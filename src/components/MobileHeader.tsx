import { useState } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/button';
import { Sun, Moon, Settings2, Wallet } from 'lucide-react';
import { CategoryManageModal } from '@/components/CategoryManageModal';
import { HeaderProfileSelector } from '@/components/HeaderProfileSelector';

export function MobileHeader() {
  const { theme, toggleTheme } = useTheme();
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);

  return (
    <>
      <header className="fixed left-0 right-0 top-0 z-50 bg-background/60 backdrop-blur-2xl">
        <div className="flex h-16 items-center justify-between px-5">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold text-foreground tracking-tight leading-none">Fluxy</span>
              <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground leading-none mt-0.5">Finance</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-0.5">
            <HeaderProfileSelector />
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50"
              onClick={() => setCategoryModalOpen(true)}
              title="Gerenciar categorias"
            >
              <Settings2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50"
              onClick={toggleTheme}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        {/* Subtle bottom line */}
        <div className="h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />
      </header>

      <CategoryManageModal open={categoryModalOpen} onOpenChange={setCategoryModalOpen} />
    </>
  );
}
