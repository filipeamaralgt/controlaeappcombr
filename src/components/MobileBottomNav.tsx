import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Home, Search, MessageCircle, User, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const MASTER_EMAIL = 'monicahartmann99@gmail.com';

const navItems = [
  { path: '/', label: 'Início', icon: Home },
  { path: '/pesquisa', label: 'Pesquisa', icon: Search },
  { path: '/chat-ia', label: 'Chat IA', icon: MessageCircle },
  { path: '/perfil', label: 'Perfil', icon: User },
];

export function MobileBottomNav() {
  const location = useLocation();
  const { user } = useAuth();
  const isMaster = user?.email === MASTER_EMAIL;

  const items = isMaster
    ? [...navItems, { path: '/admin-ia', label: 'Admin', icon: ShieldCheck }]
    : navItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-card/95 backdrop-blur-lg safe-area-inset-bottom">
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-2">
        {items.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 py-2 transition-all duration-300',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-2xl transition-all duration-300',
                  isActive
                    ? 'bg-primary/15 scale-110'
                    : 'scale-100'
                )}
              >
                <Icon
                  className={cn(
                    'h-6 w-6 transition-all duration-300',
                    isActive ? 'text-primary stroke-[2.5]' : 'stroke-[2]'
                  )}
                />
              </div>
              <span
                className={cn(
                  'text-[10px] font-medium transition-all duration-300',
                  isActive ? 'opacity-100 translate-y-0' : 'opacity-70 translate-y-px'
                )}
              >
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
