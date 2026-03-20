import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Home, Search, MessageCircle, User, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { path: '/', label: 'Início', icon: Home },
  { path: '/pesquisa', label: 'Pesquisa', icon: Search },
  { path: '/chat-ia', label: 'Dora', icon: MessageCircle },
  { path: '/perfil', label: 'Perfil', icon: User },
];

export function MobileBottomNav() {
  const location = useLocation();
  const [mayaNotification, setMayaNotification] = useState(false);

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

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <div className="h-px bg-border/40" />

      <div className="bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex max-w-lg items-end justify-around px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            const showBell = item.path === '/chat-ia' && mayaNotification && !isActive;

            return (
              <NavLink key={item.path} to={item.path} className="flex flex-1">
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
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
}