-- Create shared_notes table to track note sharing relationships
CREATE TABLE public.shared_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL,
  shared_with_email TEXT NOT NULL,
  shared_with_user_id UUID,
  permission TEXT NOT NULL CHECK (permission IN ('read', 'write')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(note_id, shared_with_email)
);

-- Enable RLS
ALTER TABLE public.shared_notes ENABLE ROW LEVEL SECURITY;

-- Create policies for shared_notes
CREATE POLICY "Users can view shares they own or are shared with" 
ON public.shared_notes 
FOR SELECT 
USING (
  auth.uid() = owner_id OR 
  auth.uid() = shared_with_user_id OR 
  (SELECT email FROM auth.users WHERE id = auth.uid()) = shared_with_email
);

CREATE POLICY "Users can create shares for their own notes" 
ON public.shared_notes 
FOR INSERT 
WITH CHECK (
  auth.uid() = owner_id AND 
  EXISTS (SELECT 1 FROM public.notes WHERE id = note_id AND user_id = auth.uid())
);

CREATE POLICY "Users can update shares they own" 
ON public.shared_notes 
FOR UPDATE 
USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete shares they own" 
ON public.shared_notes 
FOR DELETE 
USING (auth.uid() = owner_id);

-- Update notes policies to allow access to shared notes
CREATE POLICY "Users can view shared notes" 
ON public.notes 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM public.shared_notes 
    WHERE note_id = id AND (
      shared_with_user_id = auth.uid() OR
      shared_with_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
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
    AND (
      shared_with_user_id = auth.uid() OR
      shared_with_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_shared_notes_updated_at
BEFORE UPDATE ON public.shared_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to link shared notes when user signs up
CREATE OR REPLACE FUNCTION public.link_shared_notes_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Update shared_notes records where email matches the new user
  UPDATE public.shared_notes 
  SET shared_with_user_id = NEW.id,
      updated_at = now()
  WHERE shared_with_email = NEW.email 
  AND shared_with_user_id IS NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to link shared notes when user signs up
CREATE TRIGGER on_auth_user_created_link_shares
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.link_shared_notes_on_signup();