// scripts/deploy-turso-schema.ts
// Extracts local SQLite database schema and deploys it to the Turso cloud database.
// Usage: npx tsx scripts/deploy-turso-schema.ts

import { createClient } from '@libsql/client';
import Database from 'better-sqlite3';
import path from 'path';
import * as dotenv from 'dotenv';

// Load .env variables
dotenv.config();

async function main() {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;

  if (!tursoUrl || !tursoToken) {
    console.error('Error: TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set in .env');
    process.exit(1);
  }

  console.log('Connecting to local database to extract schema...');
  const localDbPath = path.join(process.cwd(), 'db', 'custom.db');
  const localDb = new Database(localDbPath);

  // Extract all tables, indexes, and triggers
  const rows = localDb.prepare(`
    SELECT type, name, sql 
    FROM sqlite_master 
    WHERE sql IS NOT NULL 
      AND name NOT LIKE 'sqlite_%'
      AND name NOT LIKE '_prisma_%'
      AND name NOT LIKE 'KnowledgeChunk_fts_%'
  `).all() as { type: string, name: string, sql: string }[];

  localDb.close();

  console.log(`Extracted ${rows.length} schema entities. Connecting to Turso at ${tursoUrl}...`);
  const turso = createClient({
    url: tursoUrl,
    authToken: tursoToken,
  });

  // Sort: tables first, then virtual tables, then indexes, then triggers
  const tables = rows.filter(r => r.type === 'table' && !r.sql.includes('USING fts5'));
  const virtualTables = rows.filter(r => r.type === 'table' && r.sql.includes('USING fts5'));
  const indexes = rows.filter(r => r.type === 'index');
  const triggers = rows.filter(r => r.type === 'trigger');

  const orderedEntities = [...tables, ...virtualTables, ...indexes, ...triggers];

  console.log('Dropping existing tables and triggers on Turso to ensure clean deployment...');
  // Drop triggers
  for (const trigger of triggers) {
    try {
      await turso.execute(`DROP TRIGGER IF EXISTS "${trigger.name}";`);
      console.log(`Dropped trigger ${trigger.name}`);
    } catch (err: any) {
      console.warn(`Warning dropping trigger ${trigger.name}:`, err.message);
    }
  }
  // Drop indexes
  for (const index of indexes) {
    try {
      await turso.execute(`DROP INDEX IF EXISTS "${index.name}";`);
      console.log(`Dropped index ${index.name}`);
    } catch (err: any) {
      console.warn(`Warning dropping index ${index.name}:`, err.message);
    }
  }
  // Drop virtual tables
  for (const vTable of virtualTables) {
    try {
      await turso.execute(`DROP TABLE IF EXISTS "${vTable.name}";`);
      console.log(`Dropped virtual table ${vTable.name}`);
    } catch (err: any) {
      console.warn(`Warning dropping virtual table ${vTable.name}:`, err.message);
    }
  }
  // Drop FTS shadow tables explicitly to avoid creation conflict
  const ftsShadows = ['KnowledgeChunk_fts_data', 'KnowledgeChunk_fts_idx', 'KnowledgeChunk_fts_docsize', 'KnowledgeChunk_fts_config'];
  for (const shadow of ftsShadows) {
    try {
      await turso.execute(`DROP TABLE IF EXISTS "${shadow}";`);
      console.log(`Explicitly dropped shadow table ${shadow}`);
    } catch (err: any) {
      console.warn(`Warning dropping shadow table ${shadow}:`, err.message);
    }
  }
  // Drop tables
  for (const table of tables) {
    try {
      await turso.execute(`DROP TABLE IF EXISTS "${table.name}";`);
      console.log(`Dropped table ${table.name}`);
    } catch (err: any) {
      console.warn(`Warning dropping table ${table.name}:`, err.message);
    }
  }

  console.log('\nCreating schema on Turso...');
  for (const entity of orderedEntities) {
    console.log(`Creating ${entity.type} ${entity.name}...`);
    try {
      await turso.execute(entity.sql);
      console.log(`  ✓ Success`);
    } catch (err: any) {
      console.error(`  ✗ Failed to create ${entity.type} ${entity.name}:`, err.message);
    }
  }

  console.log('\nTurso schema deployment complete!');
}

main().catch(console.error);
