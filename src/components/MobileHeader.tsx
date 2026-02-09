import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/button';
import { Sun, Moon, Wallet } from 'lucide-react';

export function MobileHeader() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-border/50 bg-card/95 backdrop-blur-lg">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15">
            <Wallet className="h-4 w-4 text-primary" />
          </div>
          <span className="text-lg font-bold text-foreground">Fluxy</span>
        </div>
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={toggleTheme}>
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </div>
    </header>
  );
}
