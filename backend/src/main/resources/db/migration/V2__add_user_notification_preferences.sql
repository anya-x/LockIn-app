-- Add notification preference columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS notify_ai_features BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS notify_calendar_sync BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS notify_task_reminders BOOLEAN NOT NULL DEFAULT true;
