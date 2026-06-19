// Ingest user-collected ICSE data into the knowledge base.
// Run: bun run scripts/ingest-collected-data.ts

import fs from 'fs/promises';
import { db } from '../src/lib/db';
import { addKnowledge, reloadKnowledgeBase } from '../src/lib/knowledge';

const EXEMPLARS_TXT = '/tmp/exemplars.txt';
const YT_CURATED = '/home/z/my-project/upload/youtube_curated.json';
const YT_CATALOG = '/home/z/my-project/upload/yt_catalog.json';

interface Exemplar {
  subject: string;
  projectNo: number;
  title: string;
  fullText: string;
}

const SUBJECT_MAP: Record<string, string> = {
  'PHYSICS': 'Physics',
  'CHEMISTRY': 'Chemistry',
  'BIOLOGY': 'Biology',
  'MATHEMATICS': 'Mathematics',
  'COMPUTER SCIENCE': 'Computer'
};

function parseExemplars(text: string): Exemplar[] {
  const lines = text.split('\n');
  const exemplars: Exemplar[] = [];
  const headerRegex = /^(PHYSICS|CHEMISTRY|BIOLOGY|MATHEMATICS|COMPUTER SCIENCE)\s*[–-]\s*PROJECT\s*(\d+)\s*$/i;

  let currentSubject = '';
  let currentNo = 0;
  let currentTitle = '';
  let buffer: string[] = [];
  let collectingTitle = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = line.match(headerRegex);
    if (m) {
      if (currentSubject && buffer.length) {
        exemplars.push({
          subject: SUBJECT_MAP[currentSubject] || currentSubject,
          projectNo: currentNo,
          title: currentTitle,
          fullText: buffer.join('\n').trim()
        });
      }
      currentSubject = m[1].toUpperCase();
      currentNo = parseInt(m[2], 10);
      currentTitle = '';
      buffer = [];
      collectingTitle = true;
      continue;
    }
    if (collectingTitle) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.match(/^\d+\.\s/)) {
        if (!currentTitle) currentTitle = trimmed;
        else currentTitle += ' ' + trimmed;
      }
      if (line.match(/^\s*1\.\s*AIM/i) || line.match(/^\s*AIM/i)) {
        collectingTitle = false;
        buffer.push(line);
      }
    } else if (currentSubject) {
      buffer.push(line);
    }
  }
  if (currentSubject && buffer.length) {
    exemplars.push({
      subject: SUBJECT_MAP[currentSubject] || currentSubject,
      projectNo: currentNo,
      title: currentTitle,
      fullText: buffer.join('\n').trim()
    });
  }
  return exemplars;
}

async function ingestExemplars() {
  console.log('=== Ingesting DOCX exemplars ===');
  const text = await fs.readFile(EXEMPLARS_TXT, 'utf-8');
  const exemplars = parseExemplars(text);
  console.log(`Parsed ${exemplars.length} project exemplars from DOCX`);

  for (const ex of exemplars) {
    const content = ex.fullText.slice(0, 6000);
    await addKnowledge({
      subject: ex.subject,
      className: '10',
      category: 'project_exemplar',
      chapter: 'General',
      title: `${ex.subject} Project Exemplar ${ex.projectNo}: ${ex.title}`,
      content,
      tags: `${ex.subject.toLowerCase()},project,exemplar,class10,icse,topper-sample`,
      source: 'user_upload'
    });
    console.log(`  + ${ex.subject} Project ${ex.projectNo}: ${ex.title.slice(0, 70)}`);
  }
  return exemplars.length;
}

