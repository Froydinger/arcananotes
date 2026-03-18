
-- Core: update_updated_at function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==================== NOTES TABLE ====================
CREATE TABLE public.notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled Note',
  content TEXT DEFAULT '',
  featured_image TEXT,
  pinned BOOLEAN NOT NULL DEFAULT false,
  note_type TEXT NOT NULL DEFAULT 'note',
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notes" ON public.notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own notes" ON public.notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own notes" ON public.notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own notes" ON public.notes FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON public.notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_notes_deleted_at ON public.notes(deleted_at);
CREATE INDEX idx_notes_pinned ON public.notes(pinned) WHERE pinned = true;

-- ==================== USER PREFERENCES TABLE ====================
CREATE TABLE public.user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  theme TEXT NOT NULL DEFAULT 'navy',
  title_font TEXT DEFAULT 'sans',
  body_font TEXT DEFAULT 'sans',
  ai_enabled BOOLEAN DEFAULT true,
  username TEXT UNIQUE,
  email TEXT,
  username_prompt_last_shown TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  notification_daily_prompt BOOLEAN DEFAULT true,
  notification_note_shared BOOLEAN DEFAULT true,
  notification_note_updated BOOLEAN DEFAULT true,
  daily_prompt_time TIME DEFAULT '09:00:00',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own preferences" ON public.user_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own preferences" ON public.user_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own preferences" ON public.user_preferences FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON public.user_preferences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Username format constraint
ALTER TABLE public.user_preferences ADD CONSTRAINT username_format CHECK (
  username IS NULL OR (username ~ '^[a-zA-Z0-9_-]{3,30}$' AND username = LOWER(username))
);

CREATE INDEX IF NOT EXISTS idx_user_preferences_email ON public.user_preferences(email) WHERE email IS NOT NULL;

-- Auto-create preferences on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_preferences()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.user_preferences (user_id, theme, ai_enabled)
  VALUES (NEW.id, 'navy', true);
  RETURN NEW;
EXCEPTION
  WHEN others THEN RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_preferences
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_preferences();

-- ==================== SHARED NOTES TABLE ====================
CREATE TABLE public.shared_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL,
  shared_with_email TEXT NOT NULL,
  shared_with_user_id UUID,
  shared_with_username TEXT,
  permission TEXT NOT NULL CHECK (permission IN ('read', 'write')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(note_id, shared_with_email)
);

ALTER TABLE public.shared_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view shares they own or are shared with" ON public.shared_notes FOR SELECT
  USING (auth.uid() = owner_id OR auth.uid() = shared_with_user_id);
CREATE POLICY "Users can create shares for their own notes" ON public.shared_notes FOR INSERT
  WITH CHECK (auth.uid() = owner_id AND EXISTS (SELECT 1 FROM public.notes WHERE id = note_id AND user_id = auth.uid()));
CREATE POLICY "Users can update shares they own" ON public.shared_notes FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete shares they own" ON public.shared_notes FOR DELETE USING (auth.uid() = owner_id);

CREATE TRIGGER update_shared_notes_updated_at BEFORE UPDATE ON public.shared_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Security definer functions for sharing access checks (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.user_has_note_access(p_note_id uuid, p_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.shared_notes WHERE note_id = p_note_id AND shared_with_user_id = p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.user_has_note_write_access(p_note_id uuid, p_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.shared_notes WHERE note_id = p_note_id AND shared_with_user_id = p_user_id AND permission = 'write');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Additional shared notes policy for notes table
CREATE POLICY "Users can view shared notes" ON public.notes FOR SELECT
  USING ((deleted_at IS NULL) AND ((auth.uid() = user_id) OR public.user_has_note_access(id, auth.uid())));
CREATE POLICY "Users can update shared notes with write permission" ON public.notes FOR UPDATE
  USING ((deleted_at IS NULL) AND ((auth.uid() = user_id) OR public.user_has_note_write_access(id, auth.uid())));

-- Link shared notes on signup
CREATE OR REPLACE FUNCTION public.link_shared_notes_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.shared_notes SET shared_with_user_id = NEW.id, updated_at = now()
  WHERE shared_with_email = NEW.email AND shared_with_user_id IS NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created_link_shares
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.link_shared_notes_on_signup();

-- ==================== CHECKLIST ITEMS TABLE ====================
CREATE TABLE public.checklist_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  content TEXT NOT NULL DEFAULT '',
  completed BOOLEAN NOT NULL DEFAULT false,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view checklist items for their notes" ON public.checklist_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.notes WHERE notes.id = checklist_items.note_id AND (notes.user_id = auth.uid() OR public.user_has_note_access(notes.id, auth.uid()))));
CREATE POLICY "Users can create checklist items for their notes" ON public.checklist_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.notes WHERE notes.id = checklist_items.note_id AND (notes.user_id = auth.uid() OR public.user_has_note_write_access(notes.id, auth.uid()))));
CREATE POLICY "Users can update checklist items for their notes" ON public.checklist_items FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.notes WHERE notes.id = checklist_items.note_id AND (notes.user_id = auth.uid() OR public.user_has_note_write_access(notes.id, auth.uid()))));
CREATE POLICY "Users can delete checklist items for their notes" ON public.checklist_items FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.notes WHERE notes.id = checklist_items.note_id AND (notes.user_id = auth.uid() OR public.user_has_note_write_access(notes.id, auth.uid()))));

