import {
  players,
  attempts,
  type Player,
  type InsertPlayer,
  type Attempt,
  type InsertAttempt,
  type DailyStats,
  type PlayerStats,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, gte, sql } from "drizzle-orm";
import { getLevelForAge } from "./levelSystem";

export interface IStorage {
  getPlayer(id: number): Promise<Player | undefined>;
  getAllPlayers(): Promise<Player[]>;
  createPlayer(player: InsertPlayer): Promise<Player>;
  updatePlayerLevel(id: number, level: number): Promise<Player | undefined>;
  updatePlayerStats(id: number, correct: boolean): Promise<void>;
  createAttempt(attempt: InsertAttempt): Promise<Attempt>;
  getPlayerStats(playerId: number): Promise<PlayerStats | null>;
  getWrongAttempts(playerId: number, limit?: number): Promise<Attempt[]>;
  getRecentAttempts(playerId: number, limit: number): Promise<Attempt[]>;
}

export class DatabaseStorage implements IStorage {
  async getPlayer(id: number): Promise<Player | undefined> {
    const [player] = await db.select().from(players).where(eq(players.id, id));
    return player || undefined;
  }

  async getAllPlayers(): Promise<Player[]> {
    return await db.select().from(players).orderBy(desc(players.createdAt));
  }

  async createPlayer(insertPlayer: InsertPlayer): Promise<Player> {
    const level = getLevelForAge(insertPlayer.age);
    const [player] = await db
      .insert(players)
      .values({ ...insertPlayer, level })
      .returning();
    return player;
  }

  async updatePlayerLevel(id: number, level: number): Promise<Player | undefined> {
    const [player] = await db
      .update(players)
      .set({ level: Math.max(1, Math.min(10, level)) })
      .where(eq(players.id, id))
      .returning();
    return player || undefined;
  }

  async updatePlayerStats(id: number, correct: boolean): Promise<void> {
    if (correct) {
      await db
        .update(players)
        .set({
          totalCorrect: sql`${players.totalCorrect} + 1`,
          totalAttempted: sql`${players.totalAttempted} + 1`,
        })
        .where(eq(players.id, id));
    } else {
      await db
        .update(players)
        .set({
          totalAttempted: sql`${players.totalAttempted} + 1`,
        })
        .where(eq(players.id, id));
    }
  }

  async createAttempt(insertAttempt: InsertAttempt): Promise<Attempt> {
    const [attempt] = await db
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

    const todayAttempts = await db
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
    return await db
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
    return await db
      .select()
      .from(attempts)
      .where(eq(attempts.playerId, playerId))
      .orderBy(desc(attempts.answeredAt))
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();
