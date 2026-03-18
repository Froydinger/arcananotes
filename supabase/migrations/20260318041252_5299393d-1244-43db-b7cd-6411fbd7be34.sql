DROP POLICY IF EXISTS "Users can insert their own subscription" ON public.subscriptions;

CREATE POLICY "Users can insert their own free subscription"
ON public.subscriptions
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND status = 'free'
  AND stripe_customer_id IS NULL
  AND stripe_subscription_id IS NULL
  AND current_period_end IS NULL
);