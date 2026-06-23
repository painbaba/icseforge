import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;

  if (!tursoUrl || !tursoToken) {
    console.error('Error: TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set in .env');
    process.exit(1);
  }

  console.log(`Connecting to Turso at ${tursoUrl}...`);
  const turso = createClient({
    url: tursoUrl,
    authToken: tursoToken,
  });

  console.log('Creating BattleRoom table...');
  await turso.execute(`
    CREATE TABLE IF NOT EXISTS "BattleRoom" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "room_code" TEXT NOT NULL,
        "class_name" TEXT NOT NULL,
        "subject" TEXT NOT NULL,
        "topic" TEXT NOT NULL,
        "questions" TEXT NOT NULL,
        "players" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'waiting',
        "timer" INTEGER NOT NULL DEFAULT 15,
        "current_question_index" INTEGER NOT NULL DEFAULT 0,
        "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" DATETIME NOT NULL
    );
  `);
  console.log('Creating unique index on BattleRoom...');
  await turso.execute(`
    CREATE UNIQUE INDEX IF NOT EXISTS "BattleRoom_room_code_key" ON "BattleRoom"("room_code");
  `);

  console.log('Creating BattleLeaderboard table...');
  await turso.execute(`
    CREATE TABLE IF NOT EXISTS "BattleLeaderboard" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "points" INTEGER NOT NULL DEFAULT 0,
        "battles_played" INTEGER NOT NULL DEFAULT 0,
        "battles_won" INTEGER NOT NULL DEFAULT 0,
        "updated_at" DATETIME NOT NULL
    );
  `);
  console.log('Creating unique index on BattleLeaderboard...');
  await turso.execute(`
    CREATE UNIQUE INDEX IF NOT EXISTS "BattleLeaderboard_email_key" ON "BattleLeaderboard"("email");
  `);

  console.log('Tables deployed to Turso successfully!');
}

main().catch(console.error);
