-- Create function to remove shared note access for a user
CREATE OR REPLACE FUNCTION public.remove_shared_note_access(note_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Remove the user's access to a shared note
  DELETE FROM public.shared_notes 
  WHERE note_id = note_id_param 
  AND shared_with_user_id = auth.uid();
  
  RETURN FOUND;
END;
$function$