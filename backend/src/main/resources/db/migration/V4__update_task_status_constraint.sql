-- Update task status check constraint to include ARCHIVED
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_status_check CHECK (status IN ('TODO', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED'));
