import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getPaddleEnvironment } from '@/lib/paddle';
import { usePaddleCheckout } from '@/hooks/usePaddleCheckout';

const FOUNDER_EMAILS = new Set(['josh@winthenight.info']);

interface SubscriptionState {
  isSubscribed: boolean;
  isFounder: boolean;
  subscriptionEnd: string | null;
  cancelAtPeriodEnd: boolean;
  loading: boolean;
  aiUsageToday: number;
  aiLimit: number;
}

export function useSubscription() {
  const { user } = useAuth();
  const { openCheckout } = usePaddleCheckout();
  const [state, setState] = useState<SubscriptionState>({
    isSubscribed: false,
    isFounder: false,
    subscriptionEnd: null,
    cancelAtPeriodEnd: false,
    loading: true,
    aiUsageToday: 0,
    aiLimit: 10,
  });

  const checkSubscription = useCallback(async () => {
    if (!user) {
      setState(s => ({ ...s, loading: false }));
      return;
    }

    const isFounder = FOUNDER_EMAILS.has((user.email || '').toLowerCase());

    try {
      const env = getPaddleEnvironment();
      const { data: sub } = await (supabase as any)
        .from('subscriptions')
        .select('status, current_period_end, cancel_at_period_end')
        .eq('user_id', user.id)
        .eq('environment', env)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const now = Date.now();
      const periodEnd = sub?.current_period_end ? new Date(sub.current_period_end).getTime() : null;
      const activeSub = !!sub && (
        (['active', 'trialing', 'past_due'].includes(sub.status) && (!periodEnd || periodEnd > now)) ||
        (sub.status === 'canceled' && periodEnd && periodEnd > now)
      );

      const isSubscribed = isFounder || activeSub;

      setState(s => ({
        ...s,
        isSubscribed,
        isFounder,
        subscriptionEnd: sub?.current_period_end ?? null,
        cancelAtPeriodEnd: !!sub?.cancel_at_period_end,
        aiLimit: isSubscribed ? -1 : 10,
        loading: false,
      }));
    } catch {
      setState(s => ({ ...s, isFounder, isSubscribed: isFounder, loading: false }));
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      const { data: usage } = await supabase
        .from('ai_usage')
        .select('request_count')
        .eq('user_id', user.id)
        .eq('usage_date', today)
        .maybeSingle();
      if (usage) setState(s => ({ ...s, aiUsageToday: usage.request_count }));
    } catch {
      // ignore
    }
  }, [user]);

  useEffect(() => {
    checkSubscription();
    const interval = setInterval(checkSubscription, 60_000);
    return () => clearInterval(interval);
  }, [checkSubscription]);

  const createCheckout = async () => {
    if (!user) return;
    await openCheckout({
      priceId: 'arcana_pro_monthly',
      customerEmail: user.email,
      userId: user.id,
      successUrl: `${window.location.origin}/settings?checkout=success`,
    });
  };

  const openPortal = async () => {
    const { data, error } = await supabase.functions.invoke('customer-portal', { body: {} });
    if (error) throw error;
    if (data?.url) window.open(data.url, '_blank');
  };

  return {
    ...state,
    checkSubscription,
    createCheckout,
    openPortal,
  };
}
