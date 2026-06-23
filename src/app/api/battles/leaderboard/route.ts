import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

const SEED_LEADERBOARD = [
  { name: 'Rohan Sharma', email: 'rohan@icseforge.local', points: 4850, battlesPlayed: 32, battlesWon: 24 },
  { name: 'Priya Patel', email: 'priya@icseforge.local', points: 4210, battlesPlayed: 29, battlesWon: 18 },
  { name: 'Kabir Sen', email: 'kabir@icseforge.local', points: 3950, battlesPlayed: 26, battlesWon: 15 },
  { name: 'Ananya Hegde', email: 'ananya@icseforge.local', points: 3640, battlesPlayed: 24, battlesWon: 14 },
  { name: 'Dev Adiga', email: 'dev@icseforge.local', points: 3120, battlesPlayed: 21, battlesWon: 11 }
];

export async function GET(req: NextRequest) {
  try {
    let count = await db.battleLeaderboard.count();

    if (count === 0) {
      console.log('Seeding initial leaderboard records...');
      for (const entry of SEED_LEADERBOARD) {
        await db.battleLeaderboard.create({ data: entry });
      }
    }

    const leaderboard = await db.battleLeaderboard.findMany({
      orderBy: { points: 'desc' }
    });

    return NextResponse.json({ leaderboard });

  } catch (err: any) {
    console.error('Leaderboard fetch error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
