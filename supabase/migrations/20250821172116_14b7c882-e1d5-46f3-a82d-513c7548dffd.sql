-- Fix the migration by only adding what doesn't exist
-- Add optional email field to user_preferences if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'user_preferences' 
                 AND column_name = 'email' 
                 AND table_schema = 'public') THEN
    ALTER TABLE public.user_preferences ADD COLUMN email TEXT;
  END IF;
END $$;

-- Add unique constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                 WHERE constraint_name = 'unique_username' 
                 AND table_name = 'user_preferences' 
                 AND table_schema = 'public') THEN
    ALTER TABLE public.user_preferences ADD CONSTRAINT unique_username UNIQUE (username);
  END IF;
END $$;

-- Add username format validation if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints 
                 WHERE constraint_name = 'username_format' 
                 AND constraint_schema = 'public') THEN
    ALTER TABLE public.user_preferences 
    ADD CONSTRAINT username_format CHECK (
      username IS NULL OR 
      (username ~ '^[a-zA-Z0-9_-]{3,30}$' AND username = LOWER(username))
    );
  END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_user_preferences_email ON public.user_preferences(email) WHERE email IS NOT NULL;

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