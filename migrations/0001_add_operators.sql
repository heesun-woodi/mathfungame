-- Add operators column to players table
ALTER TABLE players 
ADD COLUMN IF NOT EXISTS operators TEXT NOT NULL DEFAULT '["add","subtract","multiply","divide"]';

-- Update existing players to have all operators by default
UPDATE players 
SET operators = '["add","subtract","multiply","divide"]'
WHERE operators IS NULL OR operators = '';
