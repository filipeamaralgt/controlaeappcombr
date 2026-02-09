import { lazy, Suspense } from 'react';
import { LucideProps } from 'lucide-react';
import dynamicIconImports from 'lucide-react/dynamicIconImports';

interface CategoryIconProps extends Omit<LucideProps, 'ref'> {
  iconName?: string;
  fallbackColor?: string;
}

const fallback = <div className="h-4 w-4 rounded-full bg-muted" />;

export function CategoryIcon({ iconName, fallbackColor, ...props }: CategoryIconProps) {
  const name = (iconName || 'circle') as keyof typeof dynamicIconImports;

  if (!dynamicIconImports[name]) {
    // If the icon doesn't exist in the map, show a colored circle
    return (
      <div
        className="h-4 w-4 shrink-0 rounded-full"
        style={{ backgroundColor: fallbackColor || 'currentColor' }}
      />
    );
  }

  const LucideIcon = lazy(dynamicIconImports[name]);

  return (
    <Suspense fallback={fallback}>
      <LucideIcon {...props} />
    </Suspense>
  );
}

// A curated list of icons for the picker, organized by category
export const ICON_CATEGORIES = [
  {
    label: 'Comida & Bebida',
    icons: ['utensils', 'coffee', 'pizza', 'apple', 'cake', 'wine', 'beer', 'egg-fried', 'salad', 'ice-cream-cone'],
  },
  {
    label: 'Transporte',
    icons: ['car', 'bus', 'bike', 'fuel', 'plane', 'train-front', 'ship', 'map-pin'],
  },
  {
    label: 'Casa',
    icons: ['home', 'sofa', 'wrench', 'lamp', 'bath', 'bed', 'plug', 'thermometer'],
  },
  {
    label: 'Saúde',
    icons: ['heart', 'activity', 'pill', 'stethoscope', 'baby', 'dumbbell', 'apple'],
  },
  {
    label: 'Educação',
    icons: ['book-open', 'graduation-cap', 'library', 'pen-tool', 'languages', 'school'],
  },
  {
    label: 'Lazer',
    icons: ['gamepad-2', 'film', 'music', 'palette', 'camera', 'tv', 'ticket', 'drama'],
  },
  {
    label: 'Compras',
    icons: ['shopping-bag', 'shopping-cart', 'shirt', 'gift', 'gem', 'scissors', 'tag'],
  },
  {
    label: 'Trabalho',
    icons: ['briefcase', 'laptop', 'monitor', 'building-2', 'phone', 'mail', 'printer'],
  },
  {
    label: 'Finanças',
    icons: ['wallet', 'credit-card', 'banknote', 'piggy-bank', 'trending-up', 'trending-down', 'coins', 'receipt'],
  },
  {
    label: 'Outros',
    icons: ['star', 'zap', 'shield', 'globe', 'cloud', 'sun', 'moon', 'umbrella', 'paw-print', 'circle', 'more-horizontal'],
  },
];

export const ALL_ICONS = ICON_CATEGORIES.flatMap((c) => c.icons);

export const PRESET_COLORS = [
  // Vermelhos
  '#ef4444', '#f43f5e', '#dc2626',
  // Laranjas
  '#f97316', '#ea580c', '#fb923c',
  // Amarelos
  '#eab308', '#f59e0b', '#fbbf24',
  // Verdes
  '#22c55e', '#10b981', '#16a34a', '#84cc16',
  // Cianos
  '#06b6d4', '#14b8a6', '#0ea5e9',
  // Azuis
  '#3b82f6', '#2563eb', '#1d4ed8',
  // Roxos
  '#6366f1', '#8b5cf6', '#a855f7', '#7c3aed',
  // Rosas
  '#ec4899', '#d946ef', '#f472b6',
  // Neutros
  '#6b7280', '#78716c', '#64748b',
];
