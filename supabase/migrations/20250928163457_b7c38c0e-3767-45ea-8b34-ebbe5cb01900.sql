-- Debug and fix the get_shared_note_display_info function
-- Add better logging and fallback logic

CREATE OR REPLACE FUNCTION public.get_shared_note_display_info(share_id uuid)
RETURNS TABLE(id uuid, note_id uuid, display_name text, permission text, is_registered_user boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Verify the user has permission to see this share
  IF NOT EXISTS (
    SELECT 1 FROM shared_notes sn
    LEFT JOIN notes n ON sn.note_id = n.id
    WHERE sn.id = share_id 
    AND (
      sn.shared_with_user_id = auth.uid() OR -- User is recipient
      (sn.owner_id = auth.uid() AND n.user_id = auth.uid()) -- User owns the note
    )
  ) THEN
    RETURN; -- No access, return empty result
  END IF;

  -- Return display information 
  RETURN QUERY
  SELECT 
    sn.id,
    sn.note_id,
    CASE 
      -- First priority: Show username if available
      WHEN sn.shared_with_username IS NOT NULL AND sn.shared_with_username != ''
        THEN sn.shared_with_username
      -- Second priority: Show email if available
      WHEN sn.shared_with_email IS NOT NULL AND sn.shared_with_email != ''
        THEN 
          CASE 
            WHEN sn.owner_id = auth.uid() THEN sn.shared_with_email -- Owner can see full email
            ELSE CONCAT(LEFT(SPLIT_PART(sn.shared_with_email, '@', 1), 2), '***@', SPLIT_PART(sn.shared_with_email, '@', 2)) -- Recipient sees masked email
          END
      -- Third priority: Show "Registered User" if user exists but no username/email
      WHEN sn.shared_with_user_id IS NOT NULL 
        THEN 'Registered User'
      -- Last resort
      ELSE 'Unknown User'
    END as display_name,
    sn.permission,
    (sn.shared_with_user_id IS NOT NULL) as is_registered_user
  FROM shared_notes sn
  WHERE sn.id = share_id;
END;
$function$;