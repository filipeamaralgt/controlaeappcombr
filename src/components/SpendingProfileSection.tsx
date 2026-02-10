import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import {
  useSpendingProfiles,
  useCreateSpendingProfile,
  useUpdateSpendingProfile,
  useDeleteSpendingProfile,
  SpendingProfile,
} from '@/hooks/useSpendingProfiles';
import { Plus, Pencil, Trash2, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';

const PROFILE_ICONS = ['😊', '💑', '🏠', '👶', '👧', '👦', '🐶', '🐱', '👴', '👵', '💼', '🎓', '🚗', '💪'];

const PROFILE_COLORS = [
  '#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6',
  '#8b5cf6', '#ef4444', '#14b8a6', '#f97316', '#64748b',
  '#000000', '#795548',
];

export function SpendingProfileSection() {
  const { data: profiles, isLoading } = useSpendingProfiles();
  const createProfile = useCreateSpendingProfile();
  const updateProfile = useUpdateSpendingProfile();
  const deleteProfile = useDeleteSpendingProfile();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<SpendingProfile | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SpendingProfile | null>(null);

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('😊');
  const [color, setColor] = useState('#6366f1');

  const openCreate = () => {
    setEditingProfile(null);
    setName('');
    setIcon('😊');
    setColor('#6366f1');
    setDialogOpen(true);
  };

  const openEdit = (p: SpendingProfile) => {
    setEditingProfile(p);
    setName(p.name);
    setIcon(p.icon);
    setColor(p.color);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    try {
      if (editingProfile) {
        await updateProfile.mutateAsync({ id: editingProfile.id, name: name.trim(), icon, color });
        toast.success('Perfil atualizado!');
      } else {
        await createProfile.mutateAsync({ name: name.trim(), icon, color });
        toast.success('Perfil criado!');
      }
      setDialogOpen(false);
    } catch {
      toast.error('Erro ao salvar perfil');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteProfile.mutateAsync(deleteTarget.id);
      toast.success('Perfil removido');
      setDeleteTarget(null);
    } catch {
      toast.error('Erro ao remover perfil');
    }
  };

  const isPending = createProfile.isPending || updateProfile.isPending;

  return (
    <div>
      <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        👥 Perfis da conta
      </p>
      <Card className="border-border/50 bg-card">
        <CardContent className="p-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            Organize seus gastos por pessoa ou grupo familiar.
          </p>

          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-2">
              {profiles?.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-secondary/50"
                >
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg"
                    style={{ backgroundColor: p.color + '22' }}
                  >
                    {p.icon}
                  </div>
                  <span className="flex-1 font-medium text-foreground">{p.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground"
                    onClick={() => openEdit(p)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => setDeleteTarget(p)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              {(!profiles || profiles.length === 0) && (
                <p className="text-center text-sm text-muted-foreground py-2">
                  Nenhum perfil criado ainda.
                </p>
              )}
            </div>
          )}

          <Button variant="outline" className="w-full gap-2" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Adicionar perfil
          </Button>
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingProfile ? 'Editar perfil' : 'Novo perfil'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                placeholder="Ex: Eu, Parceiro(a), Casa"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label>Ícone</Label>
              <div className="flex flex-wrap gap-2">
                {PROFILE_ICONS.map((ic) => (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => setIcon(ic)}
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-lg transition-all ${
                      icon === ic
                        ? 'ring-2 ring-primary ring-offset-2 ring-offset-background bg-muted'
                        : 'hover:bg-muted/60'
                    }`}
                  >
                    {ic}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="flex flex-wrap gap-2">
                {PROFILE_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${
                      color === c ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''
                    }`}
                    style={{ backgroundColor: c }}
                  >
                    {color === c && <Check className="h-4 w-4 text-white" />}
                  </button>
                ))}
              </div>
            </div>

            <Button className="w-full" onClick={handleSave} disabled={isPending || !name.trim()}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
