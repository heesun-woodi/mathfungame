import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPlayerSchema, insertAttemptSchema } from "@shared/schema";
import { evaluateLevelChange } from "./levelSystem";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get("/api/players", async (_req, res) => {
    try {
      const players = await storage.getAllPlayers();
      res.json(players);
    } catch (error) {
      res.status(500).json({ message: "Failed to get players" });
    }
  });

  app.get("/api/players/:id/stats", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid player ID" });
      }
      const stats = await storage.getPlayerStats(id);
      if (!stats) {
        return res.status(404).json({ message: "Player not found" });
      }
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to get player stats" });
    }
  });

  app.get("/api/players/:id/wrong-attempts", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid player ID" });
      }
      const wrongAttempts = await storage.getWrongAttempts(id);
      res.json(wrongAttempts);
    } catch (error) {
      res.status(500).json({ message: "Failed to get wrong attempts" });
    }
  });

  app.post("/api/players", async (req, res) => {
    try {
      const parsed = insertPlayerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data", errors: parsed.error.errors });
      }
      const player = await storage.createPlayer(parsed.data);
      res.status(201).json(player);
    } catch (error) {
      res.status(500).json({ message: "Failed to create player" });
    }
  });

  app.post("/api/attempts", async (req, res) => {
    try {
      const parsed = insertAttemptSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data", errors: parsed.error.errors });
      }

      const attempt = await storage.createAttempt(parsed.data);
      await storage.updatePlayerStats(parsed.data.playerId, parsed.data.isCorrect ?? false);

      const recentAttempts = await storage.getRecentAttempts(parsed.data.playerId, 10);
      const player = await storage.getPlayer(parsed.data.playerId);

      let levelChanged = false;
      let newLevel = player?.level ?? 1;
      let direction = "none";

      if (player && recentAttempts.length >= 10) {
        const evaluation = evaluateLevelChange(player.level, recentAttempts);
        if (evaluation.shouldChange) {
          await storage.updatePlayerLevel(player.id, evaluation.newLevel);
          levelChanged = true;
          newLevel = evaluation.newLevel;
          direction = evaluation.direction;
        }
      }

      res.status(201).json({
        attempt,
        levelChanged,
        newLevel,
        direction,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to submit attempt" });
    }
  });

  return httpServer;
}
