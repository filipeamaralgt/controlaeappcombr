import { useState } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/button';
import { Sun, Moon, Monitor, Settings2 } from 'lucide-react';
import { CategoryManageModal } from '@/components/CategoryManageModal';
import { HeaderProfileSelector } from '@/components/HeaderProfileSelector';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import logoImg from '@/assets/controlae-logo.png';
import { cn } from '@/lib/utils';

const themeOptions = [
  { value: 'light' as const, label: 'Claro', icon: Sun },
  { value: 'dark' as const, label: 'Escuro', icon: Moon },
  { value: 'system' as const, label: 'Sistema', icon: Monitor },
];

export function MobileHeader() {
  const { theme, mode, setMode } = useTheme();
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);

  const CurrentIcon = mode === 'system' ? Monitor : theme === 'dark' ? Sun : Moon;

  return (
    <>
      <header className="fixed left-0 right-0 top-0 z-50 bg-background/60 backdrop-blur-2xl">
        <div className="flex h-16 items-center justify-between px-5">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 overflow-hidden">
              <img src={logoImg} alt="Controlaê" className="h-7 w-7 object-contain" />
            </div>
            <span className="text-base font-bold text-foreground tracking-tight">Controlaê</span>
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
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50"
                >
                  {<CurrentIcon className="h-4 w-4" />}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-auto p-1.5 rounded-xl">
                <div className="flex gap-1">
                  {themeOptions.map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => setMode(value)}
                      className={cn(
                        'flex flex-col items-center gap-1 rounded-lg px-3 py-2 text-[10px] font-medium transition-all',
                        mode === value
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-muted'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        {/* Subtle bottom line */}
        <div className="h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />
      </header>

      <CategoryManageModal open={categoryModalOpen} onOpenChange={setCategoryModalOpen} />
    </>
  );
}
