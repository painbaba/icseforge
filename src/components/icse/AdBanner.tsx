'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, BookOpen, GraduationCap, Flame, ArrowUpRight, Check, Sliders, RotateCcw } from 'lucide-react';

export interface Sponsor {
  id: string;
  name: string;
  tagline: string;
  description: string;
  ctaText: string;
  ctaLink: string;
  badge: string;
  imageAlt: string;
  promoCode?: string;
  highlightText?: string;
}

export const SPONSORS: Sponsor[] = [
  {
    id: 'oswaal',
    name: 'Oswaal Books',
    tagline: 'Get 35% Off 2026 ICSE Specimen Solved Banks',
    description: 'Master the new paper patterns with chapter-wise self-assessment papers, toppers answer sheets, and quick revision mind maps recommended by CISCE school faculties.',
    ctaText: 'Shop Oswaal Books',
    ctaLink: 'https://oswaalbooks.com',
    badge: 'Official Prep Partner',
    imageAlt: 'Oswaal ICSE Prep Books',
    promoCode: 'FORGE35',
    highlightText: '🔥 Best Seller for Class 10'
  },
  {
    id: 'educart',
    name: 'Educart Publications',
    tagline: 'Boost Board Exam Score with 10 Sample Papers',
    description: 'Get simulated specimen question papers styled exactly like real board prints. Fully updated for the latest Class 1-10 syllabus with detailed explanations and grading rubrics.',
    ctaText: 'Download Specimen PDFs',
    ctaLink: 'https://www.educart.co',
    badge: 'Curriculum Approved',
    imageAlt: 'Educart Specimen Papers',
    promoCode: 'ICSEFORGE',
    highlightText: '⭐ 4.9/5 Rating by Toppers'
  },
  {
    id: 'toppermentors',
    name: 'Topper Mentors 1-on-1',
    tagline: 'Unlock Live Mentorship & Paper Grader Pro',
    description: 'Get your projects and mock answers graded by former board examiners. Join live 1-on-1 weekly classes to review critical concepts and master complex topics.',
    ctaText: 'Book Free Trial Class',
    ctaLink: 'https://toppermentors.com',
    badge: '1-on-1 Live Coaching',
    imageAlt: 'Personalized Tutoring Sessions',
    promoCode: 'FREEGRADE',
    highlightText: '⏳ Limited Slots for June Batch'
  }
];

