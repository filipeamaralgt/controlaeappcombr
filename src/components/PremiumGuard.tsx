import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';

interface PremiumGuardProps {
  children: ReactNode;
}

export function PremiumGuard({ children }: PremiumGuardProps) {
  const { premium, loading } = useSubscription();

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!premium) {
    return <Navigate to="/paywall" replace />;
  }

  return <>{children}</>;
}
