-- Add suggested_prompt column to images table for AI-generated animation prompt suggestions
ALTER TABLE images ADD COLUMN suggested_prompt TEXT;
