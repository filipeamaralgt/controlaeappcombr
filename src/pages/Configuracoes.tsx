import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogOut, Moon, User, Shield, KeyRound, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { PageBackHeader } from '@/components/PageBackHeader';
import { ThemeSelector } from '@/components/ThemeSelector';
import { ResetAccountDialog } from '@/components/ResetAccountDialog';

export default function Configuracoes() {
  const { user, signOut } = useAuth();
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPassword(false);
    if (error) {
      toast.error('Erro ao alterar senha');
    } else {
      toast.success('Senha alterada com sucesso!');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      <PageBackHeader title="Configurações" />

      {/* Profile */}
      <Card className="border-border/50 bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5 text-primary" />
            Perfil
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-muted-foreground">Email</Label>
            <p className="text-foreground">{user?.email}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">ID do Usuário</Label>
            <p className="truncate text-sm text-foreground">{user?.id}</p>
          </div>
          <div className="border-t border-border/50 pt-4">
            <button
              type="button"
              onClick={() => setShowPasswordFields(!showPasswordFields)}
              className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              <KeyRound className="h-4 w-4" />
              Alterar senha
            </button>
            {showPasswordFields && (
              <div className="mt-3 space-y-3 animate-fade-in">
                <Input
                  type="password"
                  placeholder="Nova senha"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <Input
                  type="password"
                  placeholder="Confirmar nova senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleChangePassword}
                  disabled={changingPassword || !newPassword || !confirmPassword}
                >
                  {changingPassword ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Salvar nova senha
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card className="border-border/50 bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Moon className="h-5 w-5 text-primary" />
            Aparência
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">Escolha o tema da interface</p>
          <ThemeSelector />
        </CardContent>
      </Card>

      {/* Security */}
      <Card className="border-border/50 bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5 text-primary" />
            Segurança
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={signOut} className="w-full">
            <LogOut className="mr-2 h-4 w-4" />
            Sair da Conta
          </Button>
        </CardContent>
      </Card>
      {/* Advanced */}
      <Card className="border-destructive/30 bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Avançado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-muted-foreground">
            Apague permanentemente todas as transações, categorias e demais dados da sua conta.
          </p>
          <Button
            variant="outline"
            className="w-full border-destructive/50 text-destructive hover:bg-destructive/10"
            onClick={() => setResetDialogOpen(true)}
          >
            <AlertTriangle className="mr-2 h-4 w-4" />
            Resetar conta
          </Button>
        </CardContent>
      </Card>

      <ResetAccountDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen} />
    </div>
  );
}
