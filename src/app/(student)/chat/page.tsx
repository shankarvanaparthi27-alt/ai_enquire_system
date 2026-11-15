'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { ChatMessage, ChatSession, CitationSource, SupportedLanguage, ChatAttachment } from '@/types';
import { MarkdownRenderer } from '@/components/chat/MarkdownRenderer';
import {
  Sparkles,
  Send,
  Plus,
  Trash2,
  ThumbsUp,
  ThumbsDown,
  Square,
  Search,
  Copy,
  Check,
  RotateCcw,
  Menu,
  X,
  Edit2,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Settings,
  Bot,
  ExternalLink,
  FileText,
  Clock,
  Compass,
  Code2,
  HelpCircle,
  Briefcase,
  GraduationCap,
  ShieldAlert,
  Paperclip,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Lock,
  Globe,
  FileUp,
  ImageIcon,
} from 'lucide-react';

const SUGGESTED_PROMPTS = [
  {
    icon: Compass,
    title: 'Find Top Colleges',
    text: 'Find the best engineering colleges in India based on NIRF rankings and placements.',
    category: 'Colleges',
  },
  {
    icon: Code2,
    title: 'Explain C++ Pointers',
    text: 'Explain C++ pointers with practical examples, memory layout, and common pitfalls.',
    category: 'Programming',
  },
  {
    icon: GraduationCap,
    title: 'Compare IITs',
    text: 'Compare IIT Madras and IIT Bombay across campus culture, research, and placement statistics.',
    category: 'Comparison',
  },
  {
    icon: HelpCircle,
    title: 'Exam Preparation',
    text: 'Help me prepare for my semester exams: give me a structured 4-week revision strategy.',
    category: 'Academics',
  },
  {
    icon: Sparkles,
    title: 'AI in Simple Words',
    text: 'Explain artificial intelligence and neural networks in simple words with real-life analogies.',
    category: 'Technology',
  },
  {
    icon: Briefcase,
    title: 'Career Guidance',
    text: 'What high-paying career options and specializations are available after B.Tech CSE?',
    category: 'Careers',
  },
];

