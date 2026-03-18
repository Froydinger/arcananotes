-- First, let's manually link existing shared notes to user accounts
UPDATE public.shared_notes 
SET shared_with_user_id = auth_users.id,
    updated_at = now()
FROM auth.users AS auth_users
WHERE shared_notes.shared_with_email = auth_users.email 
AND shared_notes.shared_with_user_id IS NULL;

-- Recreate the trigger to ensure it's properly attached
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.link_shared_notes_on_signup();