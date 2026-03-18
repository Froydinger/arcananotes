-- Add shared_with_username column to track usernames for privacy
ALTER TABLE shared_notes ADD COLUMN shared_with_username text;

-- Create or replace the function to add shares with proper username tracking
CREATE OR REPLACE FUNCTION add_share_with_user_link(
  p_note_id uuid,
  p_owner_id uuid,
  p_shared_with_email_or_username text,
  p_permission text
) RETURNS uuid AS $$
DECLARE
  v_shared_with_email text;
  v_shared_with_user_id uuid;
  v_shared_with_username text;
  v_share_id uuid;
BEGIN
  -- Check if input is email or username
  IF p_shared_with_email_or_username LIKE '%@%' THEN
    -- It's an email
    v_shared_with_email := p_shared_with_email_or_username;
    v_shared_with_username := NULL;
    
    -- Try to find user by email to get user_id
    SELECT auth.uid() INTO v_shared_with_user_id 
    FROM auth.users 
    WHERE email = v_shared_with_email
    LIMIT 1;
    
  ELSE
    -- It's a username
    v_shared_with_username := p_shared_with_email_or_username;
    
    -- Get user_id and email from user_preferences
    SELECT up.user_id INTO v_shared_with_user_id
    FROM user_preferences up
    WHERE up.username = v_shared_with_username;
    
    -- Get the email using the function we created earlier
    SELECT get_user_email_by_username(v_shared_with_username) INTO v_shared_with_email;
    
    -- If we couldn't find a user with this username, use the username as email for invitation
    IF v_shared_with_user_id IS NULL THEN
      v_shared_with_email := v_shared_with_username || '@username.invite';
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

  -- Create notification if user exists
  IF v_shared_with_user_id IS NOT NULL THEN
    INSERT INTO notifications (
      user_id,
      note_id,
      type,
      title,
      message,
      from_user_email
    ) VALUES (
      v_shared_with_user_id,
      p_note_id,
      'note_shared',
      'Note shared with you',
      'A note has been shared with you',
      (SELECT email FROM auth.users WHERE id = p_owner_id)
    );
  END IF;

  RETURN v_share_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;