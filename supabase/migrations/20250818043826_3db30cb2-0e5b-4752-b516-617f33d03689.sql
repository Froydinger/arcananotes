-- Drop the existing overly permissive SELECT policy
DROP POLICY "Users can view shares they own or are shared with" ON public.shared_notes;

-- Create more restrictive policies that separate owner and recipient access
-- Policy 1: Note owners can see all shares for their notes (they need this to manage sharing)
CREATE POLICY "Note owners can view shares for their notes" 
ON public.shared_notes 
FOR SELECT 
USING (
  auth.uid() = owner_id 
  AND EXISTS (
    SELECT 1 FROM public.notes 
    WHERE notes.id = shared_notes.note_id 
    AND notes.user_id = auth.uid()
  )
);

-- Policy 2: Recipients can ONLY see their own sharing record, not others
CREATE POLICY "Recipients can view only their own share record" 
ON public.shared_notes 
FOR SELECT 
USING (
  auth.uid() = shared_with_user_id 
  AND shared_with_user_id IS NOT NULL
);

-- Additional security: Create a function to safely get sharing info without exposing emails
CREATE OR REPLACE FUNCTION public.get_note_sharing_info(note_id_param uuid)
RETURNS TABLE(
  share_count integer,
  user_has_access boolean,
  user_permission text
) 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::integer as share_count,
    EXISTS(
      SELECT 1 FROM shared_notes 
      WHERE note_id = note_id_param 
      AND shared_with_user_id = auth.uid()
    ) as user_has_access,
    COALESCE(
      (SELECT permission FROM shared_notes 
       WHERE note_id = note_id_param 
       AND shared_with_user_id = auth.uid() 
       LIMIT 1), 
      'none'
    ) as user_permission
  FROM shared_notes 
  WHERE note_id = note_id_param;
END;
$$;