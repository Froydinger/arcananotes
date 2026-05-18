import { useCallback } from 'react';

// Everything is free for everyone. No paywall, no limits.
export function useSubscription() {
  const noop = useCallback(async () => {}, []);
  return {
    isSubscribed: true,
    isFounder: false,
    subscriptionEnd: null as string | null,
    cancelAtPeriodEnd: false,
    loading: false,
    aiUsageToday: 0,
    aiLimit: -1,
    checkSubscription: noop,
    createCheckout: noop,
    openPortal: noop,
  };
}
