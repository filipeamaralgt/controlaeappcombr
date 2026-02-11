import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/button';
import { LogOut, Sun, Moon, Settings2, Search, MessageCircle } from 'lucide-react';
import { CategoryManageModal } from '@/components/CategoryManageModal';
import { HeaderProfileSelector } from '@/components/HeaderProfileSelector';
import { cn } from '@/lib/utils';

export function DesktopTopBar() {
  const { signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <>
      <header className="fixed left-64 right-0 top-0 z-30 border-b border-border/50 bg-background/80 backdrop-blur-lg transition-all duration-300">
        <div className="flex h-14 items-center justify-end px-6 gap-1">
          <Button
            variant="ghost"
            size="icon"
            className={cn("h-9 w-9", location.pathname === '/pesquisa' && "bg-primary/10 text-primary")}
            onClick={() => navigate('/pesquisa')}
            title="Pesquisa"
          >
            <Search className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn("h-9 w-9", location.pathname === '/chat-ia' && "bg-primary/10 text-primary")}
            onClick={() => navigate('/chat-ia')}
            title="Chat Maya"
          >
            <MessageCircle className="h-4 w-4" />
          </Button>
          <div className="w-px h-5 bg-border/50 mx-1" />
          <HeaderProfileSelector />
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setCategoryModalOpen(true)} title="Gerenciar categorias">
            <Settings2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={signOut}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <CategoryManageModal open={categoryModalOpen} onOpenChange={setCategoryModalOpen} />
    </>
  );
}
