import { useState, useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CategoryIcon, VALID_ICON_CATEGORIES } from '@/components/CategoryIcon';
import { Search, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IconCatalogSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  selectedColor: string;
  onSelect: (icon: string) => void;
}

export function IconCatalogSheet({ open, onOpenChange, value, selectedColor, onSelect }: IconCatalogSheetProps) {
  const [search, setSearch] = useState('');

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return VALID_ICON_CATEGORIES;
    const q = search.toLowerCase();
    return VALID_ICON_CATEGORIES.map((cat) => {
      if (cat.label.toLowerCase().includes(q)) return cat;
      return { ...cat, icons: cat.icons.filter((icon) => icon.toLowerCase().includes(q)) };
    }).filter((cat) => cat.icons.length > 0);
  }, [search]);

  const handleSelect = (icon: string) => {
    onSelect(icon);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl p-0">
        <SheetHeader className="px-4 pt-4 pb-2">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <SheetTitle className="text-lg font-bold">Catálogo de ícones</SheetTitle>
          </div>
        </SheetHeader>

        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar ícone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <ScrollArea className="flex-1 h-[calc(85vh-120px)]">
          <div className="space-y-6 px-4 pb-6">
            {filteredCategories.map((cat) => (
              <div key={cat.label}>
                <p className="mb-3 text-sm font-bold text-foreground">{cat.label}</p>
                <div className="grid grid-cols-4 gap-3 justify-items-center">
                  {cat.icons.map((icon) => {
                    const isSelected = value === icon;
                    return (
                      <button
                        key={icon}
                        type="button"
                        className={cn(
                          'flex h-16 w-16 items-center justify-center rounded-full transition-all hover:scale-105',
                          isSelected
                            ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                            : 'hover:brightness-110'
                        )}
                        style={{ backgroundColor: isSelected ? selectedColor : 'hsl(var(--muted))' }}
                        onClick={() => handleSelect(icon)}
                        title={icon}
                      >
                        <CategoryIcon
                          iconName={icon}
                          className="h-7 w-7"
                          style={{ color: isSelected ? 'white' : 'hsl(var(--muted-foreground))' }}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            {filteredCategories.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">Nenhum ícone encontrado</p>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
