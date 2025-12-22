-- Rename suggested_prompt to suggested_prompts (will store JSON array of suggestions)
ALTER TABLE images RENAME COLUMN suggested_prompt TO suggested_prompts;
