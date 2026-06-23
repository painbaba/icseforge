import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { roomCode, playerName } = await req.json();
    if (!roomCode || !playerName) {
      return NextResponse.json({ error: 'Room code and player name are required.' }, { status: 400 });
    }

    const room = await db.battleRoom.findUnique({
      where: { roomCode: roomCode.toUpperCase() }
    });

    if (!room) {
      return NextResponse.json({ error: 'Room not found.' }, { status: 404 });
    }

    if (room.status !== 'waiting') {
      return NextResponse.json({ error: 'Battle has already started or completed.' }, { status: 400 });
    }

    const players = JSON.parse(room.players);
    const exists = players.some((p: any) => p.name.toLowerCase() === playerName.toLowerCase());

    if (!exists) {
      players.push({
        name: playerName,
        score: 0,
        answers: {},
        answersAt: {},
        joinedAt: Date.now()
      });

      await db.battleRoom.update({
        where: { id: room.id },
        data: { players: JSON.stringify(players) }
      });
    }

    return NextResponse.json({
      roomCode: room.roomCode,
      className: room.className,
      subject: room.subject,
      topic: room.topic,
      players,
      status: room.status,
      timer: room.timer,
      currentQuestionIndex: room.currentQuestionIndex
    });

  } catch (err: any) {
    console.error('Join battle room error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
