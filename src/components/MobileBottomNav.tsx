import { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Home, Search, MessageCircle, Menu, Bell, Settings, HelpCircle, LogOut, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

const navItems = [
  { path: '/', label: 'Início', icon: Home },
  { path: '/pesquisa', label: 'Pesquisa', icon: Search },
  { path: '/chat-ia', label: 'Dora', icon: MessageCircle },
  { path: 'menu', label: 'Menu', icon: Menu },
];

const menuSections = [
  {
    title: 'Conta',
    links: [
      { icon: Settings, label: 'Configurações', path: '/configuracoes' },
      { icon: HelpCircle, label: 'Suporte', path: '/suporte' },
    ],
  },
];

export function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mayaNotification, setMayaNotification] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { displayName, initials, avatarUrl, email } = useProfile();
  const { signOut } = useAuth();

  useEffect(() => {
    const handler = () => setMayaNotification(true);
    window.addEventListener('maya-new-message', handler);
    return () => window.removeEventListener('maya-new-message', handler);
  }, []);

  useEffect(() => {
    if (location.pathname === '/chat-ia') {
      setMayaNotification(false);
    }
  }, [location.pathname]);

  const handleNavClick = (path: string) => {
    if (path === 'menu') {
      setMenuOpen(true);
    }
  };

  const handleMenuNav = (path: string) => {
    setMenuOpen(false);
    navigate(path);
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50">
        <div className="h-px bg-border/40" />

        <div className="bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
          <div className="mx-auto flex max-w-lg items-end justify-around px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5">
            {navItems.map((item) => {
              const isMenu = item.path === 'menu';
              const isActive = isMenu ? menuOpen : location.pathname === item.path;
              const Icon = item.icon;
              const showBell = item.path === '/chat-ia' && mayaNotification && !isActive;

              const content = (
                <div className="flex flex-1 flex-col items-center gap-0.5 py-1 select-none active:scale-90 transition-transform duration-150">
                  <div className="relative flex h-8 w-8 items-center justify-center">
                    {isActive && (
                      <motion.div
                        layoutId="nav-indicator"
                        className="absolute inset-0 rounded-xl bg-primary/12"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                    <Icon
                      className={cn(
                        'relative h-[22px] w-[22px] transition-colors duration-200',
                        isActive
                          ? 'text-primary stroke-[2.5]'
                          : 'text-muted-foreground stroke-[1.8]'
                      )}
                    />
                    <AnimatePresence>
                      {showBell && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className="absolute -right-1.5 -top-0.5"
                        >
                          <motion.div
                            animate={{ rotate: [0, 15, -15, 10, -10, 0] }}
                            transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 2 }}
                          >
                            <Bell className="h-3 w-3 fill-primary text-primary" />
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <span
                    className={cn(
                      'text-[10px] font-medium leading-none transition-colors duration-200',
                      isActive ? 'text-primary' : 'text-muted-foreground'
                    )}
                  >
                    {item.label}
                  </span>
                </div>
              );

              if (isMenu) {
                return (
                  <button
                    key={item.path}
                    onClick={() => handleNavClick(item.path)}
                    className="flex flex-1"
                  >
                    {content}
                  </button>
                );
              }

              return (
                <NavLink key={item.path} to={item.path} className="flex flex-1">
                  {content}
                </NavLink>
              );
            })}
          </div>
        </div>
      </nav>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="right" className="w-[85%] max-w-sm p-0 overflow-y-auto">
          <SheetHeader className="sr-only">
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>

          {/* Profile header */}
          <button
            onClick={() => handleMenuNav('/perfil')}
            className="flex w-full items-center gap-3 px-5 pt-14 pb-4 active:bg-muted/50 transition-colors"
          >
            <Avatar className="h-11 w-11 border-2 border-primary/20">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground truncate">{email}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          </button>

          <Separator />

          {/* Menu sections */}
          <div className="py-2">
            {menuSections.map((section) => (
              <div key={section.title}>
                <p className="px-5 pt-4 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {section.title}
                </p>
                {section.links.map((link) => {
                  const LinkIcon = link.icon;
                  const isActive = location.pathname === link.path;
                  return (
                    <button
                      key={link.path}
                      onClick={() => handleMenuNav(link.path)}
                      className={cn(
                        'flex w-full items-center gap-3 px-5 py-2.5 text-sm transition-colors active:scale-[0.98]',
                        isActive
                          ? 'text-primary bg-primary/5 font-medium'
                          : 'text-foreground hover:bg-muted/50'
                      )}
                    >
                      <LinkIcon className={cn('h-[18px] w-[18px]', isActive ? 'text-primary' : 'text-muted-foreground')} />
                      <span className="flex-1 text-left">{link.label}</span>
                      {isActive && <div className="h-1.5 w-1.5 rounded-full bg-primary" />}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          <Separator />

          {/* Logout */}
          <button
            onClick={() => { setMenuOpen(false); signOut(); }}
            className="flex w-full items-center gap-3 px-5 py-3 text-sm text-destructive active:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-[18px] w-[18px]" />
            <span>Sair da conta</span>
          </button>
        </SheetContent>
      </Sheet>
    </>
  );
}