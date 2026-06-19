'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileQuestion, Loader2, FlaskConical } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  ToggleGroup, ToggleGroupItem,
} from '@/components/ui/toggle-group';
import { ICSE_SUBJECTS, DIFFICULTIES, type MockPaper, type MockResponse } from './types';
import { MockPaperCard } from './MockPaperCard';

export function MockGeneratorTab() {
  const [subject, setSubject] = useState('');
  const [className, setClassName] = useState('10');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<string>('medium');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{ paper: MockPaper; id?: string | null } | null>(null);

  const handleGenerate = async () => {
    if (!subject) {
      toast.error('Pick a subject first.');
      return;
    }
    if (!topic.trim()) {
      toast.error('Enter a topic.');
      return;
    }
    setGenerating(true);
    setResult(null);
    try {
      const res = await fetch('/api/mock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, className, topic, difficulty }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Mock generation failed');
      const m = data as MockResponse;
      setResult({ paper: m.paper, id: m.id });
      toast.success('Mock paper ready');
    } catch (err: any) {
      toast.error(err?.message || 'Mock generation failed');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FlaskConical className="size-5 text-brand" />
            Standalone Mock Generator
          </CardTitle>
          <CardDescription>
            Generate a topic-focused ICSE specimen-style mock paper without running the
            full project pipeline.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="mg-subject">Subject *</Label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger id="mg-subject" className="w-full">
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
              <Label htmlFor="mg-class">Class</Label>
              <Select value={className} onValueChange={setClassName}>
                <SelectTrigger id="mg-class" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="9">Class 9</SelectItem>
                  <SelectItem value="10">Class 10</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mg-topic">Topic *</Label>
            <Input
              id="mg-topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Refraction of Light"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Difficulty</Label>
            <ToggleGroup
              type="single"
              value={difficulty}
              onValueChange={(v) => v && setDifficulty(v)}
              variant="outline"
              className="justify-start"
            >
              {DIFFICULTIES.map((d) => (
                <ToggleGroupItem key={d} value={d} className="capitalize">
                  {d}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <p className="text-[11px] text-muted-foreground">
              <span className="capitalize">{difficulty}</span>:{' '}
              {difficulty === 'easy'
                ? 'fundamentals & definitions'
                : difficulty === 'medium'
                ? 'board-level mix'
                : 'application-heavy reasoning'}
            </p>
          </div>
          <Button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full gap-2 bg-brand hover:bg-brand/90 text-brand-foreground"
          >
            {generating ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Generating…
              </>
            ) : (
              <>
                <FileQuestion className="size-4" /> Generate Mock Paper
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Paper</CardTitle>
          <CardDescription>
            Section A short-answers + Section B long-answers with internal choice.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AnimatePresence mode="wait">
            {generating ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center gap-3 py-16 text-center"
              >
                <Loader2 className="size-8 animate-spin text-brand" />
                <p className="text-sm text-muted-foreground">
                  Drafting questions and marking scheme…
                </p>
              </motion.div>
            ) : result ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <MockPaperCard paper={result.paper} id={result.id} />
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center gap-2 py-16 text-center"
              >
                <div className="grid size-10 place-items-center rounded-full bg-muted text-muted-foreground">
                  <FileQuestion className="size-5" />
                </div>
                <p className="text-sm font-medium">No mock paper yet</p>
                <p className="text-xs text-muted-foreground max-w-sm">
                  Pick a subject + topic, choose difficulty, and hit Generate.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}
