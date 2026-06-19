// ICSE Multi-Agent Pipeline
//
// Each agent is a prompt-engineered specialist. They run sequentially because
// each depends on the previous output, except image generation which can run
// in parallel with the writer.
//
// Pipeline:
//   1. Analyzer Agent    — identifies subject, class, topic, key concepts from PDF text
//   2. Outline Agent     — builds ICSE-compliant project structure (uses KB context)
//   3. Writer Agent      — produces humanized, non-plagiarized prose section-by-section
//   4. Image Director    — decides what diagrams/figures to generate
//   5. Image Generator   — generates the cutout images (image-generation skill, cached)
//   6. Originality Agent — rewrites to ensure uniqueness and human voice
//   7. (Optional) Mock Agent — produces specimen-style mock paper
//
// All LLM calls go through cachedLLM for cost control.

import ZAI from 'z-ai-web-dev-sdk';
import { buildContext, retrieve } from './knowledge';
import { cachedLLM, cachedImage } from './llm-cache';
import path from 'path';
import fs from 'fs/promises';

let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null;
async function getZai() {
  if (!zaiInstance) zaiInstance = await ZAI.create();
  return zaiInstance;
}

export interface AgentLog {
  agent: string;
  status: 'running' | 'completed' | 'failed';
  startedAt: string;
  finishedAt?: string;
  durationMs?: number;
  cached?: boolean;
  output?: string;
  error?: string;
}

export interface PipelineInput {
  sourceText: string;
  sourceName: string;
  userTopic?: string;
  userSubject?: string;
  userClass?: string;
}

export interface PipelineOutput {
  subject: string;
  className: string;
  topic: string;
  outline: any;
  finalOutput: string;
  images: { prompt: string; path: string; caption: string }[];
  logs: AgentLog[];
  mockPaper?: any;
}

const log = (agent: string, status: AgentLog['status'], extra: Partial<AgentLog> = {}): AgentLog => ({
  agent, status,
  startedAt: new Date().toISOString(),
  ...extra
});

