-- Fix create_secure_share function to use secure functions instead of direct auth.users access
CREATE OR REPLACE FUNCTION public.create_secure_share(p_note_id uuid, p_email_or_username text, p_permission text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_share_id UUID;
  v_user_id UUID;
  v_username TEXT;
  v_email TEXT;
  v_identifier TEXT := LOWER(TRIM(p_email_or_username));
BEGIN
  -- Verify the user owns the note
  IF NOT EXISTS (
    SELECT 1 FROM notes 
    WHERE id = p_note_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'You do not own this note';
  END IF;

  -- Check if identifier exists using secure function
  IF NOT verify_user_exists(v_identifier) THEN
    -- User doesn't exist, treat as email invitation
    v_email := p_email_or_username;
    v_user_id := NULL;
    v_username := NULL;
  ELSE
    -- User exists, determine if it's email or username
    IF v_identifier LIKE '%@%' THEN
      -- It's an email - get user info through secure function
      SELECT user_id INTO v_user_id FROM (
        SELECT up.user_id
        FROM user_preferences up
        WHERE get_own_user_email_by_username(up.username) = v_identifier
        LIMIT 1
      ) t;
      
      -- If we found a user, get their username
      IF v_user_id IS NOT NULL THEN
        SELECT username INTO v_username
        FROM user_preferences
        WHERE user_id = v_user_id;
      END IF;
      
      v_email := v_identifier;
    ELSE
      -- It's a username - get user_id using secure function
      v_user_id := get_user_id_by_username(v_identifier);
      v_username := v_identifier;
      v_email := NULL; -- Don't store email for username shares
    END IF;
  END IF;

  -- Create the share record
  INSERT INTO shared_notes (
    note_id,
    owner_id,
    shared_with_email,
    shared_with_user_id,
    shared_with_username,
    permission
  ) VALUES (
    p_note_id,
    auth.uid(),
    v_email,
    v_user_id,
    v_username,
    p_permission
  ) RETURNING id INTO v_share_id;

  -- Log the share creation using audit function
  INSERT INTO shared_notes_audit (
    user_id,
    shared_note_id,
    action,
    accessed_email
  ) VALUES (
    auth.uid(),
    v_share_id,
    'create_share',
    v_email
  );

  RETURN v_share_id;
END;
$function$;