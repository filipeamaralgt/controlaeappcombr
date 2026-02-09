import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory, type Category } from '@/hooks/useCategories';
import { CategoryIcon, PRESET_COLORS, ICON_CATEGORIES, ALL_ICONS } from '@/components/CategoryIcon';
import { Loader2, Plus, Pencil, Trash2, Check, Search, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CategoryManageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ──────────── Color Picker Grid ────────────
function ColorPickerGrid({ value, onChange }: { value: string; onChange: (color: string) => void }) {
  return (
    <ScrollArea className="h-40">
      <div className="grid grid-cols-10 gap-1.5 pr-3">
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-full transition-all hover:scale-110 hover:shadow-lg',
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

// ──────────── Icon Picker Grid ────────────
function IconPickerGrid({ value, selectedColor, onChange }: { value: string; selectedColor: string; onChange: (icon: string) => void }) {
  const [search, setSearch] = useState('');

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return ICON_CATEGORIES;
    const q = search.toLowerCase();
    return ICON_CATEGORIES.map((cat) => ({
      ...cat,
      icons: cat.icons.filter((icon) => icon.toLowerCase().includes(q)),
    })).filter((cat) => cat.icons.length > 0);
  }, [search]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar ícone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      <ScrollArea className="h-64">
        <div className="space-y-4 pr-3">
          {filteredCategories.map((cat) => (
            <div key={cat.label}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{cat.label}</p>
              <div className="grid grid-cols-6 gap-2">
                {cat.icons.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-full transition-all hover:scale-110',
                      value === icon
                        ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                        : 'hover:opacity-80'
                    )}
                    style={{ backgroundColor: value === icon ? selectedColor : '#e5e7eb' }}
                    onClick={() => onChange(icon)}
                    title={icon}
                  >
                    <CategoryIcon 
                      iconName={icon} 
                      className="h-5 w-5" 
                      style={{ color: value === icon ? 'white' : '#6b7280' }}
                    />
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

// ──────────── Category Form (Create/Edit) ────────────
function CategoryForm({
  mode,
  type,
  initial,
  onDone,
  onCancel,
}: {
  mode: 'create' | 'edit';
  type: 'expense' | 'income';
  initial?: Category;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name || '');
  const [color, setColor] = useState(initial?.color || PRESET_COLORS[0]);
  const [icon, setIcon] = useState(initial?.icon || 'circle');
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();

  const isPending = createCategory.isPending || updateCategory.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      if (mode === 'edit' && initial) {
        await updateCategory.mutateAsync({ id: initial.id, name: name.trim(), color, icon });
        toast.success('Categoria atualizada!');
      } else {
        await createCategory.mutateAsync({ name: name.trim(), color, icon, type });
        toast.success('Categoria criada!');
      }
      onDone();
    } catch {
      toast.error(mode === 'edit' ? 'Erro ao atualizar' : 'Erro ao criar');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-center gap-2">
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={onCancel}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-sm font-semibold">
          {mode === 'edit' ? 'Editar Categoria' : 'Nova Categoria'}
        </h3>
      </div>

      {/* Live Preview */}
      <div className="flex items-center justify-center gap-3 rounded-xl bg-muted/40 p-4">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: color }}
        >
          <CategoryIcon iconName={icon} className="h-5 w-5 text-white" />
        </div>
        <span className="text-sm font-semibold text-foreground">{name || 'Nome da categoria'}</span>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Nome</Label>
        <Input
          placeholder="Ex: Alimentação, Freelance..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Cor</Label>
        <ColorPickerGrid value={color} onChange={setColor} />
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Ícone</Label>
        <IconPickerGrid value={icon} selectedColor={color} onChange={setIcon} />
      </div>

      <Button type="submit" className="w-full" disabled={isPending || !name.trim()}>
        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {mode === 'edit' ? 'Salvar Alterações' : 'Criar Categoria'}
      </Button>
    </form>
  );
}

// ──────────── Category Row ────────────
function CategoryRow({
  category,
  onEdit,
  onDelete,
  isDeleting,
}: {
  category: Category;
  onEdit: (cat: Category) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-card p-3 transition-colors hover:bg-secondary/50">
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: category.color }}
      >
        <CategoryIcon iconName={category.icon} className="h-4 w-4 text-white" />
      </div>
      <span className="flex-1 truncate text-sm font-medium text-foreground">
        {category.name}
      </span>
      {category.is_default ? (
        <span className="text-xs text-muted-foreground">Padrão</span>
      ) : (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => onEdit(category)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => onDelete(category.id)}
            disabled={isDeleting}
          >
            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          </Button>
        </div>
      )}
    </div>
  );
}

// ──────────── Category Tab ────────────
function CategoryTab({ type }: { type: 'expense' | 'income' }) {
  const { data: categories, isLoading } = useCategories(type);
  const deleteCategory = useDeleteCategory();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
  const [editingCategory, setEditingCategory] = useState<Category | undefined>(undefined);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteCategory.mutateAsync(id);
      toast.success('Categoria excluída!');
    } catch {
      toast.error('Não é possível excluir uma categoria em uso');
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (cat: Category) => {
    setEditingCategory(cat);
    setView('edit');
  };

  const handleDone = () => {
    setView('list');
    setEditingCategory(undefined);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (view === 'create') {
    return <CategoryForm mode="create" type={type} onDone={handleDone} onCancel={handleDone} />;
  }

  if (view === 'edit' && editingCategory) {
    return <CategoryForm mode="edit" type={type} initial={editingCategory} onDone={handleDone} onCancel={handleDone} />;
  }

  return (
    <div className="space-y-4">
      <Button variant="outline" className="w-full" onClick={() => setView('create')}>
        <Plus className="mr-2 h-4 w-4" />
        Nova Categoria
      </Button>

      <div className="space-y-2">
        {categories?.map((cat) => (
          <CategoryRow
            key={cat.id}
            category={cat}
            onEdit={handleEdit}
            onDelete={handleDelete}
            isDeleting={deletingId === cat.id}
          />
        ))}
        {(!categories || categories.length === 0) && (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Nenhuma categoria encontrada
          </p>
        )}
      </div>
    </div>
  );
}

// ──────────── Main Modal ────────────
export function CategoryManageModal({ open, onOpenChange }: CategoryManageModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Gerenciar Categorias</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="expense" className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="expense">Despesas</TabsTrigger>
            <TabsTrigger value="income">Receitas</TabsTrigger>
          </TabsList>

          <TabsContent value="expense" className="mt-4">
            <CategoryTab type="expense" />
          </TabsContent>
          <TabsContent value="income" className="mt-4">
            <CategoryTab type="income" />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
