import { ReactNode, useRef } from 'react';
import { Navigate, useLocation, useNavigationType } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSubscription } from '@/hooks/useSubscription';
import { isNativeApp } from '@/lib/platform';

import { useCategoriesRealtime } from '@/hooks/useCategoriesRealtime';
import { useTransactionsRealtime } from '@/hooks/useTransactionsRealtime';
import { AppSidebar } from './AppSidebar';
import { MobileBottomNav } from './MobileBottomNav';
import { MobileHeader } from './MobileHeader';
import { DesktopTopBar } from './DesktopTopBar';

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];

const pageTransition = { type: 'tween' as const, ease, duration: 0.15 };

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, loading } = useAuth();
  const { premium, loading: subLoading } = useSubscription();
  const isMobile = useIsMobile();
  const location = useLocation();
  const navType = useNavigationType();

  // POP = back/forward, PUSH = new navigation
  const isBack = navType === 'POP';

  const variants = {
    initial: { opacity: 0, x: isBack ? -20 : 20 },
    animate: { opacity: 1, x: 0 },
    exit:    { opacity: 0, x: isBack ? 20 : -20 },
  };

  // Global realtime: categories stay synced across all screens
  useCategoriesRealtime();
  useTransactionsRealtime();

  if (loading || subLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // On native (Capacitor), redirect payment routes to /assinar-no-site
  const native = isNativeApp();
  if (native && (location.pathname === '/assinatura' || location.pathname === '/paywall')) {
    return <Navigate to="/assinar-no-site" replace />;
  }

  // Redirect non-premium users to checkout (except if already on allowed routes)
  const freeRoutes = ['/paywall', '/assinatura', '/assinar-no-site', '/checkout', '/configuracoes', '/suporte', '/perfil'];
  if (!subLoading && !premium && !freeRoutes.includes(location.pathname)) {
    return <Navigate to={native ? '/assinar-no-site' : '/checkout'} replace />;
  }


  return (
    <div className="min-h-screen bg-background">
      {/* Desktop: Sidebar */}
      {!isMobile && <AppSidebar />}

      {/* Mobile: Header */}
      {isMobile && <MobileHeader />}

      {/* Desktop: Top Bar */}
      {!isMobile && <DesktopTopBar />}

      {/* Main Content - key forces re-mount for page transition */}
      <main
        className={
          isMobile
            ? 'pb-20 pt-14'
            : 'ml-64 min-h-screen pt-14 transition-all duration-300'
        }
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile: Bottom Navigation */}
      {isMobile && <MobileBottomNav />}
    </div>
  );
}
