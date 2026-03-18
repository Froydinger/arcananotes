import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SubscriptionState {
  isSubscribed: boolean;
  status: string;
  currentPeriodEnd: string | null;
  loading: boolean;
  aiUsageToday: number;
  aiLimit: number;
}

export function useSubscription() {
  const { user } = useAuth();
  const [state, setState] = useState<SubscriptionState>({
    isSubscribed: false,
    status: 'free',
    currentPeriodEnd: null,
    loading: true,
    aiUsageToday: 0,
    aiLimit: 20,
  });

  const checkSubscription = useCallback(async () => {
    if (!user) {
      setState(s => ({ ...s, loading: false }));
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        body: {},
      });

      if (!error && data) {
        setState(s => ({
          ...s,
          isSubscribed: data.subscribed || false,
          status: data.status || 'free',
          currentPeriodEnd: data.current_period_end || null,
          aiLimit: data.subscribed ? -1 : 20,
          loading: false,
        }));
      } else {
        setState(s => ({ ...s, loading: false }));
      }
    } catch {
      setState(s => ({ ...s, loading: false }));
    }

    // Get today's usage
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data: usage } = await supabase
        .from('ai_usage')
        .select('request_count')
        .eq('user_id', user.id)
        .eq('usage_date', today)
        .maybeSingle();

      if (usage) {
        setState(s => ({ ...s, aiUsageToday: usage.request_count }));
      }
    } catch {
      // ignore
    }
  }, [user]);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  const createCheckout = async () => {
    const { data, error } = await supabase.functions.invoke('create-checkout', {
      body: { returnUrl: window.location.origin + '/settings' },
    });
    if (error) throw error;
    if (data?.url) {
      // Use window.open for PWA/mobile compatibility; fallback to href
      const opened = window.open(data.url, '_self');
      if (!opened) window.location.href = data.url;
    }
  };

  const openPortal = async () => {
    const { data, error } = await supabase.functions.invoke('create-portal', {
      body: { returnUrl: window.location.origin + '/settings' },
    });
    if (error) throw error;
    if (data?.url) window.location.href = data.url;
  };

  return {
    ...state,
    checkSubscription,
    createCheckout,
    openPortal,
  };
}
