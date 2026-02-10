import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, BrainCircuit, DollarSign, ShieldAlert } from 'lucide-react';

const MASTER_EMAIL = 'monicahartmann99@gmail.com';

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

  useEffect(() => {
    if (!user) return;
    if (user.email !== MASTER_EMAIL) {
      navigate('/');
      return;
    }

    const fetchStats = async () => {
      setLoading(true);
      const { data, error: fnError } = await supabase.functions.invoke('admin-stats');
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
      <h1 className="text-2xl font-bold">Painel de Controle — IA</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Custo Estimado</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">$ {(stats?.total_cost ?? 0).toFixed(4)}</p>
            <p className="text-sm text-muted-foreground">R$ {((stats?.total_cost ?? 0) * 5.80).toFixed(4)}</p>
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
                  <TableHead className="text-right">Custo</TableHead>
                  <TableHead className="text-right">Último Uso</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.per_user.map((u) => (
                  <TableRow key={u.user_id}>
                    <TableCell className="font-medium">{u.display_name}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{u.email}</TableCell>
                    <TableCell className="text-right">{u.calls}</TableCell>
                    <TableCell className="text-right">
                      $ {u.cost.toFixed(4)}
                      <br />
                      <span className="text-muted-foreground text-xs">R$ {(u.cost * 5.80).toFixed(4)}</span>
                    </TableCell>
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
