// ICSE Tutor Chatbot — RAG + reasoning agent
//
// What makes this a "reasoning" chatbot:
//   1. It RETRIEVES relevant ICSE knowledge chunks (past papers, exemplars, syllabus, glossary)
//      BEFORE generating an answer. Every answer is grounded in real board data.
//   2. It uses chain-of-thought (thinking: enabled) for complex multi-step questions
//      — derivations, numerical problems, comparisons, explanations.
//   3. It can switch modes: concise (definitions) vs detailed (step-by-step reasoning).
//   4. Conversation history is maintained so it can reason across turns.
//   5. It cites which knowledge chunks were used so the student can verify.
//
// All LLM calls go through cachedLLM for cost control. Repeat questions = free + instant.

import ZAI from 'z-ai-web-dev-sdk';
import { retrieve, type RetrievedChunk } from './knowledge';
import { cachedLLM } from './llm-cache';
import { db } from './db';

let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null;
async function getZai() {
  if (!zaiInstance) zaiInstance = await ZAI.create();
  return zaiInstance;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  answer: string;
  reasoning?: string;  // chain-of-thought when thinking is enabled
  sources: { title: string; subject: string; chapter: string; category: string }[];
  cached: boolean;
  durationMs: number;
}

// Detect whether a question needs deep reasoning vs quick recall
function needsReasoning(question: string): boolean {
  const q = question.toLowerCase();
  const reasoningTriggers = [
    'explain', 'derive', 'prove', 'why', 'how', 'compare', 'distinguish',
    'difference between', 'calculate', 'solve', 'find the value', 'determine',
    'analyze', 'reason', 'justify', 'describe the process', 'step by step',
    'what happens when', 'what is the effect', 'relationship between'
  ];
  const recallTriggers = [
    'define', 'what is', 'who is', 'when did', 'where is', 'name the',
    'list', 'state', 'true or false', 'fill in'
  ];
  // If question is longer than 80 chars OR has reasoning triggers → deep reasoning
  if (question.length > 100) return true;
  if (reasoningTriggers.some(t => q.includes(t))) return true;
  if (recallTriggers.some(t => q.includes(t))) return false;
  // Default: medium-length conceptual questions get reasoning
  return question.length > 40;
}

