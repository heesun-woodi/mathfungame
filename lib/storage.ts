import {
  players,
  attempts,
  reviewAttempts,
  type Player,
  type InsertPlayer,
  type Attempt,
  type InsertAttempt,
  type DailyStats,
  type PlayerStats,
  type InsertReviewAttempt,
  type ReviewAttempt,
  type DailyChartData,
  type LevelStats,
} from "@/db/schema";
import { getDb } from "@/lib/db";
import { eq, and, desc, gte, sql } from "drizzle-orm";
import { getLevelForAge } from "@/lib/levelSystem";

export class DatabaseStorage {
  async getPlayer(id: number): Promise<Player | undefined> {
    const [player] = await getDb().select().from(players).where(eq(players.id, id));
    return player || undefined;
  }

  async getAllPlayers(): Promise<Player[]> {
    return await getDb().select().from(players).orderBy(desc(players.createdAt));
  }

  async createPlayer(insertPlayer: InsertPlayer): Promise<Player> {
    const level = getLevelForAge(insertPlayer.age);
    const [player] = await getDb()
      .insert(players)
      .values({ ...insertPlayer, level })
      .returning();
    return player;
  }

  async updatePlayerLevel(id: number, level: number): Promise<Player | undefined> {
    const [player] = await getDb()
      .update(players)
      .set({ level: Math.max(1, Math.min(10, level)) })
      .where(eq(players.id, id))
      .returning();
    return player || undefined;
  }

  async updatePlayerLevelWithTimestamp(id: number, level: number): Promise<Player | undefined> {
    const [player] = await getDb()
      .update(players)
      .set({
        level: Math.max(1, Math.min(10, level)),
        lastLevelChangeAt: new Date(),
      })
      .where(eq(players.id, id))
      .returning();
    return player || undefined;
  }

  async getRecentDailyAccuracy(playerId: number, days: number): Promise<{ date: string; accuracy: number }[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 1);
    endDate.setHours(0, 0, 0, 0);

