
-- Table to track daily AI usage per user
CREATE TABLE public.ai_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  usage_date date NOT NULL DEFAULT CURRENT_DATE,
  request_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, usage_date)
);

ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own usage" ON public.ai_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage" ON public.ai_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own usage" ON public.ai_usage
  FOR UPDATE USING (auth.uid() = user_id);

-- Table to store Stripe customer/subscription info
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  stripe_customer_id text,
  stripe_subscription_id text,
  status text NOT NULL DEFAULT 'free',
  current_period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscription" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscription" ON public.subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to increment AI usage and check limit
CREATE OR REPLACE FUNCTION public.increment_ai_usage(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_count integer;
  v_is_subscribed boolean;
BEGIN
  -- Check subscription status
  SELECT (status = 'active') INTO v_is_subscribed
  FROM public.subscriptions WHERE user_id = p_user_id;

  IF v_is_subscribed IS TRUE THEN
    -- Subscribed users: unlimited, still track
    INSERT INTO public.ai_usage (user_id, usage_date, request_count)
    VALUES (p_user_id, CURRENT_DATE, 1)
    ON CONFLICT (user_id, usage_date)
    DO UPDATE SET request_count = ai_usage.request_count + 1, updated_at = now();
    
    SELECT request_count INTO v_count FROM public.ai_usage
    WHERE user_id = p_user_id AND usage_date = CURRENT_DATE;
    
    RETURN jsonb_build_object('allowed', true, 'count', v_count, 'limit', -1, 'subscribed', true);
  END IF;

  -- Free users: check limit
  INSERT INTO public.ai_usage (user_id, usage_date, request_count)
  VALUES (p_user_id, CURRENT_DATE, 1)
  ON CONFLICT (user_id, usage_date)
  DO UPDATE SET request_count = ai_usage.request_count + 1, updated_at = now();
  
  SELECT request_count INTO v_count FROM public.ai_usage
  WHERE user_id = p_user_id AND usage_date = CURRENT_DATE;
  
  IF v_count > 20 THEN
    -- Rollback the increment
    UPDATE public.ai_usage SET request_count = request_count - 1
    WHERE user_id = p_user_id AND usage_date = CURRENT_DATE;
    
    RETURN jsonb_build_object('allowed', false, 'count', v_count - 1, 'limit', 20, 'subscribed', false);
  END IF;
  
  RETURN jsonb_build_object('allowed', true, 'count', v_count, 'limit', 20, 'subscribed', false);
END;
$$;
