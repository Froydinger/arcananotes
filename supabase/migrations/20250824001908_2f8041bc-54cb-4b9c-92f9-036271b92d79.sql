-- Update the note update trigger to only fire for significant changes and include user email
-- Drop and recreate the trigger function to avoid duplicate notifications and self-notifications

DROP TRIGGER IF EXISTS trigger_notify_note_updated ON public.notes;
DROP FUNCTION IF EXISTS public.notify_note_updated();

CREATE OR REPLACE FUNCTION public.notify_note_updated()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  share_record record;
  recipient_prefs record;
  owner_email text;
  content_change_significant boolean := false;
  title_change_significant boolean := false;
BEGIN
  -- Check if this is a significant content change (more than just whitespace/formatting)
  IF OLD.content IS DISTINCT FROM NEW.content THEN
    -- Consider it significant if there's a meaningful content change
    -- This simple check looks for substantial changes, not just formatting
    content_change_significant := LENGTH(TRIM(REGEXP_REPLACE(NEW.content, '<[^>]*>', '', 'g'))) != 
                                  LENGTH(TRIM(REGEXP_REPLACE(OLD.content, '<[^>]*>', '', 'g')));
  END IF;
  
  -- Check if title changed
  title_change_significant := OLD.title IS DISTINCT FROM NEW.title;
  
  -- Only proceed if there are significant changes
  IF NOT (content_change_significant OR title_change_significant) THEN
    RETURN NEW;
  END IF;
  
  -- Get the owner's email for the from_user_email field
  SELECT au.email INTO owner_email
  FROM auth.users au
  WHERE au.id = NEW.user_id;
  
  -- Loop through all users who have access to this note
  FOR share_record IN 
    SELECT shared_with_user_id, shared_with_email 
    FROM public.shared_notes 
    WHERE note_id = NEW.id AND shared_with_user_id IS NOT NULL
  LOOP
    -- Get recipient notification preferences
    SELECT up.* INTO recipient_prefs
    FROM public.user_preferences up
    WHERE up.user_id = share_record.shared_with_user_id;
    
    -- Only proceed if recipient wants update notifications
    -- AND the recipient is not the person making the change
    IF (recipient_prefs.notification_note_updated = true OR recipient_prefs.notification_note_updated IS NULL) 
       AND share_record.shared_with_user_id != NEW.user_id THEN
      
      -- Create in-app notification
      INSERT INTO public.notifications (
        user_id,
        type,
        title,
        message,
        note_id,
        from_user_email
      ) VALUES (
        share_record.shared_with_user_id,
        'note_updated',
        'Shared note updated',
        '"' || NEW.title || '" has been updated',
        NEW.id,
        owner_email
      );
      
      RAISE LOG 'In-app notification created for user % about updated note: %', share_record.shared_with_user_id, NEW.title;
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$function$;

-- Create trigger that only fires for updates, not inserts
CREATE TRIGGER trigger_notify_note_updated
  AFTER UPDATE ON public.notes
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_note_updated();