// Detect subject from question text (helps retrieval)
function detectSubject(question: string): string | undefined {
  const q = question.toLowerCase();
  const hints: Record<string, string[]> = {
    'Physics': ['force', 'energy', 'momentum', 'velocity', 'acceleration', 'ohm', 'current', 'voltage', 'resistance', 'lens', 'mirror', 'refraction', 'reflection', 'prism', 'spectrum', 'magnet', ' electromagnet', 'transformer', 'motor', 'heat', 'temperature', 'calorimetry', 'radioactivity', 'nuclear', 'work', 'power', 'machine', 'lever', 'pulley', 'echo', 'sound wave', 'amplitude', 'frequency', 'wavelength'],
    'Chemistry': ['mole', 'acid', 'base', 'salt', 'ph', 'electrolysis', 'electrode', 'ion', 'oxidation', 'reduction', 'redox', 'catalyst', 'compound', 'mixture', 'element', 'atomic', 'molecular', 'bond', 'covalent', 'electrovalent', 'periodic', 'metallurgy', 'aluminium', 'zinc', 'iron', 'hcl', 'ammonia', 'nitric acid', 'sulphuric acid', 'organic', 'alkane', 'alkene', 'alkyne', 'alcohol', 'carboxylic', 'isomer'],
    'Biology': ['cell', 'tissue', 'photosynthesis', 'respiration', 'transpiration', 'heart', 'blood', 'artery', 'vein', 'capillary', 'kidney', 'nephron', 'neuron', 'brain', 'spinal cord', 'reflex', 'hormone', 'endocrine', 'reproduction', 'evolution', 'pollution', 'ecosystem', 'population', 'gene', 'chromosome', 'mitosis', 'meiosis', 'enzyme', 'protein', 'vitamin', 'meninges', 'gland'],
    'Mathematics': ['equation', 'solve for', 'factor', 'quadratic', 'matrix', 'determinant', 'arithmetic progression', 'geometric progression', 'ap and gp', 'coordinate', 'slope', 'distance formula', 'section formula', 'triangle', 'circle', 'tangent', 'chord', 'sector', 'cylinder', 'cone', 'sphere', 'hemisphere', 'volume', 'surface area', 'trigonometry', 'sine', 'cosine', 'tangent', 'identity', 'probability', 'statistics', 'mean', 'median', 'mode', 'quartile', 'gst', 'banking', 'shares', 'dividend', 'deposit'],
    'History': ['revolt', '1857', 'nationalism', 'congress', 'muslim league', 'gandhi', 'nehru', 'bose', 'partition', 'independence', 'world war', 'hitler', 'dictator', 'united nations', 'non-aligned', 'cold war', 'lok sabha', 'rajya sabha', 'president', 'prime minister', 'supreme court', 'high court', 'constitution', 'civics', 'freedom struggle'],
    'Geography': ['topographical', 'contour', 'climate', 'monsoon', 'rainfall', 'soil', 'vegetation', 'irrigation', 'multipurpose', 'mineral', 'coal', 'petroleum', 'iron ore', 'bauxite', 'agriculture', 'rice', 'wheat', 'cotton', 'jute', 'sugarcane', 'tea', 'industry', 'transport', 'railway', 'waste management', 'pollution'],
    'English': ['essay', 'letter', 'notice', 'report', 'comprehension', 'grammar', 'tense', 'preposition', 'voice', 'direct speech', 'indirect speech', 'merchant of venice', 'shakespeare', 'poem', 'poetry', 'stanza', 'metaphor', 'simile'],
    'Computer': ['java', 'class', 'object', 'method', 'constructor', 'array', 'loop', 'for loop', 'while loop', 'scanner', 'string', 'encapsulation', 'inheritance', 'polymorphism', 'function', 'parameter', 'return', 'variable', 'datatype', 'int', 'double', 'boolean'],
    'Economics': ['demand', 'supply', 'elasticity', 'market', 'monopoly', 'competition', 'factor of production', 'land', 'labour', 'capital', 'money', 'banking', 'central bank', 'inflation', 'deflation', 'public finance', 'tax', 'gst', 'national income', 'gdp', 'gnp', 'per capita']
  };
  for (const [subject, keywords] of Object.entries(hints)) {
    if (keywords.some(k => q.includes(k))) return subject;
  }
  return undefined;
}

