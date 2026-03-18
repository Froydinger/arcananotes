-- Create AI chat history table for notes
CREATE TABLE public.note_ai_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id UUID NOT NULL,
  user_id UUID NOT NULL,
  action_type TEXT NOT NULL, -- 'spell', 'grammar', 'rewrite'
  instruction TEXT, -- For rewrite actions
  original_content TEXT NOT NULL,
  original_title TEXT,
  new_content TEXT NOT NULL,
  new_title TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.note_ai_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own note AI history" 
ON public.note_ai_history 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own note AI history" 
ON public.note_ai_history 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own note AI history" 
ON public.note_ai_history 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_note_ai_history_note_id ON public.note_ai_history(note_id);
CREATE INDEX idx_note_ai_history_user_id ON public.note_ai_history(user_id);