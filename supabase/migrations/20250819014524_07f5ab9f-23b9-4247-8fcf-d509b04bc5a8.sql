-- Add column to track when username prompt was last shown
ALTER TABLE public.user_preferences 
ADD COLUMN username_prompt_last_shown timestamp with time zone DEFAULT NULL;