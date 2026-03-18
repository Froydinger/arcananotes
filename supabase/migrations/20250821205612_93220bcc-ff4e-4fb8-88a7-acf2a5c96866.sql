-- Function to handle user deletion cleanup
CREATE OR REPLACE FUNCTION public.handle_user_deletion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  -- Delete user preferences (including username) to free up the username
  DELETE FROM public.user_preferences WHERE user_id = OLD.id;
  
  -- Delete user's notes
  DELETE FROM public.notes WHERE user_id = OLD.id;
  
  -- Delete shared_notes where user was the owner
  DELETE FROM public.shared_notes WHERE owner_id = OLD.id;
  
  -- Delete shared_notes where user was the recipient
  DELETE FROM public.shared_notes WHERE shared_with_user_id = OLD.id;
  
  -- Delete user's notifications
  DELETE FROM public.notifications WHERE user_id = OLD.id;
  
  RETURN OLD;
END;
$function$;

-- Create trigger to automatically clean up user data on account deletion
DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
CREATE TRIGGER on_auth_user_deleted
  AFTER DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_deletion();