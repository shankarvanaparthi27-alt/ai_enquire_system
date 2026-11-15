import { NextRequest } from 'next/server';
import { authenticateRequest } from '@/lib/auth/serverAuth';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { streamContent, GeminiContent, GeminiMessagePart } from '@/lib/gemini/client';
import { retrieveRelevantContext } from '@/services/rag/retrieval';
import { isGeminiConfigured } from '@/lib/config/env';
import { CitationSource, SupportedLanguage } from '@/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    // Allow guest / visitor testing so the assistant is never blocked by auth propagation
    const effectiveUser = user || {
      uid: (req.headers.get('x-guest-id') || 'guest-visitor').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 48),
      role: 'student' as const,
      email: 'guest@universe.ai',
    };

    const body = await req.json().catch(() => ({}));
    const { sessionId, message = '', language = 'en', collegeId, attachments = [] } = body;

    if (!sessionId || (!message?.trim() && (!Array.isArray(attachments) || attachments.length === 0))) {
      return new Response(
        JSON.stringify({ success: false, error: 'Session ID and message or attachment are required.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const effectiveMessage = (message || '').trim() || (attachments.length > 0 ? 'Please analyze the attached file(s).' : '');
    const supabase = getSupabaseAdmin();

    // Check if Gemini is configured before streaming
    const encoder = new TextEncoder();
    if (!isGeminiConfigured) {
      const stream = new ReadableStream({
        start(controller) {
          const warningMessage = `### ⚠️ Gemini API Key Required on Vercel\n\nUniVerse AI is ready, but **\`GEMINI_API_KEY\`** has not been added to your Vercel Project Settings.\n\n**Quick Setup Steps:**\n1. Open your **[Vercel Dashboard](https://vercel.com)** → Select **\`ai-enquire-system\`**.\n2. Navigate to **Settings** → **Environment Variables**.\n3. Add a new variable:\n   - **Name:** \`GEMINI_API_KEY\`\n   - **Value:** *(Paste your Google AI Studio API key)*\n4. Trigger a **Redeploy** on Vercel.\n\nOnce added, this chatbot will instantly answer queries, inspect attached images & documents, and process voice queries.`;

          controller.enqueue(
            encoder.encode(`event: chunk\ndata: ${JSON.stringify({ text: warningMessage })}\n\n`)
          );
          controller.enqueue(
            encoder.encode(`event: done\ndata: ${JSON.stringify({ messageId: 'sys-config-notice' })}\n\n`)
          );
          controller.close();
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
        },
      });
    }

    // 1. Session verification & auto-provisioning
    if (supabase && user) {
      try {
        const { data: existingSession } = await supabase
          .from('chat_sessions')
          .select('id, user_id, title')
          .eq('id', sessionId)
          .maybeSingle();

        if (!existingSession) {
          await supabase
            .from('chat_sessions')
            .upsert({
              id: sessionId,
              user_id: user.uid,
              title: effectiveMessage.slice(0, 40) || 'New Conversation',
              language,
              updated_at: new Date().toISOString(),
            });
        }
      } catch (dbErr) {
        console.warn('Session verification non-fatal notice:', dbErr);
      }
    }

    // 2. Persist student message in database with attachment metadata
    let storedContent = effectiveMessage;
    if (Array.isArray(attachments) && attachments.length > 0) {
      const attSummary = attachments
        .map((a: { name?: string; size?: number; type?: string }) => {
          const sizeKb = Math.round((a.size || 0) / 1024);
          return `📎 ${a.name || 'File'} (${sizeKb > 0 ? sizeKb + ' KB' : a.type || 'file'})`;
        })
        .join(', ');
      storedContent = `[${attSummary}]\n\n${storedContent}`;
    }

    if (supabase && user) {
      try {
        await supabase.from('chat_messages').insert({
          session_id: sessionId,
          sender: 'user',
          content: storedContent,
          language,
        });

        // Update session timestamp & title
        await supabase
          .from('chat_sessions')
          .update({
            updated_at: new Date().toISOString(),
          })
          .eq('id', sessionId);
      } catch (userMsgErr) {
        console.warn('Failed to persist user message:', userMsgErr);
      }
    }

    // 3. Retrieve recent message history (last 6 messages) for conversational memory
    const contents: GeminiContent[] = [];
    if (supabase && user) {
      try {
        const { data: historyRows } = await supabase
          .from('chat_messages')
          .select('sender, content')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: true })
          .limit(6);

        if (historyRows) {
          historyRows.forEach((row) => {
            contents.push({
              role: row.sender === 'user' ? 'user' : 'model',
              parts: [{ text: row.content }],
            });
          });
        }
      } catch (hErr) {
        console.warn('Failed to retrieve history:', hErr);
      }
    }

    // Build multimodal user parts for current turn
    const currentUserParts: GeminiMessagePart[] = [];

    // Add inlineData for any attachments (images, documents, audio)
    if (Array.isArray(attachments) && attachments.length > 0) {
      for (const att of attachments) {
        if (att.base64 && att.type) {
          const rawBase64 = att.base64.replace(/^data:[^;]+;base64,/, '');
          currentUserParts.push({
            inlineData: {
              mimeType: att.type,
              data: rawBase64,
            },
          });
        }
      }
    }

    // Add the text query
    currentUserParts.push({ text: effectiveMessage });

    // Ensure the current user message with attachments is at the end
    if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
      contents[contents.length - 1] = {
        role: 'user',
        parts: currentUserParts,
      };
    } else {
      contents.push({
        role: 'user',
        parts: currentUserParts,
      });
    }

    // 4. RAG Vector Knowledge Retrieval & Direct College Grounding
    let citations: CitationSource[] = [];
    let contextText = '';
    if (effectiveMessage) {
      try {
        const ragRes = await retrieveRelevantContext(effectiveMessage, {
          collegeId,
          threshold: 0.3,
          limit: 4,
        });
        citations = ragRes.citations || [];
        contextText = ragRes.contextText || '';
      } catch (ragErr) {
        console.warn('RAG retrieval fallback:', ragErr);
      }
    }

    // Check for college-specific directory grounding if relevant
    let directoryGrounding = '';
    if (supabase) {
      try {
        const qLower = (effectiveMessage || '').toLowerCase();
        if (
          collegeId ||
          qLower.includes('college') ||
          qLower.includes('university') ||
          qLower.includes('iit') ||
          qLower.includes('nit') ||
          qLower.includes('iiit') ||
          qLower.includes('aiims') ||
          qLower.includes('iim') ||
          qLower.includes('bits') ||
          qLower.includes('nirf') ||
          qLower.includes('cutoff') ||
          qLower.includes('fee') ||
          qLower.includes('admission')
        ) {
          let colQuery = supabase
            .from('colleges')
            .select('id, name, slug, code, college_type, category, state, city, nirf_ranking, min_fee_per_year, max_fee_per_year, accreditation, rating');

          if (collegeId) {
            colQuery = colQuery.eq('id', collegeId);
          } else if (qLower.includes('nirf') || qLower.includes('top') || qLower.includes('best')) {
            colQuery = colQuery.order('nirf_ranking', { ascending: true, nullsFirst: false }).limit(6);
          } else {
            const words = (effectiveMessage || '').replace(/[^a-zA-Z0-9\s]/g, '').split(/\s+/).filter((w: string) => w.length >= 3);
            if (words.length > 0) {
              colQuery = colQuery.or(`name.ilike.%${words[0]}%,city.ilike.%${words[0]}%`).limit(4);
            } else {
              colQuery = colQuery.limit(3);
            }
          }

          const { data: matchedCols } = await colQuery;
          if (matchedCols && matchedCols.length > 0) {
            directoryGrounding = matchedCols
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              .map((c: any) =>
                `- ${c.name} (${c.city}, ${c.state}) | NIRF Rank: ${c.nirf_ranking ? '#' + c.nirf_ranking : 'Unranked/Participating'} | Category: ${c.category} | Type: ${c.college_type} | Accreditation: ${c.accreditation || 'Recognized'} | Annual Fee Range: ₹${c.min_fee_per_year?.toLocaleString('en-IN')} - ₹${c.max_fee_per_year?.toLocaleString('en-IN')} | Rating: ${c.rating}/5.0`
              )
              .join('\n');
          }
        }
      } catch {
        // Non-fatal grounding fallback
      }
    }

    // 5. Build Multilingual Universal System Instruction
    const languageNames: Record<SupportedLanguage, string> = {
      en: 'English',
      te: 'Telugu',
      hi: 'Hindi',
      ta: 'Tamil',
      kn: 'Kannada',
      pa: 'Punjabi',
    };
    const targetLangName = languageNames[language as SupportedLanguage] || 'English';

    const systemInstruction = `
You are UniVerse AI, an intelligent, universal AI assistant designed like ChatGPT with specialized expertise in higher education, technology, programming, academics, and career guidance.

CAPABILITIES & BEHAVIOR:
1. Universal Assistant: You can answer ANY question on any topic — including general knowledge, science, computer science, programming (C, C++, Python, Java, JavaScript, etc.), mathematics, engineering concepts, exam preparation, interview questions, creative writing, and everyday questions.
2. Multimodal Analysis (Images, Documents & Audio): If the user attaches files:
   - Images (diagrams, photos, code screenshots, handwritten questions, documents): Inspect the visual details thoroughly, extract text, solve math/programming questions, or explain the visual concept step-by-step.
   - Documents (PDFs, text files, CSV, syllabus, reports): Read and synthesize the contents, summarize key points, answer specific queries, and pull relevant excerpts accurately.
   - Audio Recordings: Listen carefully to the user's spoken voice query or voice memo, transcribe the core question, and deliver an immediate, accurate, and comprehensive solution.
3. Never Refuse General Questions: Do NOT decline or restrict questions to college-only topics. If a user asks a programming doubt, general science question, math equation, or everyday query, answer helpfully, clearly, and thoroughly.
4. College & Admissions Expertise: When questions touch on colleges, admissions, eligibility, fees, or rankings in India, ground your answer strictly in verified data. Use the provided directory context or official institutional knowledge. NEVER hallucinate false cutoff ranks, invented placement packages, or fabricated deadlines.
5. Response Quality & Format:
   - Use clean, modern Markdown: clear headings (## or ###), bullet points, and readable paragraphs.
   - For code, ALWAYS use properly fenced code blocks with the language identifier (e.g., \`\`\`cpp, \`\`\`python, \`\`\`javascript).
   - Use comparison tables when comparing institutions, technologies, or concepts.
   - Explain complex subjects in simple, step-by-step terms when requested.
6. Language: You must respond fluently and naturally in ${targetLangName}.
7. Transparency: If specific historical cutoff data or institutional stats are not in your verified database, transparently state that official records should be confirmed on the university's official portal.

${directoryGrounding ? `VERIFIED INSTITUTIONAL DIRECTORY RECORDS:\n${directoryGrounding}\n` : ''}
${contextText ? `VERIFIED INSTITUTIONAL KNOWLEDGE BASE CONTEXT:\n${contextText}\n` : ''}
    `.trim();

    // 6. Stream response with Server-Sent Events (SSE)
    let accumulatedResponse = '';

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send citations metadata event first
          controller.enqueue(
            encoder.encode(
              `event: metadata\ndata: ${JSON.stringify({ citations })}\n\n`
            )
          );

          // Stream Gemini generation tokens
          for await (const chunk of streamContent({
            contents,
            systemInstruction,
            temperature: 0.25,
            maxOutputTokens: 2048,
          })) {
            accumulatedResponse += chunk;
            controller.enqueue(
              encoder.encode(`event: chunk\ndata: ${JSON.stringify({ text: chunk })}\n\n`)
            );
          }

          // Persist assistant response with citations to database if available
          let savedMessageId = '';
          if (supabase && user && accumulatedResponse.trim()) {
            try {
              const { data: insertedMsg } = await supabase
                .from('chat_messages')
                .insert({
                  session_id: sessionId,
                  sender: 'assistant',
                  content: accumulatedResponse.trim(),
                  language,
                  citations: citations.length > 0 ? citations : null,
                })
                .select('id')
                .single();

              if (insertedMsg) {
                savedMessageId = insertedMsg.id;
              }
            } catch (dbErr) {
              console.warn('Failed to persist assistant message:', dbErr);
            }
          }

          // Send done event
          controller.enqueue(
            encoder.encode(
              `event: done\ndata: ${JSON.stringify({ messageId: savedMessageId || `msg-${Date.now()}`, citations })}\n\n`
            )
          );
          controller.close();
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : 'Generation stream error';
          console.error('Streaming error in Gemini generation:', errMsg);
          controller.enqueue(
            encoder.encode(
              `event: chunk\ndata: ${JSON.stringify({ text: `\n\n⚠️ **Generation Notice:** ${errMsg}\n\nPlease check that GEMINI_API_KEY is configured in Vercel Project Settings.` })}\n\n`
            )
          );
          controller.enqueue(
            encoder.encode(
              `event: error\ndata: ${JSON.stringify({ error: errMsg })}\n\n`
            )
          );
          controller.enqueue(
            encoder.encode(
              `event: done\ndata: ${JSON.stringify({ messageId: `msg-err-${Date.now()}`, citations })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : 'Internal server error while initializing chat';
    console.error('API /api/ai/chat top-level error:', err);
    const encoder = new TextEncoder();
    const fallbackStream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(
            `event: chunk\ndata: ${JSON.stringify({
              text: `### ⚠️ Assistant Initialization Notice\n\n${errMsg}\n\nPlease verify that **\`GEMINI_API_KEY\`** and Supabase environment variables are properly configured in Vercel.`,
            })}\n\n`
          )
        );
        controller.enqueue(
          encoder.encode(`event: done\ndata: ${JSON.stringify({ messageId: 'sys-error' })}\n\n`)
        );
        controller.close();
      },
    });

    return new Response(fallbackStream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  }
}
