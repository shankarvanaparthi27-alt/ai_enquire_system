import { NextRequest } from 'next/server';
import { authenticateRequest } from '@/lib/auth/serverAuth';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { streamContent, GeminiContent, GeminiMessagePart } from '@/lib/gemini/client';
import { retrieveRelevantContext } from '@/services/rag/retrieval';
import { CitationSource, SupportedLanguage } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    if (!user) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return new Response(
        JSON.stringify({ success: false, error: 'Database service unavailable' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { sessionId, message, language = 'en', collegeId, attachments = [] } = body;

    if (!sessionId || (!message?.trim() && (!Array.isArray(attachments) || attachments.length === 0))) {
      return new Response(
        JSON.stringify({ success: false, error: 'Session ID and message or attachment are required.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const effectiveMessage = message?.trim() || (attachments.length > 0 ? 'Please analyze the attached file(s).' : '');

    // 1. Verify session ownership
    const { data: session, error: sessionErr } = await supabase
      .from('chat_sessions')
      .select('id, user_id, title')
      .eq('id', sessionId)
      .eq('user_id', user.uid)
      .single();

    if (sessionErr || !session) {
      return new Response(
        JSON.stringify({ success: false, error: 'Session not found or permission denied.' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
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

    const { error: userMsgErr } = await supabase.from('chat_messages').insert({
      session_id: sessionId,
      sender: 'user',
      content: storedContent,
      language,
    });

    if (userMsgErr) {
      console.warn('Failed to persist user message:', userMsgErr.message);
    }

    // 3. Update session title if it is "New Conversation"
    if (session.title === 'New Conversation' || !session.title) {
      const generatedTitle = effectiveMessage.slice(0, 40);
      await supabase
        .from('chat_sessions')
        .update({ title: generatedTitle, updated_at: new Date().toISOString() })
        .eq('id', sessionId);
    } else {
      await supabase
        .from('chat_sessions')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', sessionId);
    }

    // 4. Retrieve recent message history (last 6 messages) for conversational memory
    const { data: historyRows } = await supabase
      .from('chat_messages')
      .select('sender, content')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(6);

    const contents: GeminiContent[] = [];
    if (historyRows) {
      historyRows.forEach((row) => {
        contents.push({
          role: row.sender === 'user' ? 'user' : 'model',
          parts: [{ text: row.content }],
        });
      });
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

    // 5. RAG Vector Knowledge Retrieval & Direct College Grounding
    const { contextText, citations } = await retrieveRelevantContext(message, {
      collegeId,
      threshold: 0.3,
      limit: 4,
    });

    // Check for college-specific directory grounding if relevant
    let directoryGrounding = '';
    try {
      const qLower = message.toLowerCase();
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
          const words = message.replace(/[^a-zA-Z0-9\s]/g, '').split(/\s+/).filter((w: string) => w.length >= 3);
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

    // 6. Build Multilingual Universal System Instruction
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

    // 7. Stream response with Server-Sent Events (SSE)
    const encoder = new TextEncoder();
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

          // Persist assistant response with citations to database
          let savedMessageId = '';
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

          // Send done event
          controller.enqueue(
            encoder.encode(
              `event: done\ndata: ${JSON.stringify({ messageId: savedMessageId, citations })}\n\n`
            )
          );
          controller.close();
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : 'Generation stream error';
          console.error('Streaming error:', errMsg);
          controller.enqueue(
            encoder.encode(
              `event: error\ndata: ${JSON.stringify({ error: errMsg })}\n\n`
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
    console.error('API /api/ai/chat error:', err);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
