import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bingoSessions, bingoAttempts } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  jsonToBoard,
  boardToJson,
  checkBingoLines,
} from "@/lib/bingoEngine";

export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const sessionId = parseInt(params.sessionId);
    const body = await request.json();
    const {
      cellIndex,
      operand1,
      operand2,
      operator,
      correctAnswer,
      userAnswer,
    } = body;

    if (
      cellIndex === undefined ||
      operand1 === undefined ||
      operand2 === undefined ||
      !operator ||
      correctAnswer === undefined ||
      userAnswer === undefined
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 세션 조회
    const [session] = await db
      .select()
      .from(bingoSessions)
      .where(eq(bingoSessions.id, sessionId))
      .limit(1);

    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    const isCorrect = parseInt(userAnswer) === correctAnswer;

    // 시도 기록
    await db.insert(bingoAttempts).values({
      sessionId,
      cellIndex: parseInt(cellIndex),
      operand1: parseInt(operand1),
      operand2: parseInt(operand2),
      operator,
      correctAnswer: parseInt(correctAnswer),
      userAnswer: parseInt(userAnswer),
      isCorrect,
    });

    // 정답일 경우 보드 상태 업데이트
    let updatedBoard = jsonToBoard(session.boardState);
    let completedLines = session.completedLines ?? 0;
    let isCompleted = session.isCompleted ?? false;

    if (isCorrect) {
      updatedBoard[parseInt(cellIndex)] = "unlocked";
      completedLines = checkBingoLines(updatedBoard);
      isCompleted = completedLines >= 5;

      await db
        .update(bingoSessions)
        .set({
          boardState: boardToJson(updatedBoard),
          completedLines,
          isCompleted,
        })
        .where(eq(bingoSessions.id, sessionId));
    }

    return NextResponse.json({
      isCorrect,
      boardState: updatedBoard,
      completedLines,
      isCompleted,
    });
  } catch (error) {
    console.error("Error recording bingo attempt:", error);
    return NextResponse.json(
      { error: "Failed to record attempt" },
      { status: 500 }
    );
  }
}
