import { useState, useMemo } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { useTransactions, useDeleteTransaction, useDuplicateTransaction, Transaction } from '@/hooks/useTransactions';
import { Input } from '@/components/ui/input';
import { TransactionList } from '@/components/TransactionList';
import { EditTransactionModal } from '@/components/EditTransactionModal';

export default function Pesquisa() {
  const [query, setQuery] = useState('');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const { data: expenses, isLoading: loadingExp } = useTransactions({ type: 'expense' });
  const { data: incomes, isLoading: loadingInc } = useTransactions({ type: 'income' });
  const deleteTransaction = useDeleteTransaction();
  const duplicateTransaction = useDuplicateTransaction();

  const allTransactions = useMemo(() => {
    return [...(expenses || []), ...(incomes || [])].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [expenses, incomes]);

  const filteredTransactions = useMemo(() => {
    if (!query.trim()) return allTransactions;
    const q = query.toLowerCase();
    return allTransactions.filter(
      (t) =>
        t.description.toLowerCase().includes(q) ||
        t.categories?.name.toLowerCase().includes(q) ||
        t.notes?.toLowerCase().includes(q)
    );
  }, [allTransactions, query]);

  const isLoading = loadingExp || loadingInc;

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
      <h1 className="text-2xl font-bold text-foreground">Pesquisa</h1>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar transações..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div>
          <p className="mb-3 text-sm text-muted-foreground">
            {filteredTransactions.length} transação(ões) encontrada(s)
          </p>
          <TransactionList
            transactions={filteredTransactions}
            onDelete={(params) => deleteTransaction.mutate(params)}
            onEdit={(t) => setEditingTransaction(t)}
            onDuplicate={(t) => duplicateTransaction.mutate(t)}
          />
        </div>
      )}

      <EditTransactionModal
        open={!!editingTransaction}
        onOpenChange={(open) => !open && setEditingTransaction(null)}
        transaction={editingTransaction}
      />
    </div>
  );
}