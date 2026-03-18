-- Add body_font column to user_preferences table
ALTER TABLE public.user_preferences 
ADD COLUMN body_font TEXT DEFAULT 'sans' CHECK (body_font IN ('serif', 'sans', 'mono'));