-- Ensure generated videos are unique per generation job (uploaded videos have NULL job IDs)
CREATE UNIQUE INDEX IF NOT EXISTS idx_videos_generation_job_id_unique
  ON videos(generation_job_id)
  WHERE generation_job_id IS NOT NULL;
