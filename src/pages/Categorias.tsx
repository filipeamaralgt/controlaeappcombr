import { useState, useMemo, useEffect } from 'react';
import { Plus, Loader2, Trash2 } from 'lucide-react';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory, type Category } from '@/hooks/useCategories';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CategoryIcon, PRESET_COLORS, VALID_ICON_CATEGORIES } from '@/components/CategoryIcon';
import { IconCatalogSheet } from '@/components/IconCatalogSheet';
import { ColorSwipePicker } from '@/components/ColorSwipePicker';
import { PageBackHeader } from '@/components/PageBackHeader';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const INITIAL_ICONS = 15;

function CategoryForm({
  category,
  defaultType,
  onBack,
}: {
  category?: Category;
  defaultType: 'expense' | 'income';
  onBack: () => void;
}) {
  const isEditing = !!category;
  const isDefault = category?.is_default ?? false;

  const [name, setName] = useState(category?.name ?? '');
  const [color, setColor] = useState(category?.color ?? PRESET_COLORS[0]);
  const [icon, setIcon] = useState(category?.icon ?? 'circle');
  const [type] = useState(category?.type ?? defaultType);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [showAllColors, setShowAllColors] = useState(false);

  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const allIcons = useMemo(() => VALID_ICON_CATEGORIES.flatMap((c) => c.icons), []);
  const isPending = createCategory.isPending || updateCategory.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() && !isDefault) return;

    try {
      if (isEditing) {
        const updates: any = { id: category!.id, color, icon };
        if (!isDefault) updates.name = name.trim();
        await updateCategory.mutateAsync(updates);
        toast.success('Categoria atualizada!');
      } else {
        await createCategory.mutateAsync({ name: name.trim(), color, icon, type });
        toast.success('Categoria criada!');
      }
      onBack();
    } catch {
      toast.error(isEditing ? 'Erro ao atualizar' : 'Erro ao criar');
    }
  };

  const handleDelete = async () => {
    if (!category || isDefault) return;
    try {
      await deleteCategory.mutateAsync(category.id);
      toast.success('Categoria excluída!');
      onBack();
    } catch {
      toast.error('Não é possível excluir uma categoria em uso');
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
      <PageBackHeader title={isEditing ? 'Editar Categoria' : 'Nova Categoria'} onBack={onBack} />

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Preview */}
        <div className="flex items-center justify-center gap-3 rounded-xl bg-muted/40 p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: color }}>
            <CategoryIcon iconName={icon} className="h-6 w-6 text-white" />
          </div>
          <span className="text-sm font-semibold text-foreground">{name || 'Nome da categoria'}</span>
        </div>

        {/* Name */}
        {!isDefault && (
          <div className="space-y-1.5">
            <Label className="text-xs">Nome</Label>
            <Input placeholder="Ex: Alimentação, Freelance..." value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
          </div>
        )}

        {/* Icon */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Ícones</Label>
          <div className="grid grid-cols-4 gap-4 justify-items-center">
            {allIcons.slice(0, INITIAL_ICONS).map((ic) => {
              const isSelected = icon === ic;
              return (
                <button
                  key={ic}
                  type="button"
                  className={cn(
                    'flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full transition-all hover:scale-105',
                    isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : 'hover:brightness-110'
                  )}
                  style={{ backgroundColor: isSelected ? color : 'hsl(var(--muted))' }}
                  onClick={() => setIcon(ic)}
                  title={ic}
                >
                  <CategoryIcon iconName={ic} className="h-8 w-8" style={{ color: isSelected ? 'white' : 'hsl(var(--muted-foreground))' }} />
                </button>
              );
            })}
            <button
              type="button"
              className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full bg-primary/80 hover:bg-primary transition-all hover:scale-105"
              onClick={() => setCatalogOpen(true)}
              title="Ver mais ícones"
            >
              <span className="text-white text-2xl font-bold leading-none">···</span>
            </button>
          </div>
        </div>

        {/* Color */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Cor</Label>
          <div className="flex flex-wrap items-center gap-3">
            {PRESET_COLORS.slice(0, 6).map((c) => (
              <button
                key={c}
                type="button"
                className={cn(
                  'flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-all hover:scale-110',
                  color === c && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                )}
                style={{ backgroundColor: c }}
                onClick={() => setColor(c)}
              />
            ))}
            <button
              type="button"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/40 hover:border-muted-foreground transition-all"
              onClick={() => setShowAllColors(true)}
            >
              <Plus className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
          {showAllColors && (
            <>
              <ColorSwipePicker value={color} onChange={setColor} />
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setShowAllColors(false)}
              >
                Recolher
              </button>
            </>
          )}
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

      <IconCatalogSheet open={catalogOpen} onOpenChange={setCatalogOpen} value={icon} selectedColor={color} onSelect={setIcon} />
    </div>
  );
}

export default function Categorias() {
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editCategory, setEditCategory] = useState<Category | undefined>(undefined);

  const { data: categories, isLoading } = useCategories(activeTab);

  const sorted = useMemo(() => {
    if (!categories) return [];
    return [...categories].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }, [categories]);

  const handleCategoryClick = (cat: Category) => {
    setEditCategory(cat);
    setView('form');
  };

  const handleNewCategory = () => {
    setEditCategory(undefined);
    setView('form');
  };

  const handleBack = () => {
    setView('list');
    setEditCategory(undefined);
  };

  // Scroll to top when switching to form
  useEffect(() => {
    if (view === 'form') {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [view]);

  if (view === 'form') {
    return <CategoryForm category={editCategory} defaultType={activeTab} onBack={handleBack} />;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
      <PageBackHeader title="Categorias">
        <Button size="sm" onClick={handleNewCategory}><Plus className="mr-1 h-4 w-4" /> Nova</Button>
      </PageBackHeader>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'expense' | 'income')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="expense">Despesas</TabsTrigger>
          <TabsTrigger value="income">Receitas</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-4 sm:grid-cols-5 md:grid-cols-6">
              {sorted.map((category, index) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category)}
                  className="flex flex-col items-center gap-2 rounded-xl p-2 transition-all hover:bg-muted/50 active:scale-95 animate-fade-in"
                  style={{ animationDelay: `${index * 40}ms`, animationFillMode: 'backwards' }}
                >
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-full sm:h-16 sm:w-16"
                    style={{ backgroundColor: category.color }}
                  >
                    <CategoryIcon iconName={category.icon} className="h-7 w-7 text-white sm:h-8 sm:w-8" />
                  </div>
                  <span className="w-full truncate text-center text-xs font-medium text-foreground">
                    {category.name}
                  </span>
                </button>
              ))}

              <button
                onClick={handleNewCategory}
                className="flex flex-col items-center gap-2 rounded-xl p-2 transition-all hover:bg-muted/50 active:scale-95"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary sm:h-16 sm:w-16">
                  <Plus className="h-7 w-7 text-primary-foreground sm:h-8 sm:w-8" />
                </div>
                <span className="w-full truncate text-center text-xs font-medium text-foreground">
                  Criar
                </span>
              </button>

              {sorted.length === 0 && (
                <p className="col-span-full py-4 text-center text-sm text-muted-foreground">
                  Nenhuma categoria encontrada
                </p>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
