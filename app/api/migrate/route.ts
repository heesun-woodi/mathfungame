import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

interface ExistsRow {
  exists: boolean;
}

export async function GET() {
  try {
    // Check if bingo_sessions table exists
    const checkResult = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'bingo_sessions'
      ) as exists
    `);

    const tableExists = (checkResult.rows[0] as unknown as ExistsRow)?.exists;

    if (tableExists) {
      return NextResponse.json({
        status: "already_migrated",
        message: "Bingo tables already exist",
      });
    }

    // Run migration
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS bingo_sessions (
        id SERIAL PRIMARY KEY,
        player_id INTEGER NOT NULL REFERENCES players(id),
        level INTEGER NOT NULL,
        animal_name TEXT NOT NULL,
        animal_image_url TEXT NOT NULL,
        board_state TEXT NOT NULL DEFAULT '["locked","locked","locked","locked","locked","locked","locked","locked","locked","locked","locked","locked","locked","locked","locked","locked","locked","locked","locked","locked","locked","locked","locked","locked","locked"]',
        completed_lines INTEGER DEFAULT 0,
        is_completed BOOLEAN DEFAULT false,
        guessed_correctly BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        completed_at TIMESTAMP
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS bingo_attempts (
        id SERIAL PRIMARY KEY,
        session_id INTEGER NOT NULL REFERENCES bingo_sessions(id),
        cell_index INTEGER NOT NULL,
        operand1 INTEGER NOT NULL,
        operand2 INTEGER NOT NULL,
        operator TEXT NOT NULL,
        correct_answer INTEGER NOT NULL,
        user_answer INTEGER NOT NULL,
        is_correct BOOLEAN NOT NULL,
        attempted_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_bingo_sessions_player ON bingo_sessions(player_id)
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_bingo_attempts_session ON bingo_attempts(session_id)
    `);

    return NextResponse.json({
      status: "migrated",
      message: "Bingo tables created successfully",
    });
  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
