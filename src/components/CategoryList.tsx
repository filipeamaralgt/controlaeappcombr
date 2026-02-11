import { useNavigate } from 'react-router-dom';
import { CategoryIcon } from '@/components/CategoryIcon';
import { ChevronRight } from 'lucide-react';

interface CategoryItem {
  name: string;
  value: number;
  percentage: number;
  color: string;
  icon?: string;
}

interface CategoryListProps {
  items: CategoryItem[];
  transactionType?: 'expense' | 'income';
  startDate?: string;
  endDate?: string;
}

export function CategoryList({ items, transactionType, startDate, endDate }: CategoryListProps) {
  const navigate = useNavigate();

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const handleCategoryClick = (categoryName: string) => {
    const params = new URLSearchParams();
    params.set('name', categoryName);
    if (transactionType) params.set('type', transactionType);
    if (startDate) params.set('start', startDate);
    if (endDate) params.set('end', endDate);
    navigate(`/categoria-transacoes?${params.toString()}`);
  };

  if (items.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        Nenhuma transação encontrada
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div
          key={item.name}
          className="flex cursor-pointer items-center gap-3 rounded-xl bg-card p-3 transition-all hover:bg-muted/50 active:scale-[0.98] animate-fade-in"
          style={{ animationDelay: `${index * 80}ms`, animationFillMode: 'backwards' }}
          onClick={() => handleCategoryClick(item.name)}
        >
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: item.color }}
          >
            <CategoryIcon iconName={item.icon} className="h-3.5 w-3.5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-sm font-semibold text-foreground">{formatCurrency(item.value)}</p>
              <p className="text-xs text-muted-foreground">{item.percentage.toFixed(1)}%</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      ))}
    </div>
  );
}
