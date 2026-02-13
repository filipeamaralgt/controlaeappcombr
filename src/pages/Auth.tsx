import { useState, useEffect } from 'react';
import { AppLogo } from '@/components/AppLogo';
import { Navigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import { z } from 'zod';


const emailSchema = z.string().email('Email inválido');
const passwordSchema = z.string().min(6, 'A senha deve ter pelo menos 6 caracteres');

export default function Auth() {
  const { user, loading, signIn, signUp } = useAuth();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const isPaid = searchParams.get('paid') === 'true';

  useEffect(() => {
    if (isPaid) {
      toast.success('Pagamento confirmado! Crie sua conta para acessar.', { duration: 8000 });
    }
  }, [isPaid]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  const validate = () => {
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      setError(emailResult.error.errors[0].message);
      return false;
    }
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      setError(passwordResult.error.errors[0].message);
      return false;
    }
    return true;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validate()) return;
    setIsSubmitting(true);
    const { error } = await signIn(email, password);
    if (error) {
      setError(error.message === 'Invalid login credentials'
        ? 'Email ou senha inválidos'
        : error.message);
    }
    setIsSubmitting(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    if (!validate()) return;
    setIsSubmitting(true);
    const { error } = await signUp(email, password);
    if (error) {
      if (error.message.includes('already registered')) {
        setError('Este email já está cadastrado. Faça login.');
      } else {
        setError(error.message);
      }
    } else {
      setSuccessMessage('Conta criada! Verifique seu email para confirmar ou faça login.');
    }
    setIsSubmitting(false);
  };

  const renderForm = (type: 'login' | 'signup') => {
    const isLogin = type === 'login';
    return (
      <form onSubmit={isLogin ? handleSignIn : handleSignUp} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor={`${type}-email`} className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Email
          </Label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id={`${type}-email`}
              type="email"
              placeholder="seu@email.com"
              className="h-11 rounded-xl border-border/60 bg-muted/40 pl-10 transition-colors focus:bg-background"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${type}-password`} className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Senha
          </Label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id={`${type}-password`}
              type="password"
              placeholder={isLogin ? '••••••' : 'mínimo 6 caracteres'}
              className="h-11 rounded-xl border-border/60 bg-muted/40 pl-10 transition-colors focus:bg-background"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </div>

        {isLogin && (
          <Link
            to="/forgot-password"
            className="mt-2 block text-center text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            Esqueceu sua senha?
          </Link>
        )}
        {error && (
          <div className="flex items-center gap-2.5 rounded-xl bg-destructive/10 p-3.5 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
        {!isLogin && successMessage && (
          <div className="rounded-xl bg-primary/10 p-3.5 text-sm text-primary">
            {successMessage}
          </div>
        )}

        <Button
          type="submit"
          className="h-11 w-full rounded-xl text-sm font-semibold shadow-lg shadow-primary/20 transition-all hover:shadow-primary/30"
          disabled={isSubmitting}
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : isLogin ? 'Entrar' : 'Criar Conta'}
        </Button>
      </form>
    );
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      {/* Decorative blurred circles */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-sm animate-fade-in">
        {/* Logo */}
        <div className="mb-10 flex flex-col items-center text-center">
          <AppLogo size="lg" className="mb-4" />
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Controlaê</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Seu controle financeiro inteligente</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border/40 bg-card/80 p-6 shadow-2xl backdrop-blur-sm">
          <h2 className="mb-6 text-center text-lg font-semibold text-foreground">Entrar</h2>
          {renderForm('login')}

          <div className="mt-5 flex flex-col items-center gap-2 border-t border-border/40 pt-5">
            <p className="text-sm text-muted-foreground">Ainda não tem conta?</p>
            <Link
              to="/checkout"
              className="text-sm font-semibold text-primary hover:underline transition-colors"
            >
              Assine e crie sua conta →
            </Link>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground/60">
          © {new Date().getFullYear()} Controlaê
        </p>
      </div>
    </div>
  );
}
