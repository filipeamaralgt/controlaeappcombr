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
  LogOut, Moon, Sun, Settings, HelpCircle, ChevronRight,
  Home, PieChart, Tag, CreditCard, Bell, Search, MessageCircle,
  Camera, Loader2, Pencil, Check, X, Target, Gauge,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

export default function Perfil() {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { profile, displayName, initials, avatarUrl, email } = useProfile();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');

  // Upload avatar mutation
  const uploadAvatar = useMutation({
    mutationFn: async (file: File) => {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user!.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

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
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Imagem deve ter no máximo 2MB');
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

  

  const pageLinks = [
    { icon: Home, label: 'Início', path: '/' },
    { icon: PieChart, label: 'Gráficos', path: '/graficos' },
    { icon: Tag, label: 'Categorias', path: '/categorias' },
    { icon: CreditCard, label: 'Pagamentos Regulares', path: '/pagamentos' },
    { icon: Bell, label: 'Lembretes', path: '/lembretes' },
    { icon: Target, label: 'Metas', path: '/metas' },
    { icon: Gauge, label: 'Limites Mensais', path: '/limites' },
    { icon: Search, label: 'Pesquisa', path: '/pesquisa' },
    { icon: MessageCircle, label: 'Chat IA', path: '/chat-ia' },
  ];

  const settingsLinks = [
    { icon: Settings, label: 'Configurações', path: '/configuracoes' },
    { icon: HelpCircle, label: 'Suporte', path: '/suporte' },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
      {/* Profile Header */}
      <Card className="border-border/50 bg-card overflow-hidden">
        <div className="h-20 bg-gradient-to-r from-primary/20 to-primary/5" />
        <CardContent className="relative px-6 pb-6 pt-0">
          {/* Avatar */}
          <div className="relative -mt-12 mb-4 w-fit">
            <Avatar className="h-24 w-24 border-4 border-card shadow-lg">
              <AvatarImage src={avatarUrl} alt={displayName} />
              <AvatarFallback className="bg-primary/15 text-2xl font-bold text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadAvatar.isPending}
              className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-transform hover:scale-110 disabled:opacity-50"
            >
              {uploadAvatar.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
            </button>
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
            <p className="text-sm text-muted-foreground">{email}</p>
          </div>
        </CardContent>
      </Card>

      {/* Theme Toggle */}
      <Card className="border-border/50 bg-card">
        <CardContent className="p-0">
          <button
            onClick={toggleTheme}
            className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-secondary/50"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
              {theme === 'dark' ? (
                <Moon className="h-5 w-5 text-primary" />
              ) : (
                <Sun className="h-5 w-5 text-primary" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">Tema {theme === 'dark' ? 'Escuro' : 'Claro'}</p>
              <p className="text-sm text-muted-foreground">Toque para alternar</p>
            </div>
          </button>
        </CardContent>
      </Card>

      {/* Pages Menu */}
      <Card className="border-border/50 bg-card">
        <CardContent className="p-0">
          {pageLinks.map((item, index) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-secondary/50 ${
                index < pageLinks.length - 1 ? 'border-b border-border/50' : ''
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

      {/* Settings */}
      <Card className="border-border/50 bg-card">
        <CardContent className="p-0">
          {settingsLinks.map((item, index) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-secondary/50 ${
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
