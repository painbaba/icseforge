'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Send, Trash2, Sparkles, BookOpen, Lightbulb, ChevronDown,
  Loader2, AlertCircle, Zap, RotateCcw, BookMarked,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Tooltip, TooltipTrigger, TooltipContent,
} from '@/components/ui/tooltip';

// ────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────

interface ChatSource {
  title: string;
  subject: string;
  chapter?: string;
  category?: string;
}

interface TutorMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  reasoning?: string;
  sources?: ChatSource[];
  cached?: boolean;
  durationMs?: number;
}

interface ChatApiResponse {
  sessionId: string;
  answer: string;
  reasoning?: string;
  sources: ChatSource[];
  cached: boolean;
  durationMs: number;
}

// ────────────────────────────────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────────────────────────────────

const SUGGESTED_QUESTIONS: readonly string[] = [
  "Explain Ohm's Law with a numerical example",
  'What is the difference between arithmetic mean and median?',
  'Derive the lens formula for a convex lens',
  'Why does ice float on water?',
  'Balance: Fe + H2O → Fe3O4 + H2',
  'Explain the working of the human heart',
];

const SUBJECT_OPTIONS: readonly string[] = [
  'Physics', 'Chemistry', 'Biology', 'Mathematics',
  'History', 'Geography', 'English', 'Computer', 'Economics',
];

