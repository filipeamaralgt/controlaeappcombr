import { useState } from 'react';
import { Plus, Trash2, Loader2, CreditCard, Power, PowerOff, RefreshCw, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import {
  useRecurringPayments,
  useCreateRecurringPayment,
  useUpdateRecurringPayment,
  useDeleteRecurringPayment,
  useGenerateRecurringTransactions,
} from '@/hooks/useRecurringPayments';
import { useCategories } from '@/hooks/useCategories';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';

export default function Pagamentos() {
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [dayOfMonth, setDayOfMonth] = useState('1');
  const [notes, setNotes] = useState('');

  const { data: payments, isLoading } = useRecurringPayments(activeTab);
  const { data: categories } = useCategories(activeTab);
  const createPayment = useCreateRecurringPayment();
  const updatePayment = useUpdateRecurringPayment();
  const deletePayment = useDeleteRecurringPayment();
  const generateTransactions = useGenerateRecurringTransactions();

  const resetForm = () => {
    setDescription('');
    setAmount('');
    setCategoryId('');
    setDayOfMonth('1');
    setNotes('');
  };

  const handleCreate = async () => {
    if (!description.trim() || !amount || !categoryId) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      await createPayment.mutateAsync({
        description: description.trim(),
        amount: parseFloat(amount),
        category_id: categoryId,
        day_of_month: parseInt(dayOfMonth),
        type: activeTab,
        notes: notes.trim() || undefined,
      });
      toast.success('Pagamento recorrente criado!');
      resetForm();
      setDialogOpen(false);
    } catch {
      toast.error('Erro ao criar pagamento');
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      await updatePayment.mutateAsync({ id, is_active: !currentActive });
      toast.success(currentActive ? 'Pagamento desativado' : 'Pagamento ativado');
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
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Pagamentos Regulares</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={handleGenerate}
          disabled={generateTransactions.isPending}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${generateTransactions.isPending ? 'animate-spin' : ''}`} />
          Gerar Lançamentos
        </Button>
      </div>

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
          {/* Add Button */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full" onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Pagamento Recorrente
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Pagamento Recorrente</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Descrição *</Label>
                  <Input
                    placeholder="Ex: Aluguel, Netflix, Salário..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Valor *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Categoria *</Label>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {categories?.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: cat.color }} />
                            {cat.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Dia do Mês</Label>
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    value={dayOfMonth}
                    onChange={(e) => setDayOfMonth(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Observações</Label>
                  <Input
                    placeholder="Opcional"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
                <Button onClick={handleCreate} disabled={createPayment.isPending} className="w-full">
                  {createPayment.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  Criar Pagamento
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Payments List */}
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
                      <p className="truncate text-sm font-semibold text-foreground">
                        {payment.description}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>Dia {payment.day_of_month}</span>
                        <span>•</span>
                        <span>{payment.categories?.name}</span>
                      </div>
                      {payment.notes && (
                        <p className="truncate text-xs text-muted-foreground">{payment.notes}</p>
                      )}
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-bold text-foreground">
                        {formatCurrency(Number(payment.amount))}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleToggleActive(payment.id, payment.is_active)}
                        title={payment.is_active ? 'Desativar' : 'Ativar'}
                      >
                        {payment.is_active ? (
                          <Power className="h-4 w-4 text-green-500" />
                        ) : (
                          <PowerOff className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(payment.id)}
                      >
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
    </div>
  );
}
