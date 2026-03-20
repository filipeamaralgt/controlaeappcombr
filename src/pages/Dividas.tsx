import { useState } from 'react';
import { useDebts, Debt, DebtInsert } from '@/hooks/useDebts';
import { useCards } from '@/hooks/useCards';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import {
  AlertTriangle, Plus, Pencil, Trash2, CheckCircle2, Calendar,
} from 'lucide-react';
import { GreenPageHeader } from '@/components/GreenPageHeader';
import { useProfileFilter } from '@/hooks/useProfileFilter';
import { useSpendingProfiles } from '@/hooks/useSpendingProfiles';
import { cn } from '@/lib/utils';

import { format, parseISO, differenceInDays, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function getDaysOverdue(dueDate: string) {
  const due = parseISO(dueDate);
  if (!isPast(due)) return 0;
  return differenceInDays(new Date(), due);
}

const PRIORITY_CONFIG = {
  alta: { label: 'Alta', dot: 'bg-destructive', bg: 'bg-destructive/8', text: 'text-destructive', border: 'border-destructive/20' },
  média: { label: 'Média', dot: 'bg-yellow-500', bg: 'bg-yellow-500/8', text: 'text-yellow-600', border: 'border-yellow-500/20' },
  baixa: { label: 'Baixa', dot: 'bg-green-500', bg: 'bg-green-500/8', text: 'text-green-600', border: 'border-green-500/20' },
} as const;

function getPayoffEstimate(debt: Debt): string | null {
  if (debt.is_paid) return null;
  const remaining = Number(debt.total_amount) - Number(debt.paid_amount);
  if (remaining <= 0) return null;

  if (debt.is_installment) {
    const left = (debt.installment_count ?? 0) - (debt.installment_paid ?? 0);
    if (left > 0) return `~${left} ${left === 1 ? 'parcela restante' : 'parcelas restantes'}`;
  }

  // Estimate based on 10% of total per month as a suggestion
  const monthlyPayment = Number(debt.total_amount) * 0.1;
  if (monthlyPayment > 0) {
    const months = Math.ceil(remaining / monthlyPayment);
    if (months <= 1) return 'Pode quitar este mês';
    return `~${months} meses pagando R$ ${monthlyPayment.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/mês`;
  }
  return null;
}

export default function Dividas() {
  const { debts, isLoading, createDebt, updateDebt, deleteDebt } = useDebts();
  const { cards } = useCards();
  const { profileFilter } = useProfileFilter();
  const { data: profiles } = useSpendingProfiles();
  const [open, setOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isInstallment, setIsInstallment] = useState(false);
  const [priority, setPriority] = useState('média');
  const [selectedProfile, setSelectedProfile] = useState('none');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const filteredDebts = profileFilter
    ? debts.filter((d) => d.profile_id === profileFilter)
    : debts.filter((d) => !d.profile_id);

  const activeDebts = filteredDebts.filter(d => !d.is_paid);
  const paidDebts = filteredDebts.filter(d => d.is_paid);
  const totalOwed = activeDebts.reduce((sum, d) => sum + (Number(d.total_amount) - Number(d.paid_amount)), 0);

  const handleOpenNew = () => {
    setEditingDebt(null);
    setIsInstallment(false);
    setPriority('média');
    setShowAdvanced(false);
    const autoProfile = profiles?.length === 1 ? profiles[0].id : profileFilter;
    setSelectedProfile(autoProfile || 'none');
    setOpen(true);
  };

  const handleEdit = (debt: Debt) => {
    setEditingDebt(debt);
    setIsInstallment(debt.is_installment);
    setPriority(debt.priority);
    setShowAdvanced(Number(debt.interest_rate) > 0);
    setSelectedProfile(debt.profile_id ?? 'none');
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload: DebtInsert = {
      name: (fd.get('name') as string).trim(),
      total_amount: Number(fd.get('total_amount') || 0),
      due_date: fd.get('due_date') as string,
      interest_rate: showAdvanced ? Number(fd.get('interest_rate') || 0) : 0,
      is_installment: isInstallment,
      installment_count: isInstallment ? Number(fd.get('installment_count') || 1) : 1,
      installment_paid: isInstallment ? Number(fd.get('installment_paid') || 0) : 0,
      priority,
      profile_id: selectedProfile === 'none' ? null : selectedProfile,
    };
    if (!payload.name || !payload.total_amount) return;

    if (editingDebt) {
      updateDebt.mutate({ id: editingDebt.id, ...payload } as any, { onSuccess: () => setOpen(false) });
    } else {
      createDebt.mutate(payload, { onSuccess: () => setOpen(false) });
    }
  };

  const togglePaid = (debt: Debt) => {
    updateDebt.mutate({ id: debt.id, is_paid: !debt.is_paid, paid_amount: !debt.is_paid ? debt.total_amount : 0 });
  };

  return (
    <div className="min-h-screen pb-24">
      <GreenPageHeader title="Dívidas" subtitle="Controle suas pendências" />

      <div className="px-4 pt-6 max-w-3xl mx-auto space-y-4">
        {/* Total card */}
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="rounded-full bg-destructive/10 p-3">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total devido</p>
              <p className="text-2xl font-bold text-destructive">
                R$ {totalOwed.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleOpenNew} className="w-full gap-2">
          <Plus className="h-4 w-4" /> Nova Dívida
        </Button>

        {isLoading && <p className="text-center text-muted-foreground">Carregando...</p>}

        {/* Active debts */}
        {activeDebts.map((debt) => {
          const remaining = Number(debt.total_amount) - Number(debt.paid_amount);
          const progress = Number(debt.total_amount) > 0
            ? (Number(debt.paid_amount) / Number(debt.total_amount)) * 100 : 0;
          const overdue = getDaysOverdue(debt.due_date);
          const pConfig = PRIORITY_CONFIG[debt.priority as keyof typeof PRIORITY_CONFIG] ?? PRIORITY_CONFIG['média'];
          const estimate = getPayoffEstimate(debt);

          return (
            <Card key={debt.id} className={cn('overflow-hidden border', pConfig.border)}>
              <CardContent className="p-4 space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className={cn('h-2.5 w-2.5 rounded-full', pConfig.dot)} />
                      <p className="font-semibold text-[15px]">{debt.name}</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {overdue > 0
                          ? `Venceu há ${overdue} dias`
                          : `Vence em ${format(parseISO(debt.due_date), "dd MMM yyyy", { locale: ptBR })}`
                        }
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(debt)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeletingId(debt.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Progress */}
                <div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-muted-foreground">
                      {Math.round(progress)}% pago
                    </span>
                    <span className="font-semibold">
                      R$ {remaining.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} restante
                    </span>
                  </div>
                  <Progress value={progress} className="h-2" gradient />
                </div>

                {/* Installment info */}
                {debt.is_installment && (
                  <p className="text-xs text-muted-foreground">
                    Parcela {debt.installment_paid} de {debt.installment_count}
                  </p>
                )}

                {/* Payoff estimate */}
                {estimate && (
                  <p className="text-xs text-muted-foreground italic">{estimate}</p>
                )}

                {/* Quit button */}
                <Button
                  variant="default"
                  size="sm"
                  className="w-full gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => togglePaid(debt)}
                >
                  <CheckCircle2 className="h-4 w-4" /> Quitar dívida
                </Button>
              </CardContent>
            </Card>
          );
        })}

        {/* Paid debts */}
        {paidDebts.length > 0 && (
          <>
            <h2 className="text-sm font-semibold text-muted-foreground pt-2">Quitadas</h2>
            {paidDebts.map((debt) => (
              <Card key={debt.id} className="opacity-60">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium line-through">{debt.name}</p>
                      <p className="text-xs text-muted-foreground">
                        R$ {Number(debt.total_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => togglePaid(debt)}>Reabrir</Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeletingId(debt.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        )}

        {!isLoading && filteredDebts.length === 0 && (
          <p className="text-center text-muted-foreground py-8">Nenhuma dívida cadastrada. 🎉</p>
        )}
      </div>

      {/* Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingDebt ? 'Editar Dívida' : 'Nova Dívida'}</DialogTitle>
            <DialogDescription>Cadastre os dados da dívida.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input name="name" placeholder="Ex: Empréstimo" defaultValue={editingDebt?.name ?? ''} required />
            </div>
            <div>
              <Label>Valor Total</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                <Input name="total_amount" type="number" step="0.01" min={0} className="pl-10" placeholder="0,00" defaultValue={editingDebt?.total_amount ?? ''} required />
              </div>
            </div>
            <div>
              <Label>Vencimento</Label>
              <Input name="due_date" type="date" defaultValue={editingDebt?.due_date ?? format(new Date(), 'yyyy-MM-dd')} required />
            </div>
            <div>
              <Label>Prioridade</Label>
              <div className="grid grid-cols-3 gap-2">
                {(['alta', 'média', 'baixa'] as const).map((p) => {
                  const cfg = PRIORITY_CONFIG[p];
                  const selected = priority === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={cn(
                        'flex items-center justify-center gap-1.5 rounded-lg border py-2.5 text-sm font-medium transition-all',
                        selected
                          ? cn(cfg.bg, cfg.border, cfg.text, 'ring-1', p === 'alta' ? 'ring-destructive/30' : p === 'média' ? 'ring-yellow-500/30' : 'ring-green-500/30')
                          : 'border-border text-muted-foreground hover:bg-muted/50'
                      )}
                    >
                      <div className={cn('h-2 w-2 rounded-full', cfg.dot)} />
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="font-medium text-sm">Parcelado</p>
                <p className="text-xs text-muted-foreground">Dividir em parcelas mensais</p>
              </div>
              <Switch checked={isInstallment} onCheckedChange={setIsInstallment} />
            </div>
            {isInstallment && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Total de Parcelas</Label>
                  <Input name="installment_count" type="number" min={1} defaultValue={editingDebt?.installment_count ?? 1} />
                </div>
                <div>
                  <Label>Parcelas Pagas</Label>
                  <Input name="installment_paid" type="number" min={0} defaultValue={editingDebt?.installment_paid ?? 0} />
                </div>
              </div>
            )}

            {/* Advanced toggle */}
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {showAdvanced ? '− Ocultar opções avançadas' : '+ Opções avançadas (juros, cartão)'}
            </button>

            {showAdvanced && (
              <div className="space-y-4">
                <div>
                  <Label>Juros mensal (%)</Label>
                  <Input name="interest_rate" type="number" step="0.01" min={0} placeholder="0" defaultValue={editingDebt?.interest_rate ?? ''} />
                </div>
                {cards.length > 0 && (
                  <div>
                    <Label>Cartão de Crédito</Label>
                    <Select name="card_id" defaultValue="none">
                      <SelectTrigger>
                        <SelectValue placeholder="Sem cartão" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sem cartão</SelectItem>
                        {cards.map((card) => (
                          <SelectItem key={card.id} value={card.id}>
                            {card.name} - {card.institution}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}

            {profiles && profiles.length > 0 && (
              <div>
                <Label>Membro</Label>
                <Select value={selectedProfile} onValueChange={setSelectedProfile}>
                  <SelectTrigger><SelectValue placeholder="Sem perfil" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem perfil</SelectItem>
                    {profiles.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.icon} {p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button type="submit" className="w-full" disabled={createDebt.isPending || updateDebt.isPending}>
              {editingDebt ? 'Salvar' : 'Adicionar'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={!!deletingId}
        onOpenChange={(o) => !o && setDeletingId(null)}
        onConfirm={() => {
          if (deletingId) deleteDebt.mutate(deletingId, { onSuccess: () => setDeletingId(null) });
        }}
        title="Excluir dívida"
        description="Tem certeza que deseja excluir esta dívida?"
      />
    </div>
  );
}
