
-- Add columns for encrypted content and metadata
ALTER TABLE public.notes 
ADD COLUMN encrypted_content TEXT,
ADD COLUMN encryption_metadata JSONB,
ADD COLUMN is_encrypted BOOLEAN DEFAULT FALSE;

-- Update existing notes to mark them as unencrypted for migration
UPDATE public.notes SET is_encrypted = FALSE WHERE is_encrypted IS NULL;
