-- Add username field to user_preferences table
ALTER TABLE public.user_preferences 
ADD COLUMN username TEXT UNIQUE;

-- Add index for faster username lookups
CREATE INDEX idx_user_preferences_username ON public.user_preferences(username);

-- Create function to check if username exists
CREATE OR REPLACE FUNCTION public.check_username_exists(p_username TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_preferences 
    WHERE username = LOWER(TRIM(p_username))
  );
END;
$$;

-- Create function to get user_id by username
CREATE OR REPLACE FUNCTION public.get_user_id_by_username(p_username TEXT)
RETURNS UUID
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT user_id INTO v_user_id
  FROM public.user_preferences 
  WHERE username = LOWER(TRIM(p_username));
  
  RETURN v_user_id;
END;
$$;

-- Update the add_share_with_user_link function to handle usernames
CREATE OR REPLACE FUNCTION public.add_share_with_user_link(p_note_id uuid, p_owner_id uuid, p_shared_with_email_or_username text, p_permission text)
RETURNS TABLE(id uuid, note_id uuid, owner_id uuid, shared_with_email text, shared_with_user_id uuid, permission text, created_at timestamp with time zone, updated_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_shared_with_user_id UUID;
  v_shared_with_email TEXT;
  v_result RECORD;
  v_input TEXT := LOWER(TRIM(p_shared_with_email_or_username));
BEGIN
  -- Check if input looks like an email (contains @)
  IF v_input LIKE '%@%' THEN
    -- Handle as email
    SELECT auth_users.id, auth_users.email INTO v_shared_with_user_id, v_shared_with_email
    FROM auth.users AS auth_users
    WHERE auth_users.email = v_input;
  ELSE
    -- Handle as username
    SELECT up.user_id, au.email INTO v_shared_with_user_id, v_shared_with_email
    FROM public.user_preferences up
    JOIN auth.users au ON au.id = up.user_id
    WHERE up.username = v_input;
  END IF;
  
  -- If user not found, raise exception
  IF v_shared_with_user_id IS NULL THEN
    IF v_input LIKE '%@%' THEN
      RAISE EXCEPTION 'No user found with email: %', p_shared_with_email_or_username;
    ELSE
      RAISE EXCEPTION 'No user found with username: %', p_shared_with_email_or_username;
    END IF;
  END IF;
  
  -- Insert the share with the found user_id
  INSERT INTO public.shared_notes (
    note_id,
    owner_id, 
    shared_with_email,
    shared_with_user_id,
    permission
  ) VALUES (
    p_note_id,
    p_owner_id,
    v_shared_with_email,
    v_shared_with_user_id,
    p_permission
  )
  RETURNING * INTO v_result;
  
  -- Return the inserted record
  RETURN QUERY
  SELECT 
    v_result.id,
    v_result.note_id,
    v_result.owner_id,
    v_result.shared_with_email,
    v_result.shared_with_user_id,
    v_result.permission,
    v_result.created_at,
    v_result.updated_at;
END;
$$;