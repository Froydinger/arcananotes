-- Fix infinite recursion in RLS policies by using security definer functions
-- The issue is that notes policies reference shared_notes and vice versa

-- First, create security definer functions to break the circular dependency

-- Function to check if a user has access to a note via sharing
CREATE OR REPLACE FUNCTION public.user_has_note_access(p_note_id uuid, p_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.shared_notes 
    WHERE note_id = p_note_id 
    AND shared_with_user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to check if a user has write access to a note via sharing
CREATE OR REPLACE FUNCTION public.user_has_note_write_access(p_note_id uuid, p_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.shared_notes 
    WHERE note_id = p_note_id 
    AND shared_with_user_id = p_user_id 
    AND permission = 'write'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Now fix the policies on the notes table
DROP POLICY "Users can view shared notes" ON public.notes;
DROP POLICY "Users can update shared notes with write permission" ON public.notes;

-- Create new policies using the security definer functions
CREATE POLICY "Users can view shared notes" 
ON public.notes 
FOR SELECT 
USING (
  (deleted_at IS NULL) AND (
    (auth.uid() = user_id) OR 
    public.user_has_note_access(id, auth.uid())
  )
);

CREATE POLICY "Users can update shared notes with write permission" 
ON public.notes 
FOR UPDATE 
USING (
  (deleted_at IS NULL) AND (
    (auth.uid() = user_id) OR 
    public.user_has_note_write_access(id, auth.uid())
  )
);