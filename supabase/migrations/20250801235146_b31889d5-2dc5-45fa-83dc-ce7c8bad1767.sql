-- Create function to add share with automatic user linking
CREATE OR REPLACE FUNCTION public.add_share_with_user_link(
  p_note_id UUID,
  p_owner_id UUID,
  p_shared_with_email TEXT,
  p_permission TEXT
)
RETURNS TABLE(
  id UUID,
  note_id UUID,
  owner_id UUID,
  shared_with_email TEXT,
  shared_with_user_id UUID,
  permission TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_shared_with_user_id UUID;
  v_result RECORD;
BEGIN
  -- Find user ID for the email
  SELECT auth_users.id INTO v_shared_with_user_id
  FROM auth.users AS auth_users
  WHERE auth_users.email = p_shared_with_email;
  
  -- Insert the share with the found user_id (or null if not found)
  INSERT INTO public.shared_notes (
    note_id,
    owner_id, 
    shared_with_email,
    shared_with_user_id,
    permission
  ) VALUES (
    p_note_id,
    p_owner_id,
    p_shared_with_email,
    v_shared_with_user_id,
    p_permission
  )
  RETURNING * INTO v_result;
  
  -- Return the inserted record
  RETURN QUERY
  SELECT 
    v_result.id,
    v_result.note_id,
    v_result.owner_id,
    v_result.shared_with_email,
    v_result.shared_with_user_id,
    v_result.permission,
    v_result.created_at,
    v_result.updated_at;
END;
$$;