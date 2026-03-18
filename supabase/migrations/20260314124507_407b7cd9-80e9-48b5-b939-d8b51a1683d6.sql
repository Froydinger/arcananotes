
CREATE OR REPLACE FUNCTION public.handle_new_user_preferences()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $$
BEGIN
  INSERT INTO public.user_preferences (user_id, theme, ai_enabled)
  VALUES (NEW.id, 'navy', false);
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RETURN NEW;
END;
$$;
