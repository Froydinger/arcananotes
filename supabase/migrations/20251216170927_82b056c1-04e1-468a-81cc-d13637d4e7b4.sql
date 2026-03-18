-- Add note_type column to notes table
ALTER TABLE public.notes 
ADD COLUMN note_type text NOT NULL DEFAULT 'note';

-- Create checklist_items table
CREATE TABLE public.checklist_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id uuid NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  content text NOT NULL DEFAULT '',
  completed boolean NOT NULL DEFAULT false,
  position integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on checklist_items
ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for checklist_items (note owners)
CREATE POLICY "Users can view checklist items for their notes"
ON public.checklist_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.notes 
    WHERE notes.id = checklist_items.note_id 
    AND (notes.user_id = auth.uid() OR user_has_note_access(notes.id, auth.uid()))
  )
);

CREATE POLICY "Users can create checklist items for their notes"
ON public.checklist_items
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.notes 
    WHERE notes.id = checklist_items.note_id 
    AND (notes.user_id = auth.uid() OR user_has_note_write_access(notes.id, auth.uid()))
  )
);

CREATE POLICY "Users can update checklist items for their notes"
ON public.checklist_items
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.notes 
    WHERE notes.id = checklist_items.note_id 
    AND (notes.user_id = auth.uid() OR user_has_note_write_access(notes.id, auth.uid()))
  )
);

CREATE POLICY "Users can delete checklist items for their notes"
ON public.checklist_items
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.notes 
    WHERE notes.id = checklist_items.note_id 
    AND (notes.user_id = auth.uid() OR user_has_note_write_access(notes.id, auth.uid()))
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_checklist_items_updated_at
BEFORE UPDATE ON public.checklist_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for checklist_items
ALTER TABLE public.checklist_items REPLICA IDENTITY FULL;

-- Add table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.checklist_items;