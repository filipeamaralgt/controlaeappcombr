import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, BrainCircuit, DollarSign, ShieldAlert } from 'lucide-react';

const MASTER_EMAIL = 'monicahartmann99@gmail.com';

function valorPorExtenso(valor: number): string {
  if (valor === 0) return 'zero reais';

  const unidades = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
  const especiais = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
  const dezenas = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
  const centenas = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

  function numPorExtenso(n: number): string {
    if (n === 0) return 'zero';
    if (n === 100) return 'cem';
    const parts: string[] = [];
    const c = Math.floor(n / 100);
    const d = Math.floor((n % 100) / 10);
    const u = n % 10;
    if (c > 0) parts.push(centenas[c]);
    if (d === 1) { parts.push(especiais[u]); }
    else {
      if (d > 1) parts.push(dezenas[d]);
      if (u > 0) parts.push(unidades[u]);
    }
    return parts.join(' e ');
  }

  const inteiro = Math.floor(valor);
  const centavos = Math.round((valor - inteiro) * 100);

  // Handle sub-centavo values (e.g. R$ 0,0052)
  if (inteiro === 0 && centavos === 0) {
    const formatted = valor.toFixed(4).replace('.', ',');
    return `menos de um centavo (R$ ${formatted})`;
  }

  let resultado = '';
  if (inteiro > 0) resultado = `${numPorExtenso(inteiro)} ${inteiro === 1 ? 'real' : 'reais'}`;
  if (centavos > 0) {
    if (inteiro > 0) resultado += ' e ';
    resultado += `${numPorExtenso(centavos)} ${centavos === 1 ? 'centavo' : 'centavos'}`;
  }
  return resultado;
}

interface AdminStats {
  total_users: number;
  total_ai_calls: number;
  total_cost: number;
  per_user: Array<{
    user_id: string;
    display_name: string;
    email: string;
    calls: number;
    cost: number;
    last_used: string | null;
  }>;
}

export default function AdminIA() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [usdToBrl, setUsdToBrl] = useState(5.80);
  const [currency, setCurrency] = useState<'BRL' | 'USD'>('BRL');

  useEffect(() => {
    if (!user) return;
    if (user.email !== MASTER_EMAIL) {
      navigate('/');
      return;
    }

    const fetchStats = async () => {
      setLoading(true);

      // Fetch exchange rate and stats in parallel
      const [, statsResult] = await Promise.all([
        fetch('https://open.er-api.com/v6/latest/USD')
          .then(r => r.json())
          .then(d => { if (d?.rates?.BRL) setUsdToBrl(d.rates.BRL); })
          .catch(() => {}),
        supabase.functions.invoke('admin-stats'),
      ]);

      const { data, error: fnError } = statsResult;
      if (fnError || data?.error) {
        setError(data?.error || fnError?.message || 'Erro ao carregar dados');
      } else {
        setStats(data);
      }
      setLoading(false);
    };

    fetchStats();
  }, [user, navigate]);

  if (!user || user.email !== MASTER_EMAIL) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <ShieldAlert className="h-16 w-16 text-destructive" />
        <p className="text-lg font-medium text-muted-foreground">Acesso restrito</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <ShieldAlert className="h-16 w-16 text-destructive" />
        <p className="text-lg font-medium text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">Painel de Controle — IA</h1>
      </div>

      {/* Currency toggle */}
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Escolha uma moeda:</p>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrency('BRL')}
            className={`flex items-center gap-2 rounded-xl border-2 px-5 py-3 text-base font-semibold transition-all ${
              currency === 'BRL'
                ? 'border-primary bg-primary/10 text-foreground'
                : 'border-border bg-card text-muted-foreground'
            }`}
          >
            🇧🇷 R$
          </button>
          <button
            onClick={() => setCurrency('USD')}
            className={`flex items-center gap-2 rounded-xl border-2 px-5 py-3 text-base font-semibold transition-all ${
              currency === 'USD'
                ? 'border-primary bg-primary/10 text-foreground'
                : 'border-border bg-card text-muted-foreground'
            }`}
          >
            🇺🇸 US$
          </button>
        </div>
        <p className="text-xs text-muted-foreground">1 USD = {usdToBrl.toFixed(4)} BRL</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.total_users ?? 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Chamadas de IA</CardTitle>
            <BrainCircuit className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.total_ai_calls ?? 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Custo Estimado Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {currency === 'BRL' ? (
              <>
                <p className="text-3xl font-bold">R$ {((stats?.total_cost ?? 0) * usdToBrl).toFixed(4).replace('.', ',')}</p>
                <p className="text-sm text-muted-foreground italic">{valorPorExtenso((stats?.total_cost ?? 0) * usdToBrl)}</p>
              </>
            ) : (
              <p className="text-3xl font-bold">US$ {(stats?.total_cost ?? 0).toFixed(4)}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Custo Médio / Usuário</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {(() => {
              const userCount = stats?.per_user?.length || 1;
              const costPerUser = (stats?.total_cost ?? 0) / userCount;
              return currency === 'BRL' ? (
                <>
                  <p className="text-3xl font-bold">R$ {(costPerUser * usdToBrl).toFixed(4).replace('.', ',')}</p>
                  <p className="text-sm text-muted-foreground italic">{valorPorExtenso(costPerUser * usdToBrl)}</p>
                </>
              ) : (
                <p className="text-3xl font-bold">US$ {costPerUser.toFixed(4)}</p>
              );
            })()}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Uso por Usuário</CardTitle>
        </CardHeader>
        <CardContent>
          {stats?.per_user && stats.per_user.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Chamadas</TableHead>
                  <TableHead className="text-right">Custo (US$)</TableHead>
                  <TableHead className="text-right">Custo (R$)</TableHead>
                  <TableHead className="text-right">Último Uso</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.per_user.map((u) => (
                  <TableRow key={u.user_id}>
                    <TableCell className="font-medium">{u.display_name}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{u.email}</TableCell>
                    <TableCell className="text-right">{u.calls}</TableCell>
                    <TableCell className="text-right">US$ {u.cost.toFixed(4)}</TableCell>
                    <TableCell className="text-right">R$ {(u.cost * usdToBrl).toFixed(4).replace('.', ',')}</TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {u.last_used ? new Date(u.last_used).toLocaleDateString('pt-BR') : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8">Nenhum uso de IA registrado ainda.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
