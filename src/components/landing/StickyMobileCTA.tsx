import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function StickyMobileCTA() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 600);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-border/50 bg-background/95 backdrop-blur-lg px-4 py-3 safe-area-pb"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col min-w-0">
              <span className="text-xs text-muted-foreground">A partir de</span>
              <span className="text-lg font-extrabold text-foreground whitespace-nowrap">R$ 8,08<span className="text-sm font-normal text-muted-foreground">/mês</span></span>
            </div>
            <Button
              className="cta-primary h-11 gap-1.5 px-6 text-sm font-bold rounded-xl border-0 text-white shrink-0 cta-glow"
              onClick={() => navigate('/checkout?plan=anual')}
            >
              <Rocket className="h-4 w-4" /> Começar agora
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
