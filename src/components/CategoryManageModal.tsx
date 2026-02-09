import { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateCategory, useUpdateCategory, useDeleteCategory, type Category } from '@/hooks/useCategories';
import { CategoryIcon, PRESET_COLORS, VALID_ICON_CATEGORIES } from '@/components/CategoryIcon';
import { IconCatalogSheet } from '@/components/IconCatalogSheet';
import { ColorSwipePicker } from '@/components/ColorSwipePicker';
import { Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CategoryManageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialCategory?: Category;
  defaultType?: 'expense' | 'income';
}

const INITIAL_ICONS = 15;

function IconPickerGrid({ value, selectedColor, onChange }: { value: string; selectedColor: string; onChange: (icon: string) => void }) {
  const [catalogOpen, setCatalogOpen] = useState(false);
  const allIcons = useMemo(() => VALID_ICON_CATEGORIES.flatMap((cat) => cat.icons), []);
  const previewIcons = allIcons.slice(0, INITIAL_ICONS);

  return (
    <>
      <div className="grid grid-cols-4 gap-3 justify-items-center">
        {previewIcons.map((icon) => {
          const isSelected = value === icon;
          return (
            <button
              key={icon}
              type="button"
              className={cn(
                'flex h-14 w-14 items-center justify-center rounded-full transition-all hover:scale-105',
                isSelected
                  ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                  : 'hover:brightness-110'
              )}
              style={{ backgroundColor: isSelected ? selectedColor : 'hsl(var(--muted))' }}
              onClick={() => onChange(icon)}
              title={icon}
            >
              <CategoryIcon
                iconName={icon}
                className="h-6 w-6"
                style={{ color: isSelected ? 'white' : 'hsl(var(--muted-foreground))' }}
              />
            </button>
          );
        })}
        <button
          type="button"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/80 hover:bg-primary transition-all hover:scale-105"
          onClick={() => setCatalogOpen(true)}
          title="Ver mais ícones"
        >
          <span className="text-white text-2xl font-bold leading-none">···</span>
        </button>
      </div>
      <IconCatalogSheet
        open={catalogOpen}
        onOpenChange={setCatalogOpen}
        value={value}
        selectedColor={selectedColor}
        onSelect={onChange}
      />
    </>
  );
}

export function CategoryManageModal({ open, onOpenChange, initialCategory, defaultType = 'expense' }: CategoryManageModalProps) {
  const isEditing = !!initialCategory;
  const isDefault = initialCategory?.is_default ?? false;

  const [name, setName] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [icon, setIcon] = useState('circle');
  const [type, setType] = useState<'expense' | 'income'>(defaultType);

  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  useEffect(() => {
    if (open && initialCategory) {
      setName(initialCategory.name);
      setColor(initialCategory.color);
      setIcon(initialCategory.icon || 'circle');
      setType(initialCategory.type);
    } else if (open) {
      setName('');
      setColor(PRESET_COLORS[0]);
      setIcon('circle');
      setType(defaultType);
    }
  }, [open, initialCategory, defaultType]);

  const isPending = createCategory.isPending || updateCategory.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() && !isDefault) return;

    try {
      if (isEditing) {
        const updates: any = { id: initialCategory!.id, color, icon };
        if (!isDefault) updates.name = name.trim();
        await updateCategory.mutateAsync(updates);
        toast.success('Categoria atualizada!');
      } else {
        await createCategory.mutateAsync({ name: name.trim(), color, icon, type });
        toast.success('Categoria criada!');
      }
      onOpenChange(false);
    } catch {
      toast.error(isEditing ? 'Erro ao atualizar' : 'Erro ao criar');
    }
  };

  const handleDelete = async () => {
    if (!initialCategory || isDefault) return;
    try {
      await deleteCategory.mutateAsync(initialCategory.id);
      toast.success('Categoria excluída!');
      onOpenChange(false);
    } catch {
      toast.error('Não é possível excluir uma categoria em uso');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Preview */}
          <div className="flex items-center justify-center gap-3 rounded-xl bg-muted/40 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: color }}>
              <CategoryIcon iconName={icon} className="h-6 w-6 text-white" />
            </div>
            <span className="text-sm font-semibold text-foreground">{name || 'Nome da categoria'}</span>
          </div>

          {/* Name - readonly for default categories */}
          {!isDefault && (
            <div className="space-y-1.5">
              <Label className="text-xs">Nome</Label>
              <Input placeholder="Ex: Alimentação, Freelance..." value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
          )}

          {/* Color */}
          <div className="space-y-1.5">
            <Label className="text-xs">Cor</Label>
            <ColorSwipePicker value={color} onChange={setColor} />
          </div>

          {/* Icon */}
          <div className="space-y-1.5">
            <Label className="text-xs">Ícone</Label>
            <IconPickerGrid value={icon} selectedColor={color} onChange={setIcon} />
          </div>

          <div className="flex gap-2">
            <Button type="submit" className="flex-1" disabled={isPending || (!isDefault && !name.trim())}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Salvar' : 'Criar Categoria'}
            </Button>
            {isEditing && !isDefault && (
              <Button type="button" variant="destructive" size="icon" onClick={handleDelete} disabled={deleteCategory.isPending}>
                {deleteCategory.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
