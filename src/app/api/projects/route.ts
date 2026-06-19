// GET /api/projects — list all projects (most recent first)
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const projects = await db.project.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, title: true, subject: true, className: true, topic: true,
      status: true, createdAt: true
    }
  });
  return NextResponse.json({ projects });
}
