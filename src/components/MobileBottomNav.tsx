import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Home, Search, MessageCircle, User, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { path: '/', label: 'Início', icon: Home },
  { path: '/pesquisa', label: 'Pesquisa', icon: Search },
  { path: '/chat-ia', label: 'Maya', icon: MessageCircle },
  { path: '/perfil', label: 'Perfil', icon: User },
];

export function MobileBottomNav() {
  const location = useLocation();
  const [mayaNotification, setMayaNotification] = useState(false);

  // Listen for Maya new message events
  useEffect(() => {
    const handler = () => setMayaNotification(true);
    window.addEventListener('maya-new-message', handler);
    return () => window.removeEventListener('maya-new-message', handler);
  }, []);

  // Clear notification when navigating to chat
  useEffect(() => {
    if (location.pathname === '/chat-ia') {
      setMayaNotification(false);
    }
  }, [location.pathname]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-area-inset-bottom">
      {/* Top gradient line */}
      <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <div className="overflow-hidden bg-background/70 backdrop-blur-2xl">
        <div className="mx-auto flex h-[68px] max-w-lg items-center justify-around px-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            const showBell = item.path === '/chat-ia' && mayaNotification && !isActive;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className="flex flex-1 flex-col items-center gap-1 py-1 overflow-visible"
              >
                <div
                  className={cn(
                    'relative flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-300',
                    isActive ? 'bg-primary/10' : ''
                  )}
                >
                  <Icon
                    className={cn(
                      'h-5 w-5 transition-all duration-300',
                      isActive
                        ? 'text-primary stroke-[2.5]'
                        : 'text-muted-foreground stroke-[1.8]'
                    )}
                  />
                  <AnimatePresence>
                    {showBell && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="absolute -right-2.5 top-0"
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
                    'text-[10px] font-semibold tracking-wide transition-all duration-500',
                    isActive
                      ? 'text-primary opacity-100'
                      : 'text-muted-foreground opacity-60'
                  )}
                >
                  {item.label}
                </span>

                {/* Active indicator dot */}
                <div
                  className={cn(
                    'h-1 w-1 rounded-full transition-all duration-500',
                    isActive
                      ? 'bg-primary scale-100 opacity-100'
                      : 'scale-0 opacity-0'
                  )}
                />
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