CREATE TRIGGER update_checklist_items_updated_at BEFORE UPDATE ON public.checklist_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
ALTER TABLE public.checklist_items REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.checklist_items;

-- ==================== NOTIFICATIONS TABLE ====================
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

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON public.notifications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ==================== PUSH SUBSCRIPTIONS TABLE ====================
CREATE TABLE public.push_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  device_name TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own push subscriptions" ON public.push_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own push subscriptions" ON public.push_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own push subscriptions" ON public.push_subscriptions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own push subscriptions" ON public.push_subscriptions FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_push_subscriptions_updated_at BEFORE UPDATE ON public.push_subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==================== NOTE AI HISTORY TABLE ====================
CREATE TABLE public.note_ai_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id UUID NOT NULL,
  user_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  instruction TEXT,
  original_content TEXT NOT NULL,
  original_title TEXT,
  new_content TEXT NOT NULL,
  new_title TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.note_ai_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own note AI history" ON public.note_ai_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own note AI history" ON public.note_ai_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own note AI history" ON public.note_ai_history FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_note_ai_history_note_id ON public.note_ai_history(note_id);
CREATE INDEX idx_note_ai_history_user_id ON public.note_ai_history(user_id);

-- ==================== ARC CONVERSATIONS TABLE ====================
CREATE TABLE public.arc_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note_id UUID REFERENCES public.notes(id) ON DELETE SET NULL,
  title TEXT NOT NULL DEFAULT 'New chat',
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.arc_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own conversations" ON public.arc_conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own conversations" ON public.arc_conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own conversations" ON public.arc_conversations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own conversations" ON public.arc_conversations FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_arc_conversations_user_id ON public.arc_conversations(user_id);
CREATE INDEX idx_arc_conversations_note_id ON public.arc_conversations(note_id);

-- ==================== UTILITY FUNCTIONS ====================
CREATE OR REPLACE FUNCTION public.soft_delete_note(note_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.notes SET deleted_at = NOW(), updated_at = NOW()
  WHERE id = note_id_param AND user_id = auth.uid() AND deleted_at IS NULL;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION public.restore_note(note_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.notes SET deleted_at = NULL, updated_at = NOW()
  WHERE id = note_id_param AND user_id = auth.uid() AND deleted_at IS NOT NULL;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION public.permanently_delete_note(note_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  DELETE FROM public.shared_notes WHERE note_id = note_id_param AND owner_id = auth.uid();
  DELETE FROM public.notes WHERE id = note_id_param AND user_id = auth.uid();
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION public.remove_shared_note_access(note_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $$
BEGIN
  DELETE FROM public.shared_notes WHERE note_id = note_id_param AND shared_with_user_id = auth.uid();
  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_by_identifier(p_identifier text)
RETURNS TABLE(user_id uuid, email text, username text, has_google_auth boolean)
LANGUAGE plpgsql STABLE SECURITY DEFINER
AS $$
DECLARE
  v_identifier TEXT := LOWER(TRIM(p_identifier));
BEGIN
  RETURN QUERY
  SELECT up.user_id, COALESCE(up.email, au.email) as email, up.username,
    (au.raw_app_meta_data->>'provider') = 'google' as has_google_auth
  FROM public.user_preferences up
  JOIN auth.users au ON au.id = up.user_id
  WHERE (up.username = v_identifier OR au.email = v_identifier OR up.email = v_identifier)
  LIMIT 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_identifier_exists(p_identifier text)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER
AS $$
DECLARE
  v_identifier TEXT := LOWER(TRIM(p_identifier));
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_preferences up
    JOIN auth.users au ON au.id = up.user_id
    WHERE up.username = v_identifier OR au.email = v_identifier OR up.email = v_identifier
  );
END;
$$;

-- Notification trigger functions
CREATE OR REPLACE FUNCTION public.notify_note_shared()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $$
DECLARE
  note_title text;
  owner_email text;
BEGIN
  SELECT n.title, au.email INTO note_title, owner_email
  FROM public.notes n JOIN auth.users au ON au.id = n.user_id WHERE n.id = NEW.note_id;
  
  IF NEW.shared_with_user_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, message, note_id, from_user_email)
    VALUES (NEW.shared_with_user_id, 'note_shared', 'New note shared with you',
      owner_email || ' shared "' || note_title || '" with you', NEW.note_id, owner_email);
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_note_updated()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $$
DECLARE
  share_record record;
BEGIN
  IF OLD.content = NEW.content AND OLD.title = NEW.title THEN RETURN NEW; END IF;
  FOR share_record IN SELECT shared_with_user_id FROM public.shared_notes WHERE note_id = NEW.id AND shared_with_user_id IS NOT NULL
  LOOP
    INSERT INTO public.notifications (user_id, type, title, message, note_id)
    VALUES (share_record.shared_with_user_id, 'note_updated', 'Shared note updated', '"' || NEW.title || '" has been updated', NEW.id);
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_note_shared AFTER INSERT ON public.shared_notes FOR EACH ROW EXECUTE FUNCTION public.notify_note_shared();
CREATE TRIGGER trigger_notify_note_updated AFTER UPDATE ON public.notes FOR EACH ROW EXECUTE FUNCTION public.notify_note_updated();
