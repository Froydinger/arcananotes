-- Drop triggers first, then functions, then create new notification system
DROP TRIGGER IF EXISTS trigger_notify_note_shared ON public.shared_notes;
DROP TRIGGER IF EXISTS trigger_notify_note_updated ON public.notes;

DROP FUNCTION IF EXISTS public.notify_note_shared();
DROP FUNCTION IF EXISTS public.notify_note_updated();

-- Create notifications table for in-app notifications
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  note_id UUID,
  from_user_email TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_notifications_updated_at
BEFORE UPDATE ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION public.update_notifications_updated_at();

-- Enable realtime for notifications
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Recreate notification functions for in-app notifications
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

-- Recreate triggers
CREATE TRIGGER trigger_notify_note_shared
  AFTER INSERT ON public.shared_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_note_shared();

CREATE TRIGGER trigger_notify_note_updated
  AFTER UPDATE ON public.notes
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_note_updated();