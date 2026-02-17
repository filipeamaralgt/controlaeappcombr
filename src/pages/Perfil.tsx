import { useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { useProfile } from '@/hooks/useProfile';

import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  LogOut, Settings, HelpCircle, ChevronRight,
  Home, PieChart, Tag, CreditCard, Bell, Moon, Sun,
  Camera, Loader2, Pencil, Check, X, Target, Gauge, Wallet, AlertTriangle, ListChecks,
  ShieldCheck, Upload, Download, CloudCog, Trash2, Crown,
} from 'lucide-react';
import { ThemeSelector } from '@/components/ThemeSelector';
import { SpendingProfileSection } from '@/components/SpendingProfileSection';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

export default function Perfil() {
  const { user, signOut } = useAuth();
  const { theme, mode, setMode } = useTheme();
  const { profile, displayName, initials, avatarUrl, email } = useProfile();
  const queryClient = useQueryClient();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');

  // Upload avatar mutation
  const uploadAvatar = useMutation({
    mutationFn: async (file: File) => {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user!.id}/avatar-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: false, contentType: file.type });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const avatarUrl = `${urlData.publicUrl}?quality=100`;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('user_id', user!.id);
      if (updateError) throw updateError;

      return avatarUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Foto atualizada!');
    },
    onError: () => {
      toast.error('Erro ao atualizar foto');
    },
  });

  // Remove avatar mutation
  const removeAvatar = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('user_id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Foto removida!');
    },
    onError: () => {
      toast.error('Erro ao remover foto');
    },
  });

  // Update display name
  const updateName = useMutation({
    mutationFn: async (displayName: string) => {
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: displayName })
        .eq('user_id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setEditingName(false);
      toast.success('Nome atualizado!');
    },
    onError: () => {
      toast.error('Erro ao atualizar nome');
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Imagem deve ter no máximo 10MB');
      return;
    }
    uploadAvatar.mutate(file);
  };

  const handleStartEditName = () => {
    setNewName(profile?.display_name || '');
    setEditingName(true);
  };

  const handleSaveName = () => {
    if (!newName.trim()) return;
    updateName.mutate(newName.trim());
  };

  

  const generalLinks = [
    { icon: Home, label: 'Início', path: '/' },
    { icon: PieChart, label: 'Gráficos', path: '/graficos' },
    { icon: Tag, label: 'Categorias', path: '/categorias' },
    { icon: CreditCard, label: 'Pagamentos Regulares', path: '/pagamentos' },
    { icon: Bell, label: 'Lembretes', path: '/lembretes' },
  ];

  const financeLinks = [
    { icon: Wallet, label: 'Cartões', path: '/cartoes' },
    { icon: AlertTriangle, label: 'Dívidas', path: '/dividas' },
    { icon: ListChecks, label: 'Parcelas em Aberto', path: '/parcelas' },
    { icon: Target, label: 'Metas', path: '/metas' },
    { icon: Gauge, label: 'Limites Mensais', path: '/limites' },
  ];

  const dataLinks = [
    { icon: Upload, label: 'Exportar dados', path: '/exportar-dados' },
    { icon: Download, label: 'Importar dados', path: '/importar-dados' },
    { icon: CloudCog, label: 'Backup automático', path: '/backup' },
  ];

  const settingsLinks = [
    { icon: Settings, label: 'Configurações', path: '/configuracoes' },
    { icon: HelpCircle, label: 'Suporte', path: '/suporte' },
    ...(email === 'monicahartmann99@gmail.com' || email === 'filipeamaralgt@gmail.com'
      ? [{ icon: ShieldCheck, label: 'Admin IA', path: '/admin-ia' }]
      : []),
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
      {/* Profile Header */}
      <Card className="border-border/50 bg-card overflow-hidden">
        <div className="h-20 bg-gradient-to-r from-primary/20 to-primary/5" />
        <CardContent className="relative px-6 pb-6 pt-0">
          {/* Avatar */}
          <div className="relative -mt-12 mb-4 w-fit">
            <Avatar className="h-28 w-28 border-4 border-card shadow-lg">
              <AvatarImage src={avatarUrl} alt={displayName} className="object-cover" style={{ imageRendering: 'auto' }} />
              <AvatarFallback className="bg-primary/15 text-2xl font-bold text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            {/* Camera + Trash grouped at bottom-right */}
            <div className="absolute -bottom-1 -right-1 flex items-center gap-1">
              {avatarUrl && (
                <button
                  onClick={() => removeAvatar.mutate()}
                  disabled={removeAvatar.isPending}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-md transition-transform hover:scale-110 disabled:opacity-50"
                  title="Remover foto"
                >
                  {removeAvatar.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </button>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadAvatar.isPending}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-transform hover:scale-110 disabled:opacity-50"
              >
                {uploadAvatar.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Name + Email */}
          <div className="space-y-1">
            {editingName ? (
              <div className="flex items-center gap-2">
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="h-9 max-w-xs text-base font-semibold"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleSaveName}
                  disabled={updateName.isPending}
                >
                  <Check className="h-4 w-4 text-green-500" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setEditingName(false)}
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-foreground">{displayName}</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={handleStartEditName}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">{email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Spending Profiles */}
      <SpendingProfileSection />

      {/* Theme Selector */}
      <Card className="border-border/50 bg-card">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
              {theme === 'dark' ? (
                <Moon className="h-5 w-5 text-primary" />
              ) : (
                <Sun className="h-5 w-5 text-primary" />
              )}
            </div>
            <div>
              <p className="font-medium text-foreground">Aparência</p>
              <p className="text-sm text-muted-foreground">Escolha o tema da interface</p>
            </div>
          </div>
          <ThemeSelector />
        </CardContent>
      </Card>

      {/* General */}
      <div>
        <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">⚙️ Geral</p>
        <Card className="border-border/50 bg-card">
          <CardContent className="p-0">
            {generalLinks.map((item, index) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-muted/50 ${
                  index < generalLinks.length - 1 ? 'border-b border-border/50' : ''
                }`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{item.label}</p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Financial */}
      <div>
        <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">💳 Financeiro</p>
        <Card className="border-border/50 bg-card">
          <CardContent className="p-0">
            {financeLinks.map((item, index) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-muted/50 ${
                  index < financeLinks.length - 1 ? 'border-b border-border/50' : ''
                }`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{item.label}</p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Data */}
      <div>
        <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">📂 Dados</p>
        <Card className="border-border/50 bg-card">
          <CardContent className="p-0">
            {dataLinks.map((item, index) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-muted/50 ${
                  index < dataLinks.length - 1 ? 'border-b border-border/50' : ''
                }`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{item.label}</p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Settings */}
      <Card className="border-border/50 bg-card">
        <CardContent className="p-0">
          {settingsLinks.map((item, index) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-muted/50 ${
                index < settingsLinks.length - 1 ? 'border-b border-border/50' : ''
              }`}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <item.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">{item.label}</p>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
            </Link>
          ))}
        </CardContent>
      </Card>

      {/* Logout */}
      <Button variant="destructive" onClick={signOut} className="w-full">
        <LogOut className="mr-2 h-4 w-4" />
        Sair da Conta
      </Button>
    </div>
  );
}
