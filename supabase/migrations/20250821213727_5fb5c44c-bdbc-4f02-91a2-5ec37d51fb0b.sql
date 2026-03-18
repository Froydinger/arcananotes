-- Check if the trigger exists and fix it if needed
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger that creates user_preferences when a user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_preferences();