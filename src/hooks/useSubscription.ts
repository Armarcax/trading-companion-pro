// useSubscription.ts — React hook for subscription state

import { useState, useEffect, useCallback } from 'react';
import {
  getUserSubscription,
  type UserSubscription,
  type PlanTier,
  PLANS,
  isWithinSignalLimit,
} from '@/lib/subscriptionService';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? '';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

export interface UseSubscriptionReturn {
  subscription: UserSubscription | null;
  tier: PlanTier;
  isLoading: boolean;
  isPro: boolean;
  isPremium: boolean;
  isFree: boolean;
  canTrade: boolean;
  canAccessExchange: (exchangeId: string) => boolean;
  canSendSignal: (signalsToday: number) => boolean;
  refetch: () => Promise<void>;
}

export function useSubscription(userId: string | null): UseSubscriptionReturn {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const sub = await getUserSubscription(SUPABASE_URL, SUPABASE_KEY, userId);
    setSubscription(sub);
    setIsLoading(false);
  }, [userId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const tier = subscription?.tier ?? 'free';
  const plan = PLANS[tier];

  return {
    subscription,
    tier,
    isLoading,
    isPro: tier === 'pro',
    isPremium: tier === 'hayq_premium',
    isFree: tier === 'free',
    canTrade: tier !== 'free',
    canAccessExchange: (exchangeId: string) =>
      plan.exchanges.includes(exchangeId),
    canSendSignal: (signalsToday: number) =>
      isWithinSignalLimit(tier, signalsToday),
    refetch: fetch,
  };
}