import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface ResetAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ResetAccountDialog({ open, onOpenChange }: ResetAccountDialogProps) {
  const { user } = useAuth();
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);

  const isConfirmed = confirmText === 'CONFIRMAR';

  const handleReset = async () => {
    if (!user || !isConfirmed) return;
    setLoading(true);

    try {
      const tables = [
        'transactions',
        'recurring_payments',
        'reminders',
        'budget_limits',
        'installments',
        'debts',
        'goals',
        'cards',
        'chat_messages',
        'ai_usage_logs',
        'spending_profiles',
      ] as const;

      for (const table of tables) {
        const { error } = await supabase
          .from(table)
          .delete()
          .eq('user_id', user.id);
        if (error) console.error(`Erro ao limpar ${table}:`, error.message);
      }

      // Delete user-created categories (not defaults)
      await supabase
        .from('categories')
        .delete()
        .eq('user_id', user.id)
        .eq('is_default', false);

      toast.success('Seus dados foram apagados com sucesso.');
      onOpenChange(false);
      setConfirmText('');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao resetar dados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setConfirmText(''); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Resetar conta
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3 text-sm">
            <span className="block font-semibold text-destructive">
              ⚠️ Isso irá apagar TODAS as suas despesas, receitas e dados.
            </span>
            <span className="block">
              Essa ação <strong>não pode ser desfeita</strong>.
            </span>
            <span className="block mt-3">
              Para confirmar, digite <strong>CONFIRMAR</strong> abaixo:
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <Input
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder="Digite CONFIRMAR"
          className="font-mono tracking-widest"
          autoFocus
        />

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleReset}
            disabled={!isConfirmed || loading}
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
            Excluir todos os dados
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
