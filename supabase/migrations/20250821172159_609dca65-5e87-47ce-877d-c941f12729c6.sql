-- Fix security linter warnings by adding SET search_path to newly created functions
CREATE OR REPLACE FUNCTION public.get_user_by_identifier(p_identifier text)
RETURNS TABLE(user_id uuid, email text, username text, has_google_auth boolean)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_identifier TEXT := LOWER(TRIM(p_identifier));
BEGIN
  RETURN QUERY
  SELECT 
    up.user_id,
    COALESCE(up.email, au.email) as email,
    up.username,
    (au.raw_app_meta_data->>'provider') = 'google' as has_google_auth
  FROM public.user_preferences up
  JOIN auth.users au ON au.id = up.user_id
  WHERE (up.username = v_identifier OR au.email = v_identifier OR up.email = v_identifier)
  LIMIT 1;
END;
$$;

-- Update function to check if identifier exists (username or email)
CREATE OR REPLACE FUNCTION public.check_identifier_exists(p_identifier text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_identifier TEXT := LOWER(TRIM(p_identifier));
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_preferences up
    JOIN auth.users au ON au.id = up.user_id
    WHERE up.username = v_identifier 
    OR au.email = v_identifier 
    OR up.email = v_identifier
  );
END;
$$;

-- Function to check if user is Google OAuth user
CREATE OR REPLACE FUNCTION public.is_google_user(p_identifier text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_identifier TEXT := LOWER(TRIM(p_identifier));
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_preferences up
    JOIN auth.users au ON au.id = up.user_id
    WHERE (up.username = v_identifier OR au.email = v_identifier OR up.email = v_identifier)
    AND (au.raw_app_meta_data->>'provider') = 'google'
  );
END;
$$;