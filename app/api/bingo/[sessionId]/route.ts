import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bingoSessions } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const sessionId = parseInt(params.sessionId);

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

    return NextResponse.json({
      sessionId: session.id,
      animalName: session.animalName,
      animalImageUrl: session.animalImageUrl,
      completedLines: session.completedLines,
      isCompleted: session.isCompleted,
      guessedCorrectly: session.guessedCorrectly,
    });
  } catch (error) {
    console.error("Error fetching bingo session:", error);
    return NextResponse.json(
      { error: "Failed to fetch session" },
      { status: 500 }
    );
  }
}
