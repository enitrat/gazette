-- Add wan_task_id to track external Evolink/WAN task IDs for recovery
ALTER TABLE generation_jobs ADD COLUMN wan_task_id TEXT;

-- Index for quick lookup of jobs by WAN task ID
CREATE INDEX idx_jobs_wan_task_id ON generation_jobs(wan_task_id);
