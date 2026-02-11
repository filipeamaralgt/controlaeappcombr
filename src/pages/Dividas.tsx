import { useState } from 'react';
import { useDebts, Debt, DebtInsert } from '@/hooks/useDebts';
import { useCards } from '@/hooks/useCards';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import {
  AlertTriangle, Plus, Pencil, Trash2, TrendingDown, Clock, Flame, Lightbulb, CheckCircle2,
} from 'lucide-react';
import { GreenPageHeader } from '@/components/GreenPageHeader';
import { useProfileFilter } from '@/hooks/useProfileFilter';
import { useSpendingProfiles } from '@/hooks/useSpendingProfiles';

import { format, parseISO, differenceInDays, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function getDaysOverdue(dueDate: string) {
  const due = parseISO(dueDate);
  if (!isPast(due)) return 0;
  return differenceInDays(new Date(), due);
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case 'alta': return 'text-destructive';
    case 'média': return 'text-yellow-500';
    case 'baixa': return 'text-green-500';
    default: return 'text-muted-foreground';
  }
}

function getPriorityBadge(priority: string) {
  switch (priority) {
    case 'alta': return 'destructive' as const;
    case 'média': return 'secondary' as const;
    case 'baixa': return 'outline' as const;
    default: return 'secondary' as const;
  }
}

function getMayaSuggestion(debt: Debt): string {
  const overdue = getDaysOverdue(debt.due_date);
  const remaining = Number(debt.total_amount) - Number(debt.paid_amount);
  const interestRate = Number(debt.interest_rate);

  if (debt.is_paid) return '✅ Parabéns! Dívida quitada!';
  if (overdue > 30 && interestRate > 5)
    return '🚨 Priorize esta dívida! Juros altos + atraso geram bola de neve. Negocie o valor total.';
  if (overdue > 0)
    return `⚠️ Em atraso há ${overdue} dias. Entre em contato com o credor para negociar.`;
  if (interestRate > 10)
    return '🔥 Juros muito altos! Considere transferir para um crédito com taxa menor.';
  if (interestRate > 5)
    return '💡 Tente antecipar parcelas para reduzir o custo total dos juros.';
  if (remaining < Number(debt.total_amount) * 0.2)
    return '🎯 Quase lá! Faltam menos de 20%. Um esforço final quita essa dívida!';
  return '📋 Mantenha os pagamentos em dia para evitar juros adicionais.';
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

  const filteredDebts = profileFilter
    ? debts.filter((d) => d.profile_id === profileFilter)
    : debts;

  const activeDebts = filteredDebts.filter(d => !d.is_paid);
  const paidDebts = filteredDebts.filter(d => d.is_paid);
  const totalOwed = activeDebts.reduce((sum, d) => sum + (Number(d.total_amount) - Number(d.paid_amount)), 0);

  const handleOpenNew = () => {
    setEditingDebt(null);
    setIsInstallment(false);
    setPriority('média');
    const autoProfile = profiles?.length === 1 ? profiles[0].id : profileFilter;
    setSelectedProfile(autoProfile || 'none');
    setOpen(true);
  };

  const handleEdit = (debt: Debt) => {
    setEditingDebt(debt);
    setIsInstallment(debt.is_installment);
    setPriority(debt.priority);
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
      interest_rate: Number(fd.get('interest_rate') || 0),
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

      <div className="px-4 pt-6 max-w-2xl mx-auto space-y-4">
        {/* Total card */}
        <Card className="border-destructive/30 bg-destructive/5">
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
          const suggestion = getMayaSuggestion(debt);

          return (
            <Card key={debt.id} className="overflow-hidden">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{debt.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Vencimento: {format(parseISO(debt.due_date), "dd MMM yyyy", { locale: ptBR })}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Badge variant={getPriorityBadge(debt.priority)}>
                      <Flame className="h-3 w-3 mr-1" />
                      {debt.priority}
                    </Badge>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(debt)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeletingId(debt.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Pago: R$ {Number(debt.paid_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    <span className="font-medium">R$ {Number(debt.total_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <Progress value={progress} className="h-2" gradient />
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  {Number(debt.interest_rate) > 0 && (
                    <div className="flex items-center gap-1">
                      <TrendingDown className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Juros: {Number(debt.interest_rate)}% a.m.</span>
                    </div>
                  )}
                  {overdue > 0 && (
                    <div className="flex items-center gap-1 text-destructive">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{overdue} dias em atraso</span>
                    </div>
                  )}
                  {debt.is_installment && (
                    <div className="text-muted-foreground">
                      Parcelas: {debt.installment_paid}/{debt.installment_count}
                    </div>
                  )}
                  <div className="text-muted-foreground">
                    Resta: R$ {remaining.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="rounded-lg bg-muted/50 p-3 text-sm flex gap-2">
                  <Lightbulb className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>{suggestion}</span>
                </div>

                <Button variant="outline" size="sm" className="w-full gap-1" onClick={() => togglePaid(debt)}>
                  <CheckCircle2 className="h-4 w-4" /> Marcar como quitada
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
              <Label>Juros mensal (%)</Label>
              <Input name="interest_rate" type="number" step="0.01" min={0} placeholder="0" defaultValue={editingDebt?.interest_rate ?? ''} />
            </div>
            <div>
              <Label>Prioridade</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alta">🔴 Alta</SelectItem>
                  <SelectItem value="média">🟡 Média</SelectItem>
                  <SelectItem value="baixa">🟢 Baixa</SelectItem>
                </SelectContent>
              </Select>
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
            {cards.length > 0 && (
              <div>
                <Label>Cartão de Crédito (Opcional)</Label>
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
