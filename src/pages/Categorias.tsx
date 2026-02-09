import { useState } from 'react';
import { Plus, Trash2, Pencil, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useCategories, useDeleteCategory, type Category } from '@/hooks/useCategories';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CategoryIcon } from '@/components/CategoryIcon';
import { CategoryManageModal } from '@/components/CategoryManageModal';

export default function Categorias() {
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');
  const [modalOpen, setModalOpen] = useState(false);

  const { data: categories, isLoading } = useCategories(activeTab);
  const deleteCategory = useDeleteCategory();

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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Categorias</h1>
        <Button onClick={() => setModalOpen(true)} size="sm">
          <Plus className="mr-1.5 h-4 w-4" />
          Nova
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'expense' | 'income')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="expense">Despesas</TabsTrigger>
          <TabsTrigger value="income">Receitas</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
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
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                        style={{ backgroundColor: category.color }}
                      >
                        <CategoryIcon iconName={category.icon} className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{category.name}</p>
                        {category.is_default && (
                          <p className="text-xs text-muted-foreground">Padrão</p>
                        )}
                      </div>
                      {!category.is_default && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(category.id, category.is_default)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {(!categories || categories.length === 0) && (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      Nenhuma categoria encontrada
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <CategoryManageModal open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
}
