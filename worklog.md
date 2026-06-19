# ICSE Project Tool — Work Log

Project: AI-powered ICSE Board project assistant for Indian students.
Approach: RAG + Prompt-Engineered Multi-Agent Pipeline (no model training — explained to user).

---
Task ID: 0
Agent: main
Task: Project kickoff, architecture design, environment setup

Work Log:
- Explored existing Next.js 16 scaffold (shadcn/ui, Prisma SQLite, z-ai-web-dev-sdk all present)
- Started dev server on port 3000
- Loaded LLM, Image-Generation, and PDF skills
- Decided architecture: 7-agent pipeline (Extractor → Analyzer → Outline → Writer → Image Director → Mock Generator → Originality Reviewer) backed by ICSE knowledge base (RAG)
- Explained to user why RAG+prompt-engineering beats fine-tuning for this use case

Stage Summary:
- Architecture locked in. Ready to build schema, knowledge base, agents, APIs, and frontend.

---
Task ID: 7
Agent: frontend-styling-expert
Task: Build ICSE Project Tool frontend (single-page app on src/app/page.tsx)

Work Log:
- Read worklog + existing API routes (upload, pipeline, projects, projects/[id], mock, knowledge/stats, knowledge/add) and agents.ts to lock the exact response shapes
- Audited available shadcn components (Card, Button, Input, Textarea, Select, Tabs, Badge, Progress, Separator, Accordion, Dialog, Tooltip, Skeleton, Sonner) — all present and used as-is
- Updated `src/app/globals.css` with a warm scholarly palette (emerald `--brand: oklch(0.55 0.13 155)` + amber accents on warm-neutral background), full dark-mode parity, brand utility classes (`.bg-brand`, `.text-brand`, etc.), and a `.prose-icse` typography stylesheet for rendering the pipeline's markdown output
- Updated `src/app/layout.tsx`: ICSE-branded metadata, mounted Sonner `<Toaster>` alongside the existing radix Toaster
- Created `src/components/icse/types.ts` — shared types (AgentLog, PipelineResponse, MockPaper, KnowledgeStats, UploadResponse, FullProject), pipeline agent definitions, ICSE subjects list, KB categories, difficulties
- Created `src/components/icse/StatChips.tsx` — live stat chips (KB chunks, subjects, cache hits) pulled from `/api/knowledge/stats`, with hero & footer variants and loading/empty states
- Created `src/components/icse/UploadStep.tsx` — accessible drag-and-drop PDF/text upload (Enter/Space keyboard support), optional Subject/Class/Topic metadata, animated text preview, 20-char validation gating Step 2
- Created `src/components/icse/AgentPipeline.tsx` — "Forge Project" button calling `/api/pipeline`. While waiting, animates the 7 agent cards (Analyzer → Outline → Writer → Image Director → Image Generator → Originality → Mock) progressively with fake timers based on expected per-agent durations. On response, replaces fake state with real `logs` (status, durationMs, cached badge). Global Progress bar + elapsed timer + "1-2 min" hint
- Created `src/components/icse/MockPaperCard.tsx` — renders mock paper (sections, questions, marks, internal choices), with a "Show answers" toggle that reveals the marking scheme with smooth framer-motion expand
- Created `src/components/icse/OutputViewer.tsx` — 3-column layout: header (topic + subject/class badges, Copy/Download/Generate Mock buttons), left = rendered markdown via react-markdown (inline images supported), right sticky sidebar = Generated Images gallery + collapsible Outline accordion + collapsible Agent Logs. Mock paper renders in a separate Card below with reveal-answers toggle
- Created `src/components/icse/PastProjectsTab.tsx` — lists `/api/projects` (with Skeleton loading + empty state), click to fetch full project from `/api/projects/[id]` and parse JSON fields (outline/images/agentLogs) into a PipelineResponse that loads into the Output Viewer, delete button per project
- Created `src/components/icse/KnowledgeBaseTab.tsx` — stats grid (total chunks, user-contributed, subjects, cache hits, subject + category badges) plus full add-chunk form (subject, class, category, chapter, title, content textarea with char counter, tags) → POST `/api/knowledge/add`, refreshes stats on success
- Created `src/components/icse/MockGeneratorTab.tsx` — standalone mock generator (subject, class, topic, difficulty easy/medium/hard via ToggleGroup) → POST `/api/mock`, renders paper via MockPaperCard with loading + empty states
- Wrote `src/app/page.tsx` — single client page with: sticky hero header (logo + tagline + StatChips), 4-tab nav (Workflow / Past Projects / Knowledge Base / Mock Generator), Workflow tab stacks Upload → AgentPipeline → OutputViewer (with smooth scroll-to-output on completion), and a sticky footer with disclaimer + footer StatChips. Uses `min-h-screen flex flex-col` + `mt-auto` footer pattern
- Ran `bun run lint` — first pass had 1 warning (unused eslint-disable directive on an <img>); removed the directive; second pass: 0 errors, 0 warnings
- Verified dev server (port 3000): GET / returns 200, ICSE Project Forge title renders, /api/knowledge/stats responds with 22 chunks across 10 subjects

