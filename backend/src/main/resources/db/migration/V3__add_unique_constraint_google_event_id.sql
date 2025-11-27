-- Attempt to add unique constraint on google_event_id to prevent duplicates
-- WARNING: This will fail if there are multiple NULL values!
ALTER TABLE tasks
ADD CONSTRAINT uk_tasks_google_event_id
UNIQUE (google_event_id);
