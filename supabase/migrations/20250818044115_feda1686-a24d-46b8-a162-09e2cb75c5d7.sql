-- The issue is that the "Users can view shared notes" policy on the notes table
-- is trying to access shared_notes, but our new RLS policies on shared_notes
-- are now more restrictive, causing the policy check to fail.

-- Let's fix this by updating the shared notes policy on the notes table
-- to work with our new shared_notes RLS structure

DROP POLICY "Users can view shared notes" ON public.notes;

-- Create a new policy that works with our updated shared_notes RLS
CREATE POLICY "Users can view shared notes" 
ON public.notes 
FOR SELECT 
USING (
  (deleted_at IS NULL) AND (
    (auth.uid() = user_id) OR 
    (EXISTS ( 
      SELECT 1 FROM shared_notes 
      WHERE shared_notes.note_id = notes.id 
      AND shared_notes.shared_with_user_id = auth.uid()
    ))
  )
);

-- Also update the update policy for shared notes
DROP POLICY "Users can update shared notes with write permission" ON public.notes;

CREATE POLICY "Users can update shared notes with write permission" 
ON public.notes 
FOR UPDATE 
USING (
  (deleted_at IS NULL) AND (
    (auth.uid() = user_id) OR 
    (EXISTS ( 
      SELECT 1 FROM shared_notes 
      WHERE shared_notes.note_id = notes.id 
      AND shared_notes.permission = 'write' 
      AND shared_notes.shared_with_user_id = auth.uid()
    ))
  )
);