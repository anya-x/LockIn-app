-- Attempt to add unique constraint to prevent duplicates
-- This migration will FAIL!
ALTER TABLE tasks
ADD CONSTRAINT uk_tasks_google_event_id
UNIQUE (google_event_id);