function uniqueId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatDuration(ms?: number): string | null {
  if (ms == null) return null;
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

// ────────────────────────────────────────────────────────────────────────────
// Main component
// ────────────────────────────────────────────────────────────────────────────

export function TutorTab() {
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [subject, setSubject] = useState<string>('auto');
  const [forceReasoning, setForceReasoning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to the latest message whenever messages / loading / error change
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, []);

  useEffect(() => {
    if (messages.length > 0 || loading || error) {
      scrollToBottom();
    }
  }, [messages, loading, error, scrollToBottom]);

  // ── API helper ──────────────────────────────────────────────────────────
  const callChatApi = useCallback(
    async (text: string, currentSessionId: string | null): Promise<ChatApiResponse> => {
      const payload: Record<string, unknown> = {
        message: text,
        forceReasoning,
      };
      if (currentSessionId) payload.sessionId = currentSessionId;
      if (subject && subject !== 'auto') payload.subject = subject;

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Tutor request failed');
      }
      return data as ChatApiResponse;
    },
    [forceReasoning, subject],
  );

  // ── Send ────────────────────────────────────────────────────────────────
  const handleSend = useCallback(
    async (messageOverride?: string) => {
      const text = (messageOverride ?? input).trim();
      if (!text || loading) return;

      setError(null);
      setInput('');
      // Reset textarea height (works even with field-sizing-content)
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      // Re-focus the input for fast follow-up typing
      requestAnimationFrame(() => textareaRef.current?.focus());

      const userMsg: TutorMessage = {
        id: uniqueId('u'),
        role: 'user',
        content: text,
      };
      const currentSession = sessionId;
      setMessages((prev) => [...prev, userMsg]);
      setLoading(true);

      try {
        const chatData = await callChatApi(text, currentSession);
        setSessionId(chatData.sessionId);
        setMessages((prev) => [
          ...prev,
          {
            id: uniqueId('a'),
            role: 'assistant',
            content: chatData.answer,
            reasoning: chatData.reasoning,
            sources: chatData.sources,
            cached: chatData.cached,
            durationMs: chatData.durationMs,
          },
        ]);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Something went wrong';
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    [input, loading, sessionId, callChatApi],
  );

  // ── Retry last failed message ───────────────────────────────────────────
  const handleRetry = useCallback(async () => {
    // Find the last user message
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    if (!lastUser) {
      setError(null);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const chatData = await callChatApi(lastUser.content, sessionId);
      setSessionId(chatData.sessionId);
      setMessages((prev) => [
        ...prev,
        {
          id: uniqueId('a'),
          role: 'assistant',
          content: chatData.answer,
          reasoning: chatData.reasoning,
          sources: chatData.sources,
          cached: chatData.cached,
          durationMs: chatData.durationMs,
        },
      ]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [messages, sessionId, callChatApi]);

  // ── Keyboard handler ────────────────────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  // ── Clear chat ──────────────────────────────────────────────────────────
  const handleClearChat = async () => {
    if (sessionId) {
      try {
        await fetch(`/api/chat?sessionId=${encodeURIComponent(sessionId)}`, {
          method: 'DELETE',
        });
      } catch {
        // Silent — UI resets regardless of API outcome
      }
    }
    setMessages([]);
    setSessionId(null);
    setInput('');
    setError(null);
    toast.success('Chat cleared');
  };

  const showEmptyState = messages.length === 0 && !loading && !error;

  return (
    <div className="mx-auto w-full max-w-3xl">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div
                className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand text-brand-foreground shadow-sm"
                aria-hidden
              >
                <Brain className="size-5" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-lg">ICSE AI Tutor</CardTitle>
                <CardDescription className="flex items-center gap-1.5">
                  <Sparkles className="size-3 text-brand" aria-hidden />
                  <span>
                    Reasoning-powered · RAG-grounded on 2700+ real past questions
                  </span>
                </CardDescription>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger
                  id="tutor-subject"
                  className="w-[140px]"
                  aria-label="Subject filter"
                >
                  <SelectValue placeholder="Subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto-detect</SelectItem>
                  {SUBJECT_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => void handleClearChat()}
                    aria-label="Clear chat"
                    disabled={messages.length === 0 && !sessionId && !loading}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Clear conversation</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* ── Messages area ─────────────────────────────────────────────── */}
          <div
            role="log"
            aria-label="Chat messages"
            aria-live="polite"
            className="max-h-[500px] min-h-[280px] overflow-y-auto rounded-lg border bg-muted/20 p-4"
          >
            {showEmptyState ? (
              <EmptyState
                onPick={(q) => {
                  void handleSend(q);
                }}
              />
            ) : (
              <div className="space-y-4">
                <AnimatePresence initial={false}>
                  {messages.map((m) => (
                    <MessageBubble key={m.id} message={m} />
                  ))}
                </AnimatePresence>

                {loading && <LoadingIndicator />}

                <AnimatePresence>
                  {error && (
                    <ErrorAlert
                      message={error}
                      onRetry={() => void handleRetry()}
                    />
                  )}
                </AnimatePresence>
              </div>
            )}
            <div ref={messagesEndRef} className="scroll-mt-2" />
          </div>

          {/* ── Input row ────────────────────────────────────────────────── */}
          <div className="space-y-2.5">
            <div className="flex items-end gap-2">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask your ICSE question — Enter to send, Shift+Enter for a new line"
                className="max-h-[200px] min-h-[44px] resize-none"
                aria-label="Message input"
                rows={1}
              />
              <Button
                onClick={() => void handleSend()}
                disabled={!input.trim() || loading}
                aria-label="Send message"
                className="gap-1.5 bg-brand text-brand-foreground hover:bg-brand/90"
              >
                {loading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
                <span className="hidden sm:inline">Send</span>
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Switch
                  id="force-reasoning"
                  checked={forceReasoning}
                  onCheckedChange={setForceReasoning}
                  aria-label="Force chain-of-thought reasoning"
                />
                <Label
                  htmlFor="force-reasoning"
                  className="cursor-pointer select-none text-xs text-muted-foreground"
                >
                  Force reasoning
                </Label>
              </div>
              <p className="font-mono text-[11px] text-muted-foreground">
                {sessionId ? `session ${sessionId.slice(0, 8)}…` : 'new session'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Empty state — suggested question chips
// ────────────────────────────────────────────────────────────────────────────

function EmptyState({ onPick }: { onPick: (q: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex h-full flex-col items-center justify-center gap-5 py-8 text-center"
    >
      <div className="space-y-2">
        <div
          className="mx-auto grid size-12 place-items-center rounded-full bg-brand-soft text-brand"
          aria-hidden
        >
          <Brain className="size-6" />
        </div>
        <p className="text-base font-semibold">Ask the ICSE Tutor anything</p>
        <p className="mx-auto max-w-md text-sm text-muted-foreground">
          Every answer is grounded in real ICSE board specimen papers, exemplars
          and past questions. Try one of these to get started:
        </p>
      </div>

      <div className="grid w-full max-w-2xl gap-2 sm:grid-cols-2">
        {SUGGESTED_QUESTIONS.map((q, i) => (
          <motion.button
            key={q}
            type="button"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: i * 0.04 }}
            onClick={() => onPick(q)}
            className="group flex items-start gap-2 rounded-lg border bg-card p-3 text-left text-sm shadow-sm transition-all hover:border-brand/40 hover:bg-brand-soft/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2"
          >
            <Lightbulb className="mt-0.5 size-4 shrink-0 text-brand transition-transform group-hover:scale-110" aria-hidden />
            <span className="text-foreground">{q}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Loading indicator — animated dots
// ────────────────────────────────────────────────────────────────────────────

function LoadingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex items-center gap-3"
      aria-live="polite"
      aria-label="Tutor is thinking"
    >
      <div
        className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-soft text-brand"
        aria-hidden
      >
        <Brain className="size-3.5" />
      </div>
      <div className="flex items-center gap-1.5 rounded-lg border bg-card px-3 py-2.5 shadow-sm">
        <span className="sr-only">Tutor is thinking</span>
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="size-1.5 rounded-full bg-brand"
            animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.18,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Error alert
// ────────────────────────────────────────────────────────────────────────────

function ErrorAlert({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      role="alert"
      className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-3"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
      <div className="flex-1 space-y-1.5">
        <p className="text-sm font-medium text-destructive">
          The tutor hit a snag
        </p>
        <p className="text-xs text-muted-foreground">{message}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <RotateCcw className="size-3.5" />
          Retry
        </Button>
      </div>
    </motion.div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Message bubble
// ────────────────────────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: TutorMessage }) {
  if (message.role === 'user') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="flex justify-end"
      >
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-brand px-4 py-2.5 text-brand-foreground shadow-sm">
          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
            {message.content}
          </p>
        </div>
      </motion.div>
    );
  }

  return <AssistantMessageCard message={message} />;
}

// ────────────────────────────────────────────────────────────────────────────
// Assistant message card — markdown + reasoning + sources + footer
// ────────────────────────────────────────────────────────────────────────────

function AssistantMessageCard({ message }: { message: TutorMessage }) {
  const [showReasoning, setShowReasoning] = useState(false);
  const sources = message.sources ?? [];
  const durationLabel = formatDuration(message.durationMs);
  const hasReasoning = Boolean(message.reasoning && message.reasoning.trim());

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="flex items-start gap-3"
    >
      <div
        className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-soft text-brand"
        aria-hidden
      >
        <Brain className="size-3.5" />
      </div>

      <div className="max-w-[88%] flex-1 rounded-2xl rounded-tl-md border bg-card px-4 py-3 shadow-sm">
        {/* Answer (markdown) */}
        <article className="prose-icse max-w-none text-sm">
          <ReactMarkdown>{message.content || '_(no answer returned)_'}</ReactMarkdown>
        </article>

        {/* Reasoning disclosure */}
        {hasReasoning && (
          <div className="mt-3 border-t pt-2">
            <button
              type="button"
              onClick={() => setShowReasoning((v) => !v)}
              aria-expanded={showReasoning}
              aria-controls={`reasoning-${message.id}`}
              className="flex items-center gap-1.5 text-xs font-medium text-brand transition-colors hover:text-brand/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-1 rounded"
            >
              <Brain className="size-3.5" aria-hidden />
              {showReasoning ? 'Hide reasoning' : 'Show reasoning'}
              <ChevronDown
                className={`size-3.5 transition-transform ${showReasoning ? 'rotate-180' : ''}`}
                aria-hidden
              />
            </button>
            <AnimatePresence initial={false}>
              {showReasoning && (
                <motion.div
                  id={`reasoning-${message.id}`}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="mt-2 rounded-md border border-brand/20 bg-brand-soft/30 p-3">
                    <p className="mb-1 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-brand">
                      <Sparkles className="size-3" aria-hidden />
                      Chain of thought
                    </p>
                    <p className="whitespace-pre-wrap break-words text-xs leading-relaxed text-muted-foreground">
                      {message.reasoning}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Sources chips */}
        {sources.length > 0 && (
          <div className="mt-3 border-t pt-2">
            <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              <BookOpen className="size-3" aria-hidden />
              Sources ({sources.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {sources.map((src, i) => (
                <SourceChip key={`${src.title}-${i}`} source={src} />
              ))}
            </div>
          </div>
        )}

        {/* Footer: cached + duration */}
        {(message.cached || durationLabel) && (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-2 text-[11px] text-muted-foreground">
            {message.cached && (
              <Badge
                variant="outline"
                className="gap-1 border-amber-strong/40 text-amber-strong"
              >
                <Zap className="size-3" aria-hidden />
                cached
              </Badge>
            )}
            {durationLabel && (
              <span className="inline-flex items-center gap-1 tabular-nums">
                <Sparkles className="size-3 text-brand" aria-hidden />
                {durationLabel}
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Source chip with tooltip
// ────────────────────────────────────────────────────────────────────────────

function SourceChip({ source }: { source: ChatSource }) {
  const label = [source.subject, source.category]
    .filter(Boolean)
    .join(' · ');

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-full border border-brand/30 bg-brand-soft/40 px-2 py-0.5 text-[11px] font-medium text-brand transition-colors hover:bg-brand-soft/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          <BookMarked className="size-3" aria-hidden />
          <span className="max-w-[180px] truncate">{label}</span>
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <p className="font-medium">{source.title}</p>
        {(source.chapter || source.subject) && (
          <p className="mt-0.5 text-[11px] text-primary-foreground/80">
            {source.subject}
            {source.chapter ? ` · ${source.chapter}` : ''}
          </p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
