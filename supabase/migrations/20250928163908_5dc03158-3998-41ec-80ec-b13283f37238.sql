-- Simplify sharing to email-only system
-- Remove username complexity and make it work reliably

-- Update shared_notes table to remove username fields
ALTER TABLE public.shared_notes DROP COLUMN IF EXISTS shared_with_username;

-- Drop the complex secure functions that aren't working
DROP FUNCTION IF EXISTS public.get_shared_note_display_info(uuid);
DROP FUNCTION IF EXISTS public.create_secure_share(uuid, text, text);
DROP FUNCTION IF EXISTS public.verify_user_exists(text);
DROP FUNCTION IF EXISTS public.get_own_user_email_by_username(text);
DROP FUNCTION IF EXISTS public.get_user_id_by_username(text);
DROP FUNCTION IF EXISTS public.check_username_exists(text);
DROP FUNCTION IF EXISTS public.check_identifier_exists(text);
DROP FUNCTION IF EXISTS public.get_user_by_identifier(text);
DROP FUNCTION IF EXISTS public.is_google_user(text);

-- Create a simple, reliable share function for emails only
CREATE OR REPLACE FUNCTION public.create_email_share(p_note_id uuid, p_email text, p_permission text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_share_id UUID;
  v_shared_with_user_id UUID;
  v_email TEXT := LOWER(TRIM(p_email));
BEGIN
  -- Verify the user owns the note
  IF NOT EXISTS (
    SELECT 1 FROM notes 
    WHERE id = p_note_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'You do not own this note';
  END IF;

  -- Prevent sharing with self
  IF v_email = (SELECT email FROM auth.users WHERE id = auth.uid()) THEN
    RAISE EXCEPTION 'Cannot share with yourself';
  END IF;

  -- Check if already shared with this email
  IF EXISTS (
    SELECT 1 FROM shared_notes 
    WHERE note_id = p_note_id AND shared_with_email = v_email
  ) THEN
    RAISE EXCEPTION 'Already shared with this email';
  END IF;

  -- Check if user exists with this email
  SELECT id INTO v_shared_with_user_id 
  FROM auth.users 
  WHERE email = v_email
  LIMIT 1;

  -- Create the share record
  INSERT INTO shared_notes (
    note_id,
    owner_id,
    shared_with_email,
    shared_with_user_id,
    permission
  ) VALUES (
    p_note_id,
    auth.uid(),
    v_email,
    v_shared_with_user_id,
    p_permission
  ) RETURNING id INTO v_share_id;

  RETURN v_share_id;
END;
$function$;