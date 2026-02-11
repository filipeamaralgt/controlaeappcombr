import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface DonutDataItem {
  name: string;
  value: number;
  color: string;
}

interface CategoryDonutChartProps {
  title: string;
  data: DonutDataItem[];
  total: number;
  emptyMessage: string;
}

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function CategoryDonutChart({ title, data, total, emptyMessage }: CategoryDonutChartProps) {
  return (
    <Card className="border-border/50 bg-card">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="h-56 w-56 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2 w-full">
              {data.map((item, i) => {
                const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0';
                return (
                  <div key={i} className="flex items-center justify-between gap-3 text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="truncate text-foreground">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-muted-foreground text-xs">{pct}%</span>
                      <span className="font-medium text-foreground">{formatCurrency(item.value)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
