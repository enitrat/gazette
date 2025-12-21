-- Videos table for storing generated video metadata
CREATE TABLE videos (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  generation_job_id TEXT REFERENCES generation_jobs(id) ON DELETE SET NULL,
  source_image_id TEXT REFERENCES images(id) ON DELETE SET NULL,
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT NOT NULL DEFAULT 'video/mp4',
  width INTEGER,
  height INTEGER,
  duration_seconds INTEGER,
  file_size INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Index for quick project lookups
CREATE INDEX idx_videos_project_id ON videos(project_id);
CREATE INDEX idx_videos_generation_job_id ON videos(generation_job_id);
