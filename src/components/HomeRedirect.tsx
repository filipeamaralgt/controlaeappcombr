import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { isNativeApp } from '@/lib/platform';

export function HomeRedirect({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to={isNativeApp() ? "/auth" : "/landing"} replace />;

  return <>{children}</>;
}
