-- Fix critical notification system RLS vulnerability
-- Drop the vulnerable policy that allows any authenticated user to insert notifications
DROP POLICY IF EXISTS "System can insert notifications for users" ON public.notifications;

-- Create a secure policy that only allows users to create notifications for themselves
CREATE POLICY "Users can create their own notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Update the notify_note_shared trigger function to use SECURITY DEFINER
-- This allows the system to insert notifications on behalf of users
CREATE OR REPLACE FUNCTION public.notify_note_shared()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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
  
  -- Only proceed if recipient wants share notifications and user exists
  IF (recipient_prefs.notification_note_shared = true OR recipient_prefs.notification_note_shared IS NULL)
     AND NEW.shared_with_user_id IS NOT NULL THEN
    
    -- Create in-app notification (SECURITY DEFINER allows bypassing RLS)
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      message,
      note_id,
      from_user_email
    ) VALUES (
      NEW.shared_with_user_id,
      'note_shared',
      'New note shared with you',
      owner_email || ' shared "' || note_title || '" with you',
      NEW.note_id,
      owner_email
    );
    
    RAISE LOG 'In-app notification created for user % about shared note: %', NEW.shared_with_user_id, note_title;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Update the notify_note_updated trigger function to use SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.notify_note_updated()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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
      
      -- Create in-app notification (SECURITY DEFINER allows bypassing RLS)
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