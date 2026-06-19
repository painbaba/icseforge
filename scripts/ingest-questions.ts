// Ingest 3375 ICSE past-paper questions into the knowledge base.
// Source: /home/z/my-project/upload/01_All_Papers_3375_Questions.json
//
// Strategy: group questions by (subject, year) into one KB chunk each.
// This gives the chatbot/agents rich, real, exam-grounded context per subject+year.
//
// Run: bun run scripts/ingest-questions.ts

import fs from 'fs/promises';
import { db } from '../src/lib/db';
import { addKnowledge, reloadKnowledgeBase } from '../src/lib/knowledge';

interface Question {
  number?: string;
  marks?: number;
  text?: string;
}

interface Section {
  name?: string;
  marks?: number;
  instruction?: string;
  questions?: Question[];
}

interface Paper {
  subject: string;
  paper_type?: string;
  academic_year?: string;
  exam_date?: string;
  duration?: string;
  total_marks?: number;
  instructions?: string[];
  sections?: Section[];
}

async function main() {
  console.log('ICSE Past-Paper Questions Ingestion');
  console.log('==================================\n');

  const raw = await fs.readFile('/home/z/my-project/upload/01_All_Papers_3375_Questions.json', 'utf-8');
  const data = JSON.parse(raw);

  const papers: Paper[] = data.papers || [];
  console.log(`Loaded ${papers.length} papers (meta says ${data.meta?.total_questions} questions)\n`);

  const before = await db.knowledgeChunk.count({ where: { source: 'user_upload' } });
  console.log(`User chunks BEFORE: ${before}\n`);

  let chunkCount = 0;
  let totalQuestions = 0;
  const subjectStats: Record<string, number> = {};

  for (const paper of papers) {
    const subject = paper.subject?.trim() || 'General';
    subjectStats[subject] = (subjectStats[subject] || 0) + 1;

    // Collect all real questions from this paper
    const allQuestions: { number: string; marks: number; text: string; section: string }[] = [];
    for (const section of paper.sections || []) {
      const sectionName = section.name || 'All Questions';
      for (const q of section.questions || []) {
        if (q.text && q.text.trim().length > 5) {
          allQuestions.push({
            number: q.number || '?',
            marks: q.marks || 0,
            text: q.text.trim(),
            section: sectionName
          });
        }
      }
    }

    if (allQuestions.length === 0) continue;
    totalQuestions += allQuestions.length;

    // Build a searchable text block
    const year = paper.academic_year || 'unknown year';
    const examDate = paper.exam_date || '';
    const duration = paper.duration || '';
    const totalMarks = paper.total_marks || '';

    const instructions = (paper.instructions || [])
      .filter(i => typeof i === 'string' && i.length < 200)
      .slice(0, 6)
      .map(i => `  - ${i}`)
      .join('\n');

    // Group questions by section for readability
    const bySection: Record<string, string[]> = {};
    for (const q of allQuestions) {
      const key = q.section || 'All Questions';
      if (!bySection[key]) bySection[key] = [];
      bySection[key].push(`Q${q.number} [${q.marks}m]: ${q.text}`);
    }

    const sectionsText = Object.entries(bySection)
      .map(([sec, qs]) => `\n=== ${sec} (${qs.length} questions) ===\n${qs.join('\n')}`)
      .join('\n');

    const content = `ICSE Class 10 ${subject} Question Paper — Academic Year ${year}
Exam date: ${examDate} | Duration: ${duration} | Total marks: ${totalMarks}

PAPER INSTRUCTIONS:
${instructions}

QUESTIONS (${allQuestions.length} total):
${sectionsText}

These are REAL ICSE board exam questions from ${year}. Use them to:
- Generate authentic mock papers in the same style
- Identify high-frequency topics and question patterns
- Answer student questions with board-accurate phrasing and mark allocation
- Train students on actual past paper difficulty`;

    await addKnowledge({
      subject,
      className: '10',
      category: 'past_paper',
      chapter: year,
      title: `${subject} ${year} — ICSE Class 10 Past Paper (${allQuestions.length} questions)`,
      content,
      tags: `${subject.toLowerCase()},past,paper,questions,${year},icse,class10,board`,
      source: 'user_upload'
    });

    chunkCount++;
    if (chunkCount % 10 === 0) console.log(`  ... ${chunkCount} papers ingested`);
  }

  await reloadKnowledgeBase();
  const after = await db.knowledgeChunk.count({ where: { source: 'user_upload' } });
  const total = await db.knowledgeChunk.count();

  console.log('\n==================================');
  console.log('INGESTION COMPLETE');
  console.log(`  Papers ingested:    ${chunkCount}`);
  console.log(`  Questions indexed:  ${totalQuestions}`);
  console.log(`  New KB chunks:      ${chunkCount}`);
  console.log(`  User chunks BEFORE: ${before}`);
  console.log(`  User chunks AFTER:  ${after}`);
  console.log(`  TOTAL KB chunks:    ${total}`);
  console.log('\nPer-subject paper counts:');
  for (const [s, c] of Object.entries(subjectStats).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${s}: ${c} papers`);
  }
  console.log('==================================\n');
}

main()
  .catch(e => { console.error('FATAL:', e); process.exit(1); })
  .finally(() => process.exit(0));
