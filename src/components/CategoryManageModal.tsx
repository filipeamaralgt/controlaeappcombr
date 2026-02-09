import { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCreateCategory, useUpdateCategory, useDeleteCategory, type Category } from '@/hooks/useCategories';
import { CategoryIcon, PRESET_COLORS, VALID_ICON_CATEGORIES } from '@/components/CategoryIcon';
import { Loader2, Check, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CategoryManageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialCategory?: Category;
  defaultType?: 'expense' | 'income';
}

function ColorPickerGrid({ value, onChange }: { value: string; onChange: (color: string) => void }) {
  return (
    <ScrollArea className="h-32">
      <div className="grid grid-cols-10 gap-1.5 pr-3">
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-full transition-all hover:scale-110',
              value === color && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
            )}
            style={{ backgroundColor: color }}
            onClick={() => onChange(color)}
          >
            {value === color && <Check className="h-3 w-3 text-white drop-shadow-md" />}
          </button>
        ))}
      </div>
    </ScrollArea>
  );
}

function IconPickerGrid({ value, selectedColor, onChange }: { value: string; selectedColor: string; onChange: (icon: string) => void }) {
  const [search, setSearch] = useState('');

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return VALID_ICON_CATEGORIES;
    const q = search.toLowerCase();
    return VALID_ICON_CATEGORIES.map((cat) => {
      if (cat.label.toLowerCase().includes(q)) return cat;
      return { ...cat, icons: cat.icons.filter((icon) => icon.toLowerCase().includes(q)) };
    }).filter((cat) => cat.icons.length > 0);
  }, [search]);

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar ícone..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>
      <ScrollArea className="h-48">
        <div className="space-y-3 pr-3">
          {filteredCategories.map((cat) => (
            <div key={cat.label}>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{cat.label}</p>
              <div className="grid grid-cols-6 gap-2">
                {cat.icons.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-full transition-all hover:scale-110',
                      value === icon ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : 'hover:opacity-80'
                    )}
                    style={{ backgroundColor: value === icon ? selectedColor : 'hsl(var(--muted))' }}
                    onClick={() => onChange(icon)}
                    title={icon}
                  >
                    <CategoryIcon iconName={icon} className="h-5 w-5" style={{ color: value === icon ? 'white' : 'hsl(var(--muted-foreground))' }} />
                  </button>
                ))}
              </div>
            </div>
          ))}
          {filteredCategories.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">Nenhum ícone encontrado</p>
          )}
        </div>
      </ScrollArea>
    </div>
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
            <ColorPickerGrid value={color} onChange={setColor} />
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
