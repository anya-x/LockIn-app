-- Add notification preference columns to users table (retry migration)
-- Using DO block to handle columns that may already exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'notify_ai_features') THEN
        ALTER TABLE users ADD COLUMN notify_ai_features BOOLEAN NOT NULL DEFAULT true;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'notify_calendar_sync') THEN
        ALTER TABLE users ADD COLUMN notify_calendar_sync BOOLEAN NOT NULL DEFAULT true;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'notify_task_reminders') THEN
        ALTER TABLE users ADD COLUMN notify_task_reminders BOOLEAN NOT NULL DEFAULT true;
    END IF;
END $$;
