import { useState } from 'react';
import { useCards, Card as CardType, CardInsert } from '@/hooks/useCards';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card as UICard, CardContent } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { CreditCard, Plus, Pencil, Trash2 } from 'lucide-react';
import { GreenPageHeader } from '@/components/GreenPageHeader';
import { Progress } from '@/components/ui/progress';

export default function Cartoes() {
  const { cards, isLoading, createCard, updateCard, deleteCard } = useCards();
  const [open, setOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CardType | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleOpenNew = () => {
    setEditingCard(null);
    setOpen(true);
  };

  const handleEdit = (card: CardType) => {
    setEditingCard(card);
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload: CardInsert = {
      name: (fd.get('name') as string).trim(),
      institution: (fd.get('institution') as string).trim(),
      closing_day: Number(fd.get('closing_day')),
      due_day: Number(fd.get('due_day')),
      credit_limit: Number((fd.get('credit_limit') as string) || 0),
      current_bill: Number((fd.get('current_bill') as string) || 0),
    };
    if (!payload.name || !payload.institution) return;

    if (editingCard) {
      updateCard.mutate({ id: editingCard.id, ...payload }, { onSuccess: () => setOpen(false) });
    } else {
      createCard.mutate(payload, { onSuccess: () => setOpen(false) });
    }
  };

  const totalLimit = cards.reduce((s, c) => s + Number(c.credit_limit || 0), 0);
  const totalBill = cards.reduce((s, c) => s + Number(c.current_bill || 0), 0);

  return (
    <div className="min-h-screen pb-24">
      <GreenPageHeader title="Cartões de Crédito" subtitle="Gerencie seus cartões">
        {cards.length > 0 && (
          <div className="mt-3 bg-background/10 backdrop-blur-sm rounded-xl p-3 flex justify-between items-center">
            <div>
              <p className="text-xs opacity-70">Fatura total</p>
              <p className="text-xl font-bold">
                R$ {totalBill.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            {totalLimit > 0 && (
              <div className="text-right">
                <p className="text-xs opacity-70">Limite total</p>
                <p className="text-lg font-semibold">
                  R$ {totalLimit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            )}
          </div>
        )}
      </GreenPageHeader>

      <div className="px-4 pt-6 max-w-2xl mx-auto space-y-4">
        <Button onClick={handleOpenNew} className="w-full gap-2">
          <Plus className="h-4 w-4" /> Novo Cartão
        </Button>

        {isLoading && <p className="text-center text-muted-foreground">Carregando...</p>}

        {!isLoading && cards.length === 0 && (
          <p className="text-center text-muted-foreground py-8">Nenhum cartão cadastrado.</p>
        )}

        {cards.map((card) => {
          const usagePercent = card.credit_limit > 0
            ? Math.min((Number(card.current_bill) / Number(card.credit_limit)) * 100, 100)
            : 0;

          return (
            <UICard key={card.id} className="relative overflow-hidden border-border/40">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-primary/10 p-2.5">
                      <CreditCard className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{card.name}</p>
                      <p className="text-xs text-muted-foreground">{card.institution}</p>
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(card)}>
                      <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeletingId(card.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fechamento</span>
                    <span className="font-medium">dia {card.closing_day}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Vencimento</span>
                    <span className="font-medium">dia {card.due_day}</span>
                  </div>
                </div>

                {card.credit_limit > 0 && (
                  <div className="space-y-1.5 pt-1 border-t border-border/30">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Fatura: <span className="font-medium text-foreground">R$ {Number(card.current_bill).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </span>
                      <span className="text-muted-foreground">
                        Limite: <span className="font-medium text-foreground">R$ {Number(card.credit_limit).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </span>
                    </div>
                    <Progress value={usagePercent} className="h-2" gradient />
                    <p className="text-xs text-muted-foreground text-right">{usagePercent.toFixed(0)}% utilizado</p>
                  </div>
                )}
              </CardContent>
            </UICard>
          );
        })}
      </div>

      {/* Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCard ? 'Editar Cartão' : 'Novo Cartão'}</DialogTitle>
            <DialogDescription>Preencha os dados do cartão de crédito.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Nome do Cartão *</Label>
              <Input name="name" placeholder="Ex: Nubank, Inter, Santander" defaultValue={editingCard?.name ?? ''} required />
            </div>
            <div>
              <Label>Instituição Bancária *</Label>
              <Input name="institution" placeholder="Ex: Nubank, Itaú, Bradesco" defaultValue={editingCard?.institution ?? ''} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Dia do Fechamento *</Label>
                <Input name="closing_day" type="number" min={1} max={31} placeholder="Ex: 25" defaultValue={editingCard?.closing_day ?? ''} required />
                <p className="text-xs text-muted-foreground mt-1">Quando a fatura fecha</p>
              </div>
              <div>
                <Label>Dia do Vencimento *</Label>
                <Input name="due_day" type="number" min={1} max={31} placeholder="Ex: 10" defaultValue={editingCard?.due_day ?? ''} required />
                <p className="text-xs text-muted-foreground mt-1">Quando a fatura vence</p>
              </div>
            </div>
            <div>
              <Label>Limite do Cartão (opcional)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                <Input name="credit_limit" type="number" step="0.01" min={0} className="pl-10" placeholder="0,00" defaultValue={editingCard?.credit_limit ?? ''} />
              </div>
            </div>
            <div>
              <Label>Fatura Atual (opcional)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                <Input name="current_bill" type="number" step="0.01" min={0} className="pl-10" placeholder="0,00" defaultValue={editingCard?.current_bill ?? ''} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Valor da fatura que já existe</p>
            </div>
            <Button type="submit" className="w-full" disabled={createCard.isPending || updateCard.isPending}>
              {editingCard ? 'Salvar' : 'Cadastrar'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <DeleteConfirmDialog
        open={!!deletingId}
        onOpenChange={(o) => !o && setDeletingId(null)}
        onConfirm={() => {
          if (deletingId) deleteCard.mutate(deletingId, { onSuccess: () => setDeletingId(null) });
        }}
        title="Excluir cartão"
        description="Tem certeza que deseja excluir este cartão?"
      />
    </div>
  );
}