// ============================================================
// AGENT 1: ANALYZER
// Identifies subject, class, topic, and extracts key concepts
// from the uploaded PDF text.
// ============================================================
export async function runAnalyzer(input: PipelineInput): Promise<{
  subject: string; className: string; topic: string; keyConcepts: string[];
  log: AgentLog;
}> {
  const startedAt = Date.now();
  const agentLog = log('Analyzer', 'running');

  const systemPrompt = `You are the ANALYZER AGENT in an ICSE Board exam-prep system.
Your job: analyze the text a student uploaded (PDF content, notes, or topic) and identify:
1. The ICSE subject (Physics, Chemistry, Biology, Mathematics, History, Geography, Civics, English, Computer, Economics, General)
2. The class (Class 9 or Class 10 — default 10 if unclear)
3. The specific topic of the project
4. 3-6 key scientific/historical/mathematical concepts involved

Respond ONLY with valid JSON, no prose:
{"subject":"...","className":"10","topic":"...","keyConcepts":["...","..."]}`;

  const userPrompt = `User-suggested subject: ${input.userSubject || '(unspecified)'}
User-suggested topic: ${input.userTopic || '(unspecified)'}
Source filename: ${input.sourceName}

Source text (truncated to first 4000 chars):
${input.sourceText.slice(0, 4000)}`;

  try {
    const { content, cached } = await cachedLLM(
      [{ role: 'assistant', content: systemPrompt }, { role: 'user', content: userPrompt }],
      async () => {
        const zai = await getZai();
        const completion = await zai.chat.completions.create({
          messages: [
            { role: 'assistant', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          thinking: { type: 'disabled' }
        });
        return completion.choices[0]?.message?.content || '{}';
      },
      { temperature: 0.3 }
    );

    // Extract JSON from response (handle code fences)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { subject: 'General', className: '10', topic: 'Untitled', keyConcepts: [] };

    agentLog.status = 'completed';
    agentLog.finishedAt = new Date().toISOString();
    agentLog.durationMs = Date.now() - startedAt;
    agentLog.cached = cached;
    agentLog.output = `Subject: ${parsed.subject} | Class: ${parsed.className} | Topic: ${parsed.topic}`;

    return {
      subject: parsed.subject || input.userSubject || 'General',
      className: parsed.className || input.userClass || '10',
      topic: parsed.topic || input.userTopic || 'Untitled Project',
      keyConcepts: parsed.keyConcepts || [],
      log: agentLog
    };
  } catch (err: any) {
    agentLog.status = 'failed';
    agentLog.error = err.message;
    agentLog.finishedAt = new Date().toISOString();
    agentLog.durationMs = Date.now() - startedAt;
    return {
      subject: input.userSubject || 'General',
      className: input.userClass || '10',
      topic: input.userTopic || 'Untitled',
      keyConcepts: [],
      log: agentLog
    };
  }
}

// ============================================================
// AGENT 2: OUTLINE
// Builds ICSE-compliant project structure using RAG context.
// ============================================================
export async function runOutlineAgent(
  subject: string, className: string, topic: string, keyConcepts: string[]
): Promise<{ outline: any; log: AgentLog }> {
  const startedAt = Date.now();
  const agentLog = log('Outline', 'running');

  const context = await buildContext(`ICSE ${subject} project format exemplar`, {
    subject, category: 'project_exemplar', topK: 3
  });

  const systemPrompt = `You are the OUTLINE AGENT for ICSE Board project generation.
Using the ICSE project exemplar format provided in context, produce a complete outline
for a project on the given topic. The outline MUST follow ICSE standard sections:
Cover Page, Certificate, Acknowledgement, Aim/Objective, Introduction, Materials/Apparatus,
Theory, Procedure, Observations, Calculations, Result, Conclusion, Precautions, Sources of Error, Bibliography.

Adapt section names to the subject (e.g. for History: Introduction → Historical Context,
for Computer: Materials → Software/Hardware Requirements).

For each section, include a 1-line description of what it should contain.
Respond ONLY with valid JSON:
{"title":"...","sections":[{"name":"...","description":"..."}]}`;

  const userPrompt = `Subject: ${subject}
Class: ${className}
Topic: ${topic}
Key concepts: ${keyConcepts.join(', ')}

ICSE format reference (from knowledge base):
${context || '(no exemplar found in KB — use default ICSE format)'}`;

  try {
    const { content, cached } = await cachedLLM(
      [{ role: 'assistant', content: systemPrompt }, { role: 'user', content: userPrompt }],
      async () => {
        const zai = await getZai();
        const completion = await zai.chat.completions.create({
          messages: [
            { role: 'assistant', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          thinking: { type: 'disabled' }
        });
        return completion.choices[0]?.message?.content || '{}';
      },
      { temperature: 0.4 }
    );

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const outline = jsonMatch ? JSON.parse(jsonMatch[0]) : { title: topic, sections: [] };

    agentLog.status = 'completed';
    agentLog.finishedAt = new Date().toISOString();
    agentLog.durationMs = Date.now() - startedAt;
    agentLog.cached = cached;
    agentLog.output = `Generated ${outline.sections?.length ?? 0} sections`;

    return { outline, log: agentLog };
  } catch (err: any) {
    agentLog.status = 'failed';
    agentLog.error = err.message;
    agentLog.finishedAt = new Date().toISOString();
    agentLog.durationMs = Date.now() - startedAt;
    return { outline: { title: topic, sections: [] }, log: agentLog };
  }
}

// ============================================================
// AGENT 3: WRITER
// Produces humanized, non-plagiarized prose for each section.
// Uses retrieved ICSE context to ground content in board expectations.
// ============================================================
export async function runWriterAgent(
  subject: string, className: string, topic: string,
  outline: any, sourceText: string
): Promise<{ content: string; log: AgentLog }> {
  const startedAt = Date.now();
  const agentLog = log('Writer', 'running');

  // Retrieve relevant ICSE knowledge for the topic
  const context = await buildContext(`${subject} ${topic} class ${className} concepts theory`, {
    subject, topK: 4
  });

  const systemPrompt = `You are the WRITER AGENT — an expert ICSE teacher with 20 years of experience.
Your task: write each section of the project in CLEAR, HUMAN, STUDENT-LIKE prose that:
- Sounds like a Class 10 Indian student wrote it (not AI, not textbook copy-paste)
- Is ORIGINAL — never copy from textbooks verbatim; paraphrase in your own words
- Uses correct ICSE terminology and definitions
- Includes specific numbers, examples, and Indian context where relevant
- Is detailed enough to fill 12-20 pages when written by hand
- Uses proper scientific/mathematical notation in plain text

Format the output as Markdown with ## for each section name.
Do NOT include "Cover Page", "Certificate", "Acknowledgement" sections in the body — those are file cover material.
Start with ## Aim/Objective.

Output ONLY the markdown project content, no meta commentary.`;

  const userPrompt = `Subject: ${subject} | Class: ${className} | Topic: ${topic}

OUTLINE TO FOLLOW:
${JSON.stringify(outline, null, 2)}

SOURCE MATERIAL (student's uploaded notes/PDF — use as reference but rewrite in original words):
${sourceText.slice(0, 6000)}

ICSE KNOWLEDGE BASE CONTEXT (use for accurate terminology and concepts):
${context || '(general ICSE knowledge)'}

Now write the full project in markdown. Be detailed, original, human-sounding.`;

  try {
    const { content, cached } = await cachedLLM(
      [{ role: 'assistant', content: systemPrompt }, { role: 'user', content: userPrompt }],
      async () => {
        const zai = await getZai();
        const completion = await zai.chat.completions.create({
          messages: [
            { role: 'assistant', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          thinking: { type: 'disabled' }
        });
        return completion.choices[0]?.message?.content || '';
      },
      { temperature: 0.75 } // higher temp for more human variation
    );

    agentLog.status = 'completed';
    agentLog.finishedAt = new Date().toISOString();
    agentLog.durationMs = Date.now() - startedAt;
    agentLog.cached = cached;
    agentLog.output = `Generated ${content.length} chars`;

    return { content, log: agentLog };
  } catch (err: any) {
    agentLog.status = 'failed';
    agentLog.error = err.message;
    agentLog.finishedAt = new Date().toISOString();
    agentLog.durationMs = Date.now() - startedAt;
    return { content: '', log: agentLog };
  }
}

// ============================================================
// AGENT 4: IMAGE DIRECTOR
// Decides what diagrams/figures the project needs.
// ============================================================
export async function runImageDirector(
  subject: string, topic: string, outline: any, content: string
): Promise<{ images: { prompt: string; caption: string; section: string }[]; log: AgentLog }> {
  const startedAt = Date.now();
  const agentLog = log('Image Director', 'running');

  const systemPrompt = `You are the IMAGE DIRECTOR AGENT for an ICSE student project.
Given the project content, decide what DIAGRAMS / FIGURES / ILLUSTRATIONS the project needs.
For ICSE projects, typical figures include:
- Physics: circuit diagrams, ray diagrams, free-body diagrams, experimental setups
- Chemistry: apparatus diagrams, reaction schematics, molecular structures
- Biology: labeled biological diagrams (pencil-sketch style)
- Math: geometric constructions, graphs
- History: maps, timelines, photographs of historical events
- Geography: topographical maps, climatic charts, distribution maps

Suggest 2-4 images. For each, provide:
1. A detailed image-generation prompt (describe what to draw, ICSE-style diagram, clean, labeled)
2. A short caption to place under the figure in the project
3. Which section it belongs to

Respond ONLY with JSON:
{"images":[{"prompt":"...","caption":"Fig 1: ...","section":"..."}]}`;

  const userPrompt = `Subject: ${subject} | Topic: ${topic}

OUTLINE:
${JSON.stringify(outline, null, 2).slice(0, 1500)}

CONTENT (truncated):
${content.slice(0, 2000)}`;

  try {
    const { content: response, cached } = await cachedLLM(
      [{ role: 'assistant', content: systemPrompt }, { role: 'user', content: userPrompt }],
      async () => {
        const zai = await getZai();
        const completion = await zai.chat.completions.create({
          messages: [
            { role: 'assistant', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          thinking: { type: 'disabled' }
        });
        return completion.choices[0]?.message?.content || '{"images":[]}';
      },
      { temperature: 0.5 }
    );

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { images: [] };

    agentLog.status = 'completed';
    agentLog.finishedAt = new Date().toISOString();
    agentLog.durationMs = Date.now() - startedAt;
    agentLog.cached = cached;
    agentLog.output = `Planned ${parsed.images?.length ?? 0} images`;

    return { images: parsed.images || [], log: agentLog };
  } catch (err: any) {
    agentLog.status = 'failed';
    agentLog.error = err.message;
    agentLog.finishedAt = new Date().toISOString();
    agentLog.durationMs = Date.now() - startedAt;
    return { images: [], log: agentLog };
  }
}

// ============================================================
// AGENT 5: IMAGE GENERATOR (uses image-generation skill, cached)
// ============================================================
export async function runImageGenerator(
  images: { prompt: string; caption: string; section: string }[]
): Promise<{ images: { prompt: string; path: string; caption: string; section: string }[]; log: AgentLog }> {
  const startedAt = Date.now();
  const agentLog = log('Image Generator', 'running');

  const outputDir = path.join(process.cwd(), 'public', 'generated');
  await fs.mkdir(outputDir, { recursive: true });

  const results: { prompt: string; path: string; caption: string; section: string }[] = [];

  for (const img of images.slice(0, 4)) {
    try {
      const size = '1024x1024';
      const { path: imgPath, cached } = await cachedImage(img.prompt, size, async () => {
        const zai = await getZai();
        const response = await zai.images.generations.create({
          prompt: `${img.prompt}. Clean ICSE-style diagram, labeled, suitable for a school project, clear lines, educational illustration.`,
          size
        });
        const base64 = response.data[0].base64;
        const buffer = Buffer.from(base64, 'base64');
        const filename = `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.png`;
        const fullPath = path.join(outputDir, filename);
        await fs.writeFile(fullPath, buffer);
        return `/generated/${filename}`;
      });
      results.push({ ...img, path: imgPath });
    } catch (err: any) {
      // skip failed image
      console.error('Image gen failed:', err.message);
    }
  }

  agentLog.status = 'completed';
  agentLog.finishedAt = new Date().toISOString();
  agentLog.durationMs = Date.now() - startedAt;
  agentLog.output = `Generated ${results.length}/${images.length} images`;

  return { images: results, log: agentLog };
}

// ============================================================
// AGENT 6: ORIGINALITY REVIEWER
// Rewrites the content to ensure uniqueness and human voice.
// ============================================================
export async function runOriginalityAgent(
  content: string, subject: string, topic: string
): Promise<{ content: string; log: AgentLog }> {
  const startedAt = Date.now();
  const agentLog = log('Originality', 'running');

  const systemPrompt = `You are the ORIGINALITY AGENT.
Your job: review the ICSE project content and rewrite it to ensure:
1. NO plagiarism — paraphrase any sentence that sounds like textbook copy
2. Human voice — vary sentence length, use natural transitions, occasional first-person ("I observed that...")
3. Uniqueness — every sentence should be reworded so a plagiarism checker returns < 15% match
4. Preserve all factual accuracy and ICSE terminology

Return ONLY the rewritten markdown. Same section structure, same length, fresh wording.`;

  try {
    const { content: rewritten, cached } = await cachedLLM(
      [{ role: 'assistant', content: systemPrompt }, { role: 'user', content: `Subject: ${subject}\nTopic: ${topic}\n\nOriginal content:\n${content}` }],
      async () => {
        const zai = await getZai();
        const completion = await zai.chat.completions.create({
          messages: [
            { role: 'assistant', content: systemPrompt },
            { role: 'user', content: `Subject: ${subject}\nTopic: ${topic}\n\nOriginal content:\n${content}` }
          ],
          thinking: { type: 'disabled' }
        });
        return completion.choices[0]?.message?.content || content;
      },
      { temperature: 0.85 }
    );

    agentLog.status = 'completed';
    agentLog.finishedAt = new Date().toISOString();
    agentLog.durationMs = Date.now() - startedAt;
    agentLog.cached = cached;
    agentLog.output = `Rewrote ${rewritten.length} chars`;

    return { content: rewritten || content, log: agentLog };
  } catch (err: any) {
    agentLog.status = 'failed';
    agentLog.error = err.message;
    agentLog.finishedAt = new Date().toISOString();
    agentLog.durationMs = Date.now() - startedAt;
    return { content, log: agentLog };
  }
}

// ============================================================
// AGENT 7: MOCK PAPER GENERATOR
// Produces ICSE specimen-style mock paper for the topic.
// ============================================================
export async function runMockAgent(
  subject: string, className: string, topic: string, difficulty: string = 'medium'
): Promise<{ paper: any; log: AgentLog }> {
  const startedAt = Date.now();
  const agentLog = log('Mock Generator', 'running');

  const patternCtx = await buildContext(`${subject} specimen paper pattern marks`, {
    subject, category: 'specimen_pattern', topK: 2
  });
  const pastCtx = await buildContext(`${subject} ${topic} past paper questions`, {
    subject, category: 'past_paper', topK: 3
  });

  const systemPrompt = `You are the MOCK PAPER GENERATOR AGENT for ICSE Board.
Create a specimen-style mock test paper for the given subject and topic following the
ICSE paper pattern provided in context. Include:
- Section A: 5 short-answer questions (1-3 marks each)
- Section B: 3 long-answer questions (5 marks each), with internal choice where appropriate
- Total marks: 30 (shorter than full 80-mark paper for topic-focused practice)
- Provide complete marking scheme (answers) for each question
- Match ICSE question style: definitions, derivations, numerical problems, diagrams, reasoning

Difficulty: ${difficulty} (easy=fundamentals, medium=board-level, hard=application-heavy)

Respond ONLY with JSON:
{"subject":"...","topic":"...","duration":60,"totalMarks":30,"sections":[{"name":"Section A","questions":[{"q":"...","type":"short","marks":2,"answer":"..."}]},{"name":"Section B","questions":[{"q":"...","type":"long","marks":5,"answer":"...","choice":"optional alternative question"}]}]}`;

  const userPrompt = `Subject: ${subject} | Class: ${className} | Topic: ${topic} | Difficulty: ${difficulty}

ICSE PAPER PATTERN REFERENCE:
${patternCtx || '(standard ICSE pattern)'}

PAST PAPER CONTEXT:
${pastCtx || '(no past papers in KB)'}`;

  try {
    const { content, cached } = await cachedLLM(
      [{ role: 'assistant', content: systemPrompt }, { role: 'user', content: userPrompt }],
      async () => {
        const zai = await getZai();
        const completion = await zai.chat.completions.create({
          messages: [
            { role: 'assistant', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          thinking: { type: 'disabled' }
        });
        return completion.choices[0]?.message?.content || '{}';
      },
      { temperature: 0.6 }
    );

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const paper = jsonMatch ? JSON.parse(jsonMatch[0]) : { sections: [] };

    agentLog.status = 'completed';
    agentLog.finishedAt = new Date().toISOString();
    agentLog.durationMs = Date.now() - startedAt;
    agentLog.cached = cached;
    agentLog.output = `Generated mock with ${paper.sections?.length ?? 0} sections`;

    return { paper, log: agentLog };
  } catch (err: any) {
    agentLog.status = 'failed';
    agentLog.error = err.message;
    agentLog.finishedAt = new Date().toISOString();
    agentLog.durationMs = Date.now() - startedAt;
    return { paper: { sections: [] }, log: agentLog };
  }
}

// ============================================================
// ORCHESTRATOR — runs the full pipeline
// ============================================================
export async function runPipeline(input: PipelineInput): Promise<PipelineOutput> {
  const logs: AgentLog[] = [];

  // 1. Analyzer
  const analysis = await runAnalyzer(input);
  logs.push(analysis.log);

  // 2. Outline
  const { outline, log: outlineLog } = await runOutlineAgent(
    analysis.subject, analysis.className, analysis.topic, analysis.keyConcepts
  );
  logs.push(outlineLog);

  // 3. Writer
  const { content: rawContent, log: writerLog } = await runWriterAgent(
    analysis.subject, analysis.className, analysis.topic, outline, input.sourceText
  );
  logs.push(writerLog);

  // 4. Image Director + 5. Image Generator (run together)
  const { images: imagePlan, log: dirLog } = await runImageDirector(
    analysis.subject, analysis.topic, outline, rawContent
  );
  logs.push(dirLog);

  const { images, log: imgLog } = await runImageGenerator(imagePlan);
  logs.push(imgLog);

  // 6. Originality (parallel with image gen would be ideal, but runs after writer)
  const { content: finalContent, log: origLog } = await runOriginalityAgent(
    rawContent, analysis.subject, analysis.topic
  );
  logs.push(origLog);

  // Insert image references into final content
  let finalOutput = finalContent;
  for (const img of images) {
    const imgMd = `\n\n![${img.caption}](${img.path})\n\n*${img.caption}*\n\n`;
    // Try to insert after the section heading matching img.section
    const sectionRegex = new RegExp(`(##\\s*${img.section}[^\\n]*\\n)`, 'i');
    if (sectionRegex.test(finalOutput)) {
      finalOutput = finalOutput.replace(sectionRegex, `$1${imgMd}`);
    } else {
      finalOutput += imgMd;
    }
  }

  return {
    subject: analysis.subject,
    className: analysis.className,
    topic: analysis.topic,
    outline,
    finalOutput,
    images: images.map(i => ({ prompt: i.prompt, path: i.path, caption: i.caption })),
    logs
  };
}
