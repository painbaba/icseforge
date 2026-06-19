'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpenCheck, Layers, Database, Plus, Loader2, Info, Sparkles, Users, FolderSearch, Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  ICSE_SUBJECTS, KB_CATEGORIES, type KnowledgeStats,
} from './types';

interface KnowledgeBaseTabProps {
  refreshKey?: number;
}

export function KnowledgeBaseTab({ refreshKey = 0 }: KnowledgeBaseTabProps) {
  const [stats, setStats] = useState<KnowledgeStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [ingesting, setIngesting] = useState(false);
  const [ingestReport, setIngestReport] = useState<any>(null);

  // Form state
  const [subject, setSubject] = useState('');
  const [className, setClassName] = useState('10');
  const [category, setCategory] = useState('');
  const [chapter, setChapter] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');

  const loadStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const res = await fetch('/api/knowledge/stats');
      const data = (await res.json()) as KnowledgeStats;
      setStats(data);
    } catch {
      toast.error('Could not load knowledge base stats');
    } finally {
      setLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats, refreshKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !category || !title || !content.trim()) {
      toast.error('Subject, category, title and content are required.');
      return;
    }
    if (content.trim().length < 30) {
      toast.error('Content should be at least 30 characters.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/knowledge/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject, className, category, chapter: chapter || 'General',
          title, content, tags,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Could not add chunk');
      toast.success('Knowledge chunk added. KB index refreshed.');
      // Reset form
      setTitle('');
      setContent('');
      setTags('');
      setChapter('');
      // Refresh stats
      loadStats();
    } catch (err: any) {
      toast.error(err?.message || 'Could not add chunk');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSmartIngest = async (dryRun: boolean = false) => {
    setIngesting(true);
    setIngestReport(null);
    toast.info(dryRun ? 'Scanning uploads folder (dry run)...' : 'Scanning & ingesting uploads...');
    try {
      const res = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Ingest failed');
      setIngestReport(data);
      const s = data.summary;
      toast.success(
        dryRun
          ? `Scan complete: ${s.chunksIngested} new, ${s.chunksSkipped} duplicates would be skipped`
          : `Ingested ${s.chunksIngested} new chunks (skipped ${s.chunksSkipped} duplicates)`,
        { duration: 6000 }
      );
      if (!dryRun) loadStats();
    } catch (err: any) {
      toast.error(err?.message || 'Ingest failed');
    } finally {
      setIngesting(false);
    }
  };

  const totalCacheHits = stats
    ? stats.cache.llmCacheHits + stats.cache.imageCacheHits
    : 0;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
      {/* Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Database className="size-5 text-brand" />
            Knowledge Base Stats
          </CardTitle>
          <CardDescription>
            Local RAG index — used by Outline, Writer & Mock agents.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingStats ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Loading…
            </div>
          ) : stats ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Stat
                  icon={<BookOpenCheck className="size-4 text-brand" />}
                  label="Total chunks"
                  value={stats.knowledgeBase.totalChunks}
                />
                <Stat
                  icon={<Users className="size-4 text-brand" />}
                  label="User-contributed"
                  value={stats.userContributedChunks}
                />
                <Stat
                  icon={<Layers className="size-4 text-brand" />}
                  label="Subjects"
                  value={stats.knowledgeBase.subjects.length}
                />
                <Stat
                  icon={<Sparkles className="size-4 text-brand" />}
                  label="Cache hits"
                  value={totalCacheHits}
                />
              </div>
              <Separator />
              <div>
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                  Subjects covered
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {stats.knowledgeBase.subjects.map((s) => (
                    <Badge key={s} variant="secondary" className="text-xs">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                  Categories
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {stats.knowledgeBase.categories.map((c) => (
                    <Badge key={c} variant="outline" className="text-xs">
                      {c.replace(/_/g, ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FolderSearch className="size-4 text-brand" />
                  <p className="text-xs font-medium">Smart Ingest from /upload folder</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Drop JSON/TXT/MD/DOCX/CSV files in <code className="rounded bg-muted px-1">/home/z/my-project/upload/</code> then click below. Auto-deduplicates against existing KB — only new chunks are ingested.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSmartIngest(true)}
                    disabled={ingesting}
                  >
                    {ingesting ? <Loader2 className="size-3.5 animate-spin" /> : <FolderSearch className="size-3.5" />}
                    Scan (dry run)
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleSmartIngest(false)}
                    disabled={ingesting}
                  >
                    {ingesting ? <Loader2 className="size-3.5 animate-spin" /> : <Zap className="size-3.5" />}
                    Ingest new chunks
                  </Button>
                </div>
                {ingestReport && (
                  <div className="rounded-md border bg-muted/40 p-2.5 text-xs">
                    <div className="font-medium mb-1">Last run summary</div>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-muted-foreground">
                      <span>Files scanned: <strong className="text-foreground">{ingestReport.summary.filesScanned}</strong></span>
                      <span>Chunks parsed: <strong className="text-foreground">{ingestReport.summary.chunksParsed}</strong></span>
                      <span>Skipped (dups): <strong className="text-foreground">{ingestReport.summary.chunksSkipped}</strong></span>
                      <span>New ingested: <strong className="text-brand">{ingestReport.summary.chunksIngested}</strong></span>
                      <span>Total KB: <strong className="text-foreground">{ingestReport.summary.totalChunks}</strong></span>
                    </div>
                    {ingestReport.report && ingestReport.report.length > 0 && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">Per-file report ({ingestReport.report.length} files)</summary>
                        <ul className="mt-1 space-y-0.5">
                          {ingestReport.report.map((r: any) => (
                            <li key={r.file} className="text-muted-foreground">
                              <strong className="text-foreground">{r.file}</strong> — {r.format}, {r.parsed} parsed, {r.ingested} new, {r.skipped} dups
                            </li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Stats unavailable.</p>
          )}
        </CardContent>
      </Card>

      {/* Add form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Plus className="size-5 text-brand" />
            Add Knowledge Chunk
          </CardTitle>
          <CardDescription className="flex items-start gap-1.5">
            <Info className="size-3.5 mt-0.5 shrink-0 text-brand" />
            <span>
              Feed ICSE specimen papers, textbook summaries, past papers, project
              exemplars — anything the agents should learn from. Chunks are
              indexed locally and used for RAG retrieval on the next pipeline run.
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="kb-subject">Subject *</Label>
                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger id="kb-subject" className="w-full">
                    <SelectValue placeholder="Choose subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {ICSE_SUBJECTS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="kb-class">Class</Label>
                <Select value={className} onValueChange={setClassName}>
                  <SelectTrigger id="kb-class" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="9">Class 9</SelectItem>
                    <SelectItem value="10">Class 10</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="kb-category">Category *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="kb-category" className="w-full">
                    <SelectValue placeholder="Choose category" />
                  </SelectTrigger>
                  <SelectContent>
                    {KB_CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="kb-chapter">Chapter</Label>
                <Input
                  id="kb-chapter"
                  value={chapter}
                  onChange={(e) => setChapter(e.target.value)}
                  placeholder="e.g. Light — Reflection & Refraction"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="kb-title">Title *</Label>
              <Input
                id="kb-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. ICSE Physics Specimen Paper Pattern 2024"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="kb-content">Content *</Label>
              <Textarea
                id="kb-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste the full text — definitions, paper pattern, syllabus extracts, exemplar paragraphs…"
                className="min-h-32 font-mono text-xs"
              />
              <p className="text-[11px] text-muted-foreground">
                {content.length.toLocaleString()} characters · minimum 30
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="kb-tags">Tags (comma-separated)</Label>
              <Input
                id="kb-tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g. refraction, lens, numericals, board-pattern"
              />
            </div>
            <Button
              type="submit"
              disabled={submitting}
              className="w-full gap-2 bg-brand hover:bg-brand/90 text-brand-foreground"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Adding…
                </>
              ) : (
                <>
                  <Plus className="size-4" /> Add to knowledge base
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({
  icon, label, value,
}: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border bg-muted/30 p-3"
    >
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
    </motion.div>
  );
}
