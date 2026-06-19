// POST /api/chat — ICSE tutor chatbot with RAG + reasoning
// Body: { message: string, sessionId?: string, subject?: string, forceReasoning?: boolean }
// Returns: { sessionId, answer, reasoning?, sources, cached, durationMs }

import { NextRequest, NextResponse } from 'next/server';
import {
  chatWithTutor,
  createSession,
  addToSession,
  getSession,
  type ChatMessage
} from '@/lib/chat';

export const runtime = 'nodejs';
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, sessionId, subject, forceReasoning } = body as {
      message?: string;
      sessionId?: string;
      subject?: string;
      forceReasoning?: boolean;
    };

    if (!message || message.trim().length < 2) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Get or create session
    let sid = sessionId;
    if (!sid || !getSession(sid)) {
      sid = createSession();
    }

    const session = getSession(sid)!;
    const history: ChatMessage[] = session.messages;

    // Add user message to session
    addToSession(sid, { role: 'user', content: message });

    // Get AI response
    const response = await chatWithTutor(message, history, { subject, forceReasoning });

    // Add assistant response to session
    addToSession(sid, { role: 'assistant', content: response.answer });

    return NextResponse.json({
      sessionId: sid,
      answer: response.answer,
      reasoning: response.reasoning,
      sources: response.sources,
      cached: response.cached,
      durationMs: response.durationMs
    });
  } catch (err: any) {
    console.error('Chat error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// GET /api/chat — get session history
export async function GET(req: NextRequest) {
  const sid = req.nextUrl.searchParams.get('sessionId');
  if (!sid) return NextResponse.json({ error: 'sessionId required' }, { status: 400 });
  const session = getSession(sid);
  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  return NextResponse.json({
    sessionId: session.id,
    messages: session.messages,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt
  });
}

// DELETE /api/chat — clear session
export async function DELETE(req: NextRequest) {
  const sid = req.nextUrl.searchParams.get('sessionId');
  if (!sid) return NextResponse.json({ error: 'sessionId required' }, { status: 400 });
  const session = getSession(sid);
  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  session.messages = [];
  session.updatedAt = new Date();
  return NextResponse.json({ ok: true });
}
