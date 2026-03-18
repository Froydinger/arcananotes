-- Drop the problematic policies first
DROP POLICY IF EXISTS "Users can view shared notes" ON public.notes;
DROP POLICY IF EXISTS "Users can update shared notes with write permission" ON public.notes;
DROP POLICY IF EXISTS "Users can view shares they own or are shared with" ON public.shared_notes;

-- Recreate shared_notes policies without referencing auth.users
CREATE POLICY "Users can view shares they own or are shared with" 
ON public.shared_notes 
FOR SELECT 
USING (
  auth.uid() = owner_id OR 
  auth.uid() = shared_with_user_id
);

-- Recreate notes policies for shared access without auth.users reference
CREATE POLICY "Users can view shared notes" 
ON public.notes 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM public.shared_notes 
    WHERE note_id = id AND shared_with_user_id = auth.uid()
  )
);

CREATE POLICY "Users can update shared notes with write permission" 
ON public.notes 
FOR UPDATE 
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM public.shared_notes 
    WHERE note_id = id 
    AND permission = 'write'
    AND shared_with_user_id = auth.uid()
  )
);