    const dailyStats = await this.getDailyStats(playerId, startDate, endDate);
    return dailyStats
      .filter((d) => d.totalAttempted >= 5)
      .map((d) => ({ date: d.date, accuracy: d.accuracy }));
  }

  async updatePlayerStats(id: number, correct: boolean): Promise<void> {
    if (correct) {
      await getDb()
        .update(players)
        .set({
          totalCorrect: sql`${players.totalCorrect} + 1`,
          totalAttempted: sql`${players.totalAttempted} + 1`,
        })
        .where(eq(players.id, id));
    } else {
      await getDb()
        .update(players)
        .set({
          totalAttempted: sql`${players.totalAttempted} + 1`,
        })
        .where(eq(players.id, id));
    }
  }

  async updatePlayerDailyLimit(id: number, dailyLimit: number): Promise<Player | undefined> {
    const [player] = await getDb()
      .update(players)
      .set({ dailyLimit })
      .where(eq(players.id, id))
      .returning();
    return player || undefined;
  }

  async updatePlayerName(id: number, name: string): Promise<Player | undefined> {
    const [player] = await getDb()
      .update(players)
      .set({ name })
      .where(eq(players.id, id))
      .returning();
    return player || undefined;
  }

  async updatePlayerOperators(id: number, operators: string): Promise<Player | undefined> {
    const [player] = await getDb()
      .update(players)
      .set({ operators })
      .where(eq(players.id, id))
      .returning();
    return player || undefined;
  }

  async deletePlayer(id: number): Promise<boolean> {
    await getDb().delete(reviewAttempts).where(eq(reviewAttempts.playerId, id));
    await getDb().delete(attempts).where(eq(attempts.playerId, id));
    const result = await getDb().delete(players).where(eq(players.id, id)).returning();
    return result.length > 0;
  }

  async createAttempt(insertAttempt: InsertAttempt): Promise<Attempt> {
    const [attempt] = await getDb()
      .insert(attempts)
      .values(insertAttempt)
      .returning();
    return attempt;
  }

  async getPlayerStats(playerId: number): Promise<PlayerStats | null> {
    const player = await this.getPlayer(playerId);
    if (!player) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayAttempts = await getDb()
      .select()
      .from(attempts)
      .where(
        and(
          eq(attempts.playerId, playerId),
          gte(attempts.answeredAt, today)
        )
      );

    const todayCorrect = todayAttempts.filter((a) => a.isCorrect).length;
    const todayTotal = todayAttempts.length;

    const todayStats: DailyStats = {
      date: today.toISOString().split("T")[0],
      totalAttempted: todayTotal,
      totalCorrect: todayCorrect,
      accuracy: todayTotal > 0 ? Math.round((todayCorrect / todayTotal) * 100) : 0,
    };

    const recentAttempts = await this.getRecentAttempts(playerId, 10);
    const recentCorrect = recentAttempts.filter((a) => a.isCorrect).length;
    const recentAccuracy = recentAttempts.length > 0
      ? Math.round((recentCorrect / recentAttempts.length) * 100)
      : 0;

    return { player, todayStats, recentAccuracy };
  }

  async getWrongAttempts(playerId: number, limit: number = 20): Promise<Attempt[]> {
    return await getDb()
      .select()
      .from(attempts)
      .where(
        and(
          eq(attempts.playerId, playerId),
          eq(attempts.isCorrect, false)
        )
      )
      .orderBy(desc(attempts.answeredAt))
      .limit(limit);
  }

  async getRecentAttempts(playerId: number, limit: number): Promise<Attempt[]> {
    return await getDb()
      .select()
      .from(attempts)
      .where(eq(attempts.playerId, playerId))
      .orderBy(desc(attempts.answeredAt))
      .limit(limit);
  }

  // Review game methods
  async getUnreviewedWrongAttempts(playerId: number, limit: number = 20): Promise<Attempt[]> {
    const reviewed = getDb()
      .select({ originalAttemptId: reviewAttempts.originalAttemptId })
      .from(reviewAttempts)
      .where(
        and(
          eq(reviewAttempts.playerId, playerId),
          eq(reviewAttempts.isCorrect, true)
        )
      );

    return await getDb()
      .select()
      .from(attempts)
      .where(
        and(
          eq(attempts.playerId, playerId),
          eq(attempts.isCorrect, false),
          sql`${attempts.id} NOT IN (${reviewed})`
        )
      )
      .orderBy(desc(attempts.answeredAt))
      .limit(limit);
  }

  async createReviewAttempt(data: InsertReviewAttempt): Promise<ReviewAttempt> {
    const [review] = await getDb()
      .insert(reviewAttempts)
      .values(data)
      .returning();
    return review;
  }

  // Chart data methods
  async getDailyStats(playerId: number, startDate: Date, endDate: Date): Promise<DailyChartData[]> {
    const result = await getDb()
      .select({
        date: sql<string>`to_char(${attempts.answeredAt}, 'YYYY-MM-DD')`,
        totalAttempted: sql<number>`count(*)::int`,
        totalCorrect: sql<number>`count(*) filter (where ${attempts.isCorrect} = true)::int`,
      })
      .from(attempts)
      .where(
        and(
          eq(attempts.playerId, playerId),
          gte(attempts.answeredAt, startDate),
          sql`${attempts.answeredAt} < ${endDate}`
        )
      )
      .groupBy(sql`to_char(${attempts.answeredAt}, 'YYYY-MM-DD')`)
      .orderBy(sql`to_char(${attempts.answeredAt}, 'YYYY-MM-DD')`);

    return result.map((r) => ({
      date: r.date,
      totalAttempted: r.totalAttempted,
      totalCorrect: r.totalCorrect,
      accuracy: r.totalAttempted > 0 ? Math.round((r.totalCorrect / r.totalAttempted) * 100) : 0,
    }));
  }

  async getLevelStats(playerId: number): Promise<LevelStats[]> {
    const result = await getDb()
      .select({
        level: attempts.level,
        totalAttempted: sql<number>`count(*)::int`,
        totalCorrect: sql<number>`count(*) filter (where ${attempts.isCorrect} = true)::int`,
      })
      .from(attempts)
      .where(eq(attempts.playerId, playerId))
      .groupBy(attempts.level)
      .orderBy(attempts.level);

    return result.map((r) => ({
      level: r.level,
      totalAttempted: r.totalAttempted,
      totalCorrect: r.totalCorrect,
      accuracy: r.totalAttempted > 0 ? Math.round((r.totalCorrect / r.totalAttempted) * 100) : 0,
    }));
  }

  async getCumulativeStats(playerId: number): Promise<DailyChartData[]> {
    const dailyData = await this.getDailyStats(
      playerId,
      new Date("2020-01-01"),
      new Date("2100-01-01")
    );

    let cumAttempted = 0;
    let cumCorrect = 0;
    return dailyData.map((d) => {
      cumAttempted += d.totalAttempted;
      cumCorrect += d.totalCorrect;
      return {
        date: d.date,
        totalAttempted: cumAttempted,
        totalCorrect: cumCorrect,
        accuracy: cumAttempted > 0 ? Math.round((cumCorrect / cumAttempted) * 100) : 0,
      };
    });
  }
}

export const storage = new DatabaseStorage();
