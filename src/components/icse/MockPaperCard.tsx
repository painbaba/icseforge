'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { MockPaper } from './types';

interface MockPaperCardProps {
  paper: MockPaper;
  id?: string | null;
}

export function MockPaperCard({ paper, id }: MockPaperCardProps) {
  const [showAnswers, setShowAnswers] = useState(false);

  const totalMarks =
    paper.totalMarks ??
    paper.sections.reduce(
      (sum, s) => sum + s.questions.reduce((a, q) => a + (q.marks || 0), 0),
      0
    );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-lg border bg-muted/40 p-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            ICSE Specimen-Style Mock Paper
          </p>
          <p className="mt-0.5 text-lg font-semibold">
            {paper.subject || 'Subject'} — {paper.topic || 'Topic'}
          </p>
          {id && (
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              ID: <span className="font-mono">{id}</span>
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 text-sm">
          <Badge className="bg-brand/15 text-brand border-brand/30 tabular-nums">
            {totalMarks} marks
          </Badge>
          <Badge variant="secondary" className="tabular-nums">
            {paper.duration ?? 60} minutes
          </Badge>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Answer all questions. Internal choices are indicated where applicable.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAnswers((v) => !v)}
          className="gap-1.5"
          aria-pressed={showAnswers}
        >
          {showAnswers ? (
            <>
              <EyeOff className="size-3.5" /> Hide answers
            </>
          ) : (
            <>
              <Eye className="size-3.5" /> Show answers
            </>
          )}
        </Button>
      </div>

      {/* Sections */}
      <div className="space-y-5">
        {paper.sections.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No questions generated. Try regenerating with a different topic.
          </p>
        ) : (
          paper.sections.map((section, si) => (
            <section key={si} aria-label={section.name}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-brand">
                  {section.name}
                </h3>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {section.questions.reduce((a, q) => a + (q.marks || 0), 0)} marks ·{' '}
                  {section.questions.length} questions
                </span>
              </div>
              <Separator className="my-2" />
              <ol className="space-y-3">
                {section.questions.map((q, qi) => (
                  <li key={qi} className="text-sm">
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-muted text-xs font-medium">
                        {qi + 1}
                      </span>
                      <div className="flex-1">
                        <p>
                          {q.q}{' '}
                          <span className="text-xs text-muted-foreground">
                            [{q.marks} mark{q.marks === 1 ? '' : 's'}
                            {q.type ? ` · ${q.type}` : ''}]
                          </span>
                        </p>
                        <AnimatePresence>
                          {showAnswers && q.answer && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-1.5 overflow-hidden"
                            >
                              <div className="rounded-md border-l-2 border-brand bg-brand-soft/40 p-2.5 text-xs">
                                <p className="font-medium text-brand">Marking scheme</p>
                                <p className="mt-1 whitespace-pre-wrap text-foreground">
                                  {q.answer}
                                </p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        {q.choice && (
                          <p className="mt-1 text-xs italic text-muted-foreground">
                            <span className="font-medium not-italic">OR</span> {q.choice}
                          </p>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          ))
        )}
      </div>

      {!showAnswers && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <FileQuestion className="size-3.5" />
          Click <span className="font-medium text-foreground">Show answers</span> to reveal the marking scheme.
        </p>
      )}
    </div>
  );
}
