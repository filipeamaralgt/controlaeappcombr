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
    <div className="relative h-52" style={{ perspective: '600px' }}>
      <div
        className="h-full w-full"
        style={{
          transform: 'rotateX(18deg) rotateZ(-8deg)',
          transformStyle: 'preserve-3d',
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <defs>
              <filter id="donut3d-shadow">
                <feDropShadow dx="0" dy="6" stdDeviation="4" floodColor="rgba(0,0,0,0.35)" />
              </filter>
            </defs>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={88}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
              style={{ filter: 'url(#donut3d-shadow)' }}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ transform: 'rotateZ(8deg) rotateX(-18deg)' }}
        >
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-lg font-bold text-foreground">{formatCurrency(total)}</p>
        </div>
      </div>
    </div>
  );
}
