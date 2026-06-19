'use client';

import { useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, FileText, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ICSE_SUBJECTS, type UploadResponse } from './types';

interface UploadStepProps {
  upload: UploadResponse | null;
  onUpload: (res: UploadResponse) => void;
  subject: string;
  onSubject: (v: string) => void;
  className: string;
  onClass: (v: string) => void;
  topic: string;
  onTopic: (v: string) => void;
}

export function UploadStep(props: UploadStepProps) {
  const { upload, onUpload, subject, onSubject, className, onClass, topic, onTopic } = props;
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      const isText =
        file.type.startsWith('text/') || /\.(txt|md|csv)$/i.test(file.name);
      if (!isPdf && !isText) {
        toast.error('Please upload a PDF or text file (.pdf, .txt, .md, .csv).');
        return;
      }
      setUploading(true);
      try {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.error || 'Upload failed');
        }
        onUpload(data as UploadResponse);
        toast.success(`Extracted ${data.textLength.toLocaleString()} characters from ${file.name}`);
      } catch (err: any) {
        toast.error(err?.message || 'Upload failed');
      } finally {
        setUploading(false);
      }
    },
    [onUpload]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const canContinue = !!upload && upload.textLength >= 20;

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <span className="grid size-7 place-items-center rounded-full bg-brand-soft text-brand text-sm font-bold">
                1
              </span>
              Upload source material
            </CardTitle>
            <CardDescription className="mt-1">
              Drop a PDF or text file. Add optional metadata to guide the agents.
            </CardDescription>
          </div>
          {canContinue && (
            <Badge className="bg-brand/15 text-brand border-brand/30">
              <CheckCircle2 className="size-3" /> Ready
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Drop zone */}
        <div
          role="button"
          tabIndex={0}
          aria-label="Upload a PDF or text file"
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={[
            'group relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors',
            dragOver
              ? 'border-brand bg-brand-soft/60'
              : 'border-border hover:border-brand/50 hover:bg-muted/50',
          ].join(' ')}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.txt,.md,.csv,application/pdf,text/*"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.currentTarget.value = '';
            }}
          />
          <div className="grid size-12 place-items-center rounded-full bg-brand-soft text-brand transition-transform group-hover:scale-105">
            {uploading ? (
              <Loader2 className="size-6 animate-spin" />
            ) : (
              <UploadCloud className="size-6" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium">
              {uploading ? 'Extracting text…' : 'Drop a PDF or text file here'}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Click to browse. PDF, .txt, .md, .csv supported.
            </p>
          </div>
        </div>

        {/* Metadata */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="subject">Subject (optional)</Label>
            <Select value={subject} onValueChange={onSubject}>
              <SelectTrigger id="subject" className="w-full">
                <SelectValue placeholder="Auto-detect" />
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
            <Label htmlFor="class">Class (optional)</Label>
            <Select value={className} onValueChange={onClass}>
              <SelectTrigger id="class" className="w-full">
                <SelectValue placeholder="Auto-detect" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="9">Class 9</SelectItem>
                <SelectItem value="10">Class 10</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="topic">Topic (optional)</Label>
            <Input
              id="topic"
              value={topic}
              onChange={(e) => onTopic(e.target.value)}
              placeholder="e.g. Refraction of Light"
            />
          </div>
        </div>

        {/* Preview */}
        <AnimatePresence>
          {upload && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="rounded-lg border bg-muted/40 p-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <FileText className="size-4 text-brand" />
                  <span className="truncate">{upload.filename}</span>
                  <Badge variant="secondary" className="ml-auto tabular-nums">
                    {upload.textLength.toLocaleString()} chars
                  </Badge>
                </div>
                {upload.textLength < 20 ? (
                  <p className="mt-3 flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="size-4" />
                    Not enough extractable text. Try a different PDF or paste your notes as a .txt file.
                  </p>
                ) : (
                  <pre className="mt-3 max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-md bg-background/80 p-3 text-xs text-muted-foreground">
                    {upload.preview}
                  </pre>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {upload && upload.textLength < 20 && (
          <p className="text-xs text-muted-foreground">
            Need at least 20 characters of extracted text to continue. Tip: scanned PDFs need OCR first.
          </p>
        )}
        {!upload && (
          <p className="text-xs text-muted-foreground">
            All processing happens on your server. Nothing is uploaded to third parties.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
