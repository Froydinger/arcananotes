-- Fix the RLS policy for viewing shared notes
DROP POLICY "Users can view shared notes" ON public.notes;

CREATE POLICY "Users can view shared notes" 
ON public.notes 
FOR SELECT 
USING ((auth.uid() = user_id) OR (EXISTS ( 
  SELECT 1
  FROM shared_notes
  WHERE ((shared_notes.note_id = notes.id) AND (shared_notes.shared_with_user_id = auth.uid()))
)));

-- Also fix the update policy for shared notes
DROP POLICY "Users can update shared notes with write permission" ON public.notes;

CREATE POLICY "Users can update shared notes with write permission" 
ON public.notes 
FOR UPDATE 
USING ((auth.uid() = user_id) OR (EXISTS ( 
  SELECT 1
  FROM shared_notes
  WHERE ((shared_notes.note_id = notes.id) AND (shared_notes.permission = 'write') AND (shared_notes.shared_with_user_id = auth.uid()))
)));