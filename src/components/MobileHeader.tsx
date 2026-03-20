import { useState } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/button';
import { Sun, Moon, Settings2 } from 'lucide-react';
import { CategoryManageModal } from '@/components/CategoryManageModal';
import { HeaderProfileSelector } from '@/components/HeaderProfileSelector';
import { AppLogo } from '@/components/AppLogo';

export function MobileHeader() {
  const { theme, toggleTheme } = useTheme();
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);

  return (
    <>
      <header className="fixed left-0 right-0 top-0 z-50 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center justify-between px-4 pt-[env(safe-area-inset-top)]">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <AppLogo size="md" />
            <span className="text-sm font-bold text-foreground tracking-tight">Controlaê</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-0.5">
            <HeaderProfileSelector />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg text-muted-foreground active:scale-90 transition-transform"
              onClick={() => setCategoryModalOpen(true)}
            >
              <Settings2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg text-muted-foreground active:scale-90 transition-transform"
              onClick={toggleTheme}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        <div className="h-px bg-border/40" />
      </header>

      <CategoryManageModal open={categoryModalOpen} onOpenChange={setCategoryModalOpen} />
    </>
  );
}
