import { CategoryIcon } from '@/components/CategoryIcon';

interface CategoryItem {
  name: string;
  value: number;
  percentage: number;
  color: string;
  icon?: string;
}

interface CategoryListProps {
  items: CategoryItem[];
}

export function CategoryList({ items }: CategoryListProps) {
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
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
      {items.map((item) => (
        <div
          key={item.name}
          className="flex items-center gap-3 rounded-xl bg-card p-3 transition-colors hover:bg-secondary/50"
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
          <div className="text-right">
            <p className="text-sm font-semibold text-foreground">{formatCurrency(item.value)}</p>
            <p className="text-xs text-muted-foreground">{item.percentage.toFixed(1)}%</p>
          </div>
        </div>
      ))}
    </div>
  );
}
