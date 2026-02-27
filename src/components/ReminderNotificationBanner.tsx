import { useState, useEffect, useMemo } from 'react';
import { BellRing, X, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReminders } from '@/hooks/useReminders';
import { useNavigate } from 'react-router-dom';
import { differenceInDays, parseISO, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface UpcomingReminder {
  id: string;
  name: string;
  amount: number;
  nextDueDate: string;
  daysUntilDue: number;
}

export function ReminderNotificationBanner() {
  const { data: reminders } = useReminders();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState<Set<string>>(() => {
    try {
      const stored = sessionStorage.getItem('dismissed-reminders');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Save dismissed state to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('dismissed-reminders', JSON.stringify([...dismissed]));
  }, [dismissed]);

  const upcoming = useMemo(() => {
    if (!reminders) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return reminders
      .filter((r) => r.is_active && !dismissed.has(r.id))
      .map((r) => {
        const dueDate = parseISO(r.next_due_date);
        const daysUntilDue = differenceInDays(dueDate, today);
        return {
          id: r.id,
          name: r.name,
          amount: Number(r.amount),
          nextDueDate: r.next_due_date,
          daysUntilDue,
        } as UpcomingReminder;
      })
      .filter((r) => r.daysUntilDue >= 0 && r.daysUntilDue <= 3)
      .sort((a, b) => a.daysUntilDue - b.daysUntilDue);
  }, [reminders, dismissed]);

  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissed((prev) => new Set([...prev, id]));
  };

  if (upcoming.length === 0) return null;

  const getDueLabel = (days: number) => {
    if (days === 0) return 'Vence hoje!';
    if (days === 1) return 'Vence amanhã';
    return `Vence em ${days} dias`;
  };

  const getDueBg = (days: number) => {
    if (days === 0) return 'bg-destructive/10 border-destructive/30 text-destructive';
    if (days === 1) return 'bg-orange-500/10 border-orange-500/30 text-orange-700 dark:text-orange-400';
    return 'bg-primary/10 border-primary/30 text-primary';
  };

  return (
    <div className="px-4 pt-2 space-y-2">
      <AnimatePresence>
        {upcoming.map((r) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <button
              onClick={() => navigate('/lembretes')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left text-sm transition-colors ${getDueBg(r.daysUntilDue)}`}
            >
              <BellRing className="h-4 w-4 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{r.name}</div>
                <div className="text-xs opacity-80">
                  {getDueLabel(r.daysUntilDue)}
                  {r.amount > 0 && ` · R$ ${r.amount.toFixed(2)}`}
                </div>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 opacity-50" />
              <button
                onClick={(e) => handleDismiss(r.id, e)}
                className="p-1 rounded-full hover:bg-foreground/10 shrink-0"
                aria-label="Dispensar"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
