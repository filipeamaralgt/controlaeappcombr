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

// A curated list of icons for the picker, organized by category (100+ icons)
export const ICON_CATEGORIES = [
  {
    label: 'Alimentação',
    icons: [
      'utensils', 'coffee', 'pizza', 'apple', 'cake', 'wine', 'beer', 'egg-fried', 
      'salad', 'ice-cream-cone', 'cookie', 'sandwich', 'soup', 'beef', 'fish', 
      'milk', 'croissant', 'popcorn', 'cherry', 'grape', 'banana', 'carrot',
      'shopping-basket', 'store'
    ],
  },
  {
    label: 'Transporte',
    icons: [
      'car', 'bus', 'bike', 'fuel', 'plane', 'train-front', 'ship', 'map-pin',
      'truck', 'taxi', 'car-front', 'sailboat', 'rocket', 'tram-front', 
      'cable-car', 'navigation', 'parking-meter', 'toll'
    ],
  },
  {
    label: 'Casa',
    icons: [
      'home', 'sofa', 'wrench', 'lamp', 'bath', 'bed', 'plug', 'thermometer',
      'door-open', 'key', 'hammer', 'paint-bucket', 'refrigerator', 'washing-machine',
      'microwave', 'air-vent', 'fence', 'armchair', 'toilet', 'shower-head'
    ],
  },
  {
    label: 'Saúde',
    icons: [
      'heart', 'activity', 'pill', 'stethoscope', 'baby', 'dumbbell', 'apple',
      'hospital', 'syringe', 'thermometer', 'brain', 'eye', 'ear', 'hand',
      'accessibility', 'heart-pulse', 'cross', 'bandage', 'clipboard-plus'
    ],
  },
  {
    label: 'Educação',
    icons: [
      'book-open', 'graduation-cap', 'library', 'pen-tool', 'languages', 'school',
      'book', 'notebook', 'pencil', 'ruler', 'calculator', 'backpack', 'award',
      'bookmark', 'highlighter', 'eraser', 'clipboard', 'file-text'
    ],
  },
  {
    label: 'Lazer',
    icons: [
      'gamepad-2', 'film', 'music', 'palette', 'camera', 'tv', 'ticket', 'drama',
      'party-popper', 'guitar', 'headphones', 'mic', 'video', 'clapperboard',
      'disc-3', 'dice-5', 'tent', 'mountain', 'waves', 'sun', 'umbrella-off',
      'palmtree', 'beer', 'martini'
    ],
  },
  {
    label: 'Compras',
    icons: [
      'shopping-bag', 'shopping-cart', 'shirt', 'gift', 'gem', 'scissors', 'tag',
      'package', 'box', 'store', 'receipt', 'barcode', 'percent', 'badge-percent',
      'truck', 'credit-card'
    ],
  },
  {
    label: 'Beleza',
    icons: [
      'sparkles', 'spray-can', 'scissors', 'droplet', 'flower-2', 'heart',
      'mirror', 'palette', 'brush', 'star', 'gem', 'crown'
    ],
  },
  {
    label: 'Trabalho',
    icons: [
      'briefcase', 'laptop', 'monitor', 'building-2', 'phone', 'mail', 'printer',
      'keyboard', 'mouse', 'headset', 'presentation', 'calendar', 'clock',
      'file', 'folder', 'archive', 'send', 'inbox', 'at-sign', 'paperclip'
    ],
  },
  {
    label: 'Finanças',
    icons: [
      'wallet', 'credit-card', 'banknote', 'piggy-bank', 'trending-up', 'trending-down', 
      'coins', 'receipt', 'landmark', 'building-2', 'chart-bar', 'chart-line',
      'chart-pie', 'calculator', 'percent', 'dollar-sign', 'bitcoin', 'hand-coins',
      'vault', 'safe'
    ],
  },
  {
    label: 'Pets',
    icons: [
      'paw-print', 'dog', 'cat', 'bird', 'fish', 'rabbit', 'squirrel', 'bug',
      'turtle', 'bone', 'carrot'
    ],
  },
  {
    label: 'Tecnologia',
    icons: [
      'smartphone', 'tablet', 'laptop', 'monitor', 'tv', 'speaker', 'headphones',
      'camera', 'wifi', 'bluetooth', 'cpu', 'hard-drive', 'usb', 'battery',
      'power', 'settings', 'cloud', 'download', 'upload', 'link'
    ],
  },
  {
    label: 'Outros',
    icons: [
      'star', 'zap', 'shield', 'globe', 'cloud', 'sun', 'moon', 'umbrella', 
      'circle', 'square', 'triangle', 'hexagon', 'plus', 'minus', 'x',
      'check', 'flag', 'bookmark', 'pin', 'lock', 'unlock', 'key',
      'info', 'alert-circle', 'help-circle', 'more-horizontal', 'more-vertical'
    ],
  },
];

// Filter each category to only include icons that actually exist in lucide-react
export const VALID_ICON_CATEGORIES = ICON_CATEGORIES.map((cat) => ({
  ...cat,
  icons: cat.icons.filter((icon) => icon in dynamicIconImports),
})).filter((cat) => cat.icons.length > 0);

export const ALL_ICONS = VALID_ICON_CATEGORIES.flatMap((c) => c.icons);

// 50+ preset colors organized by hue
export const PRESET_COLORS = [
  // Vermelhos
  '#ef4444', '#dc2626', '#b91c1c', '#f87171', '#fca5a5',
  // Rosas
  '#f43f5e', '#e11d48', '#be123c', '#fb7185', '#fda4af',
  // Magentas
  '#ec4899', '#db2777', '#be185d', '#f472b6', '#f9a8d4',
  // Roxos
  '#a855f7', '#9333ea', '#7e22ce', '#c084fc', '#d8b4fe',
  // Violetas
  '#8b5cf6', '#7c3aed', '#6d28d9', '#a78bfa', '#c4b5fd',
  // Índigos
  '#6366f1', '#4f46e5', '#4338ca', '#818cf8', '#a5b4fc',
  // Azuis
  '#3b82f6', '#2563eb', '#1d4ed8', '#60a5fa', '#93c5fd',
  // Cianos claros
  '#0ea5e9', '#0284c7', '#0369a1', '#38bdf8', '#7dd3fc',
  // Cianos
  '#06b6d4', '#0891b2', '#0e7490', '#22d3ee', '#67e8f9',
  // Teals
  '#14b8a6', '#0d9488', '#0f766e', '#2dd4bf', '#5eead4',
  // Verdes
  '#22c55e', '#16a34a', '#15803d', '#4ade80', '#86efac',
  // Verdes lima
  '#84cc16', '#65a30d', '#4d7c0f', '#a3e635', '#bef264',
  // Amarelos
  '#eab308', '#ca8a04', '#a16207', '#facc15', '#fde047',
  // Laranjas
  '#f97316', '#ea580c', '#c2410c', '#fb923c', '#fdba74',
  // Neutros quentes
  '#78716c', '#57534e', '#44403c', '#a8a29e', '#d6d3d1',
  // Neutros frios
  '#6b7280', '#4b5563', '#374151', '#9ca3af', '#d1d5db',
  // Slate
  '#64748b', '#475569', '#334155', '#94a3b8', '#cbd5e1',
];
