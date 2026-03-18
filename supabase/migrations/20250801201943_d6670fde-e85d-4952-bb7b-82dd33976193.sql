-- Update existing shared_notes records to link with current users
UPDATE shared_notes 
SET shared_with_user_id = auth_users.id, 
    updated_at = now()
FROM auth.users AS auth_users
WHERE shared_notes.shared_with_email = auth_users.email 
AND shared_notes.shared_with_user_id IS NULL;

-- Create a better linking function
CREATE OR REPLACE FUNCTION public.link_shared_notes_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Update shared_notes records where email matches the new user
  UPDATE public.shared_notes 
  SET shared_with_user_id = NEW.id,
      updated_at = now()
  WHERE shared_with_email = NEW.email 
  AND shared_with_user_id IS NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Also create a function to manually link existing users
CREATE OR REPLACE FUNCTION public.link_existing_shared_notes()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE public.shared_notes 
  SET shared_with_user_id = auth_users.id,
      updated_at = now()
  FROM auth.users AS auth_users
  WHERE shared_notes.shared_with_email = auth_users.email 
  AND shared_notes.shared_with_user_id IS NULL;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Run the linking function for existing users
SELECT public.link_existing_shared_notes();