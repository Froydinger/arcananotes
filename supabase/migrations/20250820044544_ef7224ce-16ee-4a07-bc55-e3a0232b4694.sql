-- Add function to get user email by username
CREATE OR REPLACE FUNCTION public.get_user_email_by_username(p_username text)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $function$
DECLARE
  v_email TEXT;
BEGIN
  SELECT au.email INTO v_email
  FROM public.user_preferences up
  JOIN auth.users au ON au.id = up.user_id
  WHERE up.username = LOWER(TRIM(p_username));
  
  RETURN v_email;
END;
$function$;

-- Add function to update shared notes when username changes
CREATE OR REPLACE FUNCTION public.update_shared_notes_username()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Update shared_notes records to reflect the new username
  UPDATE public.shared_notes 
  SET shared_with_username = NEW.username,
      updated_at = now()
  WHERE shared_with_user_id = NEW.user_id;
  
  RETURN NEW;
END;
$function$;

-- Create trigger to update shared notes when username changes
CREATE TRIGGER update_shared_notes_on_username_change
  AFTER UPDATE OF username ON public.user_preferences
  FOR EACH ROW
  WHEN (OLD.username IS DISTINCT FROM NEW.username)
  EXECUTE FUNCTION public.update_shared_notes_username();