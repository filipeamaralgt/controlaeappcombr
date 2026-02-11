import { useState } from 'react';
import { Plus, Trash2, Loader2, CreditCard, Power, PowerOff, RefreshCw, Calendar, Pencil, Check, Clock } from 'lucide-react';
import { GreenPageHeader } from '@/components/GreenPageHeader';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  useRecurringPayments,
  useCreateRecurringPayment,
  useUpdateRecurringPayment,
  useDeleteRecurringPayment,
  useGenerateRecurringTransactions,
  type RecurringPayment,
} from '@/hooks/useRecurringPayments';
import { useCategories } from '@/hooks/useCategories';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { RecurringPaymentFormDialog } from '@/components/RecurringPaymentFormDialog';

export default function Pagamentos() {
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<RecurringPayment | null>(null);
  const [confirmTogglePayment, setConfirmTogglePayment] = useState<RecurringPayment | null>(null);
  const [confirmDeletePayment, setConfirmDeletePayment] = useState<RecurringPayment | null>(null);

  const { data: payments, isLoading } = useRecurringPayments(activeTab);
  const { data: categories } = useCategories(activeTab);
  const createPayment = useCreateRecurringPayment();
  const updatePayment = useUpdateRecurringPayment();
  const deletePayment = useDeleteRecurringPayment();
  const generateTransactions = useGenerateRecurringTransactions();

  const handleOpenCreate = () => {
    setEditingPayment(null);
    setFormDialogOpen(true);
  };

  const handleOpenEdit = (payment: RecurringPayment) => {
    setEditingPayment(payment);
    setFormDialogOpen(true);
  };

  const handleFormSubmit = async (data: {
    description: string;
    amount: number;
    category_id: string;
    day_of_month: number;
    notes?: string;
  }) => {
    try {
      if (editingPayment) {
        await updatePayment.mutateAsync({ id: editingPayment.id, ...data });
        toast.success('Pagamento atualizado!');
      } else {
        await createPayment.mutateAsync({ ...data, type: activeTab });
        toast.success('Pagamento recorrente criado!');
      }
      setFormDialogOpen(false);
      setEditingPayment(null);
    } catch {
      toast.error(editingPayment ? 'Erro ao atualizar pagamento' : 'Erro ao criar pagamento');
    }
  };

  const handleToggleActive = async (payment: RecurringPayment) => {
    const willDeactivate = payment.is_active;
    try {
      await updatePayment.mutateAsync({ id: payment.id, is_active: !willDeactivate });

      if (willDeactivate) {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

        await supabase
          .from('transactions')
          .delete()
          .eq('description', payment.description)
          .eq('category_id', payment.category_id)
          .eq('type', payment.type)
          .gte('date', startDate)
          .lte('date', endDate)
          .like('notes', '%[Recorrente]%');
      } else {
        await supabase.functions.invoke('generate-recurring-transactions');
      }

      toast.success(willDeactivate ? 'Pagamento desativado' : 'Pagamento ativado');
    } catch {
      toast.error('Erro ao atualizar pagamento');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePayment.mutateAsync(id);
      toast.success('Pagamento excluído!');
    } catch {
      toast.error('Erro ao excluir pagamento');
    }
  };

  const handleGenerate = async () => {
    try {
      const result = await generateTransactions.mutateAsync();
      toast.success(`${result?.generated || 0} transação(ões) gerada(s)!`);
    } catch {
      toast.error('Erro ao gerar transações');
    }
  };

  const formatCurrency = (value: number) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const totalActive = payments?.filter((p) => p.is_active).reduce((sum, p) => sum + Number(p.amount), 0) || 0;

  return (
    <div className="min-h-screen pb-24">
      <GreenPageHeader title="Pagamentos Regulares" subtitle="Gerencie seus pagamentos recorrentes" />

      <div className="px-4 pt-6 max-w-4xl mx-auto space-y-4">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={handleGenerate}
          disabled={generateTransactions.isPending}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${generateTransactions.isPending ? 'animate-spin' : ''}`} />
          Gerar Lançamentos
        </Button>

        {/* Summary */}
        <Card className="border-border/50 bg-card">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Mensal Ativo</p>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(totalActive)}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <CreditCard className="h-6 w-6 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'expense' | 'income')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="expense">Despesas</TabsTrigger>
            <TabsTrigger value="income">Receitas</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4 space-y-4">
            <Button className="w-full" onClick={handleOpenCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Pagamento Recorrente
            </Button>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : payments?.length === 0 ? (
              <Card className="border-border/50 bg-card">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <CreditCard className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Nenhum pagamento</h3>
                  <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                    Adicione pagamentos recorrentes como aluguel, assinaturas e contas mensais.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {payments?.map((payment) => (
                  <Card key={payment.id} className={`border-border/50 transition-opacity ${!payment.is_active ? 'opacity-50' : ''}`}>
                    <CardContent className="flex items-center gap-3 p-4">
                      <div
                        className="h-10 w-10 shrink-0 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${payment.categories?.color}20` }}
                      >
                        <div
                          className="h-4 w-4 rounded-full"
                          style={{ backgroundColor: payment.categories?.color }}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {payment.description}
                          </p>
                          <p className="shrink-0 text-sm font-bold text-foreground">
                            {formatCurrency(Number(payment.amount))}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                          <Calendar className="h-3 w-3 shrink-0" />
                          <span className="shrink-0">Dia {payment.day_of_month}</span>
                          <span className="shrink-0">•</span>
                          <span className="truncate">{payment.categories?.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          {(() => {
                            const now = new Date();
                            const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                            const isGenerated = payment.last_generated_date?.substring(0, 7) === currentMonthStr;
                            return payment.is_active ? (
                              isGenerated ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-medium text-green-600 dark:text-green-400">
                                  <Check className="h-3 w-3" />
                                  Gerado este mês
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                                  <Clock className="h-3 w-3" />
                                  Pendente
                                </span>
                              )
                            ) : null;
                          })()}
                          {payment.notes && (
                            <span className="truncate text-xs text-muted-foreground">{payment.notes}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => handleOpenEdit(payment)} title="Editar">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => payment.is_active ? setConfirmTogglePayment(payment) : handleToggleActive(payment)} title={payment.is_active ? 'Desativar' : 'Ativar'}>
                          {payment.is_active ? (
                            <Power className="h-4 w-4 text-green-500" />
                          ) : (
                            <PowerOff className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setConfirmDeletePayment(payment)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Create / Edit form dialog */}
        <RecurringPaymentFormDialog
          open={formDialogOpen}
          onOpenChange={(open) => {
            setFormDialogOpen(open);
            if (!open) setEditingPayment(null);
          }}
          categories={categories}
          editingPayment={editingPayment}
          isPending={createPayment.isPending || updatePayment.isPending}
          onSubmit={handleFormSubmit}
        />

        {/* Confirm deactivation dialog */}
        <AlertDialog open={!!confirmTogglePayment} onOpenChange={(open) => !open && setConfirmTogglePayment(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Desativar pagamento recorrente?</AlertDialogTitle>
              <AlertDialogDescription>
                A transação de "{confirmTogglePayment?.description}" deste mês será removida e não será gerada nos próximos meses até você reativar.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => { if (confirmTogglePayment) { handleToggleActive(confirmTogglePayment); setConfirmTogglePayment(null); } }}>
                Desativar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Confirm deletion dialog */}
        <AlertDialog open={!!confirmDeletePayment} onOpenChange={(open) => !open && setConfirmDeletePayment(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir pagamento recorrente?</AlertDialogTitle>
              <AlertDialogDescription>
                "{confirmDeletePayment?.description}" será removido permanentemente. As transações já geradas não serão afetadas.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => { if (confirmDeletePayment) { handleDelete(confirmDeletePayment.id); setConfirmDeletePayment(null); } }}
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
