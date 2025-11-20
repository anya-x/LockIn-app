-- Add google_event_id column to tasks table for Calendar integration
ALTER TABLE tasks ADD COLUMN google_event_id VARCHAR(255);

-- Create index for lookups by event ID
CREATE INDEX idx_tasks_google_event_id ON tasks(google_event_id);
