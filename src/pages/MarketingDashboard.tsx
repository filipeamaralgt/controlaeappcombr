import { useState, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useMarketingMetrics, MarketingPeriod, FunnelMetric } from '@/hooks/useMarketingMetrics';
import { PageBackHeader } from '@/components/PageBackHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import {
  Eye, MousePointerClick, Users, ShoppingCart, CreditCard, TrendingUp,
  DollarSign, BarChart3, Flame, ArrowDown, Monitor, Smartphone, Globe,
  Loader2,
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts';

const MASTER_EMAILS = ['monicahartmann99@gmail.com', 'filipeamaralgt@gmail.com'];

const PERIOD_OPTIONS: { value: MarketingPeriod; label: string }[] = [
  { value: '7d', label: '7 dias' },
  { value: '30d', label: '30 dias' },
  { value: '90d', label: '90 dias' },
];

const COLORS = ['hsl(142,76%,36%)', 'hsl(217,91%,60%)', 'hsl(38,92%,50%)', 'hsl(0,84%,60%)', 'hsl(270,76%,55%)'];

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function pct(a: number, b: number) {
  return b > 0 ? ((a / b) * 100).toFixed(1) : '0.0';
}

export default function MarketingDashboard() {
  const { user, loading: authLoading } = useAuth();
  const { email } = useProfile();
  const [period, setPeriod] = useState<MarketingPeriod>('30d');
  const { data: metrics = [], isLoading } = useMarketingMetrics(period);

  const isMaster = MASTER_EMAILS.includes(email || '');

  if (authLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!user || !isMaster) return <Navigate to="/" replace />;

  const totals = metrics.reduce(
    (acc, m) => ({
      visits: acc.visits + m.visits,
      cta_clicks: acc.cta_clicks + m.cta_clicks,
      leads: acc.leads + m.leads,
      checkout_started: acc.checkout_started + m.checkout_started,
      purchases: acc.purchases + m.purchases,
      revenue: acc.revenue + m.revenue,
      ad_spend: acc.ad_spend + m.ad_spend,
      bounce_rate_sum: acc.bounce_rate_sum + m.bounce_rate,
      avg_time_sum: acc.avg_time_sum + m.avg_time_on_page,
    }),
    { visits: 0, cta_clicks: 0, leads: 0, checkout_started: 0, purchases: 0, revenue: 0, ad_spend: 0, bounce_rate_sum: 0, avg_time_sum: 0 }
  );

  const count = metrics.length || 1;
  const conversionRate = pct(totals.purchases, totals.visits);
  const cac = totals.purchases > 0 ? totals.ad_spend / totals.purchases : 0;
  const roas = totals.ad_spend > 0 ? totals.revenue / totals.ad_spend : 0;
  const avgBounce = (totals.bounce_rate_sum / count).toFixed(1);
  const avgTime = (totals.avg_time_sum / count).toFixed(0);

  // Funnel steps
  const funnelSteps = [
    { label: 'Visitas LP', value: totals.visits, icon: Eye },
    { label: 'Cliques CTA', value: totals.cta_clicks, icon: MousePointerClick },
    { label: 'Leads', value: totals.leads, icon: Users },
    { label: 'Checkout Iniciado', value: totals.checkout_started, icon: ShoppingCart },
    { label: 'Compra', value: totals.purchases, icon: CreditCard },
  ];

  // KPI cards - split into two rows for better hierarchy
  const kpisTop = [
    { label: 'Visitas', value: totals.visits.toLocaleString('pt-BR'), icon: Eye, color: 'text-blue-500' },
    { label: 'Cliques CTA', value: totals.cta_clicks.toLocaleString('pt-BR'), icon: MousePointerClick, color: 'text-indigo-500' },
    { label: 'Leads', value: totals.leads.toLocaleString('pt-BR'), icon: Users, color: 'text-emerald-500' },
    { label: 'Checkouts', value: totals.checkout_started.toLocaleString('pt-BR'), icon: ShoppingCart, color: 'text-amber-500' },
    { label: 'Compras', value: totals.purchases.toLocaleString('pt-BR'), icon: CreditCard, color: 'text-green-500' },
  ];
  const kpisBottom = [
    { label: 'Conversão', value: `${conversionRate}%`, icon: TrendingUp, color: 'text-primary', highlight: true },
    { label: 'CAC', value: formatCurrency(cac), icon: DollarSign, color: 'text-orange-500' },
    { label: 'ROAS', value: `${roas.toFixed(2)}x`, icon: BarChart3, color: 'text-purple-500' },
    { label: 'Receita', value: formatCurrency(totals.revenue), icon: Flame, color: 'text-red-500', highlight: true },
  ];

  // Aggregate by date for charts
  const byDate = metrics.reduce<Record<string, { date: string; visits: number; purchases: number; revenue: number; cumRevenue: number }>>((acc, m) => {
    if (!acc[m.date]) acc[m.date] = { date: m.date, visits: 0, purchases: 0, revenue: 0, cumRevenue: 0 };
    acc[m.date].visits += m.visits;
    acc[m.date].purchases += m.purchases;
    acc[m.date].revenue += m.revenue;
    return acc;
  }, {});
  const dateChartData = Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));
  let cum = 0;
  dateChartData.forEach(d => { cum += d.revenue; d.cumRevenue = cum; });

  // By source
  const bySource = metrics.reduce<Record<string, { source: string; visits: number; purchases: number }>>((acc, m) => {
    if (!acc[m.traffic_source]) acc[m.traffic_source] = { source: m.traffic_source, visits: 0, purchases: 0 };
    acc[m.traffic_source].visits += m.visits;
    acc[m.traffic_source].purchases += m.purchases;
    return acc;
  }, {});
  const sourceData = Object.values(bySource);

  // By device
  const byDevice = metrics.reduce<Record<string, number>>((acc, m) => {
    acc[m.device_type] = (acc[m.device_type] || 0) + m.visits;
    return acc;
  }, {});
  const deviceData = Object.entries(byDevice).map(([name, value]) => ({ name, value }));

  return (
    <div className="min-h-screen pb-24 md:pb-8 max-w-5xl mx-auto px-4">
      <div className="pt-4 mb-2">
        <PageBackHeader title="Marketing Dashboard" />
      </div>

      {/* Period filter */}
      <div className="flex gap-2 mb-6">
        {PERIOD_OPTIONS.map(o => (
          <Button
            key={o.value}
            variant={period === o.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod(o.value)}
            className="rounded-full"
          >
            {o.label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* KPI Cards - Top row: funnel numbers */}
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {kpisTop.map((kpi, i) => (
              <motion.div key={kpi.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <Card>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <kpi.icon className={`h-3.5 w-3.5 ${kpi.color}`} />
                      <span className="text-[11px] text-muted-foreground truncate">{kpi.label}</span>
                    </div>
                    <p className="text-base font-bold tabular-nums">{kpi.value}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* KPI Cards - Bottom row: performance metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {kpisBottom.map((kpi, i) => (
              <motion.div key={kpi.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.03 }}>
                <Card className={kpi.highlight ? 'border-primary/30 bg-primary/5' : ''}>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <kpi.icon className={`h-3.5 w-3.5 ${kpi.color}`} />
                      <span className="text-[11px] text-muted-foreground">{kpi.label}</span>
                    </div>
                    <p className="text-base font-bold tabular-nums">{kpi.value}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Funnel */}
          <Card>
            <CardHeader><CardTitle className="text-base">Funil de Conversão</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {funnelSteps.map((step, i) => {
                  const prevValue = i > 0 ? funnelSteps[i - 1].value : step.value;
                  const stepPct = pct(step.value, prevValue);
                  const totalPct = pct(step.value, funnelSteps[0].value);
                  const barWidth = funnelSteps[0].value > 0 ? Math.max((step.value / funnelSteps[0].value) * 100, 4) : 4;

                  return (
                    <motion.div key={step.label} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}>
                      <div className="flex items-center gap-2.5">
                        <step.icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <div className="flex-1">
                          <div className="flex justify-between text-xs mb-0.5">
                            <span className="font-medium">{step.label}</span>
                            <span className="text-muted-foreground tabular-nums">
                              {step.value.toLocaleString('pt-BR')}
                              {i > 0 && <span className="ml-1">({stepPct}%)</span>}
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <motion.div
                              className="h-full rounded-full"
                              style={{ backgroundColor: COLORS[i % COLORS.length] }}
                              initial={{ width: 0 }}
                              animate={{ width: `${barWidth}%` }}
                              transition={{ duration: 0.6, delay: i * 0.1 }}
                            />
                          </div>
                        </div>
                      </div>
                      {i < funnelSteps.length - 1 && (
                        <div className="flex justify-center py-0.5">
                          <ArrowDown className="h-3 w-3 text-muted-foreground/50" />
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
              <div className="mt-4 pt-3 border-t text-sm text-muted-foreground text-center">
                Conversão total: <span className="font-bold text-primary">{pct(totals.purchases, totals.visits)}%</span>
                {' · '}Drop-off: <span className="font-bold text-destructive">{pct(totals.visits - totals.purchases, totals.visits)}%</span>
              </div>
            </CardContent>
          </Card>

          {/* Performance metrics */}
          <div className="grid grid-cols-3 gap-2">
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-[11px] text-muted-foreground mb-0.5">Bounce Rate</p>
                <p className="text-lg font-bold tabular-nums">{avgBounce}%</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-[11px] text-muted-foreground mb-0.5">Tempo médio</p>
                <p className="text-lg font-bold tabular-nums">{avgTime}s</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-[11px] text-muted-foreground mb-0.5">Ad Spend</p>
                <p className="text-lg font-bold tabular-nums">{formatCurrency(totals.ad_spend)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Visits over time */}
          <Card>
            <CardHeader><CardTitle className="text-base">Visitas por dia</CardTitle></CardHeader>
            <CardContent>
              {dateChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={dateChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                    <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                    <Tooltip />
                    <Area type="monotone" dataKey="visits" stroke="hsl(217,91%,60%)" fill="hsl(217,91%,60%)" fillOpacity={0.2} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : <p className="text-center text-muted-foreground py-8">Sem dados no período</p>}
            </CardContent>
          </Card>

          {/* Sales per day */}
          <Card>
            <CardHeader><CardTitle className="text-base">Vendas por dia</CardTitle></CardHeader>
            <CardContent>
              {dateChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={dateChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                    <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                    <Tooltip />
                    <Bar dataKey="purchases" fill="hsl(142,76%,36%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="text-center text-muted-foreground py-8">Sem dados no período</p>}
            </CardContent>
          </Card>

          {/* Conversion by source */}
          <Card>
            <CardHeader><CardTitle className="text-base">Conversão por origem</CardTitle></CardHeader>
            <CardContent>
              {sourceData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={sourceData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                    <XAxis dataKey="source" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                    <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                    <Tooltip />
                    <Bar dataKey="visits" name="Visitas" fill="hsl(217,91%,60%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="purchases" name="Compras" fill="hsl(142,76%,36%)" radius={[4, 4, 0, 0]} />
                    <Legend />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="text-center text-muted-foreground py-8">Sem dados no período</p>}
            </CardContent>
          </Card>

          {/* Cumulative revenue */}
          <Card>
            <CardHeader><CardTitle className="text-base">Receita acumulada</CardTitle></CardHeader>
            <CardContent>
              {dateChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={dateChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                    <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" tickFormatter={(v) => `R$${v}`} />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    <Area type="monotone" dataKey="cumRevenue" name="Receita" stroke="hsl(142,76%,36%)" fill="hsl(142,76%,36%)" fillOpacity={0.15} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : <p className="text-center text-muted-foreground py-8">Sem dados no período</p>}
            </CardContent>
          </Card>

          {/* Device split */}
          <Card>
            <CardHeader><CardTitle className="text-base">Dispositivo</CardTitle></CardHeader>
            <CardContent>
              {deviceData.length > 0 ? (
                <div className="flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={deviceData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {deviceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : <p className="text-center text-muted-foreground py-8">Sem dados no período</p>}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
