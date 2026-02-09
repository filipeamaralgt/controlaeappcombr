import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { AppSidebar } from './AppSidebar';
import { MobileBottomNav } from './MobileBottomNav';
import { MobileHeader } from './MobileHeader';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, loading } = useAuth();
  const isMobile = useIsMobile();

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

      {/* Main Content */}
      <main
        className={
          isMobile
            ? 'pb-20 pt-14'
            : 'ml-64 min-h-screen transition-all duration-300'
        }
      >
        <div className="animate-fade-in">{children}</div>
      </main>

      {/* Mobile: Bottom Navigation */}
      {isMobile && <MobileBottomNav />}
    </div>
  );
}
