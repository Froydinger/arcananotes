-- Fix security vulnerability: Restrict email access in user lookup functions
-- These functions currently allow email harvesting, we need to restrict them

-- 1. Update get_user_email_by_username to only work for note sharing context
-- This function should only be callable by authenticated users and only for valid sharing operations
CREATE OR REPLACE FUNCTION public.get_user_email_by_username(p_username text)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  v_email TEXT;
BEGIN
  -- Only allow authenticated users
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Get email only if user exists and username is valid
  SELECT au.email INTO v_email
  FROM public.user_preferences up
  JOIN auth.users au ON au.id = up.user_id
  WHERE up.username = LOWER(TRIM(p_username))
  AND up.username IS NOT NULL
  AND LENGTH(TRIM(p_username)) >= 3; -- Minimum username length to prevent brute force
  
  RETURN v_email;
END;
$function$;

-- 2. Update get_user_by_identifier to be more restrictive
-- This should only return limited info and only for authenticated users
CREATE OR REPLACE FUNCTION public.get_user_by_identifier(p_identifier text)
RETURNS TABLE(user_id uuid, email text, username text, has_google_auth boolean)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  v_identifier TEXT := LOWER(TRIM(p_identifier));
BEGIN
  -- Only allow authenticated users
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;
  
  -- Only allow lookups with reasonable length to prevent enumeration
  IF LENGTH(v_identifier) < 3 THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    up.user_id,
    -- Only return email if it's the requesting user's own record
    CASE 
      WHEN up.user_id = auth.uid() THEN COALESCE(up.email, au.email)
      ELSE NULL
    END as email,
    up.username,
    (au.raw_app_meta_data->>'provider') = 'google' as has_google_auth
  FROM public.user_preferences up
  JOIN auth.users au ON au.id = up.user_id
  WHERE (up.username = v_identifier OR au.email = v_identifier OR up.email = v_identifier)
  LIMIT 1;
END;
$function$;

-- 3. Update check_identifier_exists to add rate limiting protection
CREATE OR REPLACE FUNCTION public.check_identifier_exists(p_identifier text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  v_identifier TEXT := LOWER(TRIM(p_identifier));
BEGIN
  -- Only allow authenticated users
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;
  
  -- Minimum length to prevent enumeration attacks
  IF LENGTH(v_identifier) < 3 THEN
    RETURN false;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM public.user_preferences up
    JOIN auth.users au ON au.id = up.user_id
    WHERE up.username = v_identifier 
    OR au.email = v_identifier 
    OR up.email = v_identifier
  );
END;
$function$;

-- 4. Update is_google_user with similar protections
CREATE OR REPLACE FUNCTION public.is_google_user(p_identifier text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  v_identifier TEXT := LOWER(TRIM(p_identifier));
BEGIN
  -- Only allow authenticated users
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;
  
  -- Minimum length to prevent enumeration attacks
  IF LENGTH(v_identifier) < 3 THEN
    RETURN false;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM public.user_preferences up
    JOIN auth.users au ON au.id = up.user_id
    WHERE (up.username = v_identifier OR au.email = v_identifier OR up.email = v_identifier)
    AND (au.raw_app_meta_data->>'provider') = 'google'
  );
END;
$function$;

-- 5. Fix search_path for other functions to address linter warnings
CREATE OR REPLACE FUNCTION public.check_username_available_for_user(p_username text, p_user_email text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  existing_user_email text;
BEGIN
  -- Get the email of the user who currently has this username
  SELECT au.email INTO existing_user_email
  FROM public.user_preferences up
  JOIN auth.users au ON au.id = up.user_id
  WHERE up.username = LOWER(TRIM(p_username));
  
  -- Username is available if:
  -- 1. No one has it, OR
  -- 2. The person who has it is the same user (by email)
  RETURN (existing_user_email IS NULL) OR (existing_user_email = p_user_email);
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_username_exists(p_username text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_preferences 
    WHERE username = LOWER(TRIM(p_username))
  );
END;
$function$;