import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory, type Category } from '@/hooks/useCategories';
import { Loader2, Plus, Pencil, Trash2, Check } from 'lucide-react';
import { toast } from 'sonner';

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4',
  '#3b82f6', '#6366f1', '#a855f7', '#ec4899', '#f43f5e',
  '#14b8a6', '#84cc16', '#0ea5e9', '#8b5cf6', '#d946ef',
  '#6b7280',
];

interface CategoryManageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function ColorPicker({ value, onChange }: { value: string; onChange: (color: string) => void }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-input transition-colors hover:border-primary"
          style={{ backgroundColor: value }}
          aria-label="Escolher cor"
        />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <div className="grid grid-cols-4 gap-2">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-full transition-transform hover:scale-110"
              style={{ backgroundColor: color }}
              onClick={() => onChange(color)}
              aria-label={color}
            >
              {value === color && <Check className="h-4 w-4 text-white drop-shadow" />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function CategoryRow({
  category,
  onUpdate,
  onDelete,
  isUpdating,
  isDeleting,
}: {
  category: Category;
  onUpdate: (id: string, color: string) => void;
  onDelete: (id: string) => void;
  isUpdating: boolean;
  isDeleting: boolean;
}) {
  const isDefault = category.is_default;

  return (
    <div className="flex items-center gap-3 rounded-xl bg-card p-3 transition-colors hover:bg-secondary/50">
      <ColorPicker
        value={category.color}
        onChange={(color) => {
          if (!isDefault) onUpdate(category.id, color);
        }}
      />
      <span className="flex-1 truncate text-sm font-medium text-foreground">
        {category.name}
      </span>
      {isDefault ? (
        <span className="text-xs text-muted-foreground">Padrão</span>
      ) : (
        <div className="flex items-center gap-1">
          {isUpdating && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => onDelete(category.id)}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

function CreateCategoryForm({ type, onDone }: { type: 'expense' | 'income'; onDone: () => void }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const createCategory = useCreateCategory();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await createCategory.mutateAsync({ name: name.trim(), color, type });
      toast.success('Categoria criada!');
      setName('');
      setColor(PRESET_COLORS[0]);
      onDone();
    } catch {
      toast.error('Erro ao criar categoria');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <div className="flex-1 space-y-1.5">
        <Label htmlFor={`new-cat-${type}`} className="text-xs">
          Nova categoria
        </Label>
        <Input
          id={`new-cat-${type}`}
          placeholder="Nome da categoria"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <ColorPicker value={color} onChange={setColor} />
      <Button type="submit" size="icon" disabled={createCategory.isPending || !name.trim()}>
        {createCategory.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
      </Button>
    </form>
  );
}

function CategoryTab({ type }: { type: 'expense' | 'income' }) {
  const { data: categories, isLoading } = useCategories(type);
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleUpdate = async (id: string, color: string) => {
    setUpdatingId(id);
    try {
      await updateCategory.mutateAsync({ id, color });
      toast.success('Cor atualizada!');
    } catch {
      toast.error('Erro ao atualizar categoria');
    } finally {
      setUpdatingId(null);
    }
  };

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

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <CreateCategoryForm type={type} onDone={() => {}} />

      <div className="space-y-2">
        {categories?.map((cat) => (
          <CategoryRow
            key={cat.id}
            category={cat}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            isUpdating={updatingId === cat.id}
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

export function CategoryManageModal({ open, onOpenChange }: CategoryManageModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
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
