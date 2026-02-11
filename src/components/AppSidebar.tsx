import { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
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
  Briefcase,
  Database,
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

const financePaths = financeItems.map((i) => i.path);
const dataPaths = dataItems.map((i) => i.path);

export type SidebarSection = 'financeiro' | 'dados' | null;

export function useActiveSidebarSection(pathname: string): SidebarSection {
  if (financePaths.includes(pathname)) return 'financeiro';
  if (dataPaths.includes(pathname)) return 'dados';
  return null;
}

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState<SidebarSection>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { email } = useProfile();
  const isMaster = MASTER_EMAILS.includes(email || '');

  // Auto-open section based on current route
  useEffect(() => {
    const routeSection = financePaths.includes(location.pathname)
      ? 'financeiro'
      : dataPaths.includes(location.pathname)
        ? 'dados'
        : null;
    if (routeSection) {
      setActiveSection(routeSection);
    }
  }, [location.pathname]);

  const handleSectionClick = (section: SidebarSection) => {
    if (activeSection === section) {
      setActiveSection(null);
    } else {
      setActiveSection(section);
    }
  };

  const subItems = activeSection === 'financeiro' ? financeItems : activeSection === 'dados' ? dataItems : [];

  return (
    <>
      {/* Main Sidebar */}
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
                    onClick={() => setActiveSection(null)}
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

            {/* Divider */}
            {!collapsed && <div className="my-3 mx-1 h-px bg-border/50" />}
            {collapsed && <div className="my-2 mx-2 h-px bg-border/50" />}

            {/* Financeiro section button */}
            <li>
              <button
                onClick={() => handleSectionClick('financeiro')}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  activeSection === 'financeiro' || financePaths.includes(location.pathname)
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  collapsed && 'justify-center px-2'
                )}
                title={collapsed ? 'Financeiro' : undefined}
              >
                <Briefcase className={cn('h-5 w-5 shrink-0', (activeSection === 'financeiro' || financePaths.includes(location.pathname)) && 'text-primary')} />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">Financeiro</span>
                    <ChevronRight className={cn('h-4 w-4 transition-transform duration-200', activeSection === 'financeiro' && 'rotate-0')} />
                  </>
                )}
              </button>
            </li>

            {/* Dados section button */}
            <li>
              <button
                onClick={() => handleSectionClick('dados')}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  activeSection === 'dados' || dataPaths.includes(location.pathname)
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  collapsed && 'justify-center px-2'
                )}
                title={collapsed ? 'Dados' : undefined}
              >
                <Database className={cn('h-5 w-5 shrink-0', (activeSection === 'dados' || dataPaths.includes(location.pathname)) && 'text-primary')} />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">Dados</span>
                    <ChevronRight className={cn('h-4 w-4 transition-transform duration-200', activeSection === 'dados' && 'rotate-0')} />
                  </>
                )}
              </button>
            </li>

            {/* Admin IA - master only */}
            {isMaster && (
              <li>
                <NavLink
                  to="/admin-ia"
                  onClick={() => setActiveSection(null)}
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

      {/* Sub-panel */}
      <aside
        className={cn(
          'fixed top-0 z-30 flex h-full flex-col border-r border-border/50 bg-card/95 backdrop-blur-sm transition-all duration-300',
          collapsed ? 'left-16' : 'left-64',
          activeSection ? 'w-48 opacity-100' : 'w-0 opacity-0 overflow-hidden'
        )}
      >
        <div className="flex h-16 items-center border-b border-border/50 px-4">
          <p className="text-sm font-semibold text-foreground">
            {activeSection === 'financeiro' ? '💳 Financeiro' : '📂 Dados'}
          </p>
        </div>
        <nav className="flex-1 overflow-y-auto p-3">
          <ul className="space-y-1">
            {subItems.map((item) => {
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
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <Icon className={cn('h-5 w-5 shrink-0', isActive && 'text-primary')} />
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
}
