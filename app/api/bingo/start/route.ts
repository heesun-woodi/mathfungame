import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bingoSessions } from "@/db/schema";
import {
  getRandomAnimal,
  getAnimalImageUrl,
  createBingoBoard,
  boardToJson,
} from "@/lib/bingoEngine";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { playerId, level } = body;

    if (!playerId || !level) {
      return NextResponse.json(
        { error: "playerId and level are required" },
        { status: 400 }
      );
    }

    // 랜덤 동물 선택
    const animal = getRandomAnimal();
    const imageUrl = getAnimalImageUrl(animal);

    // 빙고 보드 생성
    const board = createBingoBoard();

    // 새 세션 생성
    const [session] = await db
      .insert(bingoSessions)
      .values({
        playerId: parseInt(playerId),
        level: parseInt(level),
        animalName: animal.ko,
        animalImageUrl: imageUrl,
        boardState: boardToJson(board),
        completedLines: 0,
        isCompleted: false,
        guessedCorrectly: false,
      })
      .returning();

    return NextResponse.json({
      sessionId: session.id,
      animalImageUrl: session.animalImageUrl,
      boardState: board,
      level: session.level,
    });
  } catch (error) {
    console.error("Error starting bingo session:", error);
    return NextResponse.json(
      { error: "Failed to start bingo session" },
      { status: 500 }
    );
  }
}
