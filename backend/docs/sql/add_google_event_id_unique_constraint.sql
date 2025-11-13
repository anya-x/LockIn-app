-- Add partial unique index for google_event_id
-- This prevents duplicate calendar events for the same task
-- Partial index only applies when google_event_id IS NOT NULL
-- (many tasks won't have calendar events, so null values are allowed to repeat)

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_google_event_id
ON tasks (google_event_id)
WHERE google_event_id IS NOT NULL;

-- This ensures:
-- 1. Each event ID can only be associated with one task
-- 2. Multiple tasks can have NULL event IDs (not synced to calendar)
-- 3. Database-level enforcement prevents race conditions
