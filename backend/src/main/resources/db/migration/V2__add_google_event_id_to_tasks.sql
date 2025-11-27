-- Add google_event_id column to tasks table for calendar sync
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS google_event_id VARCHAR(255);

-- Index for looking up tasks by Google event ID
CREATE INDEX IF NOT EXISTS idx_tasks_google_event_id ON tasks(google_event_id);
