-- Add title_font column to user_preferences table
ALTER TABLE public.user_preferences 
ADD COLUMN title_font TEXT DEFAULT 'serif' CHECK (title_font IN ('serif', 'sans', 'mono'));