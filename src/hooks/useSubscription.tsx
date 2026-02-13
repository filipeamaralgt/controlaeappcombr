import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { getUserSubscription, SubscriptionRecord } from '@/services/subscriptionService';

interface SubscriptionState {
  premium: boolean;
  subscribed: boolean;
  productId: string | null;
  subscriptionEnd: string | null;
  isTrial: boolean;
  plan: string | null;
  provider: string | null;
  subscription: SubscriptionRecord | null;
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

const defaultState: SubscriptionState = {
  premium: false,
  subscribed: false,
  productId: null,
  subscriptionEnd: null,
  isTrial: false,
  plan: null,
  provider: null,
  subscription: null,
  loading: true,
};

const SubscriptionContext = createContext<
  SubscriptionState & {
    checkSubscription: () => Promise<void>;
    startCheckout: (priceId: string) => Promise<void>;
    openPortal: () => Promise<void>;
  }
>({
  ...defaultState,
  checkSubscription: async () => {},
  startCheckout: async () => {},
  openPortal: async () => {},
});

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState<SubscriptionState>(defaultState);

  const checkSubscription = useCallback(async () => {
    if (!user) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }

    try {
      // 1. Sync with Stripe via edge function (updates subscriptions table)
      const { data: edgeData, error: edgeError } = await supabase.functions.invoke('check-subscription');

      if (!edgeError && edgeData) {
        setState({
          premium: edgeData.premium ?? false,
          subscribed: edgeData.subscribed ?? false,
          productId: edgeData.product_id ?? null,
          subscriptionEnd: edgeData.subscription_end ?? null,
          isTrial: edgeData.is_trial ?? false,
          plan: edgeData.plan ?? null,
          provider: edgeData.provider ?? null,
          subscription: null,
          loading: false,
        });

        // 2. Also fetch the DB record for full subscription info
        const dbResult = await getUserSubscription(user.id);
        setState((s) => ({
          ...s,
          subscription: dbResult.subscription,
        }));
        return;
      }

      // Fallback: read from DB directly if edge function fails
      const dbResult = await getUserSubscription(user.id);
      setState({
        premium: dbResult.premium,
        subscribed: dbResult.premium,
        productId: null,
        subscriptionEnd: dbResult.expires_at,
        isTrial: dbResult.subscription?.status === 'trial',
        plan: dbResult.subscription?.plan ?? null,
        provider: dbResult.provider,
        subscription: dbResult.subscription,
        loading: false,
      });
    } catch {
      // Final fallback: read from DB
      try {
        const dbResult = await getUserSubscription(user.id);
        setState({
          premium: dbResult.premium,
          subscribed: dbResult.premium,
          productId: null,
          subscriptionEnd: dbResult.expires_at,
          isTrial: dbResult.subscription?.status === 'trial',
          plan: dbResult.subscription?.plan ?? null,
          provider: dbResult.provider,
          subscription: dbResult.subscription,
          loading: false,
        });
      } catch {
        setState((s) => ({ ...s, loading: false }));
      }
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

  return (
    <SubscriptionContext.Provider value={{ ...state, checkSubscription, startCheckout, openPortal }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  return context;
}
