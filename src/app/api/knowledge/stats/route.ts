// GET /api/knowledge/stats — KB size, subjects, categories, cache stats
import { NextResponse } from 'next/server';
import { getKnowledgeStats } from '@/lib/knowledge';
import { getCacheStats } from '@/lib/llm-cache';
import { db } from '@/lib/db';

export async function GET() {
  const stats = await getKnowledgeStats();
  const cache = await getCacheStats();
  const userChunks = await db.knowledgeChunk.count({ where: { source: 'user_upload' } });
  return NextResponse.json({
    knowledgeBase: stats,
    userContributedChunks: userChunks,
    cache
  });
}
