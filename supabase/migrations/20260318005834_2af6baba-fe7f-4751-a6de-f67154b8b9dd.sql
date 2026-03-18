
CREATE OR REPLACE FUNCTION public.increment_ai_usage(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_count integer;
  v_is_subscribed boolean;
BEGIN
  SELECT (status = 'active') INTO v_is_subscribed
  FROM public.subscriptions WHERE user_id = p_user_id;

  IF v_is_subscribed IS TRUE THEN
    INSERT INTO public.ai_usage (user_id, usage_date, request_count)
    VALUES (p_user_id, CURRENT_DATE, 1)
    ON CONFLICT (user_id, usage_date)
    DO UPDATE SET request_count = ai_usage.request_count + 1, updated_at = now();
    
    SELECT request_count INTO v_count FROM public.ai_usage
    WHERE user_id = p_user_id AND usage_date = CURRENT_DATE;
    
    RETURN jsonb_build_object('allowed', true, 'count', v_count, 'limit', -1, 'subscribed', true);
  END IF;

  INSERT INTO public.ai_usage (user_id, usage_date, request_count)
  VALUES (p_user_id, CURRENT_DATE, 1)
  ON CONFLICT (user_id, usage_date)
  DO UPDATE SET request_count = ai_usage.request_count + 1, updated_at = now();
  
  SELECT request_count INTO v_count FROM public.ai_usage
  WHERE user_id = p_user_id AND usage_date = CURRENT_DATE;
  
  IF v_count > 10 THEN
    UPDATE public.ai_usage SET request_count = request_count - 1
    WHERE user_id = p_user_id AND usage_date = CURRENT_DATE;
    
    RETURN jsonb_build_object('allowed', false, 'count', v_count - 1, 'limit', 10, 'subscribed', false);
  END IF;
  
  RETURN jsonb_build_object('allowed', true, 'count', v_count, 'limit', 10, 'subscribed', false);
END;
$function$;