async function ingestYouTubeCatalog() {
  console.log('\n=== Ingesting YouTube topper video catalog ===');
  const raw = await fs.readFile(YT_CATALOG, 'utf-8');
  const catalog = JSON.parse(raw);

  let count = 0;
  for (const [subjectKey, data] of Object.entries(catalog.subjects || {})) {
    const subjectName = subjectKey.charAt(0).toUpperCase() + subjectKey.slice(1);
    const videos = (data as any).videos || [];
    if (videos.length === 0) continue;

    const videoSummaries = videos.slice(0, 25).map((v: any) =>
      `- "${v.title}" by ${v.channel} (${v.view_count?.toLocaleString() || '?'} views, ${v.duration}s) — ${(v.description || '').slice(0, 200).replace(/\n/g, ' ')}`
    ).join('\n');

    const topTopics = videos.slice(0, 10).map((v: any) => v.title).join(' | ');

    await addKnowledge({
      subject: subjectName,
      className: '10',
      category: 'project_exemplar',
      chapter: 'Topper Reference',
      title: `${subjectName} — Real ICSE Class 10 Topper Project Videos (YouTube reference)`,
      content: `These are real ICSE Class 10 ${subjectName} project walkthrough videos from YouTube toppers, useful for understanding what high-scoring projects look like and what topics students actually chose:

POPULAR TOPPER PROJECT TOPICS:
${topTopics}

DETAILED VIDEO LIST (title, channel, views, description excerpt):
${videoSummaries}

Use these as inspiration for choosing project topics and understanding presentation style. Do NOT copy content — use only as reference for what worked.`,
      tags: `${subjectKey},youtube,topper,videos,reference,topics`,
      source: 'user_upload'
    });
    count++;
    console.log(`  + ${subjectName}: ${videos.length} videos summarized`);
  }
  return count;
}

async function ingestCuratedQueries() {
  console.log('\n=== Ingesting curated search queries ===');
  const raw = await fs.readFile(YT_CURATED, 'utf-8');
  const curated = JSON.parse(raw);

  const queries = curated.search_queries_for_later_discovery || {};
  const lines: string[] = [];
  for (const [subject, qs] of Object.entries(queries)) {
    const subjectName = subject.charAt(0).toUpperCase() + subject.slice(1);
    lines.push(`${subjectName}:`);
    (qs as string[]).forEach(q => lines.push(`  - ${q}`));
  }

  await addKnowledge({
    subject: 'General',
    className: '10',
    category: 'project_exemplar',
    chapter: 'Topic Discovery',
    title: 'ICSE Class 10 — Curated Project Topic Search Queries (for finding more exemplars)',
    content: `These are validated search queries that surface real ICSE Class 10 topper project files and walkthroughs on YouTube. Use them to discover additional project ideas and presentation patterns:

${lines.join('\n')}

When a student asks for a project topic, suggest topics that appear in these searches — they are proven to score well.`,
    tags: 'project,topics,discovery,youtube,queries',
    source: 'user_upload'
  });
  console.log('  + Added curated search queries (3 subjects)');
  return 1;
}

async function main() {
  console.log('ICSE Knowledge Base Ingestion');
  console.log('============================\n');

  const before = await db.knowledgeChunk.count({ where: { source: 'user_upload' } });
  console.log(`User-contributed chunks BEFORE: ${before}\n`);

  let added = 0;
  try { added += await ingestExemplars(); } catch (e: any) { console.error('Exemplars failed:', e.message); }
  try { added += await ingestYouTubeCatalog(); } catch (e: any) { console.error('YT catalog failed:', e.message); }
  try { added += await ingestCuratedQueries(); } catch (e: any) { console.error('Curated failed:', e.message); }

  await reloadKnowledgeBase();
  const after = await db.knowledgeChunk.count({ where: { source: 'user_upload' } });
  const total = await db.knowledgeChunk.count();

  console.log('\n============================');
  console.log(`INGESTION COMPLETE`);
  console.log(`  Added this run:     ${added}`);
  console.log(`  User chunks BEFORE: ${before}`);
  console.log(`  User chunks AFTER:  ${after}`);
  console.log(`  TOTAL KB chunks:    ${total}`);
  console.log('============================\n');
}

main()
  .catch(e => { console.error('FATAL:', e); process.exit(1); })
  .finally(() => process.exit(0));
