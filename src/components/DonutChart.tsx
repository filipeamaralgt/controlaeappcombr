import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface DonutChartProps {
  data: { name: string; value: number; color: string }[];
  total: number;
}

export function DonutChart({ data, total }: DonutChartProps) {
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  if (data.length === 0 || total === 0) {
    return (
      <div className="flex h-52 items-center justify-center text-sm text-muted-foreground">
        Nenhuma transação neste período
      </div>
    );
  }

  return (
    <div className="relative h-52">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={3}
            dataKey="value"
            strokeWidth={0}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-xs text-muted-foreground">Total</p>
        <p className="text-lg font-bold text-foreground">{formatCurrency(total)}</p>
      </div>
    </div>
  );
}
