import { useState, useMemo, useDeferredValue } from 'react';
import searchIllustration from '@/assets/search-illustration.png';
import { Search, Loader2 } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useDeleteTransaction, useDuplicateTransaction, Transaction } from '@/hooks/useTransactions';
import { Input } from '@/components/ui/input';
import { TransactionList } from '@/components/TransactionList';
import { EditTransactionModal } from '@/components/EditTransactionModal';

function useSearchTransactions(query: string) {
  const { user } = useAuth();
  const trimmed = query.trim();

  return useQuery({
    queryKey: ['transactions-search', trimmed],
    queryFn: async () => {
      if (!trimmed) return [];
      const q = `%${trimmed}%`;

      const { data, error } = await supabase
        .from('transactions')
        .select('*, categories(id, name, color, icon, type)')
        .or(`description.ilike.${q},notes.ilike.${q}`)
        .order('date', { ascending: false })
        .limit(100);

      if (error) throw error;
      return (data || []) as Transaction[];
    },
    enabled: !!user && trimmed.length >= 1,
    staleTime: 30_000,
  });
}

export default function Pesquisa() {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const { data: results, isLoading } = useSearchTransactions(deferredQuery);
  const deleteTransaction = useDeleteTransaction();
  const duplicateTransaction = useDuplicateTransaction();

  const trimmed = deferredQuery.trim();

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

      {trimmed.length < 1 ? (
        <div className="flex flex-col items-center gap-3 py-8">
          <div className="animate-[wiggle_1.5s_ease-in-out_2] text-4xl">🔍</div>
          <p className="animate-fade-in text-sm font-medium text-muted-foreground text-center leading-relaxed">
            Busque suas transações
            <br />
            <span className="text-xs opacity-70">Digite para começar</span>
          </p>
        </div>
      ) : isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div>
          <p className="mb-3 text-sm text-muted-foreground">
            {results?.length || 0} transação(ões) encontrada(s)
          </p>
          <TransactionList
            transactions={results || []}
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
