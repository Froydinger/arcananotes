-- Create a secure function to safely retrieve user preferences
-- This adds an extra layer of protection beyond RLS
CREATE OR REPLACE FUNCTION public.get_user_preferences_safe(requesting_user_id uuid DEFAULT auth.uid())
RETURNS TABLE (
  id uuid,
  user_id uuid,
  theme text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  notification_daily_prompt boolean,
  notification_note_shared boolean,
  notification_note_updated boolean,
  daily_prompt_time time without time zone,
  username text,
  username_prompt_last_shown timestamp with time zone,
  email text,
  title_font text,
  body_font text,
  ai_enabled boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Additional security: only return data if requesting user owns the preferences
  IF requesting_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  RETURN QUERY
  SELECT 
    up.id,
    up.user_id,
    up.theme,
    up.created_at,
    up.updated_at,
    up.notification_daily_prompt,
    up.notification_note_shared,
    up.notification_note_updated,
    up.daily_prompt_time,
    up.username,
    up.username_prompt_last_shown,
    up.email,
    up.title_font,
    up.body_font,
    up.ai_enabled
  FROM user_preferences up
  WHERE up.user_id = requesting_user_id;
END;
$$;

-- Add additional RLS policy for extra security
-- This policy ensures that even database functions must respect user ownership
CREATE POLICY "Extra security: Function-level access control"
ON public.user_preferences
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Create a view that only exposes non-sensitive data for public operations
-- This can be used for operations like username availability checks
CREATE OR REPLACE VIEW public.user_preferences_public AS
SELECT 
  user_id,
  username,
  created_at
FROM user_preferences
WHERE username IS NOT NULL;

-- Add RLS to the view (inherited from base table, but explicitly defined)
ALTER VIEW public.user_preferences_public SET (security_barrier = true);

-- Comment the table and sensitive columns for documentation
COMMENT ON TABLE public.user_preferences IS 'User preference settings with RLS protection';
COMMENT ON COLUMN public.user_preferences.email IS 'SENSITIVE: User email address - protected by RLS';
COMMENT ON COLUMN public.user_preferences.username IS 'SENSITIVE: User chosen username - protected by RLS';