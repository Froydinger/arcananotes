-- Remove push subscription table as we're switching to email notifications
DROP TABLE IF EXISTS public.push_subscriptions;

-- Add email notification preferences to user_preferences if not already present
-- (keeping existing notification preferences as they work for email too)

-- Add email frequency preference
ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS email_notifications_enabled boolean DEFAULT true;

-- Add email digest preference (daily, weekly, never)
ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS email_digest_frequency text DEFAULT 'daily' CHECK (email_digest_frequency IN ('daily', 'weekly', 'never'));

-- Create function to send email notification when a note is shared
CREATE OR REPLACE FUNCTION public.notify_note_shared()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  note_title text;
  owner_email text;
  recipient_prefs record;
BEGIN
  -- Get note title and owner email
  SELECT n.title, au.email INTO note_title, owner_email
  FROM public.notes n
  JOIN auth.users au ON au.id = n.user_id
  WHERE n.id = NEW.note_id;
  
  -- Get recipient notification preferences
  SELECT up.* INTO recipient_prefs
  FROM public.user_preferences up
  WHERE up.user_id = NEW.shared_with_user_id;
  
  -- Only proceed if recipient has email notifications enabled and wants share notifications
  IF recipient_prefs.email_notifications_enabled = true 
     AND recipient_prefs.notification_note_shared = true 
     AND NEW.shared_with_user_id IS NOT NULL THEN
    
    -- Here we would trigger an email (this will be handled by an edge function)
    -- For now, we'll just log that a notification should be sent
    RAISE LOG 'Email notification should be sent to user % about shared note: %', NEW.shared_with_user_id, note_title;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for note sharing notifications
DROP TRIGGER IF EXISTS trigger_notify_note_shared ON public.shared_notes;
CREATE TRIGGER trigger_notify_note_shared
  AFTER INSERT ON public.shared_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_note_shared();

-- Create function to send email notification when a note is updated
CREATE OR REPLACE FUNCTION public.notify_note_updated()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  share_record record;
  recipient_prefs record;
BEGIN
  -- Only notify for actual content changes, not just timestamp updates
  IF OLD.content = NEW.content AND OLD.title = NEW.title THEN
    RETURN NEW;
  END IF;
  
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
    
    -- Only proceed if recipient has email notifications enabled and wants update notifications
    IF recipient_prefs.email_notifications_enabled = true 
       AND recipient_prefs.notification_note_updated = true THEN
      
      -- Log that a notification should be sent (edge function will handle actual sending)
      RAISE LOG 'Email notification should be sent to user % about updated note: %', share_record.shared_with_user_id, NEW.title;
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for note update notifications
DROP TRIGGER IF EXISTS trigger_notify_note_updated ON public.notes;
CREATE TRIGGER trigger_notify_note_updated
  AFTER UPDATE ON public.notes
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_note_updated();