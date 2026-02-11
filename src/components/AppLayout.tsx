import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { useCategoriesRealtime } from '@/hooks/useCategoriesRealtime';
import { useTransactionsRealtime } from '@/hooks/useTransactionsRealtime';
import { AppSidebar } from './AppSidebar';
import { MobileBottomNav } from './MobileBottomNav';
import { MobileHeader } from './MobileHeader';
import { DesktopTopBar } from './DesktopTopBar';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

const pageTransition = {
  type: 'tween' as const,
  ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
  duration: 0.3,
};

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, loading } = useAuth();
  const isMobile = useIsMobile();
  const location = useLocation();

  // Global realtime: categories stay synced across all screens
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
            variants={pageVariants}
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
