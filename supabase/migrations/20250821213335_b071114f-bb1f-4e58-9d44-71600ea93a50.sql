-- Function to check if username is available for a specific user (by email)
CREATE OR REPLACE FUNCTION public.check_username_available_for_user(p_username text, p_user_email text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  existing_user_email text;
BEGIN
  -- Get the email of the user who currently has this username
  SELECT au.email INTO existing_user_email
  FROM public.user_preferences up
  JOIN auth.users au ON au.id = up.user_id
  WHERE up.username = LOWER(TRIM(p_username));
  
  -- Username is available if:
  -- 1. No one has it, OR
  -- 2. The person who has it is the same user (by email)
  RETURN (existing_user_email IS NULL) OR (existing_user_email = p_user_email);
END;
$function$;