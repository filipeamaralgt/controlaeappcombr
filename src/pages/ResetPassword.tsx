import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLogo } from '@/components/AppLogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { Lock, Loader2, AlertCircle } from 'lucide-react';
import { z } from 'zod';
import { toast } from 'sonner';

const passwordSchema = z.string().min(6, 'A senha deve ter pelo menos 6 caracteres');

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const result = passwordSchema.safeParse(password);
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success('Senha alterada com sucesso!');
      navigate('/auth', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao redefinir senha.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-sm animate-fade-in">
        <div className="mb-10 flex flex-col items-center text-center">
          <AppLogo size="lg" className="mb-4" />
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Nova senha</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Defina sua nova senha abaixo.</p>
        </div>

        <div className="rounded-2xl border border-border/40 bg-card/80 p-6 shadow-2xl backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="new-password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Nova senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="new-password"
                  type="password"
                  placeholder="mínimo 6 caracteres"
                  className="h-11 rounded-xl border-border/60 bg-muted/40 pl-10 transition-colors focus:bg-background"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Confirmar senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="repita a senha"
                  className="h-11 rounded-xl border-border/60 bg-muted/40 pl-10 transition-colors focus:bg-background"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2.5 rounded-xl bg-destructive/10 p-3.5 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="h-11 w-full rounded-xl text-sm font-semibold shadow-lg shadow-primary/20"
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar nova senha'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
