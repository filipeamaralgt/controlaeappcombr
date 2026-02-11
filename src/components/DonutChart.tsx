import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface DonutChartProps {
  data: { name: string; value: number; color: string }[];
  total: number;
  emptyMessage?: string;
}

export function DonutChart({ data, total, emptyMessage }: DonutChartProps) {
  const [animationKey, setAnimationKey] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(false);
    setAnimationKey((k) => k + 1);
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, [data, total]);
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  if (data.length === 0 || total === 0) {
    return (
      <div className="flex h-52 flex-col items-center justify-center gap-3">
        <div className="animate-[bounce_2s_ease-in-out_infinite] text-4xl">💸</div>
        <p className="animate-fade-in text-sm font-medium text-muted-foreground text-center leading-relaxed">
          {emptyMessage || 'Nenhuma transação neste período'}
          <br />
          <span className="text-xs opacity-70">Toque no botão <span className="font-bold text-primary">+</span> abaixo</span>
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-52">
      <div
        key={animationKey}
        className="h-full w-full transition-all duration-700 ease-out"
        style={{
          transform: isVisible ? 'scale(1) rotate(0deg)' : 'scale(0.6) rotate(-90deg)',
          opacity: isVisible ? 1 : 0,
        }}
      >
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
              animationBegin={0}
              animationDuration={800}
              animationEasing="ease-out"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div
        className="absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-500 delay-300"
        style={{ opacity: isVisible ? 1 : 0 }}
      >
        <p className="text-xs text-muted-foreground">Total</p>
        <p className="text-lg font-bold text-foreground">{formatCurrency(total)}</p>
      </div>
    </div>
  );
}