// 1. Top Banner Component
export function TopAdBanner({
  sponsor,
  onDismiss,
  isDismissed
}: {
  sponsor: Sponsor;
  onDismiss: () => void;
  isDismissed: boolean;
}) {
  return (
    <AnimatePresence>
      {!isDismissed && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="relative overflow-hidden bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-950 border-b border-emerald-500/20 text-white z-40"
        >
          {/* Subtle glowing radial overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(16,185,129,0.12),transparent_60%)] pointer-events-none" />

          <div className="max-w-6xl mx-auto px-4 py-3 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left">
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <Sparkles className="size-3" />
                {sponsor.badge}
              </span>
              <p className="text-xs sm:text-sm font-medium text-slate-200">
                <strong className="text-emerald-400 font-bold">{sponsor.name}</strong>: {sponsor.tagline}
                {sponsor.promoCode && (
                  <span className="ml-2 font-mono bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded text-xs select-all">
                    Code: {sponsor.promoCode}
                  </span>
                )}
              </p>
            </div>
            
            <div className="flex items-center gap-4 shrink-0">
              <a
                href={sponsor.ctaLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-slate-900 bg-emerald-400 hover:bg-emerald-300 px-3.5 py-1.5 rounded-lg transition-all shadow-sm hover:scale-[1.02]"
              >
                {sponsor.ctaText}
                <ArrowUpRight className="size-3.5" />
              </a>
              <button
                onClick={onDismiss}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Dismiss banner"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// 2. Floating Sidebar Ad Component
export function SidebarAdCard({
  sponsor,
  onDismiss,
  isDismissed
}: {
  sponsor: Sponsor;
  onDismiss: () => void;
  isDismissed: boolean;
}) {
  return (
    <AnimatePresence>
      {!isDismissed && (
        <motion.div
          initial={{ opacity: 0, x: 50, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 50, scale: 0.95 }}
          className="fixed bottom-6 right-6 z-40 w-72 p-5 rounded-2xl glass-card border border-emerald-500/20 shadow-2xl overflow-hidden hidden xl:block"
        >
          {/* Animated gradient accent border line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400" />
          
          {/* Pulsing decoration dot */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <button
              onClick={onDismiss}
              className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              aria-label="Dismiss ad"
            >
              <X className="size-3.5" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-[9px] uppercase tracking-widest font-black text-emerald-600 dark:text-emerald-400 block">
                SPONSORED PREP
              </span>
              <h4 className="font-extrabold text-sm text-foreground tracking-tight leading-tight pr-8">
                {sponsor.name}
              </h4>
              {sponsor.highlightText && (
                <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 block bg-emerald-500/10 dark:bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10 w-fit">
                  {sponsor.highlightText}
                </span>
              )}
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              {sponsor.description.slice(0, 130)}...
            </p>

            {sponsor.promoCode && (
              <div className="flex items-center justify-between p-2 bg-muted/60 dark:bg-slate-900/50 rounded-lg border border-black/5 dark:border-white/5">
                <span className="text-[10px] text-muted-foreground font-mono">PROMO CODE</span>
                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 select-all tracking-wider px-1.5 py-0.5 bg-emerald-500/10 rounded">
                  {sponsor.promoCode}
                </span>
              </div>
            )}

            <a
              href={sponsor.ctaLink}
              target="_blank"
              rel="noreferrer"
              className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/10 hover:shadow-emerald-600/20 active:scale-98 transition-all"
            >
              {sponsor.ctaText}
              <ArrowUpRight className="size-3.5" />
            </a>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// 3. Inline Sponsored Card (styled like standard grids)
export function InlineAdCard({ sponsor }: { sponsor: Sponsor }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-emerald-500/20 dark:border-emerald-500/10 bg-emerald-500/[0.02] p-5 shadow-sm transition-all hover:translate-y-[-2px] hover:border-emerald-500/30 hover:shadow-md flex flex-col justify-between min-h-[220px]">
      {/* Glow background decorative element */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-500/5 to-transparent rounded-bl-full pointer-events-none" />

      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
              <Sparkles className="size-2.5" />
              SPONSORED
            </span>
            <h4 className="font-extrabold text-base text-foreground tracking-tight mt-1.5">
              {sponsor.name}
            </h4>
          </div>
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 font-mono shrink-0">
            CODE: {sponsor.promoCode || 'FORGE'}
          </span>
        </div>

        <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 leading-snug">
          {sponsor.tagline}
        </p>

        <p className="text-xs text-muted-foreground leading-relaxed">
          {sponsor.description}
        </p>
      </div>

      <div className="pt-4 mt-auto">
        <a
          href={sponsor.ctaLink}
          target="_blank"
          rel="noreferrer"
          className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 hover:scale-[1.01] active:scale-98 transition-all"
        >
          {sponsor.ctaText}
          <ArrowUpRight className="size-3.5" />
        </a>
      </div>
    </div>
  );
}

// 4. Settings Manager Widget (allows testing & changing active mock advertiser)
export function AdSettingsManager({
  activeSponsorId,
  onChangeSponsor,
  onResetDismissed,
  isTopDismissed,
  isSidebarDismissed
}: {
  activeSponsorId: string;
  onChangeSponsor: (id: string) => void;
  onResetDismissed: () => void;
  isTopDismissed: boolean;
  isSidebarDismissed: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mx-auto max-w-4xl px-4 mt-6">
      <div className="border border-black/5 dark:border-white/5 rounded-2xl bg-muted/30 dark:bg-slate-900/10 p-4 sm:p-5 glass-panel">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-600 border border-emerald-500/20">
              <Sliders className="size-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-foreground tracking-tight">
                Mock Sponsor Settings Panel
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Toggle publisher advertisements, test active sponsors, or reset dismissed state.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-xs font-semibold px-4 py-2 bg-background border rounded-xl hover:bg-muted transition-colors w-full sm:w-auto"
          >
            {isOpen ? 'Hide Panel' : 'Configure Sponsors'}
          </button>
        </div>

        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-5 pt-5 border-t border-black/5 dark:border-white/5 space-y-5"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {SPONSORS.map(s => {
                const isActive = s.id === activeSponsorId;
                return (
                  <button
                    key={s.id}
                    onClick={() => onChangeSponsor(s.id)}
                    className={`flex flex-col text-left p-4 rounded-xl border transition-all ${
                      isActive
                        ? 'border-emerald-500 bg-emerald-500/5 shadow-sm ring-1 ring-emerald-500/20'
                        : 'border-black/5 dark:border-white/5 hover:bg-muted/50 bg-background'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-bold text-foreground">{s.name}</span>
                      {isActive && <Check className="size-4 text-emerald-600 shrink-0" />}
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-1 line-clamp-1">
                      {s.tagline}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-3 bg-emerald-500/[0.02] border border-emerald-500/10 rounded-xl">
              <div className="text-xs text-muted-foreground">
                <span className="font-bold text-foreground block">Active Visibility Metrics:</span>
                Top Banner: <span className="font-mono text-foreground font-semibold">{isTopDismissed ? 'Dismissed ❌' : 'Visible 🟢'}</span>
                {' • '}
                Sidebar Widget: <span className="font-mono text-foreground font-semibold">{isSidebarDismissed ? 'Dismissed ❌' : 'Visible 🟢'}</span>
              </div>
              <button
                onClick={onResetDismissed}
                disabled={!isTopDismissed && !isSidebarDismissed}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 disabled:opacity-40 disabled:pointer-events-none"
              >
                <RotateCcw className="size-3.5" />
                Reset Dismissed States
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
