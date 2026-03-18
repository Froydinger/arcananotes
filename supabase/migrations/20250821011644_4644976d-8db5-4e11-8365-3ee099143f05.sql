-- Add the missing shared_with_username column
ALTER TABLE shared_notes ADD COLUMN IF NOT EXISTS shared_with_username text;