// POST /api/mock — generate ICSE specimen-style mock paper
import { NextRequest, NextResponse } from 'next/server';
import { runMockAgent } from '@/lib/agents';
import { db } from '@/lib/db';

export const runtime = 'nodejs';
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { subject, className, topic, difficulty, projectId } = body as {
      subject: string; className: string; topic: string;
      difficulty?: string; projectId?: string;
    };

    if (!subject || !topic) {
      return NextResponse.json({ error: 'Subject and topic are required' }, { status: 400 });
    }

    const { paper, log } = await runMockAgent(
      subject, className || '10', topic, difficulty || 'medium'
    );

    const saved = await db.mock.create({
      data: {
        projectId: projectId || null,
        subject, className: className || '10', topic,
        difficulty: difficulty || 'medium',
        questions: JSON.stringify(paper),
        duration: paper.duration || 60
      }
    });

    return NextResponse.json({ id: saved.id, paper, log });
  } catch (err: any) {
    console.error('Mock gen error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
