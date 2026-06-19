'use client';

import { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Copy, Download, FileQuestion, Loader2, ChevronRight,
  ImageIcon, ListTree, ScrollText, Eye, EyeOff,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  type PipelineResponse, type AgentLog, type MockPaper, type MockResponse,
} from './types';
import { MockPaperCard } from './MockPaperCard';

interface OutputViewerProps {
  result: PipelineResponse | null;
  onMockGenerated?: (m: MockResponse) => void;
}

function copyToClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  }
  // Fallback
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
  } finally {
    document.body.removeChild(ta);
  }
  return Promise.resolve();
}

export function OutputViewer({ result, onMockGenerated }: OutputViewerProps) {
  const [generatingMock, setGeneratingMock] = useState(false);
  const [mock, setMock] = useState<MockPaper | null>(null);
  const [mockId, setMockId] = useState<string | null>(null);

  const safeImages = useMemo(() => {
    if (!result) return [];
    return Array.isArray(result.images) ? result.images : [];
  }, [result]);

  if (!result) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
            <ScrollText className="size-6" />
          </div>
          <div>
            <p className="font-medium">Your forged project will appear here</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Upload a file and run the pipeline. The 7-agent output (markdown, diagrams,
              outline, logs) shows up in this panel.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleCopy = async () => {
    try {
      await copyToClipboard(result.finalOutput || '');
      toast.success('Markdown copied to clipboard');
    } catch {
      toast.error('Could not copy markdown');
    }
  };

  const handleDownload = () => {
    const blob = new Blob([result.finalOutput || ''], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeName = (result.topic || 'icse-project')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    a.download = `${safeName || 'icse-project'}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Downloaded markdown file');
  };

  const handleMock = async () => {
    setGeneratingMock(true);
    try {
      const res = await fetch('/api/mock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: result.subject,
          className: result.className,
          topic: result.topic,
          difficulty: 'medium',
          projectId: result.projectId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Mock generation failed');
      const m = data as MockResponse;
      setMock(m.paper);
      setMockId(m.id);
      onMockGenerated?.(m);
      toast.success('Mock paper generated');
    } catch (err: any) {
      toast.error(err?.message || 'Mock generation failed');
    } finally {
      setGeneratingMock(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="space-y-1.5">
              <CardTitle className="flex items-center gap-2 text-xl">
                <span className="grid size-7 place-items-center rounded-full bg-brand-soft text-brand text-sm font-bold">
                  3
                </span>
                Forged output
              </CardTitle>
              <CardDescription className="flex flex-wrap items-center gap-2">
                <span className="text-base font-semibold text-foreground">
                  {result.topic}
                </span>
                <Badge className="bg-brand/15 text-brand border-brand/30">
                  {result.subject}
                </Badge>
                <Badge variant="secondary">Class {result.className}</Badge>
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
                    <Copy className="size-3.5" /> Copy
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copy markdown to clipboard</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={handleDownload} className="gap-1.5">
                    <Download className="size-3.5" /> .md
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Download as markdown file</TooltipContent>
              </Tooltip>
              <Button
                size="sm"
                onClick={handleMock}
                disabled={generatingMock}
                className="gap-1.5 bg-brand hover:bg-brand/90 text-brand-foreground"
              >
                {generatingMock ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <FileQuestion className="size-3.5" />
                )}
                Generate Mock
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
        {/* Markdown output */}
        <Card className="overflow-hidden">
          <CardContent className="pt-6">
            <article className="prose-icse max-w-none">
              <ReactMarkdown>{result.finalOutput || '_(no content generated)_'}</ReactMarkdown>
            </article>
          </CardContent>
        </Card>

        {/* Sidebar: images + outline + logs */}
        <div className="lg:sticky lg:top-6 lg:self-start space-y-4">
          {/* Images */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ImageIcon className="size-4 text-brand" />
                Generated Images
                <Badge variant="secondary" className="ml-auto tabular-nums">
                  {safeImages.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {safeImages.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No diagrams were generated for this project.
                </p>
              ) : (
                safeImages.map((img, i) => (
                  <figure key={i} className="space-y-1.5">
                    <img
                      src={img.path}
                      alt={img.caption || `Generated diagram ${i + 1}`}
                      className="w-full rounded-md border bg-muted"
                      loading="lazy"
                    />
                    <figcaption className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">Fig {i + 1}.</span>{' '}
                      {img.caption}
                    </figcaption>
                  </figure>
                ))
              )}
            </CardContent>
          </Card>

          {/* Outline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ListTree className="size-4 text-brand" />
                Outline
              </CardTitle>
              <CardDescription className="text-xs">
                ICSE structure the Writer followed.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {result.outline?.sections?.length ? (
                <Accordion type="multiple" className="w-full">
                  {result.outline.sections.map((s, i) => (
                    <AccordionItem key={i} value={`sec-${i}`}>
                      <AccordionTrigger className="py-2 text-sm">
                        <span className="flex items-center gap-2">
                          <ChevronRight className="size-3 text-brand" />
                          {s.name}
                        </span>
                      </AccordionTrigger>
                      {s.description && (
                        <AccordionContent className="text-xs text-muted-foreground">
                          {s.description}
                        </AccordionContent>
                      )}
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <p className="text-xs text-muted-foreground">No outline available.</p>
              )}
            </CardContent>
          </Card>

          {/* Agent logs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ScrollText className="size-4 text-brand" />
                Agent Logs
              </CardTitle>
              <CardDescription className="text-xs">
                Per-agent runtime + cache status.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="logs" className="border-b-0">
                  <AccordionTrigger className="py-2 text-sm">
                    Show all {result.logs.length} agents
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul className="space-y-2">
                      {result.logs.map((l: AgentLog, i) => (
                        <li
                          key={i}
                          className="flex items-start justify-between gap-2 text-xs"
                        >
                          <div className="min-w-0">
                            <p className="font-medium">{l.agent}</p>
                            <p className="text-muted-foreground truncate">
                              {l.output || l.error || l.status}
                            </p>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-0.5">
                            <Badge
                              variant="outline"
                              className={
                                l.status === 'completed'
                                  ? 'border-brand/40 text-brand'
                                  : l.status === 'failed'
                                  ? 'border-destructive/40 text-destructive'
                                  : 'text-muted-foreground'
                              }
                            >
                              {l.status}
                            </Badge>
                            <span className="tabular-nums text-muted-foreground">
                              {l.durationMs != null
                                ? `${(l.durationMs / 1000).toFixed(1)}s`
                                : '—'}
                            </span>
                            {l.cached && (
                              <span className="text-[10px] text-brand">cached</span>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mock paper (below) */}
      <AnimatePresence>
        {(mock || generatingMock) && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileQuestion className="size-5 text-brand" />
                  Mock Paper
                  {mock && (
                    <Badge variant="secondary" className="ml-auto">
                      {mock.totalMarks ?? '—'} marks · {mock.duration ?? 60} min
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Specimen-style mock paper generated for this topic.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {generatingMock ? (
                  <div className="flex items-center gap-3 py-8 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin text-brand" />
                    Generating questions and marking scheme…
                  </div>
                ) : mock ? (
                  <MockPaperCard paper={mock} id={mockId} />
                ) : null}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Separator />
    </div>
  );
}

// Re-exported for convenience
export { MockPaperCard };
