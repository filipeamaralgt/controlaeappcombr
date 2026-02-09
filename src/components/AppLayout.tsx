import { ReactNode, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { useCategoriesRealtime } from '@/hooks/useCategoriesRealtime';
import { AppSidebar } from './AppSidebar';
import { MobileBottomNav } from './MobileBottomNav';
import { MobileHeader } from './MobileHeader';
import { DesktopTopBar } from './DesktopTopBar';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, loading } = useAuth();
  const isMobile = useIsMobile();
  const location = useLocation();

  // Global realtime: categories stay synced across all screens
  useCategoriesRealtime();

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
        <div key={location.pathname} className="animate-fade-in">
          {children}
        </div>
      </main>

      {/* Mobile: Bottom Navigation */}
      {isMobile && <MobileBottomNav />}
    </div>
  );
}
