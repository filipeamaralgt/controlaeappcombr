import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useTheme } from '@/hooks/useTheme';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sun, Moon, Settings2, Search } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import mayaAvatar from '@/assets/maya-avatar-smiling.png';
import { CategoryManageModal } from '@/components/CategoryManageModal';
import { HeaderProfileSelector } from '@/components/HeaderProfileSelector';
import { cn } from '@/lib/utils';

export function DesktopTopBar() {
  const { theme, toggleTheme } = useTheme();
  const { displayName, initials, avatarUrl } = useProfile();
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/pesquisa${searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ''}`);
  };

  const handleSearchFocus = () => {
    if (location.pathname !== '/pesquisa') {
      navigate('/pesquisa');
    }
  };

  return (
    <>
      <header className="fixed left-64 right-0 top-0 z-30 border-b border-border/50 bg-background/80 backdrop-blur-lg transition-all duration-300">
        <div className="flex h-14 items-center justify-end px-6 gap-4">
          {/* Search bar - hidden on /pesquisa since page has its own */}
          {location.pathname !== '/pesquisa' && (
            <form onSubmit={handleSearchSubmit} className="relative max-w-md flex-1 mr-auto">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Pesquisar transações..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={handleSearchFocus}
                className="h-9 pl-9 bg-muted/50 border-transparent focus-visible:border-primary/30 focus-visible:ring-1 focus-visible:ring-primary/20 rounded-xl"
              />
            </form>
          )}

          {/* Right actions */}
          <div className="flex items-center gap-1">
            <HeaderProfileSelector />
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setCategoryModalOpen(true)}>
                    <Settings2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom"><p>Gerenciar categorias</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9" onClick={toggleTheme}>
                    {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom"><p>{theme === 'dark' ? 'Modo claro' : 'Modo escuro'}</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link to="/perfil">
                    <Avatar className="h-8 w-8 transition-transform hover:scale-105">
                      <AvatarImage src={avatarUrl} alt={displayName} />
                      <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>{displayName}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </header>

      {/* Floating Chat Maya Button */}
      {location.pathname !== '/chat-ia' && (
        <button
          onClick={() => navigate('/chat-ia')}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl overflow-hidden bg-primary"
          title="Chat com Maya"
        >
          <img src={mayaAvatar} alt="Maya" className="h-full w-full object-cover" />
          <span className="absolute bottom-0 right-0 flex h-4 w-4">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-4 w-4 rounded-full bg-emerald-500 border-2 border-background" />
          </span>
        </button>
      )}

      <CategoryManageModal open={categoryModalOpen} onOpenChange={setCategoryModalOpen} />
    </>
  );
}
