-- Add pinned column to notes table
ALTER TABLE public.notes 
ADD COLUMN pinned BOOLEAN NOT NULL DEFAULT false;

-- Create index for better performance when filtering pinned notes
CREATE INDEX idx_notes_pinned ON public.notes(user_id, pinned, updated_at) WHERE deleted_at IS NULL;