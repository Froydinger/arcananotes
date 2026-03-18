-- Fix search path security warnings for new functions
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';