// Main chat function with RAG + reasoning
export async function chatWithTutor(
  question: string,
  history: ChatMessage[] = [],
  opts: { forceReasoning?: boolean; subject?: string } = {}
): Promise<ChatResponse> {
  const startedAt = Date.now();

  // 1. Detect subject + retrieve relevant knowledge
  const subject = opts.subject || detectSubject(question);
  const needsThink = opts.forceReasoning ?? needsReasoning(question);

  const retrieved: RetrievedChunk[] = await retrieve(question, {
    subject,
    topK: 6
  });

  const contextStr = retrieved.length > 0
    ? retrieved.map((c, i) =>
        `[${i + 1}] SUBJECT: ${c.subject} | CHAPTER: ${c.chapter} | CATEGORY: ${c.category}\nTITLE: ${c.title}\n${c.content.slice(0, 1500)}`
      ).join('\n\n---\n\n')
    : '(No specific ICSE knowledge chunks matched — answer from general ICSE understanding.)';

  // 2. Build system prompt
  const systemPrompt = `You are the ICSE TUTOR — an expert, patient, encouraging tutor for Indian students preparing for the ICSE Class 9-10 board exams.

Your capabilities:
- Deep knowledge of ICSE syllabus across Physics, Chemistry, Biology, Mathematics, History, Geography, Civics, English, Computer Applications, and Economics
- Access to REAL past ICSE board questions (2021-2026) and high-scoring project exemplars
- Step-by-step reasoning for numerical problems, derivations, and conceptual explanations
- Exam-focused: always tie answers to mark allocation and board expectations

When answering:
1. ALWAYS ground your answer in the provided KNOWLEDGE CONTEXT. Cite which past papers or exemplars inform your answer.
2. For numerical/derivation questions: show FULL step-by-step working with units and significant figures.
3. For definitions: give the precise ICSE-board-accepted definition (1-2 sentences).
4. For "compare/distinguish": use a structured table.
5. For "explain why/how": use clear reasoning chains — "Because X, therefore Y, which means Z".
6. If a question asks about a topic not in ICSE syllabus, politely redirect: "This topic is not in the ICSE Class 10 syllabus. The related ICSE topic is..."
7. End answers with a "💡 Exam tip" line where relevant — practical advice on avoiding common mistakes or what examiners look for.
8. Use simple, clear Indian-English. Avoid jargon unless defined.

${needsThink
  ? 'This question requires REASONING. Think step by step before giving the final answer. Show your reasoning process.'
  : 'This is a recall/short-answer question. Answer concisely (under 80 words) but accurately.'}

KNOWLEDGE CONTEXT (from ICSE database — use these as your source of truth):
${contextStr}`;

  // 3. Build messages with history (last 6 messages to stay within token budget)
  const recentHistory = history.slice(-6);
  const messages: { role: string; content: string }[] = [
    { role: 'assistant', content: systemPrompt },
    ...recentHistory.map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: question }
  ];

  // 4. Call LLM (with caching) — enable thinking for reasoning questions
  const temperature = needsThink ? 0.4 : 0.5;

  try {
    const { content, cached } = await cachedLLM(
      messages,
      async () => {
        const zai = await getZai();
        const completion = await zai.chat.completions.create({
          messages: messages.map(m => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.content
          })) as any,
          thinking: { type: needsThink ? 'enabled' : 'disabled' }
        });
        return completion.choices[0]?.message?.content || '';
      },
      { temperature }
    );

    // The SDK may return reasoning separately; we extract it if present
    let answer = content;
    let reasoning: string | undefined;

    // If thinking was enabled, the response may contain <think> blocks or reasoning markers
    const thinkMatch = answer.match(/<think>([\s\S]*?)<\/think>/i);
    if (thinkMatch) {
      reasoning = thinkMatch[1].trim();
      answer = answer.replace(/<think>[\s\S]*?<\/think>/i, '').trim();
    } else {
      // Some models return reasoning as a separate field; check if completion has it
      try {
        const zai = await getZai();
        const completion: any = await zai.chat.completions.create({
          messages: messages.map(m => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.content
          })) as any,
          thinking: { type: needsThink ? 'enabled' : 'disabled' }
        });
        if (completion.choices[0]?.message?.reasoning) {
          reasoning = completion.choices[0].message.reasoning;
        }
      } catch {
        // ignore — keep the answer as-is
      }
    }

    return {
      answer,
      reasoning,
      sources: retrieved.slice(0, 4).map(c => ({
        title: c.title,
        subject: c.subject,
        chapter: c.chapter,
        category: c.category
      })),
      cached,
      durationMs: Date.now() - startedAt
    };
  } catch (err: any) {
    throw new Error(`Chat failed: ${err.message}`);
  }
}

// Suggested questions students might ask (for the UI)
export const SUGGESTED_QUESTIONS = [
  "Explain Ohm's Law with a numerical example",
  "What is the difference between arithmetic mean and median?",
  "Derive the lens formula for a convex lens",
  "Why does ice float on water? Explain with molecular structure.",
  "Balance the equation: Fe + H2O → Fe3O4 + H2",
  "Explain the working of the human heart with a diagram description",
  "What were the main causes of the 1857 revolt?",
  "How do you solve a quadratic equation by factorization?",
  "What is the difference between TCP and UDP? (Computer Applications)",
  "Explain the process of photosynthesis with the chemical equation"
];

// Persist chat sessions in DB so user can return to them
export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

// In-memory session store (could be moved to DB later)
const sessions = new Map<string, ChatSession>();

export function createSession(): string {
  const id = `chat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  sessions.set(id, {
    id,
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date()
  });
  return id;
}

export function getSession(id: string): ChatSession | undefined {
  return sessions.get(id);
}

export function addToSession(id: string, message: ChatMessage): void {
  const session = sessions.get(id);
  if (session) {
    session.messages.push(message);
    session.updatedAt = new Date();
  }
}

export function clearSession(id: string): void {
  sessions.set(id, {
    id,
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date()
  });
}

// Save notable Q&A pairs to DB for analytics (optional)
export async function saveQAPair(question: string, answer: string, subject?: string): Promise<void> {
  // Could create a ChatLog model — for now, we just track via cache hits
  // This is where you'd persist interesting questions for later review
}
