import { useState } from 'react';
import { useInstallments, Installment, InstallmentInsert } from '@/hooks/useInstallments';
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
import { Plus, Pencil, Trash2, CreditCard, CheckCircle2, Receipt, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Parcelas() {
  const { installments, isLoading, create, update, remove } = useInstallments();
  const navigate = useNavigate();
  const { cards } = useCards();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Installment | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [manualValue, setManualValue] = useState(false);
  const [selectedCard, setSelectedCard] = useState('none');

  const active = installments.filter(i => !i.is_completed);
  const completed = installments.filter(i => i.is_completed);

  const totalRemaining = active.reduce((sum, i) => {
    const valuePerInstallment = i.manual_value && i.installment_value
      ? i.installment_value
      : i.total_amount / i.installment_count;
    return sum + valuePerInstallment * (i.installment_count - i.installment_paid);
  }, 0);

  const handleOpenNew = () => {
    setEditing(null);
    setManualValue(false);
    setSelectedCard('none');
    setOpen(true);
  };

  const handleEdit = (item: Installment) => {
    setEditing(item);
    setManualValue(item.manual_value);
    setSelectedCard(item.card_id ?? 'none');
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const totalAmount = Number(fd.get('total_amount') || 0);
    const installmentCount = Number(fd.get('installment_count') || 1);

    const payload: InstallmentInsert = {
      name: (fd.get('name') as string).trim(),
      total_amount: totalAmount,
      installment_count: installmentCount,
      installment_paid: Number(fd.get('installment_paid') || 0),
      manual_value: manualValue,
      installment_value: manualValue ? Number(fd.get('installment_value') || 0) : null,
      next_due_date: fd.get('next_due_date') as string,
      card_id: selectedCard === 'none' ? null : selectedCard,
    };
    if (!payload.name) return;

    if (editing) {
      update.mutate({ id: editing.id, ...payload }, { onSuccess: () => setOpen(false) });
    } else {
      create.mutate(payload, { onSuccess: () => setOpen(false) });
    }
  };

  const getValuePerInstallment = (item: Installment) => {
    if (item.manual_value && item.installment_value) return item.installment_value;
    return item.total_amount / item.installment_count;
  };

  const getCardName = (cardId: string | null) => {
    if (!cardId) return null;
    const card = cards.find(c => c.id === cardId);
    return card ? `${card.name}` : null;
  };

  return (
    <div className="min-h-screen pb-24">
      <div className="bg-gradient-to-br from-primary/80 to-primary p-6 pt-10 text-primary-foreground">
        <button onClick={() => navigate(-1)} className="mb-2 flex items-center gap-1 text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>
        <h1 className="text-2xl font-bold">Parcelas</h1>
        <p className="text-sm opacity-80">Gerencie suas compras parceladas</p>
        <div className="mt-3 bg-background/10 backdrop-blur-sm rounded-xl p-3">
          <p className="text-xs opacity-70">Total restante</p>
          <p className="text-xl font-bold">
            R$ {totalRemaining.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <Button onClick={handleOpenNew} className="w-full gap-2">
          <Plus className="h-4 w-4" /> Nova Parcela
        </Button>

        {isLoading && <p className="text-center text-muted-foreground">Carregando...</p>}

        {!isLoading && installments.length === 0 && (
          <p className="text-center text-muted-foreground py-8">Nenhuma parcela cadastrada.</p>
        )}

        {active.map((item) => {
          const valuePerInstallment = getValuePerInstallment(item);
          const progress = (item.installment_paid / item.installment_count) * 100;
          const cardName = getCardName(item.card_id);

          return (
            <Card key={item.id} className="relative overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-primary/10 p-2">
                      <Receipt className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.installment_paid}/{item.installment_count} parcelas
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(item)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeletingId(item.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Parcela:</span>
                    <span className="font-medium">R$ {valuePerInstallment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total:</span>
                    <span>R$ {Number(item.total_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <Progress value={progress} className="h-2" gradient />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Próx: {format(parseISO(item.next_due_date), "dd 'de' MMM", { locale: ptBR })}</span>
                    {cardName && (
                      <span className="flex items-center gap-1">
                        <CreditCard className="h-3 w-3" /> {cardName}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {completed.length > 0 && (
          <>
            <h2 className="text-sm font-semibold text-muted-foreground pt-4 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> Concluídas
            </h2>
            {completed.map((item) => (
              <Card key={item.id} className="opacity-60">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.installment_count}x R$ {getValuePerInstallment(item).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeletingId(item.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </div>

      {/* Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Parcela' : 'Nova Parcela'}</DialogTitle>
            <DialogDescription>Preencha os dados da compra parcelada.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input name="name" placeholder="Ex: iPhone 16" defaultValue={editing?.name ?? ''} required />
            </div>
            <div>
              <Label>Valor Total *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                <Input name="total_amount" type="number" step="0.01" min={0} className="pl-10" placeholder="0,00" defaultValue={editing?.total_amount ?? ''} required />
              </div>
            </div>
            <div>
              <Label>Total de Parcelas *</Label>
              <Input name="installment_count" type="number" min={1} placeholder="12" defaultValue={editing?.installment_count ?? ''} required />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="font-medium text-sm">Definir valor da parcela manualmente</p>
                <p className="text-xs text-muted-foreground">
                  {manualValue ? 'Valor definido por você' : 'Valor calculado automaticamente'}
                </p>
              </div>
              <Switch checked={manualValue} onCheckedChange={setManualValue} />
            </div>

            {manualValue && (
              <div>
                <Label>Valor da Parcela</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                  <Input name="installment_value" type="number" step="0.01" min={0} className="pl-10" placeholder="0,00" defaultValue={editing?.installment_value ?? ''} />
                </div>
              </div>
            )}

            <div>
              <Label>Parcelas já pagas</Label>
              <Input name="installment_paid" type="number" min={0} placeholder="0" defaultValue={editing?.installment_paid ?? 0} />
            </div>

            <div>
              <Label>Próxima data de pagamento *</Label>
              <Input name="next_due_date" type="date" defaultValue={editing?.next_due_date ?? format(new Date(), 'yyyy-MM-dd')} required />
            </div>

            <div>
              <Label>Cartão de Crédito (Opcional)</Label>
              <Select value={selectedCard} onValueChange={setSelectedCard}>
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

            <Button type="submit" className="w-full" disabled={create.isPending || update.isPending}>
              {editing ? 'Salvar' : 'Adicionar Parcela'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={!!deletingId}
        onOpenChange={(o) => !o && setDeletingId(null)}
        onConfirm={() => {
          if (deletingId) remove.mutate(deletingId, { onSuccess: () => setDeletingId(null) });
        }}
        title="Excluir parcela"
        description="Tem certeza que deseja excluir esta parcela?"
      />
    </div>
  );
}
