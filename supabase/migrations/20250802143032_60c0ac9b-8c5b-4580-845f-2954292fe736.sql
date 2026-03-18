-- Remove email notification columns and functions, create in-app notifications table
ALTER TABLE public.user_preferences 
DROP COLUMN IF EXISTS email_notifications_enabled,
DROP COLUMN IF EXISTS email_digest_frequency;

-- Create notifications table for in-app notifications
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  type text NOT NULL CHECK (type IN ('note_shared', 'note_updated')),
  title text NOT NULL,
  message text NOT NULL,
  note_id uuid,
  from_user_email text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on notifications table
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Enable realtime for notifications
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- Add notifications table to realtime publication
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE notes, shared_notes, user_preferences, notifications;

-- Update triggers to create in-app notifications instead of emails
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
  
  -- Only proceed if recipient wants share notifications and user exists
  IF (recipient_prefs.notification_note_shared = true OR recipient_prefs.notification_note_shared IS NULL)
     AND NEW.shared_with_user_id IS NOT NULL THEN
    
    -- Create in-app notification
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

-- Update the note updated trigger for in-app notifications
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
    
    -- Only proceed if recipient wants update notifications
    IF (recipient_prefs.notification_note_updated = true OR recipient_prefs.notification_note_updated IS NULL) THEN
      
      -- Create in-app notification
      INSERT INTO public.notifications (
        user_id,
        type,
        title,
        message,
        note_id
      ) VALUES (
        share_record.shared_with_user_id,
        'note_updated',
        'Shared note updated',
        '"' || NEW.title || '" has been updated',
        NEW.id
      );
      
      RAISE LOG 'In-app notification created for user % about updated note: %', share_record.shared_with_user_id, NEW.title;
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$function$;

-- Add trigger for automatic timestamp updates on notifications
CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();