-- Add deleted_at column to notes table for soft delete functionality
ALTER TABLE public.notes 
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create index for efficient querying of deleted notes
CREATE INDEX idx_notes_deleted_at ON public.notes(deleted_at);
CREATE INDEX idx_notes_active ON public.notes(user_id) WHERE deleted_at IS NULL;

-- Update existing RLS policies to exclude deleted notes from normal operations
DROP POLICY IF EXISTS "Users can view their own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can view shared notes" ON public.notes;

-- Recreate policies to exclude deleted notes
CREATE POLICY "Users can view their own notes" 
ON public.notes 
FOR SELECT 
USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "Users can view shared notes" 
ON public.notes 
FOR SELECT 
USING (
  deleted_at IS NULL AND 
  (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM shared_notes 
    WHERE shared_notes.note_id = notes.id 
    AND shared_notes.shared_with_user_id = auth.uid()
  ))
);

-- Add policy for viewing deleted notes (only owners)
CREATE POLICY "Users can view their own deleted notes" 
ON public.notes 
FOR SELECT 
USING (auth.uid() = user_id AND deleted_at IS NOT NULL);

-- Update existing update policies to exclude deleted notes
DROP POLICY IF EXISTS "Users can update their own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can update shared notes with write permission" ON public.notes;

CREATE POLICY "Users can update their own notes" 
ON public.notes 
FOR UPDATE 
USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "Users can update shared notes with write permission" 
ON public.notes 
FOR UPDATE 
USING (
  deleted_at IS NULL AND (
    auth.uid() = user_id OR EXISTS (
      SELECT 1 FROM shared_notes 
      WHERE shared_notes.note_id = notes.id 
      AND shared_notes.permission = 'write' 
      AND shared_notes.shared_with_user_id = auth.uid()
    )
  )
);

-- Create function for soft delete
CREATE OR REPLACE FUNCTION public.soft_delete_note(note_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.notes 
  SET deleted_at = NOW(), updated_at = NOW()
  WHERE id = note_id_param 
  AND user_id = auth.uid() 
  AND deleted_at IS NULL;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function for restoring deleted notes
CREATE OR REPLACE FUNCTION public.restore_note(note_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.notes 
  SET deleted_at = NULL, updated_at = NOW()
  WHERE id = note_id_param 
  AND user_id = auth.uid() 
  AND deleted_at IS NOT NULL;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function for permanent deletion
CREATE OR REPLACE FUNCTION public.permanently_delete_note(note_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Delete associated shared_notes first
  DELETE FROM public.shared_notes 
  WHERE note_id = note_id_param 
  AND owner_id = auth.uid();
  
  -- Delete the note
  DELETE FROM public.notes 
  WHERE id = note_id_param 
  AND user_id = auth.uid();
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to clean up notes older than 7 days
CREATE OR REPLACE FUNCTION public.cleanup_old_deleted_notes()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete shared_notes for notes that will be permanently deleted
  DELETE FROM public.shared_notes 
  WHERE note_id IN (
    SELECT id FROM public.notes 
    WHERE deleted_at IS NOT NULL 
    AND deleted_at < NOW() - INTERVAL '7 days'
  );
  
  -- Delete the notes
  DELETE FROM public.notes 
  WHERE deleted_at IS NOT NULL 
  AND deleted_at < NOW() - INTERVAL '7 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to automatically update updated_at when restoring notes
CREATE TRIGGER update_notes_updated_at
BEFORE UPDATE ON public.notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();