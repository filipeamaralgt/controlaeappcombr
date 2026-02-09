import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useProfile } from '@/hooks/useProfile';
import {
  Home,
  PieChart,
  Tag,
  CreditCard,
  Bell,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Wallet,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const menuItems = [
  { path: '/', label: 'Início', icon: Home },
  { path: '/graficos', label: 'Gráficos', icon: PieChart },
  { path: '/categorias', label: 'Categorias', icon: Tag },
  { path: '/pagamentos', label: 'Pagamentos Regulares', icon: CreditCard },
  { path: '/lembretes', label: 'Lembretes', icon: Bell },
  { path: '/configuracoes', label: 'Configurações', icon: Settings },
  { path: '/suporte', label: 'Suporte', icon: HelpCircle },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { displayName, initials, avatarUrl, email } = useProfile();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-full flex-col border-r border-border/50 bg-card transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-border/50 px-4">
        <div className={cn('flex items-center gap-2', collapsed && 'justify-center w-full')}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15">
            <Wallet className="h-5 w-5 text-primary" />
          </div>
          {!collapsed && (
            <span className="text-xl font-bold text-foreground">Fluxy</span>
          )}
        </div>
        {!collapsed && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => setCollapsed(true)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Menu Items */}
      <nav className="flex-1 overflow-y-auto p-3">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-primary/15 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    collapsed && 'justify-center px-2'
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className={cn('h-5 w-5 shrink-0', isActive && 'text-primary')} />
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Profile Footer */}
      <div className="border-t border-border/50 p-3">
        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            <Link to="/perfil" title={displayName}>
              <Avatar className="h-9 w-9">
                <AvatarImage src={avatarUrl} alt={displayName} />
                <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCollapsed(false)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Link
            to="/perfil"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-muted"
          >
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarImage src={avatarUrl} alt={displayName} />
              <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{displayName}</p>
              <p className="truncate text-xs text-muted-foreground">{email}</p>
            </div>
          </Link>
        )}
      </div>
    </aside>
  );
}
