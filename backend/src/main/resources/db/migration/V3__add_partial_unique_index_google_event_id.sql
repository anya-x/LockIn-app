-- Partial unique index: only enforces uniqueness for non-null values
-- This allows multiple NULL values (tasks without calendar events)
-- but prevents duplicate event IDs
CREATE UNIQUE INDEX IF NOT EXISTS uk_tasks_google_event_id
ON tasks (google_event_id)
WHERE google_event_id IS NOT NULL;
