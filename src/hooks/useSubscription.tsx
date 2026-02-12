import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface SubscriptionState {
  subscribed: boolean;
  productId: string | null;
  subscriptionEnd: string | null;
  isTrial: boolean;
  loading: boolean;
}

export const PLANS = {
  monthly: {
    priceId: 'price_1T046JJPXCnRNFoNYcWHpAoZ',
    productId: 'prod_Ty065ul2vqdVPi',
    label: 'Plano Mensal',
    price: 'R$ 11,90/mês',
    amount: 11.9,
  },
  annual: {
    priceId: 'price_1T046YJPXCnRNFoNmFQ000t2',
    productId: 'prod_Ty06dz6oRg9maZ',
    label: 'Plano Anual',
    price: 'R$ 97/ano',
    amount: 97,
  },
} as const;

export function useSubscription() {
  const { user } = useAuth();
  const [state, setState] = useState<SubscriptionState>({
    subscribed: false,
    productId: null,
    subscriptionEnd: null,
    isTrial: false,
    loading: true,
  });

  const checkSubscription = useCallback(async () => {
    if (!user) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) throw error;
      setState({
        subscribed: data.subscribed ?? false,
        productId: data.product_id ?? null,
        subscriptionEnd: data.subscription_end ?? null,
        isTrial: data.is_trial ?? false,
        loading: false,
      });
    } catch {
      setState((s) => ({ ...s, loading: false }));
    }
  }, [user]);

  useEffect(() => {
    checkSubscription();
    const interval = setInterval(checkSubscription, 60_000);
    return () => clearInterval(interval);
  }, [checkSubscription]);

  const startCheckout = async (priceId: string) => {
    const { data, error } = await supabase.functions.invoke('create-checkout', {
      body: { priceId },
    });
    if (error) throw error;
    if (data?.url) {
      window.open(data.url, '_blank');
    }
  };

  const openPortal = async () => {
    const { data, error } = await supabase.functions.invoke('customer-portal');
    if (error) throw error;
    if (data?.url) {
      window.open(data.url, '_blank');
    }
  };

  return { ...state, checkSubscription, startCheckout, openPortal };
}
