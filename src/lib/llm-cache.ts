// LLM Cache — dedupe identical LLM calls, persist to DB, in-memory LRU on top.
// Key: sha256(messages + temperature). Value: assistant content.

import { createHash } from 'crypto';
import { db } from './db';

const memoryCache = new Map<string, { value: string; hits: number }>();
const MAX_MEMORY = 200;

function hashKey(messages: unknown[], temperature = 0.7): string {
  const payload = JSON.stringify({ messages, temperature });
  return createHash('sha256').update(payload).digest('hex');
}

export async function cachedLLM(
  messages: { role: string; content: string }[],
  generate: () => Promise<string>,
  opts: { temperature?: number; ttlSeconds?: number } = {}
): Promise<{ content: string; cached: boolean }> {
  const temp = opts.temperature ?? 0.7;
  const key = hashKey(messages, temp);

  // 1. Memory cache
  const mem = memoryCache.get(key);
  if (mem) {
    mem.hits++;
    return { content: mem.value, cached: true };
  }

  // 2. DB cache
  const dbHit = await db.cacheEntry.findUnique({ where: { cacheKey: key } });
  if (dbHit) {
    if (memoryCache.size >= MAX_MEMORY) {
      const firstKey = memoryCache.keys().next().value;
      if (firstKey) memoryCache.delete(firstKey);
    }
    memoryCache.set(key, { value: dbHit.value, hits: 1 });
    await db.cacheEntry.update({
      where: { id: dbHit.id },
      data: { hits: { increment: 1 } }
    }).catch(() => {});
    return { content: dbHit.value, cached: true };
  }

  // 3. Miss — call generator
  const content = await generate();

  // store in DB
  await db.cacheEntry.create({
    data: { cacheKey: key, kind: 'llm', value: content, hits: 1 }
  }).catch(() => {});

  // store in memory
  if (memoryCache.size >= MAX_MEMORY) {
    const firstKey = memoryCache.keys().next().value;
    if (firstKey) memoryCache.delete(firstKey);
  }
  memoryCache.set(key, { value: content, hits: 1 });

  return { content, cached: false };
}

// Image cache — keyed on prompt + size
export async function cachedImage(
  prompt: string,
  size: string,
  generate: () => Promise<string>,
): Promise<{ path: string; cached: boolean }> {
  const key = createHash('sha256').update(`${prompt}|${size}`).digest('hex');
  const dbHit = await db.cacheEntry.findUnique({ where: { cacheKey: key } });
  if (dbHit) return { path: dbHit.value, cached: true };

  const path = await generate();
  await db.cacheEntry.create({
    data: { cacheKey: key, kind: 'image', value: path, hits: 1 }
  }).catch(() => {});
  return { path, cached: false };
}

export async function getCacheStats() {
  const total = await db.cacheEntry.count();
  const llmHits = await db.cacheEntry.aggregate({ _sum: { hits: true }, where: { kind: 'llm' } });
  const imgHits = await db.cacheEntry.aggregate({ _sum: { hits: true }, where: { kind: 'image' } });
  return {
    totalEntries: total,
    llmCacheHits: llmHits._sum.hits ?? 0,
    imageCacheHits: imgHits._sum.hits ?? 0
  };
}
