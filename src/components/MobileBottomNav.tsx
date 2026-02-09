import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Home, Search, MessageCircle, User } from 'lucide-react';

const navItems = [
  { path: '/', label: 'Início', icon: Home },
  { path: '/pesquisa', label: 'Pesquisa', icon: Search },
  { path: '/chat-ia', label: 'Chat IA', icon: MessageCircle },
];

export function MobileBottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-card/95 backdrop-blur-lg safe-area-inset-bottom">
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 py-2 transition-all duration-200',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-2xl transition-all duration-200',
                  isActive && 'bg-primary/15'
                )}
              >
                <Icon className={cn('h-6 w-6', isActive && 'text-primary')} />
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </NavLink>
          );
        })}

        {/* Profile tab with user icon */}
        <NavLink
          to="/perfil"
          className={cn(
            'flex flex-1 flex-col items-center gap-1 py-2 transition-all duration-200',
            location.pathname === '/perfil' ? 'text-primary' : 'text-muted-foreground'
          )}
        >
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-2xl transition-all duration-200',
              location.pathname === '/perfil' && 'bg-primary/15'
            )}
          >
            <User className={cn('h-6 w-6', location.pathname === '/perfil' && 'text-primary')} />
          </div>
          <span className="text-[10px] font-medium">Perfil</span>
        </NavLink>
      </div>
    </nav>
  );
}
