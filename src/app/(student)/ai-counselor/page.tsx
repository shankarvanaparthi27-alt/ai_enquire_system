'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { ChatMessage, ChatSession, CitationSource, SupportedLanguage } from '@/types';
import {
  Sparkles,
  Send,
  Plus,
  Trash2,
  ThumbsUp,
  ThumbsDown,
  Square,
  Compass,
  FileText,
  AlertCircle,
  ExternalLink,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Globe,
  Check,
  RefreshCw,
  Info,
} from 'lucide-react';

const SUGGESTED_QUESTIONS = [
  'What are the B.Tech CSE cutoffs at IIT Bombay?',
  'Compare annual tuition fees between IIT Madras and BITS Pilani',
  'What is the median placement package at IIIT Hyderabad?',
  'Is 75% in Class 12 mandatory for JEE Advanced admissions?',
  'Which top engineering colleges in India accept admission via BITSAT?',
];

export default function AICounselorPage() {
  const { user, getIdToken } = useAuth();
  const { language: currentLang, setLanguage, languages, t } = useLanguage();
  const { showToast } = useToast();

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [feedbackSent, setFeedbackSent] = useState<Record<string, number>>({});
  const [activeCitationModal, setActiveCitationModal] = useState<CitationSource | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Load chat sessions on mount
  useEffect(() => {
    async function loadSessions() {
      if (!user) {
        setLoadingSessions(false);
        return;
      }
      try {
        const token = await getIdToken();
        const res = await fetch('/api/ai/sessions', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setSessions(data.data);
          if (data.data.length > 0 && !activeSessionId) {
            setActiveSessionId(data.data[0].id);
          }
        }
      } catch (err) {
        console.error('Error fetching chat sessions:', err);
      } finally {
        setLoadingSessions(false);
      }
    }
    loadSessions();
  }, [user, getIdToken, activeSessionId]);

  // Load active session messages
  useEffect(() => {
    if (!activeSessionId || !user) return;

    let isMounted = true;
    async function loadMessages() {
      try {
        const token = await getIdToken();
        const res = await fetch(`/api/ai/sessions/${activeSessionId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (isMounted && data.success && data.data?.messages) {
          setMessages(data.data.messages);
        }
      } catch (err) {
        console.error('Error loading session messages:', err);
      }
    }
    loadMessages();

    return () => {
      isMounted = false;
    };
  }, [activeSessionId, user, getIdToken]);

  // Create a new session
  const handleCreateNewSession = async () => {
    if (!user) {
      showToast({ type: 'warning', title: 'Sign In Required', message: 'Please sign in to save your counseling sessions.' });
      return;
    }

    try {
      const token = await getIdToken();
      const res = await fetch('/api/ai/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: 'New Conversation',
          language: currentLang,
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setSessions((prev) => [data.data, ...prev]);
        setActiveSessionId(data.data.id);
        setMessages([]);
        if (textareaRef.current) textareaRef.current.focus();
      }
    } catch (err) {
      console.error('Create session error:', err);
      showToast({ type: 'error', title: 'Session Creation Failed', message: 'Could not create a new conversation.' });
    }
  };

  // Delete a session
  const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this conversation?')) return;

    try {
      const token = await getIdToken();
      const res = await fetch(`/api/ai/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        if (activeSessionId === sessionId) {
          const remaining = sessions.filter((s) => s.id !== sessionId);
          if (remaining.length > 0) {
            setActiveSessionId(remaining[0].id);
          } else {
            setActiveSessionId(null);
            setMessages([]);
          }
        }
        showToast({ type: 'success', title: 'Conversation Deleted', message: 'Chat history was removed.' });
      }
    } catch (err) {
      console.error('Delete session error:', err);
      showToast({ type: 'error', title: 'Delete Failed', message: 'Could not delete conversation.' });
    }
  };

  // Stop Generation
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsStreaming(false);
      showToast({ type: 'info', title: 'Generation Stopped', message: 'AI generation was interrupted.' });
    }
  };

  // Send Message
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isStreaming) return;

    if (!user) {
      showToast({ type: 'warning', title: 'Sign In Required', message: 'Please sign in to chat with the AI College Counselor.' });
      return;
    }

    // Ensure we have an active session ID
    let currentSessionId = activeSessionId;
    if (!currentSessionId) {
      try {
        const token = await getIdToken();
        const res = await fetch('/api/ai/sessions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: text.slice(0, 30),
            language: currentLang,
          }),
        });
        const data = await res.json();
        if (data.success && data.data) {
          currentSessionId = data.data.id;
          setActiveSessionId(currentSessionId);
          setSessions((prev) => [data.data, ...prev]);
        }
      } catch (err) {
        console.error('Auto session creation error:', err);
        return;
      }
    }

    if (!currentSessionId) return;

    const userMessage: ChatMessage = {
      id: `temp-user-${Date.now()}`,
      sessionId: currentSessionId,
      sender: 'user',
      content: text,
      language: currentLang as SupportedLanguage,
      createdAt: new Date().toISOString(),
    };

    const assistantPlaceholderId = `temp-asst-${Date.now()}`;
    const assistantPlaceholder: ChatMessage = {
      id: assistantPlaceholderId,
      sessionId: currentSessionId,
      sender: 'assistant',
      content: '',
      language: currentLang as SupportedLanguage,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage, assistantPlaceholder]);
    setInputText('');
    setIsStreaming(true);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const token = await getIdToken();
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sessionId: currentSessionId,
          message: text,
          language: currentLang,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => null);
        throw new Error(errJson?.error || `Request failed with status ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Readable stream not available.');

      const decoder = new TextDecoder();
      let buffer = '';
      let accumulatedText = '';
      let messageCitations: CitationSource[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('event: metadata')) {
            // next line will be data: {...}
            continue;
          }
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6).trim();
            if (!jsonStr) continue;

            try {
              const parsed = JSON.parse(jsonStr);

              // 1. Metadata with citations
              if (parsed.citations && Array.isArray(parsed.citations)) {
                messageCitations = parsed.citations;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantPlaceholderId
                      ? { ...m, citations: messageCitations }
                      : m
                  )
                );
              }

              // 2. Text Chunk
              if (parsed.text) {
                accumulatedText += parsed.text;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantPlaceholderId
                      ? { ...m, content: accumulatedText }
                      : m
                  )
                );
              }

              // 3. Completion Done
              if (parsed.messageId) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantPlaceholderId
                      ? { ...m, id: parsed.messageId, citations: messageCitations }
                      : m
                  )
                );
              }
            } catch {
              // Partial JSON, continue
            }
          }
        }
      }
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') {
        console.log('Stream aborted by student');
      } else {
        console.error('Chat streaming failed:', err);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantPlaceholderId
              ? {
                  ...m,
                  content:
                    m.content ||
                    'Sorry, I encountered an error connecting to the knowledge base. Please try again.',
                }
              : m
          )
        );
        showToast({
          type: 'error',
          title: 'Response Error',
          message: (err as Error)?.message || 'Failed to complete AI response.',
        });
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  // Submit Feedback
  const handleFeedback = async (messageId: string, rating: 1 | -1) => {
    if (feedbackSent[messageId]) return;

    try {
      const token = await getIdToken();
      const res = await fetch('/api/ai/feedback', {
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
          title: 'Feedback Received',
          message: rating === 1 ? 'Glad this helped!' : 'Thanks for helping us improve.',
        });
      }
    } catch (err) {
      console.error('Feedback error:', err);
    }
  };

  const activeLanguageObj = languages.find((l) => l.code === currentLang) || languages[0];

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950 overflow-hidden relative">
      <div className="flex-1 flex h-full overflow-hidden">
        {/* ====================================================================== */}
        {/* Left Sessions Sidebar / Drawer                                          */}
        {/* ====================================================================== */}
        <aside
          className={`shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-300 flex flex-col z-20 ${
            sidebarOpen ? 'w-72' : 'w-0 -translate-x-full lg:w-0 lg:translate-x-0'
          } overflow-hidden`}
        >
          {/* Sidebar Header */}
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <button
              onClick={handleCreateNewSession}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>New Conversation</span>
            </button>
          </div>

          {/* Sessions List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loadingSessions ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading history...</div>
            ) : sessions.length === 0 ? (
              <div className="py-8 text-center px-4">
                <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-500 dark:text-slate-400">No conversations yet.</p>
                <p className="text-[11px] text-slate-400 mt-1">Start by asking your first admissions question.</p>
              </div>
            ) : (
              sessions.map((sess) => {
                const isActive = sess.id === activeSessionId;
                return (
                  <div
                    key={sess.id}
                    onClick={() => setActiveSessionId(sess.id)}
                    className={`group flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/40 shadow-xs'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <Sparkles
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'
                        }`}
                      />
                      <span className="truncate">{sess.title || 'Conversation'}</span>
                    </div>
                    <button
                      onClick={(e) => handleDeleteSession(e, sess.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 text-slate-400 transition-all rounded"
                      title="Delete conversation"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Institutional Integrity Notice */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
            <span>Answers are grounded in verified institutional data & cutoffs.</span>
          </div>
        </aside>

        {/* ====================================================================== */}
        {/* Main Chat Interface                                                    */}
        {/* ====================================================================== */}
        <section className="flex-1 flex flex-col h-full min-w-0 bg-white dark:bg-slate-900/50">
          {/* Chat Header */}
          <header className="h-14 border-b border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between shrink-0 bg-white dark:bg-slate-900 z-10">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all"
                title={sidebarOpen ? 'Collapse History' : 'Open History'}
              >
                {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>

              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h1 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    UniVerse AI Counselor
                    <span className="hidden sm:inline-flex text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      Active 2.0
                    </span>
                  </h1>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    Grounded admissions guidance & cutoff counseling
                  </p>
                </div>
              </div>
            </div>

            {/* Language Quick Switcher */}
            <div className="flex items-center gap-2">
              <div className="relative group">
                <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-blue-400 transition-all">
                  <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>{activeLanguageObj.nativeName}</span>
                </button>
                <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-1 hidden group-hover:block z-30 animate-in fade-in slide-in-from-top-1 duration-150">
                  {languages.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => setLanguage(l.code as SupportedLanguage)}
                      className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 ${
                        currentLang === l.code ? 'font-bold text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span>{l.nativeName}</span>
                      {currentLang === l.code && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </div>

              {isStreaming && (
                <button
                  onClick={handleStopGeneration}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 transition-all"
                  title="Stop generating response"
                >
                  <Square className="w-3 h-3 fill-current" />
                  <span className="hidden sm:inline">Stop</span>
                </button>
              )}
            </div>
          </header>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
            {messages.length === 0 ? (
              <div className="max-w-2xl mx-auto py-10 px-4 text-center flex flex-col items-center">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/25 mb-4 animate-bounce">
                  <Sparkles className="w-7 h-7" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Welcome to UniVerse AI Counselor
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-lg leading-relaxed">
                  Ask any questions regarding courses, eligibility, annual fees, verified cutoff ranks, placements, and campus facilities across Indian institutions.
                </p>

                {/* Suggested Questions */}
                <div className="mt-8 w-full">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                    Suggested Admissions Queries
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                    {SUGGESTED_QUESTIONS.map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(q)}
                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 text-xs font-medium text-slate-700 dark:text-slate-300 transition-all text-left group"
                      >
                        <div className="flex items-center gap-2">
                          <Compass className="w-3.5 h-3.5 text-blue-500 shrink-0 group-hover:rotate-45 transition-transform" />
                          <span>{q}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              messages.map((msg, index) => {
                const isUser = msg.sender === 'user';
                return (
                  <div
                    key={msg.id || index}
                    className={`flex items-start gap-3 max-w-3xl ${
                      isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
                    }`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold shadow-xs ${
                        isUser
                          ? 'bg-blue-600 text-white'
                          : 'bg-gradient-to-tr from-indigo-600 to-blue-600 text-white shadow-blue-500/20'
                      }`}
                    >
                      {isUser ? (user?.displayName?.[0] || 'U') : <Sparkles className="w-4 h-4" />}
                    </div>

                    {/* Bubble */}
                    <div className="flex flex-col gap-1.5 max-w-[85%]">
                      <div
                        className={`px-4 py-3 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs whitespace-pre-wrap ${
                          isUser
                            ? 'bg-blue-600 text-white rounded-tr-xs'
                            : 'bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 border border-slate-200/60 dark:border-slate-700/60 rounded-tl-xs'
                        }`}
                      >
                        {msg.content ? (
                          msg.content
                        ) : isStreaming && !isUser ? (
                          <div className="flex items-center gap-1.5 py-1 text-slate-400 text-xs">
                            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse delay-150" />
                            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse delay-300" />
                            <span className="ml-1 text-[11px]">Consulting knowledge base...</span>
                          </div>
                        ) : null}
                      </div>

                      {/* Citations & Source Badges (For Assistant Messages) */}
                      {!isUser && msg.citations && msg.citations.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {msg.citations.map((cite, cIdx) => (
                            <button
                              key={cIdx}
                              onClick={() => setActiveCitationModal(cite)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 text-[11px] font-medium hover:bg-blue-100 transition-colors"
                              title="Click to view verified source citation"
                            >
                              <FileText className="w-3 h-3 text-blue-500" />
                              <span className="truncate max-w-[200px]">
                                {cite.collegeName ? `${cite.collegeName} Brochure` : cite.documentTitle || `Source #${cIdx + 1}`}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Feedback Action Buttons */}
                      {!isUser && msg.content && (
                        <div className="flex items-center gap-2 mt-0.5 text-slate-400">
                          <button
                            onClick={() => handleFeedback(msg.id, 1)}
                            className={`p-1 rounded hover:text-blue-600 transition-colors ${
                              feedbackSent[msg.id] === 1 ? 'text-blue-600 font-bold' : ''
                            }`}
                            title="Helpful response"
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleFeedback(msg.id, -1)}
                            className={`p-1 rounded hover:text-red-500 transition-colors ${
                              feedbackSent[msg.id] === -1 ? 'text-red-500 font-bold' : ''
                            }`}
                            title="Not helpful"
                          >
                            <ThumbsDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Bar */}
          <footer className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="max-w-3xl mx-auto relative flex items-end gap-2"
            >
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                rows={1}
                placeholder={`Ask UniVerse Counselor in ${activeLanguageObj.nativeName}... (Press Enter to send)`}
                className="flex-1 max-h-32 min-h-[44px] py-2.5 px-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
              />

              <button
                type="submit"
                disabled={!inputText.trim() || isStreaming}
                className="h-11 w-11 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white flex items-center justify-center shrink-0 shadow-sm transition-all"
                title="Send query"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </footer>
        </section>
      </div>

      {/* Citation Detail Modal */}
      {activeCitationModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-5 border border-slate-200 dark:border-slate-800 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Verified Institutional Source
                </h3>
              </div>
              <button
                onClick={() => setActiveCitationModal(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Institution</span>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                  {activeCitationModal.collegeName || 'Accredited Higher Education Institution'}
                </p>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Document Title</span>
                <p className="text-xs text-slate-700 dark:text-slate-300">
                  {activeCitationModal.documentTitle || 'Official Information Brochure & Cutoff Gazette'}
                </p>
              </div>

              {activeCitationModal.snippet && (
                <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Verified Extract</span>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 italic leading-relaxed">
                    &ldquo;{activeCitationModal.snippet}&rdquo;
                  </p>
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setActiveCitationModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
