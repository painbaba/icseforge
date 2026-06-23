import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { roomCode } = await req.json();
    if (!roomCode) {
      return NextResponse.json({ error: 'Room code is required.' }, { status: 400 });
    }

    const room = await db.battleRoom.findUnique({
      where: { roomCode: roomCode.toUpperCase() }
    });

    if (!room) {
      return NextResponse.json({ error: 'Room not found.' }, { status: 404 });
    }

    if (room.status !== 'waiting') {
      return NextResponse.json({ error: 'Battle is already started.' }, { status: 400 });
    }

    const questionsObj = JSON.parse(room.questions);
    questionsObj.questionStartedAt = Date.now();

    const updatedRoom = await db.battleRoom.update({
      where: { id: room.id },
      data: {
        status: 'active',
        questions: JSON.stringify(questionsObj)
      }
    });

    return NextResponse.json({
      roomCode: updatedRoom.roomCode,
      className: updatedRoom.className,
      subject: updatedRoom.subject,
      topic: updatedRoom.topic,
      players: JSON.parse(updatedRoom.players),
      status: updatedRoom.status,
      timer: updatedRoom.timer,
      currentQuestionIndex: updatedRoom.currentQuestionIndex
    });

  } catch (err: any) {
    console.error('Start battle room error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
