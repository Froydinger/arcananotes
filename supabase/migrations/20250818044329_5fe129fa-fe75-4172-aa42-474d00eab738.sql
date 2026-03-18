-- Revert to original RLS policies for notes table

-- Drop the current policies that I modified
DROP POLICY "Users can view shared notes" ON public.notes;
DROP POLICY "Users can update shared notes with write permission" ON public.notes;

-- Restore the original policies exactly as they were
CREATE POLICY "Users can view shared notes" 
ON public.notes 
FOR SELECT 
USING (
  (deleted_at IS NULL) AND (
    (auth.uid() = user_id) OR 
    (EXISTS ( 
      SELECT 1 FROM shared_notes 
      WHERE ((shared_notes.note_id = notes.id) AND (shared_notes.shared_with_user_id = auth.uid()))
    ))
  )
);

CREATE POLICY "Users can update shared notes with write permission" 
ON public.notes 
FOR UPDATE 
USING (
  (deleted_at IS NULL) AND (
    (auth.uid() = user_id) OR 
    (EXISTS ( 
      SELECT 1 FROM shared_notes 
      WHERE ((shared_notes.note_id = notes.id) AND (shared_notes.permission = 'write'::text) AND (shared_notes.shared_with_user_id = auth.uid()))
    ))
  )
);