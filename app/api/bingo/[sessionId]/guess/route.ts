import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bingoSessions } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ sessionId: string }> }
) {
  try {
    const params = await context.params;
    const sessionId = parseInt(params.sessionId);
    const body = await request.json();
    const { animalGuess } = body;

    if (!animalGuess) {
      return NextResponse.json(
        { error: "animalGuess is required" },
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

    // 정답 확인 (공백 제거 후 비교)
    const isCorrect =
      animalGuess.trim().toLowerCase() ===
      session.animalName.trim().toLowerCase();

    if (isCorrect) {
      // 정답 시 세션 완료 처리
      await db
        .update(bingoSessions)
        .set({
          guessedCorrectly: true,
          completedAt: new Date(),
        })
        .where(eq(bingoSessions.id, sessionId));
    }

    return NextResponse.json({
      isCorrect,
      correctAnswer: isCorrect ? session.animalName : undefined,
    });
  } catch (error) {
    console.error("Error checking animal guess:", error);
    return NextResponse.json(
      { error: "Failed to check guess" },
      { status: 500 }
    );
  }
}
