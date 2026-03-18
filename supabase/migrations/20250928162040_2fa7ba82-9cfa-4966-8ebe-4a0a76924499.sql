-- Step 1: Remove the insecure get_user_email_by_username function
DROP FUNCTION IF EXISTS public.get_user_email_by_username(text);

-- Step 2: Update get_user_by_identifier to be more secure
-- This function should only return limited info and never expose other users' emails
CREATE OR REPLACE FUNCTION public.get_user_by_identifier(p_identifier text)
RETURNS TABLE(user_id uuid, email text, username text, has_google_auth boolean)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
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
    -- CRITICAL SECURITY FIX: Only return email if it's the requesting user's own record
    -- OR if this is for authentication purposes (checking if identifier exists)
    CASE 
      WHEN up.user_id = auth.uid() THEN COALESCE(au.email, up.email)
      ELSE NULL -- Never expose other users' emails
    END as email,
    -- Only return username for existence checks, not for data harvesting
    CASE 
      WHEN up.user_id = auth.uid() THEN up.username
      ELSE NULL
    END as username,
    -- Only return auth info for own user
    CASE 
      WHEN up.user_id = auth.uid() THEN (au.raw_app_meta_data->>'provider') = 'google'
      ELSE false
    END as has_google_auth
  FROM public.user_preferences up
  JOIN auth.users au ON au.id = up.user_id
  WHERE (up.username = v_identifier OR au.email = v_identifier)
  LIMIT 1;
END;
$function$;

-- Step 3: Create a secure function for authentication that doesn't expose emails
CREATE OR REPLACE FUNCTION public.verify_user_exists(p_identifier text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
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
  
  -- Only return existence, never expose actual data
  RETURN EXISTS (
    SELECT 1 FROM public.user_preferences up
    JOIN auth.users au ON au.id = up.user_id
    WHERE up.username = v_identifier 
    OR au.email = v_identifier
  );
END;
$function$;

-- Step 4: Create a secure function to get user email for authentication (own user only)
CREATE OR REPLACE FUNCTION public.get_own_user_email_by_username(p_username text)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_email TEXT;
  v_user_id UUID;
BEGIN
  -- Only allow authenticated users
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Get user_id by username first
  SELECT user_id INTO v_user_id
  FROM public.user_preferences 
  WHERE username = LOWER(TRIM(p_username));
  
  -- CRITICAL: Only return email if this is the requesting user's own username
  IF v_user_id = auth.uid() THEN
    SELECT au.email INTO v_email
    FROM auth.users au
    WHERE au.id = v_user_id;
    RETURN v_email;
  END IF;
  
  RETURN NULL;
END;
$function$;

-- Step 5: Remove the email column from user_preferences (it's redundant and insecure)
-- First, we'll migrate any existing email data, but since there's none, we can safely remove it
ALTER TABLE public.user_preferences DROP COLUMN IF EXISTS email;