import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateCategory } from '@/hooks/useCategories';
import { CategoryIcon, PRESET_COLORS, VALID_ICON_CATEGORIES } from '@/components/CategoryIcon';
import { IconCatalogSheet } from '@/components/IconCatalogSheet';
import { ColorSwipePicker } from '@/components/ColorSwipePicker';
import { Loader2 } from 'lucide-react';
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
  const [catalogOpen, setCatalogOpen] = useState(false);

  const createCategory = useCreateCategory();

  const allIcons = useMemo(() => VALID_ICON_CATEGORIES.flatMap((c) => c.icons), []);

  const resetForm = () => {
    setName('');
    setColor(PRESET_COLORS[0]);
    setIcon('circle');
    setIcon('circle');
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

  const INITIAL_ICONS_COUNT = 11;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-sm z-[60]">
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
            <ColorSwipePicker value={color} onChange={setColor} />
          </div>

          {/* Icon Picker */}
          <div className="space-y-1.5">
            <Label className="text-xs">Ícone</Label>
            <div className="grid grid-cols-4 gap-1.5">
              {allIcons.slice(0, INITIAL_ICONS_COUNT).map((ic) => (
                <button
                  key={ic}
                  type="button"
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-full transition-all hover:scale-110',
                    icon === ic ? 'ring-2 ring-primary ring-offset-1 ring-offset-background' : 'hover:opacity-80'
                  )}
                  style={{ backgroundColor: icon === ic ? color : 'hsl(var(--muted))' }}
                  onClick={() => setIcon(ic)}
                  title={ic}
                >
                  <CategoryIcon iconName={ic} className="h-4 w-4" style={{ color: icon === ic ? 'white' : 'hsl(var(--muted-foreground))' }} />
                </button>
              ))}
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/80 hover:bg-primary transition-all"
                onClick={() => setCatalogOpen(true)}
              >
                <span className="text-white text-lg font-bold leading-none">···</span>
              </button>
            </div>
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

      <IconCatalogSheet
        open={catalogOpen}
        onOpenChange={setCatalogOpen}
        value={icon}
        selectedColor={color}
        onSelect={setIcon}
      />
    </Dialog>
  );
}
