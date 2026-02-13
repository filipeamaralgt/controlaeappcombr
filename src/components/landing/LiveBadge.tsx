import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Eye } from 'lucide-react';

export function LiveBadge() {
  const [viewers, setViewers] = useState(0);

  useEffect(() => {
    // Simulate realistic viewer count
    const base = 15 + Math.floor(Math.random() * 20);
    setViewers(base);
    const id = setInterval(() => {
      setViewers((prev) => {
        const delta = Math.floor(Math.random() * 5) - 2;
        return Math.max(8, Math.min(50, prev + delta));
      });
    }, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div
      className="inline-flex items-center gap-2 rounded-full bg-card border border-border/60 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 1.5, duration: 0.5 }}
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
      </span>
      <Eye className="h-3 w-3" />
      <span>{viewers} pessoas vendo agora</span>
    </motion.div>
  );
}
