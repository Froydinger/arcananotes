
-- Drop old Stripe subscriptions table
DROP TABLE IF EXISTS public.subscriptions CASCADE;

-- New Paddle-shaped subscriptions table
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  paddle_subscription_id text NOT NULL UNIQUE,
  paddle_customer_id text NOT NULL,
  product_id text NOT NULL,
  price_id text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  environment text NOT NULL DEFAULT 'sandbox',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_paddle_id ON public.subscriptions(paddle_subscription_id);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscriptions"
  ON public.subscriptions FOR ALL
  USING (auth.role() = 'service_role');

-- Helper for server-side checks
CREATE OR REPLACE FUNCTION public.has_active_subscription(
  user_uuid uuid,
  check_env text DEFAULT 'live'
)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = user_uuid
    AND environment = check_env
    AND (
      (status IN ('active','trialing','past_due') AND (current_period_end IS NULL OR current_period_end > now()))
      OR (status = 'canceled' AND current_period_end > now())
    )
  ) OR EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = user_uuid AND lower(email) = 'josh@winthenight.info'
  );
$$;

-- Update AI usage helper: founder + active Paddle sub = unlimited
CREATE OR REPLACE FUNCTION public.increment_ai_usage(p_user_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
  v_is_pro boolean;
  v_email text;
BEGIN
  IF p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: cannot affect another user''s usage';
  END IF;

  SELECT lower(email) INTO v_email FROM auth.users WHERE id = p_user_id;

  v_is_pro := (v_email = 'josh@winthenight.info') OR EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = p_user_id
    AND status IN ('active','trialing','past_due')
    AND (current_period_end IS NULL OR current_period_end > now())
  );

  INSERT INTO public.ai_usage (user_id, usage_date, request_count)
  VALUES (p_user_id, CURRENT_DATE, 1)
  ON CONFLICT (user_id, usage_date)
  DO UPDATE SET request_count = ai_usage.request_count + 1, updated_at = now();

  SELECT request_count INTO v_count FROM public.ai_usage
  WHERE user_id = p_user_id AND usage_date = CURRENT_DATE;

  IF v_is_pro THEN
    RETURN jsonb_build_object('allowed', true, 'count', v_count, 'limit', -1, 'subscribed', true);
  END IF;

  IF v_count > 10 THEN
    UPDATE public.ai_usage SET request_count = request_count - 1
    WHERE user_id = p_user_id AND usage_date = CURRENT_DATE;
    RETURN jsonb_build_object('allowed', false, 'count', v_count - 1, 'limit', 10, 'subscribed', false);
  END IF;

  RETURN jsonb_build_object('allowed', true, 'count', v_count, 'limit', 10, 'subscribed', false);
END;
$$;
