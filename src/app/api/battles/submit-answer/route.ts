import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { roomCode, playerName, questionIndex, answerIndex } = await req.json();
    if (!roomCode || !playerName || questionIndex === undefined || answerIndex === undefined) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    const room = await db.battleRoom.findUnique({
      where: { roomCode: roomCode.toUpperCase() }
    });

    if (!room) {
      return NextResponse.json({ error: 'Room not found.' }, { status: 404 });
    }

    if (room.status !== 'active') {
      return NextResponse.json({ error: 'Battle is not active.' }, { status: 400 });
    }

    if (room.currentQuestionIndex !== questionIndex) {
      return NextResponse.json({ error: 'Question index mismatch.' }, { status: 400 });
    }

    let players = JSON.parse(room.players);
    const player = players.find((p: any) => p.name.toLowerCase() === playerName.toLowerCase());

    if (!player) {
      return NextResponse.json({ error: 'Player not found in room.' }, { status: 404 });
    }

    if (player.answers[questionIndex] !== undefined) {
      return NextResponse.json({ error: 'Answer already submitted for this question.' }, { status: 400 });
    }

    let questionsObj = JSON.parse(room.questions);
    const question = questionsObj.list[questionIndex];
    if (!question) {
      return NextResponse.json({ error: 'Question not found.' }, { status: 404 });
    }

    const isCorrect = question.answerIndex === answerIndex;
    let pointsEarned = 0;

    if (isCorrect) {
      const secondsElapsed = Math.floor((Date.now() - questionsObj.questionStartedAt) / 1000);
      const remainingTime = Math.max(0, 15 - secondsElapsed);
      pointsEarned = 100 + remainingTime * 5;
    }

    // Update player answers and score
    player.answers[questionIndex] = answerIndex;
    player.answersAt[questionIndex] = Date.now();
    player.score += pointsEarned;

    // Check if all players in room have now answered this question
    const allPlayersAnswered = players.every((p: any) => p.answers[questionIndex] !== undefined);
    
    let nextQuestionIndex = room.currentQuestionIndex;
    let status = room.status;

    if (allPlayersAnswered) {
      nextQuestionIndex += 1;
      if (nextQuestionIndex >= 10) {
        status = 'completed';
        questionsObj.questionStartedAt = 0;

        // Battle finished! Update persistent leaderboard
        for (const p of players) {
          try {
            const isWinner = players.every((other: any) => p.score >= other.score);
            await db.battleLeaderboard.upsert({
              where: { email: `${p.name.toLowerCase()}@icseforge.local` },
              update: {
                points: { increment: p.score },
                battlesPlayed: { increment: 1 },
                battlesWon: { increment: isWinner ? 1 : 0 }
              },
              create: {
                name: p.name,
                email: `${p.name.toLowerCase()}@icseforge.local`,
                points: p.score,
                battlesPlayed: 1,
                battlesWon: isWinner ? 1 : 0
              }
            });
          } catch (err) {
            console.error('Failed to update leaderboard for player on submit:', p.name, err);
          }
        }
      } else {
        questionsObj.questionStartedAt = Date.now();
      }
    }

    // Save updated room state
    await db.battleRoom.update({
      where: { id: room.id },
      data: {
        players: JSON.stringify(players),
        currentQuestionIndex: nextQuestionIndex,
        status,
        questions: JSON.stringify(questionsObj)
      }
    });

    return NextResponse.json({
      correct: isCorrect,
      correctAnswerIndex: question.answerIndex,
      explanation: question.explanation,
      pointsEarned,
      currentScore: player.score,
      allAnswered: allPlayersAnswered
    });

  } catch (err: any) {
    console.error('Submit answer error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
