import { pgTable, text, integer, boolean, timestamp, serial } from "drizzle-orm/pg-core";
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
  dailyLimit: integer("daily_limit").notNull().default(0),
  operators: text("operators").notNull().default('["add","subtract","multiply","divide"]'),
  lastLevelChangeAt: timestamp("last_level_change_at"),
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

export const reviewAttempts = pgTable("review_attempts", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull().references(() => players.id),
  originalAttemptId: integer("original_attempt_id").notNull().references(() => attempts.id),
  userAnswer: integer("user_answer"),
  isCorrect: boolean("is_correct"),
  answeredAt: timestamp("answered_at").defaultNow().notNull(),
});

export const playersRelations = relations(players, ({ many }) => ({
  attempts: many(attempts),
  reviewAttempts: many(reviewAttempts),
}));

export const attemptsRelations = relations(attempts, ({ one }) => ({
  player: one(players, {
    fields: [attempts.playerId],
    references: [players.id],
  }),
}));

export const reviewAttemptsRelations = relations(reviewAttempts, ({ one }) => ({
  player: one(players, {
    fields: [reviewAttempts.playerId],
    references: [players.id],
  }),
  originalAttempt: one(attempts, {
    fields: [reviewAttempts.originalAttemptId],
    references: [attempts.id],
  }),
}));

// Bingo game tables
export const bingoSessions = pgTable("bingo_sessions", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull().references(() => players.id),
  level: integer("level").notNull(),
  animalName: text("animal_name").notNull(),
  animalImageUrl: text("animal_image_url").notNull(),
  boardState: text("board_state").notNull().default('["locked","locked","locked","locked","locked","locked","locked","locked","locked","locked","locked","locked","locked","locked","locked","locked","locked","locked","locked","locked","locked","locked","locked","locked","locked"]'),
  completedLines: integer("completed_lines").default(0),
  isCompleted: boolean("is_completed").default(false),
  guessedCorrectly: boolean("guessed_correctly").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const bingoAttempts = pgTable("bingo_attempts", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => bingoSessions.id),
  cellIndex: integer("cell_index").notNull(),
  operand1: integer("operand1").notNull(),
  operand2: integer("operand2").notNull(),
  operator: text("operator").notNull(),
  correctAnswer: integer("correct_answer").notNull(),
  userAnswer: integer("user_answer").notNull(),
  isCorrect: boolean("is_correct").notNull(),
  attemptedAt: timestamp("attempted_at").defaultNow().notNull(),
});

export const bingoSessionsRelations = relations(bingoSessions, ({ one, many }) => ({
  player: one(players, {
    fields: [bingoSessions.playerId],
    references: [players.id],
  }),
  attempts: many(bingoAttempts),
}));

export const bingoAttemptsRelations = relations(bingoAttempts, ({ one }) => ({
  session: one(bingoSessions, {
    fields: [bingoAttempts.sessionId],
    references: [bingoSessions.id],
  }),
}));

export const insertPlayerSchema = createInsertSchema(players).omit({
  id: true,
  level: true,
  totalCorrect: true,
  totalAttempted: true,
  dailyLimit: true,
  lastLevelChangeAt: true,
  createdAt: true,
});

export const insertAttemptSchema = createInsertSchema(attempts).omit({
  id: true,
  answeredAt: true,
});

export const insertReviewAttemptSchema = createInsertSchema(reviewAttempts).omit({
  id: true,
  answeredAt: true,
});

export const updatePlayerSettingsSchema = z.object({
  dailyLimit: z.union([z.literal(0), z.literal(10), z.literal(20), z.literal(30)]),
  operators: z.array(z.enum(["add", "subtract", "multiply", "divide"])).optional(),
});

export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type Player = typeof players.$inferSelect;
export type InsertAttempt = z.infer<typeof insertAttemptSchema>;
export type Attempt = typeof attempts.$inferSelect;
export type InsertReviewAttempt = z.infer<typeof insertReviewAttemptSchema>;
export type ReviewAttempt = typeof reviewAttempts.$inferSelect;
export type UpdatePlayerSettings = z.infer<typeof updatePlayerSettingsSchema>;

export type OperatorType = "+" | "-" | "×" | "÷";
export type OperatorKey = "add" | "subtract" | "multiply" | "divide";

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

export interface DailyChartData {
  date: string;
  totalAttempted: number;
  totalCorrect: number;
  accuracy: number;
}

export interface LevelStats {
  level: number;
  totalAttempted: number;
  totalCorrect: number;
  accuracy: number;
}

// Bingo types
export type BingoSession = typeof bingoSessions.$inferSelect;
export type InsertBingoSession = typeof bingoSessions.$inferInsert;
export type BingoAttempt = typeof bingoAttempts.$inferSelect;
export type InsertBingoAttempt = typeof bingoAttempts.$inferInsert;

export type CellState = "locked" | "unlocked";

export interface Animal {
  ko: string;
  en: string;
}