export default function ChatPage() {
  const router = useRouter();
  const { user, profile, getIdToken, loading: authLoading } = useAuth();
  const { language, setLanguage, languages } = useLanguage();
  const { showToast } = useToast();

  // Sessions and Active Chat State
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Sidebar Controls
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Editing / Renaming Session State
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  // Message Actions & Feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [feedbackSent, setFeedbackSent] = useState<Record<string, number>>({});
  const [activeCitationModal, setActiveCitationModal] = useState<CitationSource | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // File Upload Attachments State
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // Audio Recording (Microphone) State
  const [isRecording, setIsRecording] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Text-To-Speech (Response Audio) State
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);

  // Require login: Redirect unauthenticated visitors to login, then immediately back to chat
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/chat');
    }
  }, [user, authLoading, router]);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 180)}px`;
    }
  }, [inputText]);

  // Cleanup speech synthesis & audio recording on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch {}
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, []);

  // Text to Speech (Audio of Chatbot Response)
  const handleToggleSpeak = useCallback((msgId: string, content: string, msgLang?: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      showToast({
        type: 'warning',
        title: 'Audio Not Supported',
        message: 'Speech synthesis is not supported on this browser.',
      });
      return;
    }

    if (speakingMessageId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();

    // Clean markdown syntax for natural reading
    const cleanedText = content
      .replace(/```[\s\S]*?```/g, ' [Code example omitted for audio] ')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/#{1,6}\s+/g, '')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[-*+]\s+/g, '')
      .replace(/\|[^\n]+\|/g, '')
      .trim();

    if (!cleanedText) return;

    const utterance = new SpeechSynthesisUtterance(cleanedText);
    const targetLang = msgLang || language;
    const langCode =
      targetLang === 'hi'
        ? 'hi-IN'
        : targetLang === 'te'
        ? 'te-IN'
        : targetLang === 'ta'
        ? 'ta-IN'
        : targetLang === 'kn'
        ? 'kn-IN'
        : targetLang === 'pa'
        ? 'pa-IN'
        : 'en-US';
    utterance.lang = langCode;

    const voices = window.speechSynthesis.getVoices();
    const matchingVoice = voices.find((v) => v.lang.toLowerCase().startsWith(langCode.slice(0, 2).toLowerCase()));
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      setSpeakingMessageId(msgId);
    };

    utterance.onend = () => {
      setSpeakingMessageId(null);
    };

    utterance.onerror = () => {
      setSpeakingMessageId(null);
    };

    window.speechSynthesis.speak(utterance);
  }, [speakingMessageId, language, showToast]);

  // File Upload Handlers (Images, PDF, Documents)
  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (file.size > 10 * 1024 * 1024) {
        showToast({
          type: 'warning',
          title: 'File Too Large',
          message: `${file.name} exceeds 10MB limit.`,
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setAttachments((prev) => [
          ...prev,
          {
            name: file.name,
            type: file.type || 'application/octet-stream',
            size: file.size,
            base64,
          },
        ]);
        showToast({
          type: 'success',
          title: 'File Attached',
          message: `${file.name} attached for UniVerse AI analysis.`,
        });
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveAttachment = (idx: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const filesToUpload: File[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) filesToUpload.push(file);
      }
    }

    if (filesToUpload.length > 0) {
      const dataTransfer = new DataTransfer();
      filesToUpload.forEach((f) => dataTransfer.items.add(f));
      handleFileSelect(dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer?.files) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  // Audio Recording (Microphone) Handler
  const handleToggleRecord = async () => {
    if (isRecording) {
      handleStopRecording();
      return;
    }

    try {
      // 1. Web Speech Recognition for real-time live transcription
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognitionClass) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const recognition = new SpeechRecognitionClass();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang =
          language === 'hi'
            ? 'hi-IN'
            : language === 'te'
            ? 'te-IN'
            : language === 'ta'
            ? 'ta-IN'
            : language === 'kn'
            ? 'kn-IN'
            : language === 'pa'
            ? 'pa-IN'
            : 'en-US';

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onresult = (event: any) => {
          let liveTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            liveTranscript += event.results[i][0].transcript;
          }
          if (liveTranscript.trim()) {
            setInputText((prev) => {
              const base = prev.trim();
              return base ? `${base} ${liveTranscript.trim()}` : liveTranscript.trim();
            });
          }
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onerror = (event: any) => {
          console.warn('Speech recognition warning:', event.error);
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognition.start();
        recognitionRef.current = recognition;
      }

      // 2. MediaRecorder for audio recording & raw audio capture
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };

        mediaRecorder.onstop = () => {
          stream.getTracks().forEach((track) => track.stop());
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          if (audioBlob.size > 0) {
            const reader = new FileReader();
            reader.onload = () => {
              const base64 = reader.result as string;
              setAttachments((prev) => [
                ...prev,
                {
                  name: `Voice-Query-${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.webm`,
                  type: 'audio/webm',
                  size: audioBlob.size,
                  base64,
                },
              ]);
              showToast({
                type: 'success',
                title: 'Audio Recorded',
                message: 'Voice query captured and ready for Gemini analysis.',
              });
            };
            reader.readAsDataURL(audioBlob);
          }
        };

        mediaRecorder.start();
        mediaRecorderRef.current = mediaRecorder;
      }

      setIsRecording(true);
      showToast({
        type: 'info',
        title: 'Microphone Active',
        message: 'Listening... speak your question clearly.',
      });
    } catch (err) {
      console.error('Microphone error:', err);
      showToast({
        type: 'error',
        title: 'Microphone Permission Needed',
        message: 'Please allow microphone access in your browser to record audio.',
      });
      setIsRecording(false);
    }
  };

  const handleStopRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
      mediaRecorderRef.current = null;
    }
    setIsRecording(false);
  };

  const handleCancelRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
      audioChunksRef.current = [];
      mediaRecorderRef.current = null;
    }
    setIsRecording(false);
  };

  // Fetch all chat sessions for the student
  const loadSessions = useCallback(async () => {
    if (!user) {
      setLoadingSessions(false);
      return;
    }
    try {
      const token = await getIdToken();
      const res = await fetch('/api/chat/sessions', {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setSessions(data.data);
      }
    } catch (err) {
      console.warn('Failed to load chat sessions:', err);
    } finally {
      setLoadingSessions(false);
    }
  }, [user, getIdToken]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Fetch messages for active session
  useEffect(() => {
    if (!activeSessionId || !user) return;

    let isMounted = true;
    async function loadMessages() {
      setLoadingMessages(true);
      try {
        const token = await getIdToken();
        const res = await fetch(`/api/chat/sessions/${activeSessionId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (isMounted && data.success && data.data?.messages) {
          setMessages(data.data.messages);
        }
      } catch (err) {
        console.error('Error fetching messages:', err);
      } finally {
        if (isMounted) setLoadingMessages(false);
      }
    }
    loadMessages();

    return () => {
      isMounted = false;
    };
  }, [activeSessionId, user, getIdToken]);

  // Create or Reset to a New Chat Session
  const handleNewChat = () => {
    if (isStreaming) {
      abortControllerRef.current?.abort();
      setIsStreaming(false);
    }
    // If already in fresh new chat state, leave as-is and focus input
    if (!activeSessionId && messages.length === 0) {
      setMobileDrawerOpen(false);
      textareaRef.current?.focus();
      return;
    }
    // Reset to brand new clean chat
    setActiveSessionId(null);
    setMessages([]);
    setInputText('');
    setAttachments([]);
    setMobileDrawerOpen(false);
    textareaRef.current?.focus();
  };

  // Delete a Session
  const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this conversation?')) return;

    try {
      const token = await getIdToken();
      const res = await fetch(`/api/chat/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        const remaining = sessions.filter((s) => s.id !== sessionId);
        setSessions(remaining);
        if (activeSessionId === sessionId) {
          setActiveSessionId(null);
          setMessages([]);
        }
        showToast({ type: 'success', title: 'Deleted', message: 'Conversation deleted.' });
      }
    } catch {
      showToast({ type: 'error', title: 'Error', message: 'Could not delete conversation.' });
    }
  };

  // Rename a Session
  const handleStartRename = (e: React.MouseEvent, session: ChatSession) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditingTitle(session.title);
  };

  const handleSaveRename = async (sessionId: string) => {
    if (!editingTitle.trim()) {
      setEditingSessionId(null);
      return;
    }
    try {
      const token = await getIdToken();
      const res = await fetch(`/api/chat/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: editingTitle.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setSessions((prev) =>
          prev.map((s) => (s.id === sessionId ? { ...s, title: editingTitle.trim() } : s))
        );
        showToast({ type: 'success', title: 'Updated', message: 'Conversation renamed.' });
      }
    } catch {
      showToast({ type: 'error', title: 'Error', message: 'Could not rename conversation.' });
    } finally {
      setEditingSessionId(null);
    }
  };

  // Send Message & Stream Response
  const handleSendMessage = async (textToSend?: string) => {
    const prompt = (textToSend || inputText).trim();
    if ((!prompt && attachments.length === 0) || isStreaming) return;

    if (isRecording) {
      handleStopRecording();
    }

    const currentAttachments = [...attachments];
    setAttachments([]);

    let targetSessionId = activeSessionId;

    // If no active session, create one or fallback to client session ID
    if (!targetSessionId) {
      try {
        const token = await getIdToken();
        const res = await fetch('/api/chat/sessions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            title: (prompt || currentAttachments[0]?.name || 'File Analysis').slice(0, 36),
            language,
          }),
        });
        const data = await res.json();
        if (data.success && data.data?.id) {
          targetSessionId = data.data.id;
          setSessions((prev) => [data.data, ...prev]);
          setActiveSessionId(data.data.id);
        } else {
          const localId = `sess-${Date.now()}`;
          targetSessionId = localId;
          const localSession: ChatSession = {
            id: localId,
            userId: user?.uid || 'guest',
            title: (prompt || currentAttachments[0]?.name || 'New Conversation').slice(0, 36),
            language: language as SupportedLanguage,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          setSessions((prev) => [localSession, ...prev]);
          setActiveSessionId(localId);
        }
      } catch {
        const localId = `sess-${Date.now()}`;
        targetSessionId = localId;
        const localSession: ChatSession = {
          id: localId,
          userId: user?.uid || 'guest',
          title: (prompt || currentAttachments[0]?.name || 'New Conversation').slice(0, 36),
          language: language as SupportedLanguage,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setSessions((prev) => [localSession, ...prev]);
        setActiveSessionId(localId);
      }
    }

    if (!targetSessionId) return;
    const finalSessionId: string = targetSessionId;

    // Append optimistic user message
    const tempUserMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sessionId: finalSessionId,
      sender: 'user',
      content: prompt || (currentAttachments.length > 0 ? 'Analyze attached file(s)' : ''),
      language: language as SupportedLanguage,
      attachments: currentAttachments.length > 0 ? currentAttachments : undefined,
      createdAt: new Date().toISOString(),
    };

    // Placeholder assistant message
    const tempAssistantMsgId = `ast-${Date.now()}`;
    const tempAssistantMsg: ChatMessage = {
      id: tempAssistantMsgId,
      sessionId: finalSessionId,
      sender: 'assistant',
      content: '',
      language: language as SupportedLanguage,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg, tempAssistantMsg]);
    setInputText('');
    setIsStreaming(true);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    let accumulatedText = '';

    try {
      const token = await getIdToken();
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(!user ? { 'x-guest-id': `guest-${Date.now()}` } : {}),
        },
        body: JSON.stringify({
          sessionId: finalSessionId,
          message: prompt,
          language,
          attachments: currentAttachments,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        let errDesc = `Server returned status ${response.status}`;
        try {
          const errObj = await response.json();
          if (errObj.error) errDesc = errObj.error;
        } catch {}
        throw new Error(errDesc);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Response body has no readable stream.');

      const decoder = new TextDecoder();
      let buffer = '';
      let parsedCitations: CitationSource[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6).trim();
            if (jsonStr) {
              try {
                const eventData = JSON.parse(jsonStr);
                if (eventData.error) {
                  accumulatedText += (accumulatedText ? '\n\n' : '') + `⚠️ **Notice:** ${eventData.error}`;
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === tempAssistantMsgId
                        ? { ...msg, content: accumulatedText }
                        : msg
                    )
                  );
                } else if (eventData.text) {
                  accumulatedText += eventData.text;
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === tempAssistantMsgId
                        ? { ...msg, content: accumulatedText, citations: parsedCitations }
                        : msg
                    )
                  );
                } else if (eventData.citations) {
                  parsedCitations = eventData.citations;
                } else if (eventData.messageId) {
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === tempAssistantMsgId
                        ? { ...msg, id: eventData.messageId, citations: parsedCitations }
                        : msg
                    )
                  );
                }
              } catch {
                // Ignore partial JSON
              }
            }
          }
        }
      }

      if (!accumulatedText.trim()) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempAssistantMsgId
              ? {
                  ...msg,
                  content:
                    '⚠️ UniVerse AI was unable to generate a response. Please check that server environment variables (such as GEMINI_API_KEY) are configured in Vercel.',
                }
              : msg
          )
        );
      }

      // Refresh session title in sidebar if it was updated
      loadSessions();
    } catch (err: unknown) {
      if ((err as Error).name === 'AbortError') {
        // Stream aborted by student
      } else {
        const errMsg = (err as Error)?.message || 'An error occurred while communicating with UniVerse AI.';
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempAssistantMsgId
              ? {
                  ...msg,
                  content:
                    accumulatedText ||
                    `⚠️ **Assistant Communication Notice:** ${errMsg}\n\nIf running in production, please verify that \`GEMINI_API_KEY\` and database settings are configured in Vercel.`,
                }
              : msg
          )
        );
        showToast({
          type: 'error',
          title: 'Communication Notice',
          message: errMsg,
        });
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  // Stop Generation
  const handleStopGenerating = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
    }
  };

  // Regenerate Last AI Response
  const handleRegenerate = () => {
    if (isStreaming || messages.length === 0) return;
    const lastUserMsg = [...messages].reverse().find((m) => m.sender === 'user');
    if (lastUserMsg) {
      // Remove last assistant message
      setMessages((prev) => {
        const copy = [...prev];
        if (copy[copy.length - 1]?.sender === 'assistant') {
          copy.pop();
        }
        return copy;
      });
      handleSendMessage(lastUserMsg.content);
    }
  };

  // Copy Message to Clipboard
  const handleCopyMessage = async (msgId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(msgId);
      setTimeout(() => setCopiedId(null), 2000);
      showToast({ type: 'success', title: 'Copied', message: 'Response copied to clipboard.' });
    } catch {
      // Fallback
    }
  };

  // Submit Feedback
  const handleFeedback = async (messageId: string, rating: 1 | -1) => {
    if (feedbackSent[messageId]) return;
    try {
      const token = await getIdToken();
      const res = await fetch('/api/chat/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ messageId, rating }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedbackSent((prev) => ({ ...prev, [messageId]: rating }));
        showToast({
          type: 'success',
          title: 'Feedback Recorded',
          message: rating === 1 ? 'Glad you found this helpful!' : 'Thank you for your feedback.',
        });
      }
    } catch {
      // Fallback
    }
  };

  // Filter and Group Sessions: Today, Previous 7 Days, Older
  const groupedSessions = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    const filtered = query
      ? sessions.filter((s) => s.title.toLowerCase().includes(query))
      : sessions;

    const today: ChatSession[] = [];
    const lastWeek: ChatSession[] = [];
    const older: ChatSession[] = [];

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysAgo = startOfToday - 7 * 24 * 60 * 60 * 1000;

    filtered.forEach((session) => {
      const updatedTime = new Date(session.updatedAt || session.createdAt).getTime();
      if (updatedTime >= startOfToday) {
        today.push(session);
      } else if (updatedTime >= sevenDaysAgo) {
        lastWeek.push(session);
      } else {
        older.push(session);
      }
    });

    return { today, lastWeek, older };
  }, [sessions, searchQuery]);

  const activeSession = sessions.find((s) => s.id === activeSessionId);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="relative flex h-[calc(100vh-4rem)] w-full overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased font-sans"
    >
      {/* Drag & Drop File Upload Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-cyan-950/80 backdrop-blur-sm border-2 border-dashed border-cyan-400 p-6 pointer-events-none animate-in fade-in duration-150">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-4 animate-bounce">
            <FileUp className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white">Drop images or documents here</h3>
          <p className="text-xs text-cyan-200 mt-1">
            UniVerse AI will inspect your files with Gemini multimodal intelligence.
          </p>
        </div>
      )}
      {/* ========================================================================= */}
      {/* 1. LEFT CONVERSATION SIDEBAR (Desktop & Mobile Drawer)                    */}
      {/* ========================================================================= */}

      {/* Mobile Drawer Overlay */}
      {mobileDrawerOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs md:hidden"
          onClick={() => setMobileDrawerOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'w-72' : 'w-0 md:w-16'
        } ${mobileDrawerOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        {/* Sidebar Header & New Chat Button */}
        <div className="p-3.5 border-b border-slate-200/80 dark:border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-2 ${!sidebarOpen && 'hidden md:hidden'}`}>
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-black tracking-tight text-slate-900 dark:text-white">
                  UniVerse <span className="text-cyan-500">AI</span>
                </h2>
                <p className="text-[10px] text-slate-500 font-medium">Universal Assistant</p>
              </div>
            </div>

            <button
              onClick={() => {
                setSidebarOpen(!sidebarOpen);
                setMobileDrawerOpen(false);
              }}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4 hidden md:block" />}
            </button>
          </div>

          {/* New Chat Button */}
          <button
            onClick={handleNewChat}
            className={`w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-md shadow-cyan-500/20 transition-all active:scale-[0.98] ${
              !sidebarOpen && 'md:p-2 md:justify-center'
            }`}
            title="Start a new conversation"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span className={`${!sidebarOpen && 'md:hidden'}`}>New Chat</span>
          </button>

          {/* Search Conversations Input */}
          {sidebarOpen && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Conversation History List */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
          {loadingSessions ? (
            <div className="space-y-2 p-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-8 rounded-lg bg-slate-100 dark:bg-slate-800/60 animate-pulse" />
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8 px-3 text-slate-400 text-xs">
              <MessageSquare className="w-6 h-6 mx-auto mb-2 opacity-40" />
              <p>No conversations yet.</p>
              <p className="text-[11px] mt-1 text-slate-500">Ask a question to start chatting!</p>
            </div>
          ) : (
            <>
              {/* Group: Today */}
              {groupedSessions.today.length > 0 && (
                <div>
                  <div className={`px-2 pb-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider ${!sidebarOpen && 'md:hidden'}`}>
                    Today
                  </div>
                  <div className="space-y-1">
                    {groupedSessions.today.map((s) => renderSessionItem(s))}
                  </div>
                </div>
              )}

              {/* Group: Previous 7 Days */}
              {groupedSessions.lastWeek.length > 0 && (
                <div>
                  <div className={`px-2 pb-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider ${!sidebarOpen && 'md:hidden'}`}>
                    Previous 7 Days
                  </div>
                  <div className="space-y-1">
                    {groupedSessions.lastWeek.map((s) => renderSessionItem(s))}
                  </div>
                </div>
              )}

              {/* Group: Older */}
              {groupedSessions.older.length > 0 && (
                <div>
                  <div className={`px-2 pb-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider ${!sidebarOpen && 'md:hidden'}`}>
                    Older
                  </div>
                  <div className="space-y-1">
                    {groupedSessions.older.map((s) => renderSessionItem(s))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Sidebar Footer: Settings & Profile */}
        <div className="p-3 border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 space-y-2">
          {/* Settings Trigger */}
          <button
            onClick={() => setShowSettingsModal(true)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors ${
              !sidebarOpen && 'md:justify-center md:px-0'
            }`}
            title="Assistant Settings & Model Info"
          >
            <Settings className="w-4 h-4 text-slate-400 shrink-0" />
            <span className={`${!sidebarOpen && 'md:hidden'}`}>Settings & Model</span>
          </button>

          {/* User Profile Info */}
          <div
            className={`flex items-center gap-2.5 p-2 rounded-xl bg-white dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 ${
              !sidebarOpen && 'md:justify-center md:p-1.5'
            }`}
          >
            {profile?.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.fullName}
                className="w-7 h-7 rounded-lg object-cover ring-1 ring-cyan-500/30"
              />
            ) : (
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                {profile?.fullName?.charAt(0) || user?.displayName?.charAt(0) || 'U'}
              </div>
            )}
            <div className={`min-w-0 flex-1 ${!sidebarOpen && 'md:hidden'}`}>
              <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {profile?.fullName || user?.displayName || 'Student'}
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                {user?.email || 'Authenticated'}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. MAIN CHAT AREA                                                         */}
      {/* ========================================================================= */}
      <main className="flex-1 flex flex-col h-full min-w-0 bg-white dark:bg-slate-950 relative overflow-hidden">
        {/* Top Chat Header Bar - Locked firmly at the top */}
        <header className="h-14 shrink-0 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Hamburger Drawer Trigger */}
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 md:hidden text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Open sidebar"
            >
              <Menu className="w-4 h-4" />
            </button>

            {/* Conversation Title & Model Badge & Lock Badge */}
            <div className="flex items-center gap-2 truncate">
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                {activeSession ? activeSession.title : 'New Conversation'}
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 shrink-0">
                <Bot className="w-3 h-3" />
                <span>Gemini 3.5 Flash-Lite</span>
              </span>
              <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                <Lock className="w-2.5 h-2.5" />
                <span>Header Locked</span>
              </span>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <Globe className="w-3.5 h-3.5 text-cyan-500" />
              <span className="uppercase text-[10px] font-bold">{language}</span>
            </div>

            <button
              onClick={handleNewChat}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors shadow-2xs"
              title="Start a new chat"
            >
              <Plus className="w-3.5 h-3.5 text-cyan-500" />
              <span className="hidden sm:inline">New Chat</span>
            </button>
          </div>
        </header>

        {/* Guest Preview Mode Notice */}
        {!user && !authLoading && (
          <div className="mx-4 sm:mx-6 md:mx-8 mt-3 mb-1 px-4 py-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-between gap-3 text-xs text-cyan-900 dark:text-cyan-200">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-cyan-500 shrink-0" />
              <span>
                <strong>Guest Mode Active:</strong> UniVerse AI is fully unlocked. Ask any question, upload documents/images, or record voice notes. <Link href="/login" className="underline font-bold text-cyan-600 dark:text-cyan-300 hover:opacity-80">Sign in</Link> to save your conversations to the cloud.
              </span>
            </div>
            <Link
              href="/login"
              className="shrink-0 px-3 py-1 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-[11px] transition-all shadow-sm"
            >
              Sign In
            </Link>
          </div>
        )}

        {/* Chat Message Scrollable Container */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 py-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
          {loadingMessages ? (
            <div className="max-w-3xl mx-auto space-y-4 py-8">
              <div className="h-14 rounded-2xl bg-slate-100 dark:bg-slate-900 animate-pulse" />
              <div className="h-28 rounded-2xl bg-slate-100 dark:bg-slate-900 animate-pulse" />
            </div>
          ) : messages.length === 0 ? (
            /* ========================================================================= */
            /* 3. WELCOME SCREEN & SUGGESTED PROMPT CARDS                                 */
            /* ========================================================================= */
            <div className="max-w-3xl mx-auto py-8 sm:py-12 px-2 text-center flex flex-col items-center">
              {/* Sparkle Icon Hero */}
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-cyan-500/20 mb-4 animate-bounce">
                <Sparkles className="w-7 h-7" />
              </div>

              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Hello! I&apos;m UniVerse AI.
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-lg leading-relaxed">
                Your AI assistant for college discovery, education, technology, career guidance, and everyday questions.
              </p>

              {/* 6 Suggested Prompt Cards */}
              <div className="mt-8 w-full">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-left">
                  {SUGGESTED_PROMPTS.map((prompt, idx) => {
                    const Icon = prompt.icon;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(prompt.text)}
                        className="group flex flex-col justify-between p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 hover:border-cyan-500/50 dark:hover:border-cyan-500/40 hover:shadow-md transition-all text-left"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 group-hover:scale-110 transition-transform">
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            {prompt.category}
                          </span>
                        </div>
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-cyan-500 transition-colors line-clamp-1 mb-1">
                          {prompt.title}
                        </h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {prompt.text}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* ========================================================================= */
            /* 4. CONVERSATION MESSAGES STREAM                                            */
            /* ========================================================================= */
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.map((msg, index) => {
                const isUser = msg.sender === 'user';
                return (
                  <div
                    key={msg.id || index}
                    className={`flex items-start gap-3.5 ${
                      isUser ? 'ml-auto flex-row-reverse max-w-[85%]' : 'mr-auto max-w-full'
                    }`}
                  >
                    {/* Message Avatar */}
                    <div
                      className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-xs font-bold shadow-xs ${
                        isUser
                          ? 'bg-blue-600 text-white'
                          : 'bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white shadow-cyan-500/20'
                      }`}
                    >
                      {isUser ? profile?.fullName?.charAt(0) || user?.displayName?.charAt(0) || 'U' : <Sparkles className="w-4 h-4" />}
                    </div>

                    {/* Message Content & Action Container */}
                    <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                      {/* User Message Attachments */}
                      {isUser && msg.attachments && msg.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-1 justify-end">
                          {msg.attachments.map((att, aIdx) => {
                            const isImg = att.type?.startsWith('image/') || (att.base64 && att.base64.startsWith('data:image/'));
                            return isImg ? (
                              <div
                                key={aIdx}
                                onClick={() => setPreviewImageUrl(att.base64 || att.url || null)}
                                className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 max-w-[160px] shadow-sm cursor-pointer group bg-slate-900"
                                title="Click to view full image"
                              >
                                <img
                                  src={att.base64 || att.url}
                                  alt={att.name}
                                  className="h-28 w-full object-cover group-hover:scale-105 transition-transform"
                                />
                                <div className="p-1 text-[10px] bg-black/60 text-white truncate px-2">
                                  {att.name}
                                </div>
                              </div>
                            ) : (
                              <div
                                key={aIdx}
                                className="flex items-center gap-2 p-2 rounded-xl bg-blue-700/80 text-white text-xs border border-blue-500/30 shadow-xs"
                              >
                                <FileText className="w-4 h-4 text-cyan-200 shrink-0" />
                                <div className="min-w-0">
                                  <div className="font-semibold truncate max-w-[140px]">{att.name}</div>
                                  <div className="text-[10px] text-blue-200">
                                    {Math.round((att.size || 0) / 1024)} KB
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Bubble */}
                      <div
                        className={`rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed shadow-xs ${
                          isUser
                            ? 'bg-blue-600 text-white rounded-tr-xs ml-auto whitespace-pre-wrap'
                            : 'bg-slate-100/90 dark:bg-slate-900/80 text-slate-900 dark:text-slate-100 border border-slate-200/80 dark:border-slate-800/80 rounded-tl-xs'
                        }`}
                      >
                        {isUser ? (
                          msg.content
                        ) : msg.content ? (
                          <MarkdownRenderer content={msg.content} />
                        ) : isStreaming ? (
                          <div className="flex items-center gap-1.5 py-1 text-slate-400 text-xs">
                            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse delay-150" />
                            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse delay-300" />
                            <span className="ml-1 text-[11px] font-medium text-slate-500">
                              UniVerse AI is generating response...
                            </span>
                          </div>
                        ) : null}
                      </div>

                      {/* Live Audio Playing Indicator (When TTS is active on this message) */}
                      {!isUser && speakingMessageId === msg.id && (
                        <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-cyan-500/10 border border-cyan-500/25 text-xs font-bold text-cyan-600 dark:text-cyan-400 animate-pulse w-fit">
                          <div className="flex items-center gap-0.5">
                            <span className="w-1 h-3 bg-cyan-500 rounded-full animate-bounce" />
                            <span className="w-1 h-4 bg-cyan-500 rounded-full animate-bounce delay-100" />
                            <span className="w-1 h-2 bg-cyan-500 rounded-full animate-bounce delay-200" />
                            <span className="w-1 h-3.5 bg-cyan-500 rounded-full animate-bounce delay-300" />
                          </div>
                          <span>Reading aloud response...</span>
                          <button
                            onClick={() => handleToggleSpeak(msg.id, msg.content, msg.language)}
                            className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-700 dark:text-cyan-300"
                          >
                            Stop
                          </button>
                        </div>
                      )}

                      {/* Verified Citation Pills (For Assistant Messages) */}
                      {!isUser && msg.citations && msg.citations.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                            Verified Sources:
                          </span>
                          {msg.citations.map((cite, cIdx) => (
                            <button
                              key={cIdx}
                              onClick={() => setActiveCitationModal(cite)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/20 text-[11px] font-medium hover:bg-cyan-500/20 transition-colors"
                              title="Click to view verified source citation"
                            >
                              <FileText className="w-3 h-3 text-cyan-500" />
                              <span className="truncate max-w-[180px]">
                                {cite.collegeName ? `${cite.collegeName} Records` : cite.documentTitle || `Source #${cIdx + 1}`}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Assistant Message Actions: Listen Audio, Copy, Regenerate, Feedback, Timestamp */}
                      {!isUser && msg.content && (
                        <div className="flex items-center justify-between gap-3 text-slate-400 pt-0.5 px-1">
                          <div className="flex items-center gap-1">
                            {/* Audio Read-Aloud button */}
                            <button
                              onClick={() => handleToggleSpeak(msg.id, msg.content, msg.language)}
                              className={`p-1 rounded-md transition-colors ${
                                speakingMessageId === msg.id
                                  ? 'text-cyan-500 bg-cyan-500/15'
                                  : 'hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                              }`}
                              title={speakingMessageId === msg.id ? 'Stop listening' : 'Listen to response (Read Aloud)'}
                              aria-label="Listen to response"
                            >
                              {speakingMessageId === msg.id ? (
                                <Square className="w-3.5 h-3.5 fill-current text-cyan-500 animate-pulse" />
                              ) : (
                                <Volume2 className="w-3.5 h-3.5" />
                              )}
                            </button>

                            {/* Copy button */}
                            <button
                              onClick={() => handleCopyMessage(msg.id, msg.content)}
                              className="p-1 rounded-md hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Copy response"
                              aria-label="Copy response"
                            >
                              {copiedId === msg.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>

                            {/* Regenerate button (only on the last assistant message) */}
                            {index === messages.length - 1 && !isStreaming && (
                              <button
                                onClick={handleRegenerate}
                                className="p-1 rounded-md hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                title="Regenerate response"
                                aria-label="Regenerate response"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Thumbs up */}
                            <button
                              onClick={() => handleFeedback(msg.id, 1)}
                              className={`p-1 rounded-md hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                                feedbackSent[msg.id] === 1 ? 'text-emerald-500' : ''
                              }`}
                              title="Helpful response"
                              aria-label="Thumbs up"
                            >
                              <ThumbsUp className="w-3.5 h-3.5" />
                            </button>

                            {/* Thumbs down */}
                            <button
                              onClick={() => handleFeedback(msg.id, -1)}
                              className={`p-1 rounded-md hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                                feedbackSent[msg.id] === -1 ? 'text-rose-500' : ''
                              }`}
                              title="Needs improvement"
                              aria-label="Thumbs down"
                            >
                              <ThumbsDown className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Timestamp */}
                          <div className="flex items-center gap-1 text-[10px] text-slate-400">
                            <Clock className="w-3 h-3" />
                            <span>
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* 5. BOTTOM MESSAGE COMPOSER                                                */}
        {/* ========================================================================= */}
        <div className="shrink-0 p-3 sm:p-5 bg-gradient-to-t from-white via-white dark:from-slate-950 dark:via-slate-950 to-transparent">
          <div className="max-w-3xl mx-auto space-y-2">
            {/* Hidden File Input for Image & Document Upload */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.txt,.doc,.docx,.csv,.md,.json"
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
            />

            {/* Attached Files Preview Bar */}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                {attachments.map((file, idx) => {
                  const isImg = file.type.startsWith('image/');
                  return (
                    <div
                      key={idx}
                      className="relative flex items-center gap-2 p-1.5 pr-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 shadow-2xs group"
                    >
                      {isImg ? (
                        <img
                          src={file.base64}
                          alt={file.name}
                          className="w-8 h-8 rounded-lg object-cover ring-1 ring-cyan-500/40"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                      )}
                      <div className="text-[11px] leading-tight min-w-0 max-w-[130px]">
                        <div className="font-bold text-slate-800 dark:text-slate-200 truncate">{file.name}</div>
                        <div className="text-[10px] text-slate-400">{Math.round((file.size || 0) / 1024)} KB</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(idx)}
                        className="p-1 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Remove file"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Voice Recording Active Banner */}
            {isRecording && (
              <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl animate-pulse">
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
                  <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                    Recording voice query... Speak now
                  </span>
                  <div className="hidden sm:flex items-center gap-1">
                    <span className="w-1 h-3 bg-rose-500 rounded-full animate-bounce" />
                    <span className="w-1 h-4 bg-rose-500 rounded-full animate-bounce delay-100" />
                    <span className="w-1 h-2 bg-rose-500 rounded-full animate-bounce delay-200" />
                    <span className="w-1 h-5 bg-rose-500 rounded-full animate-bounce delay-150" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleStopRecording}
                    className="px-3 py-1 rounded-xl text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white transition-colors"
                  >
                    Done Speaking
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelRecording}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                    title="Cancel recording"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Input pill box */}
            <div className="relative flex items-end gap-2 p-2.5 rounded-2xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-none focus-within:border-cyan-500/80 dark:focus-within:border-cyan-500/80 transition-all">
              {/* Attachment Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isStreaming}
                className="p-1.5 rounded-xl text-slate-400 hover:text-cyan-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40 shrink-0"
                title="Attach files (Images, PDF, Documents)"
                aria-label="Attach files"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              {/* Textarea */}
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onPaste={handlePaste}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                rows={1}
                placeholder={
                  isRecording
                    ? 'Listening... speak your question...'
                    : attachments.length > 0
                    ? 'Ask UniVerse AI about the attached file(s)...'
                    : 'Ask UniVerse AI anything (colleges, admissions, programming, math, everyday questions)...'
                }
                className="w-full pl-2 pr-2 py-1.5 max-h-44 bg-transparent text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none resize-none leading-relaxed"
                disabled={isStreaming}
              />

              {/* Composer Controls */}
              <div className="flex items-center gap-1 shrink-0 pb-0.5">
                {/* Microphone Button (Record & Analyze) */}
                <button
                  type="button"
                  onClick={handleToggleRecord}
                  disabled={isStreaming}
                  className={`p-1.5 rounded-xl transition-all ${
                    isRecording
                      ? 'bg-rose-500/20 text-rose-500 ring-2 ring-rose-500 animate-pulse'
                      : 'text-slate-400 hover:text-cyan-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                  title={isRecording ? 'Stop recording voice' : 'Record voice question with microphone'}
                  aria-label="Voice input"
                >
                  {isRecording ? <MicOff className="w-4 h-4 text-rose-500" /> : <Mic className="w-4 h-4" />}
                </button>

                {/* Clear input button */}
                {inputText && !isStreaming && (
                  <button
                    type="button"
                    onClick={() => setInputText('')}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    title="Clear input"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                {/* Stop generating button */}
                {isStreaming ? (
                  <button
                    type="button"
                    onClick={handleStopGenerating}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-500/20 transition-all"
                    title="Stop generating"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>Stop</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSendMessage()}
                    disabled={!inputText.trim() && attachments.length === 0}
                    className="p-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-cyan-500/20 transition-all active:scale-95"
                    title="Send message (Enter)"
                    aria-label="Send message"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Disclaimer Footer */}
            <p className="text-[11px] text-center text-slate-400 dark:text-slate-500 leading-tight">
              UniVerse AI may produce occasional inaccuracies. Please verify official college details directly with institution authorities.
            </p>
          </div>
        </div>
      </main>

      {/* ========================================================================= */}
      {/* 6. SETTINGS & MODEL INFO MODAL                                            */}
      {/* ========================================================================= */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-cyan-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Assistant Settings & Model
                </h3>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Active Model Info */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Active Model</span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                    Google Gemini 3.5 Flash-Lite
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Real-time streaming token generation, multilingual support, and vector RAG grounding on verified college records.
                </p>
              </div>

              {/* Language Selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                  Response Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-1 focus:ring-cyan-500"
                >
                  {languages.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.nativeName} ({l.name})
                    </option>
                  ))}
                </select>
              </div>

              {/* Conversation Metrics */}
              <div className="flex items-center justify-between pt-2 text-[11px] text-slate-500">
                <span>Total Conversations:</span>
                <span className="font-bold text-slate-900 dark:text-white">{sessions.length}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. VERIFIED CITATION DETAILS MODAL                                        */}
      {/* ========================================================================= */}
      {activeCitationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Verified Institutional Source
                </h3>
              </div>
              <button
                onClick={() => setActiveCitationModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Institution</span>
                <p className="font-bold text-slate-900 dark:text-white text-sm">
                  {activeCitationModal.collegeName || 'Official Academic Directory'}
                </p>
              </div>

              {activeCitationModal.documentTitle && (
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Document</span>
                  <p className="text-slate-700 dark:text-slate-300 font-medium">
                    {activeCitationModal.documentTitle}
                  </p>
                </div>
              )}

              {activeCitationModal.snippet && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Verified Excerpt
                  </span>
                  <p className="text-slate-600 dark:text-slate-400 italic leading-relaxed text-[11px]">
                    &quot;{activeCitationModal.snippet}&quot;
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveCitationModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 text-white hover:bg-cyan-600 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. IMAGE ZOOM PREVIEW MODAL                                               */}
      {/* ========================================================================= */}
      {previewImageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
          onClick={() => setPreviewImageUrl(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewImageUrl(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/70 text-white hover:bg-black/90 transition-colors"
              title="Close image preview"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewImageUrl}
              alt="Enlarged attachment preview"
              className="max-h-[82vh] max-w-full rounded-xl object-contain mx-auto"
            />
          </div>
        </div>
      )}
    </div>
  );

  // Helper to render session list items
  function renderSessionItem(session: ChatSession) {
    const isActive = session.id === activeSessionId;
    const isEditing = editingSessionId === session.id;

    return (
      <div
        key={session.id}
        onClick={() => {
          if (!isEditing) {
            setActiveSessionId(session.id);
            setMobileDrawerOpen(false);
          }
        }}
        className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all cursor-pointer ${
          isActive
            ? 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 font-bold border border-cyan-500/30'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 font-medium'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-cyan-500' : 'text-slate-400'}`} />
          {isEditing ? (
            <input
              type="text"
              value={editingTitle}
              autoFocus
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => setEditingTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveRename(session.id);
                if (e.key === 'Escape') setEditingSessionId(null);
              }}
              className="w-full px-1.5 py-0.5 rounded text-xs bg-white dark:bg-slate-950 border border-cyan-500 text-slate-900 dark:text-white focus:outline-none"
            />
          ) : (
            <span className={`truncate ${!sidebarOpen && 'md:hidden'}`}>{session.title}</span>
          )}
        </div>

        {/* Action icons on hover */}
        {sidebarOpen && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            {isEditing ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSaveRename(session.id);
                }}
                className="p-1 rounded hover:text-emerald-500"
                title="Save rename"
              >
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={(e) => handleStartRename(e, session)}
                  className="p-1 rounded text-slate-400 hover:text-cyan-500 transition-colors"
                  title="Rename conversation"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={(e) => handleDeleteSession(e, session.id)}
                  className="p-1 rounded text-slate-400 hover:text-rose-500 transition-colors"
                  title="Delete conversation"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </>
            )}
          </div>
        )}
      </div>
    );
  }
}
