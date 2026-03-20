import { useState, useRef, useCallback } from 'react';
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
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function Perfil() {
  const { user, signOut } = useAuth();
  const { theme, mode, setMode } = useTheme();
  const { profile, displayName, initials, avatarUrl, email } = useProfile();
  const queryClient = useQueryClient();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = useRef(false);

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

  // Long press handlers
  const handlePointerDown = useCallback(() => {
    didLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      didLongPress.current = true;
      setShowAvatarMenu(true);
    }, 500);
  }, []);

  const handlePointerUp = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (!didLongPress.current) {
      fileInputRef.current?.click();
    }
  }, []);

  const handlePointerCancel = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleRemovePhoto = () => {
    setShowAvatarMenu(false);
    setShowRemoveConfirm(true);
  };

  const handleChangePhoto = () => {
    setShowAvatarMenu(false);
    fileInputRef.current?.click();
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      {/* Profile Header */}
      <Card className="border-border/50 bg-card overflow-hidden">
        <div className="h-20 bg-gradient-to-r from-primary/20 to-primary/5" />
        <CardContent className="relative px-6 pb-6 pt-0">
          {/* Avatar with long press */}
          <div className="relative -mt-12 mb-4 w-fit">
            <button
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerCancel}
              onContextMenu={(e) => e.preventDefault()}
              disabled={uploadAvatar.isPending}
              className="relative rounded-full focus:outline-none active:scale-95 transition-transform duration-150 touch-none select-none"
            >
              <Avatar className="h-28 w-28 border-4 border-card shadow-lg">
                <AvatarImage src={avatarUrl} alt={displayName} className="object-cover" style={{ imageRendering: 'auto' }} />
                <AvatarFallback className="bg-primary/15 text-2xl font-bold text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {uploadAvatar.isPending && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/30">
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                </div>
              )}
            </button>

            {/* Long press context menu */}
            <AnimatePresence>
              {showAvatarMenu && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="fixed inset-0 z-40"
                    onClick={() => setShowAvatarMenu(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.85, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.85, y: -4 }}
                    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50 min-w-[160px] rounded-xl border border-border bg-popover p-1 shadow-lg"
                  >
                    <button
                      onClick={handleChangePhoto}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-muted active:scale-[0.98]"
                    >
                      <Camera className="h-4 w-4 text-muted-foreground" />
                      Alterar foto
                    </button>
                    {avatarUrl && (
                      <button
                        onClick={handleRemovePhoto}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-destructive transition-colors hover:bg-destructive/10 active:scale-[0.98]"
                      >
                        <Trash2 className="h-4 w-4" />
                        Remover foto
                      </button>
                    )}
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Remove photo confirmation */}
          <AlertDialog open={showRemoveConfirm} onOpenChange={setShowRemoveConfirm}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remover foto de perfil?</AlertDialogTitle>
                <AlertDialogDescription>
                  Sua foto será removida e substituída pelas iniciais do seu nome.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => removeAvatar.mutate()}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Remover
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

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
