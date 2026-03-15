-- Add bingo game tables
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
);

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
);

CREATE INDEX IF NOT EXISTS idx_bingo_sessions_player ON bingo_sessions(player_id);
CREATE INDEX IF NOT EXISTS idx_bingo_attempts_session ON bingo_attempts(session_id);
