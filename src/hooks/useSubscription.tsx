import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { checkPremiumStatus } from '@/services/subscriptionService';

interface SubscriptionState {
  premium: boolean;
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

const defaultState: SubscriptionState = { premium: false, loading: true };

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
      setState({ premium: false, loading: false });
      return;
    }
    try {
      const premium = await checkPremiumStatus();
      setState({ premium, loading: false });
    } catch {
      setState({ premium: false, loading: false });
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
    if (data?.url) window.open(data.url, '_blank');
  };

  const openPortal = async () => {
    const { data, error } = await supabase.functions.invoke('customer-portal');
    if (error) throw error;
    if (data?.url) window.open(data.url, '_blank');
  };

  return (
    <SubscriptionContext.Provider value={{ ...state, checkSubscription, startCheckout, openPortal }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  return useContext(SubscriptionContext);
}
