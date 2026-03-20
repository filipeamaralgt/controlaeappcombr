import { GoalInsert } from '@/hooks/useGoals';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const ICONS = ['✈️', '🚘', '🏡', '🎓', '💵', '💍', '🎯', '⭐', '🩺', '🏅', '🎉'];

interface GoalFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingId: string | null;
  form: GoalInsert;
  setForm: (form: GoalInsert) => void;
  onSubmit: () => void;
  isPending: boolean;
  profiles?: { id: string; name: string; icon: string }[];
}

function formatCurrencyInput(value: string): string {
  const digits = value.replace(/\D/g, '');
  const num = parseInt(digits || '0', 10) / 100;
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseCurrencyInput(formatted: string): number {
  const clean = formatted.replace(/\./g, '').replace(',', '.');
  return parseFloat(clean) || 0;
}

export default function GoalFormDialog({
  open,
  onOpenChange,
  editingId,
  form,
  setForm,
  onSubmit,
  isPending,
  profiles,
}: GoalFormDialogProps) {
  const [showMore, setShowMore] = useState(false);

  const handleCurrencyChange = (field: 'target_amount' | 'current_amount') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    const num = parseInt(raw || '0', 10) / 100;
    setForm({ ...form, [field]: num });
  };

  const displayCurrency = (val: number) => {
    if (val === 0) return '';
    return val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const isValid = form.name.trim().length > 0 && form.target_amount > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">{editingId ? 'Editar Meta' : 'Nova Meta'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          {/* Name */}
          <div className="space-y-1.5">
            <Label>Nome da meta *</Label>
            <Input
              placeholder="Ex: Viagem para Europa, Reserva de emergência"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              autoFocus
            />
          </div>

          {/* Target amount */}
          <div className="space-y-1.5">
            <Label>Quanto você quer juntar? *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">R$</span>
              <Input
                className="pl-10 text-lg font-semibold tabular-nums"
                placeholder="0,00"
                value={displayCurrency(form.target_amount)}
                onChange={handleCurrencyChange('target_amount')}
                inputMode="numeric"
              />
            </div>
          </div>

          {/* Deadline */}
          <div className="space-y-1.5">
            <Label>Prazo (opcional)</Label>
            <Input
              type="date"
              value={form.deadline || ''}
              onChange={(e) => setForm({ ...form, deadline: e.target.value || null })}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Icon picker */}
          <div className="space-y-1.5">
            <Label>Ícone</Label>
            <div className="flex flex-wrap gap-2">
              {ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setForm({ ...form, icon })}
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-xl border-2 text-xl transition-all active:scale-95',
                    form.icon === icon
                      ? 'border-primary bg-primary/10 scale-110'
                      : 'border-border bg-secondary/30 hover:border-primary/40'
                  )}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Current amount */}
          <div className="space-y-1.5">
            <Label>Valor já guardado</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
              <Input
                className="pl-10 tabular-nums"
                placeholder="0,00"
                value={displayCurrency(form.current_amount)}
                onChange={handleCurrencyChange('current_amount')}
                inputMode="numeric"
              />
            </div>
          </div>

          {profiles && profiles.length > 0 && (
            <div className="space-y-1.5">
              <Label>Membro</Label>
              <Select
                value={form.profile_id || 'none'}
                onValueChange={(v) => setForm({ ...form, profile_id: v === 'none' ? null : v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem perfil</SelectItem>
                  {profiles.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.icon} {p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button
            onClick={onSubmit}
            disabled={isPending || !isValid}
            className="w-full h-11 text-base font-semibold"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : editingId ? (
              'Salvar alterações'
            ) : (
              'Criar meta 🎯'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
