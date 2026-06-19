// Ingest 4 new ICSE data files into the knowledge base.
// Sources:
//   02_Exam_Guide_Marking_Topper.json   — exam strategies, marking schemes, topper tips
//   03_Paper_Index.json                 — paper metadata per subject
//   04_Topic_Frequency_Analysis.json    — chapter-wise question frequency (for graphs + study priority)
//   05_Formula_KeyTerms_Glossary.json   — formulas + key terms per chapter
//
// Run: bun run scripts/ingest-aux-data.ts

import fs from 'fs/promises';
import { db } from '../src/lib/db';
import { addKnowledge, reloadKnowledgeBase } from '../src/lib/knowledge';

const UPLOAD_DIR = '/home/z/my-project/upload';

async function readJson(name: string): Promise<any> {
  const raw = await fs.readFile(`${UPLOAD_DIR}/${name}`, 'utf-8');
  return JSON.parse(raw);
}

// ─── Exam Guide ────────────────────────────────────────────
async function ingestExamGuide() {
  console.log('=== Ingesting Exam Guide / Marking / Topper Strategies ===');
  const guide = await readJson('02_Exam_Guide_Marking_Topper.json');
  let count = 0;

  // 1. General exam overview + marking scheme (one chunk)
  const overview = guide.exam_overview || {};
  const marking = guide.general_marking_scheme || {};
  const topper = guide.topper_universal_strategies || {};

  const generalContent = `ICSE Class 10 — Complete Exam Preparation Guide

EXAM OVERVIEW:
- Typical total marks per subject: ${overview.typical_total_marks_per_subject || 80}
- Exam duration: ${overview.exam_duration || '2-3 hours'}
- Reading time: ${overview.reading_time || '15 minutes (no writing allowed)'}
- Core subjects: ${(overview.core_subjects || []).join(', ')}

GENERAL MARKING SCHEME:
${JSON.stringify(marking.section_structure, null, 2)}

KEY MARKING RULES:
${(marking.key_marking_rules || []).map((r: string, i: number) => `${i + 1}. ${r}`).join('\n')}

TOPPER STRATEGIES — BEFORE EXAM:
${(topper.before_exam || []).map((s: string) => `• ${s}`).join('\n')}

TOPPER STRATEGIES — DURING EXAM:
${(topper.during_exam || []).map((s: string) => `• ${s}`).join('\n')}

ANSWER PRESENTATION:
${(topper.answer_presentation || []).map((s: string) => `• ${s}`).join('\n')}

COMMON MISTAKES TO AVOID:
${(topper.common_mistakes_to_avoid || []).map((s: string) => `• ${s}`).join('\n')}`;

  await addKnowledge({
    subject: 'General', className: '10', category: 'rubric', chapter: 'Exam Guide',
    title: 'ICSE Class 10 — Complete Exam Preparation Guide (Marking + Topper Strategies)',
    content: generalContent,
    tags: 'exam,guide,marking,topper,strategy,rubric,icse,class10',
    source: 'user_upload'
  });
  count++;
  console.log('  + General exam guide + topper strategies');

  // 2. Per-subject patterns + strategies
  for (const [subject, pat] of Object.entries(guide.subject_patterns || {})) {
    const strategies = (guide.subject_specific_strategies || {})[subject] || {};
    const content = `ICSE Class 10 ${subject} — Exam Pattern & Subject-Specific Strategy

SUBJECT PATTERN:
- Papers analyzed: ${(pat as any).papers_analyzed}
- Typical marks: ${(pat as any).typical_marks}
- Total questions in pool: ${(pat as any).total_questions_in_pool}
- Question type breakdown: ${JSON.stringify((pat as any).question_type_breakdown, null, 2)}
- Key instructions: ${JSON.stringify((pat as any).key_instructions, null, 2)}

SUBJECT-SPECIFIC STRATEGY:
${JSON.stringify(strategies, null, 2)}`;

    await addKnowledge({
      subject: subject === 'History' ? 'History' : subject === 'Computer Applications' ? 'Computer' : subject,
      className: '10', category: 'rubric', chapter: 'Exam Pattern',
      title: `${subject} — Exam Pattern & Strategy`,
      content,
      tags: `${subject.toLowerCase()},exam,pattern,strategy,marking`,
      source: 'user_upload'
    });
    count++;
  }
  console.log(`  + ${count - 1} subject-specific patterns`);
  return count;
}

// ─── Topic Frequency (also used for graphs) ────────────────
async function ingestTopicFrequency() {
  console.log('\n=== Ingesting Topic Frequency Analysis ===');
  const freq = await readJson('04_Topic_Frequency_Analysis.json');
  let count = 0;

  for (const [subject, data] of Object.entries(freq)) {
    if (!data || typeof data !== 'object') continue;
    const chapters = (data as any).chapters || [];
    const totalQs = (data as any).total_questions_analyzed || 0;
    if (chapters.length === 0) continue;

    const subjName = subject === 'History & Civics' ? 'History'
      : subject === 'Computer Applications' ? 'Computer'
      : subject === 'English Language' ? 'English'
      : subject === 'English Literature' ? 'English'
      : subject;

    const chapterLines = chapters.map((ch: any) =>
      `• ${ch.chapter}: ${ch.question_count} questions (${ch.percentage}%), avg ${ch.avg_marks_per_q} marks/q, appears in ${JSON.stringify(ch.appears_in_years)} years, PRIORITY: ${ch.priority}`
    ).join('\n');

    const content = `ICSE Class 10 ${subject} — Chapter-wise Topic Frequency Analysis
Based on ${totalQs} real board questions analyzed across 2021-2026.

CHAPTER FREQUENCY (sorted by appearance frequency — use this to PRIORITIZE study):
${chapterLines}

Use this data to:
- Focus revision on HIGH PRIORITY chapters (appear most often in exams)
- Predict likely topics for upcoming exams
- Allocate study time proportional to question frequency
- Generate mock papers weighted by real exam frequency`;

    await addKnowledge({
      subject: subjName, className: '10', category: 'past_paper', chapter: 'Topic Frequency',
      title: `${subject} — Chapter Frequency Analysis (${totalQs} Qs, ${chapters.length} chapters)`,
      content,
      tags: `${subjName.toLowerCase()},frequency,topics,chapters,analysis,weightage,graph`,
      source: 'user_upload'
    });
    count++;
  }
  console.log(`  + ${count} subject frequency analyses`);
  return count;
}

