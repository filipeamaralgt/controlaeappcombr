import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NavLink, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useProfile } from '@/hooks/useProfile';
import logoImg from '@/assets/controlae-logo.png';
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
  ChevronDown,
  Wallet,
  ShieldCheck,
  Target,
  Gauge,
  AlertTriangle,
  ListChecks,
  Upload,
  Download,
  CloudCog,
  FolderOpen,
  MessageCircle,
} from 'lucide-react';

const MASTER_EMAILS = ['monicahartmann99@gmail.com', 'filipeamaralgt@gmail.com'];

const menuItems = [
  { path: '/', label: 'Início', icon: Home },
  { path: '/chat-ia', label: 'Chat Maya', icon: MessageCircle },
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
  const { user } = useAuth();
  const isMaster = MASTER_EMAILS.includes(email || '');
  const [unreadCount, setUnreadCount] = useState(0);
  const [mayaBellNotification, setMayaBellNotification] = useState(false);

  // Listen for real-time Maya notification
  useEffect(() => {
    const handler = () => setMayaBellNotification(true);
    window.addEventListener('maya-new-message', handler);
    return () => window.removeEventListener('maya-new-message', handler);
  }, []);

  // Track unread Maya messages
  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    const lastSeen = localStorage.getItem('maya-chat-last-seen') || '1970-01-01T00:00:00Z';
    const { count, error } = await supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('role', 'assistant')
      .gt('created_at', lastSeen);
    if (!error && count) setUnreadCount(count);
  }, [user]);

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  // Clear unread when navigating to chat
  useEffect(() => {
    if (location.pathname === '/chat-ia') {
      localStorage.setItem('maya-chat-last-seen', new Date().toISOString());
      setUnreadCount(0);
      setMayaBellNotification(false);
    }
  }, [location.pathname]);

  const isInFinance = financeItems.some(i => location.pathname === i.path);
  const isInData = dataItems.some(i => location.pathname === i.path);

  const [financeOpen, setFinanceOpen] = useState(isInFinance);
  const [dataOpen, setDataOpen] = useState(isInData);

  useEffect(() => {
    if (isInFinance) setFinanceOpen(true);
  }, [isInFinance]);

  useEffect(() => {
    if (isInData) setDataOpen(true);
  }, [isInData]);

  const renderLink = (item: { path: string; label: string; icon: any }) => {
    const isActive = location.pathname === item.path;
    const Icon = item.icon;
    const showBadge = item.path === '/chat-ia' && unreadCount > 0 && !isActive;
    const showBellAnim = item.path === '/chat-ia' && mayaBellNotification && !isActive;
    return (
      <li key={item.path}>
        <NavLink
          to={item.path}
          className={cn(
            'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:translate-x-0.5',
            isActive
              ? 'bg-primary/15 text-primary shadow-sm shadow-primary/10'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            collapsed && 'justify-center px-2'
          )}
          title={collapsed ? item.label : undefined}
        >
          <div className="relative shrink-0">
            <Icon className={cn('h-5 w-5', isActive && 'text-primary')} />
            {showBadge && collapsed && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
            <AnimatePresence>
              {showBellAnim && !showBadge && collapsed && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="absolute -top-1.5 -right-1.5"
                >
                  <motion.div
                    animate={{ rotate: [0, 15, -15, 10, -10, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 2 }}
                  >
                    <Bell className="h-3.5 w-3.5 fill-primary text-primary" />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {!collapsed && (
            <>
              <span className="flex-1">{item.label}</span>
              {showBadge && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
              <AnimatePresence>
                {showBellAnim && !showBadge && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <motion.div
                      animate={{ rotate: [0, 15, -15, 10, -10, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 2 }}
                    >
                      <Bell className="h-4 w-4 fill-primary text-primary" />
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </NavLink>
      </li>
    );
  };

  const renderCollapsibleGroup = (
    label: string,
    emoji: string,
    icon: any,
    items: typeof menuItems,
    open: boolean,
    toggle: (v: boolean) => void
  ) => {
    const GroupIcon = icon;
    const isActiveInGroup = items.some(i => location.pathname === i.path);

    if (collapsed) {
      return (
        <>
          <div className="my-2 mx-2 h-px bg-border/50" />
          {items.map(renderLink)}
        </>
      );
    }

    return (
      <>
        <li>
          <button
            onClick={() => toggle(!open)}
            className={cn(
              'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:translate-x-0.5',
              isActiveInGroup
                ? 'bg-primary/15 text-primary shadow-sm shadow-primary/10'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <GroupIcon className={cn('h-5 w-5 shrink-0', isActiveInGroup && 'text-primary')} />
            <span className="flex-1 text-left">
              {label}
            </span>
            <ChevronDown
              className={cn(
                'h-4 w-4 shrink-0 transition-transform duration-200',
                open && 'rotate-180'
              )}
            />
          </button>
        </li>
        <div
          className="overflow-hidden transition-all duration-300 ease-out"
          style={{
            maxHeight: open ? `${items.length * 44}px` : '0px',
            opacity: open ? 1 : 0,
          }}
        >
          <ul className="ml-3 space-y-0.5 border-l border-border/40 pl-2">
            {items.map(renderLink)}
          </ul>
        </div>
      </>
    );
  };

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
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 overflow-hidden">
            <img src={logoImg} alt="Controlaê" className="h-7 w-7 object-contain" />
          </div>
          {!collapsed && (
            <span className="text-xl font-bold text-foreground">Controlaê</span>
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
          {menuItems.map(renderLink)}

          {renderCollapsibleGroup('Financeiro', '💳', Wallet, financeItems, financeOpen, (v) => { setFinanceOpen(v); if (v) setDataOpen(false); })}
          {renderCollapsibleGroup('Dados', '📂', FolderOpen, dataItems, dataOpen, (v) => { setDataOpen(v); if (v) setFinanceOpen(false); })}

          {isMaster && (
            <>
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
