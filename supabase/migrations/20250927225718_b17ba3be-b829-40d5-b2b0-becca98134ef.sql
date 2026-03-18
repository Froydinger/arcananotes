-- Add ai_enabled column to user_preferences table
ALTER TABLE public.user_preferences ADD COLUMN ai_enabled BOOLEAN DEFAULT true;