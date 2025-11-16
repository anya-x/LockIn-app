-- Add new column to track tasks created and completed on the same day
-- This supports dual-metric tracking: total throughput vs research-based completion rate

ALTER TABLE daily_analytics
ADD COLUMN IF NOT EXISTS tasks_completed_from_today INTEGER DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN daily_analytics.tasks_completed_from_today IS 'Tasks that were both created AND completed on the same day (research-based metric)';
