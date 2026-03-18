-- Update user_preferences table to support username-first auth while maintaining backward compatibility
-- Add unique constraint to username but allow nulls for existing users
ALTER TABLE public.user_preferences 
ADD CONSTRAINT unique_username UNIQUE (username);

-- Add optional email field to user_preferences for users who want to provide it
ALTER TABLE public.user_preferences 
ADD COLUMN email TEXT;

-- Add username format validation (alphanumeric, underscore, hyphen, 3-30 chars)
ALTER TABLE public.user_preferences 
ADD CONSTRAINT username_format CHECK (
  username IS NULL OR 
  (username ~ '^[a-zA-Z0-9_-]{3,30}$' AND username = LOWER(username))
);

-- Create index for performance
CREATE INDEX idx_user_preferences_username ON public.user_preferences(username) WHERE username IS NOT NULL;
CREATE INDEX idx_user_preferences_email ON public.user_preferences(email) WHERE email IS NOT NULL;

-- Update function to get user by username or email (backward compatible)
CREATE OR REPLACE FUNCTION public.get_user_by_identifier(p_identifier text)
RETURNS TABLE(user_id uuid, email text, username text, has_google_auth boolean)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
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

-- Generate usernames for existing users who don't have one
CREATE OR REPLACE FUNCTION public.generate_username_for_user(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_email text;
  v_base_username text;
  v_username text;
  v_counter integer := 1;
BEGIN
  -- Get user email
  SELECT email INTO v_email FROM auth.users WHERE id = p_user_id;
  
  -- Extract base username from email (part before @)
  v_base_username := LOWER(REGEXP_REPLACE(SPLIT_PART(v_email, '@', 1), '[^a-zA-Z0-9]', '', 'g'));
  
  -- Ensure minimum length
  IF LENGTH(v_base_username) < 3 THEN
    v_base_username := 'user' || v_base_username;
  END IF;
  
  -- Ensure maximum length
  IF LENGTH(v_base_username) > 25 THEN
    v_base_username := SUBSTRING(v_base_username, 1, 25);
  END IF;
  
  v_username := v_base_username;
  
  -- Check for conflicts and add number if needed
  WHILE EXISTS (SELECT 1 FROM public.user_preferences WHERE username = v_username) LOOP
    v_username := v_base_username || v_counter;
    v_counter := v_counter + 1;
    
    -- Ensure we don't exceed 30 chars
    IF LENGTH(v_username) > 30 THEN
      v_base_username := SUBSTRING(v_base_username, 1, 30 - LENGTH(v_counter::text));
      v_username := v_base_username || v_counter;
    END IF;
  END LOOP;
  
  RETURN v_username;
END;
$$;