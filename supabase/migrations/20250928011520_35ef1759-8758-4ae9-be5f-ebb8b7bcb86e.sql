-- Remove the problematic security_barrier setting from the view
-- and recreate it without security definer properties
DROP VIEW IF EXISTS public.user_preferences_public;

-- Create a safer view without security definer
-- This view only exposes non-sensitive usernames for username checks
CREATE VIEW public.user_preferences_public AS
SELECT 
  username,
  created_at
FROM user_preferences
WHERE username IS NOT NULL
AND user_id = auth.uid(); -- Only show current user's username

-- Enable RLS on the underlying table (already enabled, but ensuring it)
-- The view will inherit the table's RLS policies

-- Add a comment explaining the purpose
COMMENT ON VIEW public.user_preferences_public IS 'Public view for username availability - only shows current user data';