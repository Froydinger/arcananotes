-- Update the database triggers to call the edge function for actual email sending
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
  supabase_url text;
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
    
    -- Call the edge function to send email
    supabase_url := 'https://viidccjyjeipulbqqwua.supabase.co';
    
    PERFORM net.http_post(
      url := supabase_url || '/functions/v1/send-email-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object(
        'type', 'note_shared',
        'recipientUserId', NEW.shared_with_user_id,
        'noteId', NEW.note_id,
        'noteTitle', note_title,
        'ownerEmail', owner_email
      )
    );
    
    RAISE LOG 'Email notification triggered for user % about shared note: %', NEW.shared_with_user_id, note_title;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Update the note updated trigger
CREATE OR REPLACE FUNCTION public.notify_note_updated()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  share_record record;
  recipient_prefs record;
  supabase_url text;
BEGIN
  -- Only notify for actual content changes, not just timestamp updates
  IF OLD.content = NEW.content AND OLD.title = NEW.title THEN
    RETURN NEW;
  END IF;
  
  supabase_url := 'https://viidccjyjeipulbqqwua.supabase.co';
  
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
      
      -- Call the edge function to send email
      PERFORM net.http_post(
        url := supabase_url || '/functions/v1/send-email-notification',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
        ),
        body := jsonb_build_object(
          'type', 'note_updated',
          'recipientUserId', share_record.shared_with_user_id,
          'noteId', NEW.id,
          'noteTitle', NEW.title
        )
      );
      
      RAISE LOG 'Email notification triggered for user % about updated note: %', share_record.shared_with_user_id, NEW.title;
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$function$;