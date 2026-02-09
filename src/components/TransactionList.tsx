import { Transaction } from '@/hooks/useTransactions';
import { Trash2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CategoryIcon } from '@/components/CategoryIcon';

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  onEdit?: (transaction: Transaction) => void;
}

export function TransactionList({ transactions, onDelete, onEdit }: TransactionListProps) {
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  if (transactions.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Nenhuma transação encontrada
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {transactions.map((t, index) => (
        <div
          key={t.id}
          className="flex items-center gap-3 rounded-xl bg-card p-3 transition-all hover:bg-secondary/50 animate-fade-in"
          style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'backwards' }}
        >
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: t.categories?.color || '#6b7280' }}
          >
            <CategoryIcon
              iconName={t.categories?.icon}
              className="h-3.5 w-3.5 text-white"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{t.description}</p>
            <p className="text-xs text-muted-foreground">
              {t.categories?.name} • {format(parseISO(t.date), "dd MMM yyyy", { locale: ptBR })}
              {t.installment_total > 1 && ` • ${t.installment_number}/${t.installment_total}`}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <p className={`text-sm font-semibold ${t.type === 'income' ? 'text-success' : 'text-foreground'}`}>
              {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
            </p>
            {onEdit && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(t)}>
                <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDelete(t.id)}>
              <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
