import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage";
import { insertAttemptSchema } from "@/db/schema";
import { evaluateLevelChange } from "@/lib/levelSystem";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = insertAttemptSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid data", errors: parsed.error.issues }, { status: 400 });
    }

    const attempt = await storage.createAttempt(parsed.data);
    await storage.updatePlayerStats(parsed.data.playerId, parsed.data.isCorrect ?? false);

    const player = await storage.getPlayer(parsed.data.playerId);
    const dailyStats = await storage.getRecentDailyAccuracy(parsed.data.playerId, 7);

    let levelChanged = false;
    let newLevel = player?.level ?? 1;
    let direction = "none";

    if (player) {
      const evaluation = evaluateLevelChange(player.level, dailyStats, player.lastLevelChangeAt);
      if (evaluation.shouldChange) {
        await storage.updatePlayerLevelWithTimestamp(player.id, evaluation.newLevel);
        levelChanged = true;
        newLevel = evaluation.newLevel;
        direction = evaluation.direction;
      }
    }

    return NextResponse.json({
      attempt,
      levelChanged,
      newLevel,
      direction,
    }, { status: 201 });
  } catch {
    return NextResponse.json({ message: "Failed to submit attempt" }, { status: 500 });
  }
}
