-- Performance indexes for analytics queries

CREATE INDEX IF NOT EXISTS idx_daily_analytics_user_date
ON daily_analytics(user_id, date);

CREATE INDEX IF NOT EXISTS idx_tasks_user_created
ON tasks(user_id, created_at);

CREATE INDEX IF NOT EXISTS idx_focus_sessions_user_started
ON focus_sessions(user_id, started_at);

CREATE INDEX IF NOT EXISTS idx_goals_user_type
ON goals(user_id, type);
