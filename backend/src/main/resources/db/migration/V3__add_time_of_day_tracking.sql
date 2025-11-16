-- Add time of day tracking columns

ALTER TABLE daily_analytics ADD COLUMN IF NOT EXISTS morning_focus_minutes INTEGER DEFAULT 0;
ALTER TABLE daily_analytics ADD COLUMN IF NOT EXISTS afternoon_focus_minutes INTEGER DEFAULT 0;
ALTER TABLE daily_analytics ADD COLUMN IF NOT EXISTS evening_focus_minutes INTEGER DEFAULT 0;
ALTER TABLE daily_analytics ADD COLUMN IF NOT EXISTS night_focus_minutes INTEGER DEFAULT 0;
