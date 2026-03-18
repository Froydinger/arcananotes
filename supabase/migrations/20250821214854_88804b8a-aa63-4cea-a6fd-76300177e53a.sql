-- Clean up duplicate triggers and ensure only one trigger creates user_preferences
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_preferences ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_link_shares ON auth.users;

-- Create the main trigger that handles new user setup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_preferences();

-- Create the trigger for linking shared notes  
CREATE TRIGGER on_auth_user_created_link_shares
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.link_shared_notes_on_signup();