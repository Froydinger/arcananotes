-- Remove IP tracking columns from audit table for privacy
ALTER TABLE public.shared_notes_audit 
DROP COLUMN IF EXISTS ip_address,
DROP COLUMN IF EXISTS user_agent;

-- Make storage bucket private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'note-images';