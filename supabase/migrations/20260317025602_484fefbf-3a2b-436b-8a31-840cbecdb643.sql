
-- Fix search_path for functions that were missing it
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.user_has_note_access(uuid, uuid) SET search_path = public;
ALTER FUNCTION public.user_has_note_write_access(uuid, uuid) SET search_path = public;
ALTER FUNCTION public.link_shared_notes_on_signup() SET search_path = public;
ALTER FUNCTION public.notify_note_shared() SET search_path = '';
ALTER FUNCTION public.notify_note_updated() SET search_path = '';
ALTER FUNCTION public.get_user_by_identifier(text) SET search_path = public;
ALTER FUNCTION public.check_identifier_exists(text) SET search_path = public;

-- Add missing create_email_share function
CREATE OR REPLACE FUNCTION public.create_email_share(p_note_id uuid, p_email text, p_permission text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id uuid;
  v_shared_user_id uuid;
BEGIN
  -- Verify the caller owns the note
  SELECT user_id INTO v_owner_id FROM public.notes WHERE id = p_note_id;
  IF v_owner_id IS NULL OR v_owner_id != auth.uid() THEN
    RAISE EXCEPTION 'Not authorized to share this note';
  END IF;

  -- Try to find the user by email
  SELECT id INTO v_shared_user_id FROM auth.users WHERE email = LOWER(TRIM(p_email));

  INSERT INTO public.shared_notes (note_id, owner_id, shared_with_email, shared_with_user_id, permission)
  VALUES (p_note_id, auth.uid(), LOWER(TRIM(p_email)), v_shared_user_id, p_permission)
  ON CONFLICT (note_id, shared_with_email) DO UPDATE SET permission = p_permission, updated_at = now();

  RETURN true;
END;
$$;

-- Add missing check_username_available_for_user function
CREATE OR REPLACE FUNCTION public.check_username_available_for_user(p_username text, p_user_email text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_username TEXT := LOWER(TRIM(p_username));
  v_existing_user_id uuid;
BEGIN
  SELECT up.user_id INTO v_existing_user_id
  FROM public.user_preferences up
  WHERE up.username = v_username;

  IF v_existing_user_id IS NULL THEN
    RETURN true; -- Username is available
  END IF;

  -- Check if it belongs to the same user (email match)
  RETURN EXISTS (
    SELECT 1 FROM auth.users WHERE id = v_existing_user_id AND email = LOWER(TRIM(p_user_email))
  );
END;
$$;
