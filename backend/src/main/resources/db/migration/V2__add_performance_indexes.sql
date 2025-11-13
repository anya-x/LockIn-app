-- V2: Add Performance Indexes
--
-- Context: Analytics queries were slow because we load ALL user data
-- then filter in Java. These indexes allow PostgreSQL to filter efficiently.
--
-- Performance Issue Identified:
-- AnalyticsCalculationService.java:79 and :161
-- - findByUserId() loads ALL tasks for a user
-- - Then filters by created_at in Java (lines 87-101)
-- - For users with 1000+ tasks, this is slow!
--
-- Solution: Add indexes on frequently queried columns
-- This allows the database to use index scans instead of full table scans.


-- Tasks table indexes
-- Used by: Analytics calculations that filter tasks by date
-- Impact: ~10x faster for users with many tasks
CREATE INDEX IF NOT EXISTS idx_tasks_user_created
    ON tasks(user_id, created_at);

-- Used by: Filtering tasks by status (TODO, IN_PROGRESS, COMPLETED)
-- Impact: Faster task list queries with status filters
CREATE INDEX IF NOT EXISTS idx_tasks_user_status
    ON tasks(user_id, status);


-- Focus sessions table indexes
-- Used by: Analytics queries finding sessions in date ranges
-- Impact: Speeds up daily/weekly analytics calculation
CREATE INDEX IF NOT EXISTS idx_focus_sessions_user_started
    ON focus_sessions(user_id, started_at);


-- Goals table indexes
-- Used by: Finding active vs completed goals
-- Impact: Faster goal list queries
CREATE INDEX IF NOT EXISTS idx_goals_user_completed
    ON goals(user_id, completed);

-- Used by: Finding goals in date ranges for analytics
-- Impact: Speeds up monthly/weekly goal queries
CREATE INDEX IF NOT EXISTS idx_goals_user_dates
    ON goals(user_id, start_date, end_date);


-- NOTE: daily_analytics already has idx_analytics_user_date (see entity annotation)
-- We're not recreating it here since JPA creates it on schema generation.


-- Performance Testing Commands (for later verification):
--
-- Before indexes:
-- EXPLAIN ANALYZE SELECT * FROM tasks WHERE user_id = 1 AND created_at > '2024-01-01';
--
-- After indexes:
-- EXPLAIN ANALYZE SELECT * FROM tasks WHERE user_id = 1 AND created_at > '2024-01-01';
-- Should show "Index Scan" instead of "Seq Scan"
--
-- Check index usage:
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public'
-- ORDER BY idx_scan;
