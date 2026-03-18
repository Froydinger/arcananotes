-- Update existing shared_notes records to populate shared_with_username
-- for users who have usernames but the shared_notes record doesn't have it set
UPDATE shared_notes 
SET shared_with_username = up.username,
    updated_at = now()
FROM user_preferences up
WHERE shared_notes.shared_with_user_id = up.user_id 
AND shared_notes.shared_with_username IS NULL 
AND up.username IS NOT NULL;