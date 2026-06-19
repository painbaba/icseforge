'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileSearch, ListTree, PenLine, Image as ImageIcon, Palette,
  ShieldCheck, FileQuestion, Loader2, CheckCircle2, AlertCircle,
  Clock, Sparkles, Flame, Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  PIPELINE_AGENTS, type AgentLog, type UploadResponse, type PipelineResponse,
} from './types';

interface AgentPipelineProps {
  upload: UploadResponse | null;
  subject: string;
  className: string;
  topic: string;
  disabled?: boolean;
  onComplete: (result: PipelineResponse) => void;
  onProjectCountIncrement?: () => void;
}

const ICONS = {
  FileSearch, ListTree, PenLine, Image: ImageIcon, Palette, ShieldCheck, FileQuestion,
} as const;

type AgentStatus = 'pending' | 'running' | 'completed' | 'failed';

interface FakeAgentState {
  name: string;
  status: AgentStatus;
  durationMs?: number;
  cached?: boolean;
}

// Approximate "expected" duration for each agent (ms) — used to pace the fake animation.
const FAKE_DURATIONS = [3500, 5000, 18000, 4000, 12000, 9000, 7000];

function formatMs(ms?: number) {
  if (!ms && ms !== 0) return '';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function AgentPipeline(props: AgentPipelineProps) {
  const { upload, subject, className, topic, disabled, onComplete, onProjectCountIncrement } = props;
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [fakeState, setFakeState] = useState<FakeAgentState[]>(
    PIPELINE_AGENTS.map((a) => ({ name: a.name, status: 'pending' }))
  );
  const [finalLogs, setFinalLogs] = useState<AgentLog[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const startRef = useRef<number | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const fakeIndexRef = useRef(0);

  const canForge = !!upload && upload.textLength >= 20 && !running && !disabled;

  // Elapsed timer
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      if (startRef.current) setElapsed(Date.now() - startRef.current);
    }, 200);
    return () => clearInterval(id);
  }, [running]);

  // Fake progressive agent animation while waiting
  useEffect(() => {
    if (!running) return;
    // Reset fake state
    fakeIndexRef.current = 0;
    setFakeState(PIPELINE_AGENTS.map((a) => ({ name: a.name, status: 'pending' })));

    // Schedule each agent to "start" sequentially based on FAKE_DURATIONS.
    let acc = 0;
    const newTimers: ReturnType<typeof setTimeout>[] = [];
    PIPELINE_AGENTS.forEach((agent, i) => {
      const startAt = acc;
      const finishAt = acc + FAKE_DURATIONS[i];
      newTimers.push(
        setTimeout(() => {
          setFakeState((prev) =>
            prev.map((a, idx) =>
              idx === i ? { ...a, status: 'running' } : a
            )
          );
        }, startAt)
      );
      newTimers.push(
        setTimeout(() => {
          setFakeState((prev) =>
            prev.map((a, idx) =>
              idx === i ? { ...a, status: 'completed', durationMs: FAKE_DURATIONS[i] } : a
            )
          );
        }, finishAt)
      );
      acc = finishAt;
    });
    timersRef.current = newTimers;

    return () => {
      newTimers.forEach(clearTimeout);
    };
  }, [running]);

  const handleForge = async () => {
    if (!upload) return;
    setRunning(true);
    setError(null);
    setFinalLogs(null);
    setElapsed(0);
    startRef.current = Date.now();

    try {
      const res = await fetch('/api/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceText: upload.extractedText,
          sourceName: upload.filename,
          userTopic: topic,
          userSubject: subject,
          userClass: className,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Pipeline failed');

      const result = data as PipelineResponse;
      // Replace fake animation with real logs
      setFinalLogs(result.logs);
      setRunning(false);
      onProjectCountIncrement?.();
      onComplete(result);
    } catch (err: any) {
      setError(err?.message || 'Pipeline failed');
      setRunning(false);
      // Mark all still-pending fake agents as failed
      setFakeState((prev) =>
        prev.map((a) => (a.status === 'pending' || a.status === 'running' ? { ...a, status: 'failed' } : a))
      );
    }
  };

  // Derive display state: real logs if available, else fake state
  const displayAgents = useMemo(() => {
    if (finalLogs) {
      return PIPELINE_AGENTS.map((def) => {
        const log = finalLogs.find(
          (l) => l.agent.toLowerCase() === def.name.toLowerCase()
        );
        return {
          def,
          status: log?.status ?? 'pending',
          durationMs: log?.durationMs,
          cached: log?.cached,
          output: log?.output,
          error: log?.error,
        };
      });
    }
    return fakeState.map((s, i) => ({
      def: PIPELINE_AGENTS[i],
      status: s.status,
      durationMs: s.durationMs,
      cached: s.cached,
      output: undefined,
      error: undefined,
    }));
  }, [fakeState, finalLogs]);

  const completedCount = displayAgents.filter((a) => a.status === 'completed').length;
  const progressPct = running
    ? Math.min(95, (completedCount / PIPELINE_AGENTS.length) * 100)
    : finalLogs
    ? 100
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <span className="grid size-7 place-items-center rounded-full bg-brand-soft text-brand text-sm font-bold">
            2
          </span>
          Forge project
          {finalLogs && (
            <Badge className="bg-brand/15 text-brand border-brand/30">
              <CheckCircle2 className="size-3" /> Done
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Seven AI agents collaborate to analyze, outline, write, illustrate, and verify your ICSE project.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            size="lg"
            onClick={handleForge}
            disabled={!canForge}
            className="gap-2 bg-brand hover:bg-brand/90 text-brand-foreground"
          >
            {running ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Forging…
              </>
            ) : (
              <>
                <Flame className="size-4" />
                Forge Project
              </>
            )}
          </Button>
          {!canForge && !running && (
            <p className="text-xs text-muted-foreground">
              {upload
                ? 'Need at least 20 characters of extracted text.'
                : 'Upload a file in Step 1 to enable forging.'}
            </p>
          )}
          {running && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="size-3.5" />
              <span className="tabular-nums">{(elapsed / 1000).toFixed(1)}s elapsed</span>
              <span aria-hidden>•</span>
              <span>This can take 1–2 minutes</span>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <AnimatePresence>
          {(running || finalLogs) && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-1.5"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {finalLogs
                    ? `Pipeline complete — ${completedCount}/${PIPELINE_AGENTS.length} agents succeeded`
                    : `${completedCount}/${PIPELINE_AGENTS.length} agents working`}
                </span>
                <span className="tabular-nums text-muted-foreground">
                  {Math.round(progressPct)}%
                </span>
              </div>
              <Progress value={progressPct} className="h-2" />
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="size-4 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Pipeline error</p>
              <p className="text-xs opacity-90 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Agent cards grid */}
        <ol className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3" aria-label="Agent pipeline status">
          {displayAgents.map(({ def, status, durationMs, cached, output, error: agentError }, i) => {
            const Icon = ICONS[def.icon];
            return (
              <motion.li
                key={def.name}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.04 * i, duration: 0.25 }}
                className={[
                  'relative flex items-start gap-3 rounded-lg border p-3 transition-colors',
                  status === 'running' && 'border-brand/40 bg-brand-soft/40',
                  status === 'completed' && 'border-brand/30 bg-card',
                  status === 'failed' && 'border-destructive/40 bg-destructive/5',
                  status === 'pending' && 'bg-muted/30 opacity-70',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <div
                  className={[
                    'grid size-9 shrink-0 place-items-center rounded-md',
                    status === 'completed' && 'bg-brand text-brand-foreground',
                    status === 'running' && 'bg-brand/20 text-brand',
                    status === 'failed' && 'bg-destructive/15 text-destructive',
                    status === 'pending' && 'bg-muted text-muted-foreground',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {status === 'running' ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : status === 'completed' ? (
                    <Icon className="size-4" />
                  ) : status === 'failed' ? (
                    <AlertCircle className="size-4" />
                  ) : (
                    <Icon className="size-4" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-sm font-medium">{def.label}</p>
                    {cached && (
                      <Badge variant="outline" className="gap-1 py-0 text-[10px] text-brand border-brand/40">
                        <Zap className="size-2.5" /> cached
                      </Badge>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                    {def.description}
                  </p>
                  <div className="mt-1.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                    {status === 'running' && (
                      <span className="flex items-center gap-1 text-brand">
                        <Sparkles className="size-3" /> running…
                      </span>
                    )}
                    {status === 'completed' && durationMs !== undefined && (
                      <span className="tabular-nums">{formatMs(durationMs)}</span>
                    )}
                    {status === 'pending' && <span>queued</span>}
                    {status === 'failed' && (
                      <span className="text-destructive">
                        {agentError ? 'failed' : 'failed'}
                      </span>
                    )}
                    {output && status === 'completed' && (
                      <span className="truncate opacity-80">· {output}</span>
                    )}
                  </div>
                </div>
              </motion.li>
            );
          })}
        </ol>

        {!running && !finalLogs && !error && (
          <p className="text-xs text-muted-foreground">
            Click <span className="font-medium text-foreground">Forge Project</span> to start. The pipeline runs
            sequentially because each agent builds on the previous one's output.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
