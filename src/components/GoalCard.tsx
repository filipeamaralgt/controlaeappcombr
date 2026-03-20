import { Goal } from '@/hooks/useGoals';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Pencil, Trash2, CalendarClock } from 'lucide-react';
import { motion } from 'framer-motion';
import { differenceInDays, format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface GoalCardProps {
  goal: Goal;
  onEdit: (goal: Goal) => void;
  onDelete: (id: string) => void;
}

const formatCurrency = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function getMotivationalMessage(current: number, target: number, progress: number): string {
  if (progress >= 100) return 'Parabéns! Meta alcançada! 🏆';
  if (progress >= 75) return 'Quase lá! Falta pouco! 🔥';
  if (progress >= 50) return 'Metade do caminho! Continue assim! 💪';
  if (progress >= 25) return `Você já conquistou ${formatCurrency(current)} 🎉`;
  if (current > 0) return 'Bom começo! Cada passo conta! 🌱';
  return 'Defina seu primeiro depósito! 🚀';
}

function getDeadlineLabel(deadline: string | null): string | null {
  if (!deadline) return null;
  const days = differenceInDays(parseISO(deadline), new Date());
  if (days < 0) return 'Prazo vencido';
  if (days === 0) return 'Vence hoje';
  if (days <= 30) return `${days} dias restantes`;
  return format(parseISO(deadline), "dd 'de' MMM, yyyy", { locale: ptBR });
}

export default function GoalCard({ goal, onEdit, onDelete }: GoalCardProps) {
  const progress = goal.target_amount > 0
    ? Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100))
    : 0;
  const remaining = Math.max(0, goal.target_amount - goal.current_amount);
  const motivational = getMotivationalMessage(goal.current_amount, goal.target_amount, progress);
  const deadlineLabel = getDeadlineLabel(goal.deadline);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      <Card className="border-border/40 bg-card overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-2xl shrink-0">
              {goal.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground truncate text-base">{goal.name}</h3>
                <div className="flex items-center gap-0.5 shrink-0 ml-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => onEdit(goal)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => onDelete(goal.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Tags row */}
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                <span className="text-[11px] rounded-full bg-muted px-2 py-0.5 text-muted-foreground font-medium">{goal.category}</span>
                <span className="text-[11px] rounded-full bg-muted px-2 py-0.5 text-muted-foreground font-medium">{goal.goal_type}</span>
                {deadlineLabel && (
                  <span className="text-[11px] rounded-full bg-primary/10 px-2 py-0.5 text-primary font-medium flex items-center gap-1">
                    <CalendarClock className="h-3 w-3" />
                    {deadlineLabel}
                  </span>
                )}
              </div>

              {/* Progress section */}
              <div className="mt-4 space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-lg font-bold text-foreground tabular-nums">
                    {formatCurrency(goal.current_amount)}
                  </span>
                  <span className="text-sm text-muted-foreground tabular-nums">
                    de {formatCurrency(goal.target_amount)}
                  </span>
                </div>
                <Progress value={progress} className="h-3 rounded-full" gradient />
                <div className="flex justify-between items-center">
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(remaining)} restantes
                  </p>
                  <p className="text-xs font-semibold text-primary tabular-nums">{progress}%</p>
                </div>
              </div>

              {/* Motivational */}
              <p className="text-xs text-primary/80 mt-2 font-medium">{motivational}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
