import { useState, useMemo } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { useCategories, type Category } from '@/hooks/useCategories';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CategoryIcon } from '@/components/CategoryIcon';
import { CategoryManageModal } from '@/components/CategoryManageModal';
import { PageBackHeader } from '@/components/PageBackHeader';

export default function Categorias() {
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');
  const [modalOpen, setModalOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | undefined>(undefined);

  const { data: categories, isLoading } = useCategories(activeTab);

  const sorted = useMemo(() => {
    if (!categories) return [];
    return [...categories].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }, [categories]);

  const handleCategoryClick = (cat: Category) => {
    setEditCategory(cat);
    setModalOpen(true);
  };

  const handleNewCategory = () => {
    setEditCategory(undefined);
    setModalOpen(true);
  };

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

              {/* Add new category button */}
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

      <CategoryManageModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        initialCategory={editCategory}
        defaultType={activeTab}
      />
    </div>
  );
}
