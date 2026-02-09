import { useState } from 'react';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/hooks/useCategories';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const colorOptions = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#78716c', '#6b7280', '#64748b',
];

export default function Categorias() {
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState(colorOptions[0]);

  const { data: categories, isLoading } = useCategories(activeTab);
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const handleCreate = async () => {
    if (!newCategoryName.trim()) {
      toast.error('Digite o nome da categoria');
      return;
    }
    try {
      await createCategory.mutateAsync({
        name: newCategoryName.trim(),
        color: newCategoryColor,
        type: activeTab,
      });
      setNewCategoryName('');
      toast.success('Categoria criada!');
    } catch {
      toast.error('Erro ao criar categoria');
    }
  };

  const handleColorChange = async (id: string, color: string) => {
    try {
      await updateCategory.mutateAsync({ id, color });
      toast.success('Cor atualizada!');
    } catch {
      toast.error('Erro ao atualizar cor');
    }
  };

  const handleDelete = async (id: string, isDefault: boolean) => {
    if (isDefault) {
      toast.error('Não é possível excluir categorias padrão');
      return;
    }
    try {
      await deleteCategory.mutateAsync(id);
      toast.success('Categoria excluída!');
    } catch {
      toast.error('Erro ao excluir categoria');
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
      <h1 className="text-2xl font-bold text-foreground">Categorias</h1>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'expense' | 'income')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="expense">Despesas</TabsTrigger>
          <TabsTrigger value="income">Receitas</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4 space-y-4">
          {/* Add New Category */}
          <Card className="border-border/50 bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Nova Categoria</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Nome da categoria"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
              <div className="flex flex-wrap gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewCategoryColor(color)}
                    className={`h-8 w-8 rounded-full transition-transform hover:scale-110 ${
                      newCategoryColor === color ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <Button onClick={handleCreate} disabled={createCategory.isPending} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Categoria
              </Button>
            </CardContent>
          </Card>

          {/* Categories List */}
          <Card className="border-border/50 bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Suas Categorias</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-2">
                  {categories?.map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center gap-3 rounded-xl bg-secondary/50 p-3"
                    >
                      <div className="relative">
                        <input
                          type="color"
                          value={category.color}
                          onChange={(e) => handleColorChange(category.id, e.target.value)}
                          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                        />
                        <div
                          className="h-8 w-8 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{category.name}</p>
                        {category.is_default && (
                          <p className="text-xs text-muted-foreground">Padrão</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(category.id, category.is_default)}
                        disabled={category.is_default}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
