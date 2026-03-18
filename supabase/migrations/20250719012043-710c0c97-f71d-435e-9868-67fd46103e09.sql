-- Remove encryption columns and reset notes to use plain text
ALTER TABLE public.notes 
DROP COLUMN IF EXISTS encrypted_content,
DROP COLUMN IF EXISTS encryption_metadata,
DROP COLUMN IF EXISTS is_encrypted;

-- Clear any existing encrypted data by resetting content field
UPDATE public.notes SET content = '' WHERE content IS NULL OR content = '';
UPDATE public.notes SET title = 'Untitled Note' WHERE title IS NULL OR title = '';