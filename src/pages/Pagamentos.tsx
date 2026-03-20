import { useState, useMemo } from 'react';
import { Plus, Loader2, Calendar, Check, Clock, MoreVertical, Pencil, Power, PowerOff, Trash2, Repeat } from 'lucide-react';
import { GreenPageHeader } from '@/components/GreenPageHeader';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useRecurringPayments,
  useCreateRecurringPayment,
  useUpdateRecurringPayment,
  useDeleteRecurringPayment,
  useGenerateRecurringTransactions,
  type RecurringPayment,
} from '@/hooks/useRecurringPayments';
import { useCategories } from '@/hooks/useCategories';
import { useProfileFilter } from '@/hooks/useProfileFilter';
import { CategoryIcon } from '@/components/CategoryIcon';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

  const { data: allPayments, isLoading } = useRecurringPayments(activeTab);
  const { data: categories } = useCategories(activeTab);
  const { profileFilter } = useProfileFilter();
  const createPayment = useCreateRecurringPayment();
  const updatePayment = useUpdateRecurringPayment();
  const deletePayment = useDeleteRecurringPayment();
  const generateTransactions = useGenerateRecurringTransactions();

  const payments = profileFilter
    ? allPayments?.filter((p) => p.profile_id === profileFilter)
    : allPayments?.filter((p) => !p.profile_id);

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

      toast.success(willDeactivate ? 'Pagamento pausado' : 'Pagamento reativado');
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

  const formatCurrency = (value: number) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const totalActive = payments?.filter((p) => p.is_active).reduce((sum, p) => sum + Number(p.amount), 0) || 0;
  const activeCount = payments?.filter((p) => p.is_active).length || 0;

  const isIncome = activeTab === 'income';

  return (
    <div className="min-h-screen pb-24">
      <GreenPageHeader title="Pagamentos Regulares" subtitle="Gerencie seus pagamentos recorrentes" />

      <div className="px-4 pt-6 max-w-5xl mx-auto space-y-5">
        {/* Summary Card */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
          <Card className="border-border/40 bg-gradient-to-br from-card to-card/80 shadow-lg">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground tracking-wide uppercase">
                    {isIncome ? 'Receitas fixas do mês' : 'Despesas fixas do mês'}
                  </p>
                  <p className={cn(
                    'text-3xl font-bold tracking-tight tabular-nums',
                    isIncome ? 'text-green-600 dark:text-green-400' : 'text-foreground'
                  )}>
                    {formatCurrency(totalActive)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {activeCount} {activeCount === 1 ? (isIncome ? 'receita ativa' : 'pagamento ativo') : (isIncome ? 'receitas ativas' : 'pagamentos ativos')}
                  </p>
                </div>
                <div className={cn(
                  'flex h-14 w-14 items-center justify-center rounded-2xl',
                  isIncome ? 'bg-green-500/10' : 'bg-primary/10'
                )}>
                  <Repeat className={cn('h-7 w-7', isIncome ? 'text-green-600 dark:text-green-400' : 'text-primary')} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'expense' | 'income')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="expense">Despesas</TabsTrigger>
            <TabsTrigger value="income">Receitas</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4 space-y-3">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Button
                className={cn(
                  'w-full h-12 text-sm font-medium rounded-xl',
                  isIncome && 'bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700'
                )}
                onClick={handleOpenCreate}
              >
                <Plus className="mr-2 h-4 w-4" />
                {isIncome ? 'Nova receita' : 'Novo pagamento'}
              </Button>
            </motion.div>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : payments?.length === 0 ? (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
                <Card className="border-border/40 bg-card">
                  <CardContent className="flex flex-col items-center justify-center py-14 text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                      <Repeat className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground">
                      {isIncome ? 'Nenhuma receita' : 'Nenhum pagamento'}
                    </h3>
                    <p className="mt-1.5 max-w-[260px] text-sm text-muted-foreground leading-relaxed">
                      {isIncome
                        ? 'Adicione receitas recorrentes como salário, freelance e rendimentos.'
                        : 'Adicione pagamentos recorrentes como aluguel, assinaturas e contas mensais.'}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {payments?.map((payment, index) => {
                    const now = new Date();
                    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                    const isGenerated = payment.last_generated_date?.substring(0, 7) === currentMonthStr;

                    return (
                      <motion.div
                        key={payment.id}
                        layout
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.4, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
                      >
                        <Card className={`border-border/40 transition-all duration-300 ${!payment.is_active ? 'opacity-50' : ''}`}>
                          <CardContent className="flex items-center gap-3 p-4">
                            {/* Category icon */}
                            <div
                              className="h-11 w-11 shrink-0 rounded-xl flex items-center justify-center"
                              style={{ backgroundColor: `${payment.categories?.color}18` }}
                            >
                              <CategoryIcon
                                iconName={payment.categories?.type === 'expense' ? undefined : undefined}
                                fallbackColor={payment.categories?.color}
                                className="h-5 w-5"
                                style={{ color: payment.categories?.color }}
                              />
                            </div>

                            {/* Content */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <p className="truncate text-sm font-semibold text-foreground">
                                  {payment.description}
                                </p>
                                <p className="shrink-0 text-sm font-bold tabular-nums text-foreground">
                                  {formatCurrency(Number(payment.amount))}
                                </p>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                                <Calendar className="h-3 w-3 shrink-0" />
                                <span>Dia {payment.day_of_month}</span>
                                <span>·</span>
                                <span className="truncate">{payment.categories?.name}</span>
                              </div>
                              <div className="flex items-center gap-1.5 mt-1.5">
                                {payment.is_active ? (
                                  isGenerated ? (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-600 dark:text-green-400">
                                      <Check className="h-2.5 w-2.5" />
                                      Gerado
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                                      <Clock className="h-2.5 w-2.5" />
                                      Pendente
                                    </span>
                                  )
                                ) : (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                    <PowerOff className="h-2.5 w-2.5" />
                                    Pausado
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* 3-dot menu */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-44">
                                <DropdownMenuItem onClick={() => handleOpenEdit(payment)}>
                                  <Pencil className="mr-2 h-3.5 w-3.5" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => payment.is_active ? setConfirmTogglePayment(payment) : handleToggleActive(payment)}>
                                  {payment.is_active ? (
                                    <>
                                      <PowerOff className="mr-2 h-3.5 w-3.5" />
                                      Pausar
                                    </>
                                  ) : (
                                    <>
                                      <Power className="mr-2 h-3.5 w-3.5" />
                                      Reativar
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => setConfirmDeletePayment(payment)}
                                >
                                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
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
              <AlertDialogTitle>Pausar pagamento?</AlertDialogTitle>
              <AlertDialogDescription>
                A transação de "{confirmTogglePayment?.description}" deste mês será removida e não será gerada nos próximos meses até você reativar.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => { if (confirmTogglePayment) { handleToggleActive(confirmTogglePayment); setConfirmTogglePayment(null); } }}>
                Pausar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Confirm deletion dialog */}
        <AlertDialog open={!!confirmDeletePayment} onOpenChange={(open) => !open && setConfirmDeletePayment(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir pagamento?</AlertDialogTitle>
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
