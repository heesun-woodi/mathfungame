import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, serial } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  age: integer("age").notNull(),
  level: integer("level").notNull().default(1),
  totalCorrect: integer("total_correct").notNull().default(0),
  totalAttempted: integer("total_attempted").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const attempts = pgTable("attempts", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull().references(() => players.id),
  operand1: integer("operand1").notNull(),
  operand2: integer("operand2").notNull(),
  operator: text("operator").notNull(),
  correctAnswer: integer("correct_answer").notNull(),
  userAnswer: integer("user_answer"),
  isCorrect: boolean("is_correct"),
  level: integer("level").notNull(),
  answeredAt: timestamp("answered_at").defaultNow().notNull(),
});

export const playersRelations = relations(players, ({ many }) => ({
  attempts: many(attempts),
}));

export const attemptsRelations = relations(attempts, ({ one }) => ({
  player: one(players, {
    fields: [attempts.playerId],
    references: [players.id],
  }),
}));

export const insertPlayerSchema = createInsertSchema(players).omit({
  id: true,
  level: true,
  totalCorrect: true,
  totalAttempted: true,
  createdAt: true,
});

export const insertAttemptSchema = createInsertSchema(attempts).omit({
  id: true,
  answeredAt: true,
});

export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type Player = typeof players.$inferSelect;
export type InsertAttempt = z.infer<typeof insertAttemptSchema>;
export type Attempt = typeof attempts.$inferSelect;

export type OperatorType = "+" | "-" | "×" | "÷";

export interface MathProblem {
  operand1: number;
  operand2: number;
  operator: OperatorType;
  correctAnswer: number;
}

export interface DailyStats {
  date: string;
  totalAttempted: number;
  totalCorrect: number;
  accuracy: number;
}

export interface PlayerStats {
  player: Player;
  todayStats: DailyStats;
  recentAccuracy: number;
}
