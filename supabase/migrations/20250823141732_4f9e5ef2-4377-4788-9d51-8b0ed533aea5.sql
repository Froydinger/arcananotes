-- Fix remaining function search_path security warnings

CREATE OR REPLACE FUNCTION public.get_user_id_by_username(p_username text)
RETURNS uuid
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT user_id INTO v_user_id
  FROM public.user_preferences 
  WHERE username = LOWER(TRIM(p_username));
  
  RETURN v_user_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.user_has_note_access(p_note_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.shared_notes 
    WHERE note_id = p_note_id 
    AND shared_with_user_id = p_user_id
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.user_has_note_write_access(p_note_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.shared_notes 
    WHERE note_id = p_note_id 
    AND shared_with_user_id = p_user_id 
    AND permission = 'write'
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.add_share_with_user_link(p_note_id uuid, p_owner_id uuid, p_shared_with_email_or_username text, p_permission text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  v_shared_with_email text;
  v_shared_with_user_id uuid;
  v_shared_with_username text;
  v_share_id uuid;
  v_input text := LOWER(TRIM(p_shared_with_email_or_username));
BEGIN
  -- Check if input is email or username
  IF v_input LIKE '%@%' THEN
    -- It's an email
    v_shared_with_email := v_input;
    v_shared_with_username := NULL;
    
    -- Try to find user by email to get user_id
    SELECT au.id INTO v_shared_with_user_id 
    FROM auth.users au
    WHERE au.email = v_shared_with_email
    LIMIT 1;
    
  ELSE
    -- It's a username
    v_shared_with_username := v_input;
    
    -- Get user_id and email from user_preferences
    SELECT up.user_id, au.email INTO v_shared_with_user_id, v_shared_with_email
    FROM user_preferences up
    JOIN auth.users au ON au.id = up.user_id
    WHERE up.username = v_input;
    
    -- If we couldn't find a user with this username, create a placeholder email
    IF v_shared_with_user_id IS NULL THEN
      v_shared_with_email := v_input || '@username.invite';
    END IF;
  END IF;

  -- Insert the share record
  INSERT INTO shared_notes (
    note_id,
    owner_id,
    shared_with_email,
    shared_with_user_id,
    shared_with_username,
    permission
  ) VALUES (
    p_note_id,
    p_owner_id,
    v_shared_with_email,
    v_shared_with_user_id,
    v_shared_with_username,
    p_permission
  ) RETURNING id INTO v_share_id;

  RETURN v_share_id;
END;
$function$;