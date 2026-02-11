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
  ShieldCheck,
  
  Target,
  Gauge,
  AlertTriangle,
  ListChecks,
  Upload,
  Download,
  CloudCog,
} from 'lucide-react';

const MASTER_EMAILS = ['monicahartmann99@gmail.com', 'filipeamaralgt@gmail.com'];

const menuItems = [
  { path: '/', label: 'Início', icon: Home },
  { path: '/graficos', label: 'Gráficos', icon: PieChart },
  { path: '/categorias', label: 'Categorias', icon: Tag },
  { path: '/pagamentos', label: 'Pagamentos Regulares', icon: CreditCard },
  { path: '/lembretes', label: 'Lembretes', icon: Bell },
  { path: '/configuracoes', label: 'Configurações', icon: Settings },
];

const financeItems = [
  { path: '/cartoes', label: 'Cartões', icon: Wallet },
  { path: '/dividas', label: 'Dívidas', icon: AlertTriangle },
  { path: '/parcelas', label: 'Parcelas em Aberto', icon: ListChecks },
  { path: '/metas', label: 'Metas', icon: Target },
  { path: '/limites', label: 'Limites Mensais', icon: Gauge },
];

const dataItems = [
  { path: '/exportar-dados', label: 'Exportar dados', icon: Upload },
  { path: '/importar-dados', label: 'Importar dados', icon: Download },
  { path: '/backup', label: 'Backup automático', icon: CloudCog },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { displayName, initials, avatarUrl, email } = useProfile();
  const isMaster = MASTER_EMAILS.includes(email || '');

  const renderMenuSection = (items: typeof menuItems, label?: string) => (
    <>
      {label && !collapsed && (
        <p className="mt-4 mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      )}
      {collapsed && label && <div className="my-2 mx-2 h-px bg-border/50" />}
      {items.map((item) => {
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
    </>
  );

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
          {renderMenuSection(menuItems)}
          {renderMenuSection(financeItems, '💳 Financeiro')}
          {renderMenuSection(dataItems, '📂 Dados')}
          {isMaster && (
            <>
              {!collapsed && (
                <p className="mt-4 mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">🛡️ Admin</p>
              )}
              {collapsed && <div className="my-2 mx-2 h-px bg-border/50" />}
              <li>
                <NavLink
                  to="/admin-ia"
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    location.pathname === '/admin-ia'
                      ? 'bg-primary/15 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    collapsed && 'justify-center px-2'
                  )}
                  title={collapsed ? 'Admin IA' : undefined}
                >
                  <ShieldCheck className={cn('h-5 w-5 shrink-0', location.pathname === '/admin-ia' && 'text-primary')} />
                  {!collapsed && <span>Admin IA</span>}
                </NavLink>
              </li>
            </>
          )}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-border/50 p-3">
        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            <NavLink
              to="/suporte"
              className={cn(
                'flex items-center justify-center rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                location.pathname === '/suporte' && 'bg-primary/15 text-primary'
              )}
              title="Suporte"
            >
              <HelpCircle className="h-5 w-5" />
            </NavLink>
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
          <NavLink
            to="/suporte"
            className={cn(
              'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
              location.pathname === '/suporte'
                ? 'bg-primary/15 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <HelpCircle className="h-5 w-5 shrink-0" />
            <span>Suporte</span>
          </NavLink>
        )}
      </div>
    </aside>
  );
}
