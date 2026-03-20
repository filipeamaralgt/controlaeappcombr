import { ReactNode } from 'react';
import { Navigate, useLocation, useNavigationType } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useScreenSize } from '@/hooks/use-mobile';

import { useCategoriesRealtime } from '@/hooks/useCategoriesRealtime';
import { useTransactionsRealtime } from '@/hooks/useTransactionsRealtime';
import { AppSidebar } from './AppSidebar';
import { MobileBottomNav } from './MobileBottomNav';
import { MobileHeader } from './MobileHeader';
import { DesktopTopBar } from './DesktopTopBar';
import { ReminderNotificationBanner } from './ReminderNotificationBanner';

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];

const pageTransition = { type: 'tween' as const, ease, duration: 0.15 };

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, loading } = useAuth();
  const screenSize = useScreenSize();
  const location = useLocation();
  const navType = useNavigationType();

  const isDesktop = screenSize === 'desktop';
  const showBottomNav = screenSize === 'mobile' || screenSize === 'tablet';
  const showMobileHeader = screenSize === 'mobile' || screenSize === 'tablet';

  const isBack = navType === 'POP';

  const variants = {
    initial: { opacity: 0, x: isBack ? -20 : 20 },
    animate: { opacity: 1, x: 0 },
    exit:    { opacity: 0, x: isBack ? 20 : -20 },
  };

  useCategoriesRealtime();
  useTransactionsRealtime();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop only: Sidebar */}
      {isDesktop && <AppSidebar />}

      {/* Mobile & Tablet: Header */}
      {showMobileHeader && <MobileHeader />}

      {/* Desktop only: Top Bar */}
      {isDesktop && <DesktopTopBar />}

      {/* Main Content */}
      <main
        className={
          isDesktop
            ? 'ml-64 min-h-screen pt-14 transition-all duration-300'
            : 'pb-[calc(4.5rem+env(safe-area-inset-bottom))] pt-14'
        }
      >
        <ReminderNotificationBanner />
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

      {/* Mobile & Tablet: Bottom Navigation */}
      {showBottomNav && <MobileBottomNav />}
    </div>
  );
}