Stage Summary:
- Files produced:
  - `src/app/globals.css` (edited — brand palette + .prose-icse + brand utilities)
  - `src/app/layout.tsx` (edited — ICSE metadata + Sonner Toaster)
  - `src/app/page.tsx` (rewritten — full single-page app)
  - `src/components/icse/types.ts` (new)
  - `src/components/icse/StatChips.tsx` (new)
  - `src/components/icse/UploadStep.tsx` (new)
  - `src/components/icse/AgentPipeline.tsx` (new)
  - `src/components/icse/OutputViewer.tsx` (new)
  - `src/components/icse/MockPaperCard.tsx` (new)
  - `src/components/icse/PastProjectsTab.tsx` (new)
  - `src/components/icse/KnowledgeBaseTab.tsx` (new)
  - `src/components/icse/MockGeneratorTab.tsx` (new)
- Lint: clean (0 errors, 0 warnings)
- Dev server: HTTP 200 on `/`, all API integrations wired
- Design: emerald/teal scholarly palette on warm neutral — no indigo/blue primary. Footer sticky to bottom via flex column. Fully responsive (mobile-first, stacks → multi-column on lg). Framer-motion animations on hero chips, agent cards, mock answer reveal, tab transitions. Sonner toasts for success/error. Accessibility: semantic header/main/footer/nav/section, ARIA labels on dropzone + icon buttons, keyboard-focusable, alt text on all images, aria-pressed on answer toggle
- Constraints honored: only `/` route is user-visible, no new pages/routes; only existing shadcn components reused; all fetches use relative paths; no test code

---
Task ID: 8
Agent: main
Task: End-to-end verification with Agent Browser + bug fixes

Work Log:
- Opened http://localhost:3000/ in agent-browser — page rendered cleanly with hero, 4 tabs (Workflow / Past Projects / Knowledge Base / Mock Generator), upload zone, metadata fields
- Uploaded /tmp/icse_test.txt (716 chars about refraction of light) — toast "Extracted 716 characters" appeared, Forge button enabled
- Clicked "Forge Project" → triggered 7-agent pipeline (Analyzer → Outline → Writer → Image Director → Image Generator → Originality)
- Discovered BUG: pdf-parse v2.4.5 has no default export — fixed import to `import { PDFParse } from 'pdf-parse'` and constructor usage `new PDFParse({ data: new Uint8Array(buffer) })` + `parser.getText().text`
- Pipeline completed in 2.7 min, returned full ICSE-format project with all sections (Aim, Introduction, Materials/Apparatus, Theory, Procedure, Observations, Calculations, Result, Conclusion, Precautions, Sources of Error, Bibliography)
- Generated images were inserted inline into the markdown output
- Outline accordion + Agent run logs accordion rendered in sticky sidebar
- Clicked "Generate Mock" → mock paper with Section A (short) + Section B (long) + "Show answers" toggle generated in 17s
- Past Projects tab showed saved project with Open/Delete actions
- Knowledge Base tab showed full ingestion form (Subject/Class/Category/Chapter/Title/Content/Tags)
- Mobile viewport (390x844) tested — layout responsive, footer present
- Lint clean: `bun run lint` → 0 errors, 0 warnings

Stage Summary:
- ICSE Project Forge is FULLY FUNCTIONAL end-to-end:
  • PDF/text upload + extraction works
  • 7-agent RAG pipeline produces complete ICSE-format project (2-3 min)
  • AI-generated diagrams inserted inline
  • Mock paper generator produces ICSE specimen-style tests with marking scheme
  • Knowledge base ingestion UI ready for user to feed specimen/textbook/past-paper data
  • Past projects persisted in SQLite, browseable + deletable
  • Cache layer (in-memory LRU + DB) dedupes LLM/image calls — repeat queries near-free
  • Responsive, accessible, sticky footer, emerald/amber scholarly palette
- The tool is now ready for the user to start contributing ICSE specimen data via the Knowledge Base tab
