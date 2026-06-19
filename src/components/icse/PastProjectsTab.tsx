'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FolderOpen, Trash2, Loader2, FileText, Calendar, BookOpen, RefreshCcw,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { ProjectListItem, PipelineResponse } from './types';

interface PastProjectsTabProps {
  refreshKey: number;
  onOpen: (project: PipelineResponse) => void;
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

export function PastProjectsTab({ refreshKey, onOpen }: PastProjectsTabProps) {
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      setProjects(data.projects || []);
    } catch {
      toast.error('Could not load projects');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const openProject = async (p: ProjectListItem) => {
    setOpeningId(p.id);
    try {
      const res = await fetch(`/api/projects/${p.id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Could not load project');
      const proj = data.project;
      let outline = {};
      try {
        outline = proj.outline ? JSON.parse(proj.outline) : {};
      } catch {}
      let images: PipelineResponse['images'] = [];
      try {
        images = proj.images ? JSON.parse(proj.images) : [];
      } catch {}
      let logs: PipelineResponse['logs'] = [];
      try {
        logs = proj.agentLogs ? JSON.parse(proj.agentLogs) : [];
      } catch {}
      const pipelineResult: PipelineResponse = {
        projectId: proj.id,
        subject: proj.subject,
        className: proj.className,
        topic: proj.topic,
        outline,
        finalOutput: proj.finalOutput || '',
        images,
        logs,
      };
      onOpen(pipelineResult);
      toast.success(`Loaded "${proj.topic || proj.title}"`);
    } catch (err: any) {
      toast.error(err?.message || 'Could not load project');
    } finally {
      setOpeningId(null);
    }
  };

  const deleteProject = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Could not delete project');
      setProjects((prev) => prev.filter((p) => p.id !== id));
      toast.success('Project deleted');
    } catch (err: any) {
      toast.error(err?.message || 'Could not delete project');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FolderOpen className="size-5 text-brand" />
              Past Projects
            </CardTitle>
            <CardDescription>
              Previously forged projects. Click any to re-open in the output viewer.
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={load} className="gap-1.5">
            <RefreshCcw className="size-3.5" /> Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <div className="grid size-10 place-items-center rounded-full bg-muted text-muted-foreground">
              <FileText className="size-5" />
            </div>
            <p className="text-sm font-medium">No projects yet</p>
            <p className="text-xs text-muted-foreground max-w-sm">
              Forge your first project from the <span className="font-medium text-foreground">Workflow</span> tab — it
              will be saved here automatically.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {projects.map((p, i) => (
              <motion.li
                key={p.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.03 * i, duration: 0.2 }}
                className="flex flex-col gap-3 rounded-lg border bg-card p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <button
                  onClick={() => openProject(p)}
                  disabled={openingId === p.id}
                  className="group flex min-w-0 flex-1 items-start gap-3 text-left"
                  aria-label={`Open project ${p.topic || p.title}`}
                >
                  <div className="grid size-9 shrink-0 place-items-center rounded-md bg-brand-soft text-brand">
                    {openingId === p.id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <BookOpen className="size-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium group-hover:text-brand">
                      {p.topic || p.title || 'Untitled'}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                      <Badge variant="secondary" className="py-0">
                        {p.subject}
                      </Badge>
                      <Badge variant="outline" className="py-0">
                        Class {p.className}
                      </Badge>
                      <span className="flex items-center gap-1">
                        <Calendar className="size-3" />
                        {formatDate(p.createdAt)}
                      </span>
                      <Badge
                        variant="outline"
                        className={
                          p.status === 'completed'
                            ? 'border-brand/40 text-brand py-0'
                            : p.status === 'failed'
                            ? 'border-destructive/40 text-destructive py-0'
                            : 'py-0'
                        }
                      >
                        {p.status}
                      </Badge>
                    </div>
                  </div>
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Delete project ${p.topic || p.title}`}
                  onClick={() => deleteProject(p.id)}
                  disabled={deletingId === p.id}
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                >
                  {deletingId === p.id ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                </Button>
              </motion.li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
