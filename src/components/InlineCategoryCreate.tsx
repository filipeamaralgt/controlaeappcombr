import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCreateCategory } from '@/hooks/useCategories';
import { CategoryIcon, PRESET_COLORS, VALID_ICON_CATEGORIES } from '@/components/CategoryIcon';
import { Loader2, Check, Search } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface InlineCategoryCreateProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'expense' | 'income';
  onCreated: (categoryId: string) => void;
}

export function InlineCategoryCreate({ open, onOpenChange, type, onCreated }: InlineCategoryCreateProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [icon, setIcon] = useState('circle');
  const [iconSearch, setIconSearch] = useState('');

  const createCategory = useCreateCategory();

  const filteredCategories = useMemo(() => {
    if (!iconSearch.trim()) return VALID_ICON_CATEGORIES;
    const q = iconSearch.toLowerCase();
    return VALID_ICON_CATEGORIES.map((cat) => ({
      ...cat,
      icons: cat.icons.filter((ic) => ic.toLowerCase().includes(q)),
    })).filter((cat) => cat.icons.length > 0);
  }, [iconSearch]);

  const resetForm = () => {
    setName('');
    setColor(PRESET_COLORS[0]);
    setIcon('circle');
    setIconSearch('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const result = await createCategory.mutateAsync({
        name: name.trim(),
        color,
        icon,
        type,
      });
      toast.success('Categoria criada!');
      onCreated(result.id);
      resetForm();
      onOpenChange(false);
    } catch {
      toast.error('Erro ao criar categoria');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Nova Categoria</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Live Preview */}
          <div className="flex items-center justify-center gap-3 rounded-xl bg-muted/40 p-4">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full transition-all"
              style={{ backgroundColor: color }}
            >
              <CategoryIcon iconName={icon} className="h-5 w-5 text-white" />
            </div>
            <span className="text-sm font-semibold text-foreground">
              {name || 'Nome da categoria'}
            </span>
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <Label className="text-xs">Nome</Label>
            <Input
              placeholder="Ex: Pet, Streaming..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          {/* Color Picker */}
          <div className="space-y-1.5">
            <Label className="text-xs">Cor</Label>
            <ScrollArea className="h-24">
              <div className="grid grid-cols-10 gap-1.5 pr-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={cn(
                      'flex h-6 w-6 items-center justify-center rounded-full transition-all hover:scale-110',
                      color === c && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                    )}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                  >
                    {color === c && <Check className="h-3 w-3 text-white drop-shadow-md" />}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Icon Picker */}
          <div className="space-y-1.5">
            <Label className="text-xs">Ícone</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar ícone..."
                value={iconSearch}
                onChange={(e) => setIconSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <ScrollArea className="h-40">
              <div className="space-y-3 pr-2">
                {filteredCategories.map((cat) => (
                  <div key={cat.label} className="animate-fade-in">
                    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {cat.label}
                    </p>
                    <div className="grid grid-cols-6 gap-1.5">
                      {cat.icons.map((ic, idx) => (
                        <button
                          key={ic}
                          type="button"
                          className={cn(
                            'flex h-9 w-9 items-center justify-center rounded-full transition-all hover:scale-110 animate-scale-in',
                            icon === ic
                              ? 'ring-2 ring-primary ring-offset-1 ring-offset-background'
                              : 'hover:opacity-80'
                          )}
                          style={{
                            backgroundColor: icon === ic ? color : 'hsl(var(--muted))',
                            animationDelay: `${Math.min(idx * 20, 200)}ms`,
                            animationFillMode: 'both',
                          }}
                          onClick={() => setIcon(ic)}
                          title={ic}
                        >
                          <CategoryIcon
                            iconName={ic}
                            className="h-4 w-4"
                            style={{ color: icon === ic ? 'white' : 'hsl(var(--muted-foreground))' }}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                {filteredCategories.length === 0 && (
                  <p className="py-4 text-center text-xs text-muted-foreground">
                    Nenhum ícone encontrado
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Submit */}
          <Button type="submit" className="w-full" disabled={createCategory.isPending || !name.trim()}>
            {createCategory.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Salvar Categoria
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