// ─── Formula & Key Terms Glossary ──────────────────────────
async function ingestGlossary() {
  console.log('\n=== Ingesting Formula & Key Terms Glossary ===');
  const gloss = await readJson('05_Formula_KeyTerms_Glossary.json');
  let count = 0;

  for (const [subject, chapters] of Object.entries(gloss)) {
    if (!chapters || typeof chapters !== 'object') continue;
    for (const [chapter, data] of Object.entries(chapters)) {
      const keyTerms = (data as any).key_terms || [];
      const formulas = (data as any).formulas || [];
      if (keyTerms.length === 0 && formulas.length === 0) continue;

      const content = `ICSE Class 10 ${subject} — ${chapter}

KEY TERMS:
${keyTerms.map((t: any) => {
  if (typeof t === 'string') return `• ${t}`;
  if (typeof t === 'object') return `• ${t.term || t.name || '?'}: ${t.definition || t.meaning || t.description || JSON.stringify(t)}`;
  return `• ${t}`;
}).join('\n')}

FORMULAS:
${formulas.map((f: any) => {
  if (typeof f === 'string') return `• ${f}`;
  if (typeof f === 'object') return `• ${f.formula || f.expression || '?'} — ${f.description || f.meaning || f.use || ''}`;
  return `• ${f}`;
}).join('\n')}`;

      await addKnowledge({
        subject, className: '10', category: 'glossary', chapter,
        title: `${subject} — ${chapter} (Key Terms + Formulas)`,
        content,
        tags: `${subject.toLowerCase()},glossary,formula,terms,${chapter.toLowerCase()}`,
        source: 'user_upload'
      });
      count++;
    }
  }
  console.log(`  + ${count} chapter glossaries`);
  return count;
}

// ─── Paper Index ───────────────────────────────────────────
async function ingestPaperIndex() {
  console.log('\n=== Ingesting Paper Index ===');
  const idx = await readJson('03_Paper_Index.json');
  let count = 0;

  for (const [key, data] of Object.entries(idx)) {
    if (!data || typeof data !== 'object') continue;
    const subject = (data as any).subject || key;
    const papers = (data as any).papers || [];
    if (papers.length === 0) continue;

    const subjName = subject === 'History & Civics' ? 'History'
      : subject === 'Computer Applications' ? 'Computer'
      : subject === 'English Language' ? 'English'
      : subject === 'English Literature' ? 'English'
      : subject;

    const paperLines = papers.map((p: any) =>
      `${p.year || p.academic_year || '?'} — ${p.paper_type || 'board'} — ${p.total_marks || '?'} marks — ${p.duration || '?'} — ${p.sections?.length || 0} sections`
    ).join('\n');

    const content = `ICSE Class 10 ${subject} — Paper Index
${papers.length} papers available across years.

PAPERS:
${paperLines}

Use this index to locate specific past papers by year.`;

    await addKnowledge({
      subject: subjName, className: '10', category: 'past_paper', chapter: 'Paper Index',
      title: `${subject} — Paper Index (${papers.length} papers)`,
      content,
      tags: `${subjName.toLowerCase()},paper,index,years`,
      source: 'user_upload'
    });
    count++;
  }
  console.log(`  + ${count} subject paper indexes`);
  return count;
}

async function main() {
  console.log('ICSE Auxiliary Data Ingestion');
  console.log('=============================\n');

  const before = await db.knowledgeChunk.count({ where: { source: 'user_upload' } });
  console.log(`User chunks BEFORE: ${before}\n`);

  let total = 0;
  try { total += await ingestExamGuide(); } catch (e: any) { console.error('Exam guide failed:', e.message); }
  try { total += await ingestTopicFrequency(); } catch (e: any) { console.error('Frequency failed:', e.message); }
  try { total += await ingestGlossary(); } catch (e: any) { console.error('Glossary failed:', e.message); }
  try { total += await ingestPaperIndex(); } catch (e: any) { console.error('Paper index failed:', e.message); }

  await reloadKnowledgeBase();
  const after = await db.knowledgeChunk.count({ where: { source: 'user_upload' } });
  const grand = await db.knowledgeChunk.count();

  console.log('\n=============================');
  console.log(`INGESTION COMPLETE`);
  console.log(`  Added this run:   ${total}`);
  console.log(`  User chunks:      ${before} → ${after}`);
  console.log(`  TOTAL KB chunks:  ${grand}`);
  console.log('=============================\n');
}

main()
  .catch(e => { console.error('FATAL:', e); process.exit(1); })
  .finally(() => process.exit(0));
