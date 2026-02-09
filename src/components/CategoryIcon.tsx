import { LucideProps, icons } from 'lucide-react';

interface CategoryIconProps extends Omit<LucideProps, 'ref'> {
  iconName?: string;
  fallbackColor?: string;
}

// Convert kebab-case to PascalCase for lucide-react icons
function toPascalCase(str: string): string {
  return str
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

export function CategoryIcon({ iconName, fallbackColor, ...props }: CategoryIconProps) {
  const pascalName = toPascalCase(iconName || 'circle');
  const LucideIcon = icons[pascalName as keyof typeof icons];

  if (!LucideIcon) {
    // If the icon doesn't exist, show a colored circle
    return (
      <div
        className="h-4 w-4 shrink-0 rounded-full"
        style={{ backgroundColor: fallbackColor || 'currentColor' }}
      />
    );
  }

  return <LucideIcon {...props} />;
}

// A curated list of icons for the picker, organized by category
export const ICON_CATEGORIES = [
  {
    label: 'Finanças',
    icons: [
      'landmark', 'hand-coins', 'calculator', 'credit-card', 'dollar-sign', 'euro',
      'coins', 'chart-bar', 'receipt', 'trending-up', 'banknote', 'wallet',
      'piggy-bank', 'percent', 'chart-line', 'chart-pie', 'badge-percent',
      'building-2', 'briefcase', 'scale', 'circle-dollar-sign', 'bitcoin',
    ],
  },
  {
    label: 'Transporte',
    icons: [
      'ship', 'fuel', 'car', 'car-front', 'car-taxi-front', 'bus', 'train-front',
      'tram-front', 'bike', 'map-pin', 'truck', 'plane', 'plane-takeoff',
      'parking-meter', 'navigation', 'rocket', 'sailboat', 'cable-car',
      'map', 'compass', 'route', 'milestone', 'locate',
    ],
  },
  {
    label: 'Compras',
    icons: [
      'shopping-cart', 'camera', 'shirt', 'gamepad-2', 'shopping-bag',
      'smartphone', 'laptop', 'gift', 'gem', 'tag', 'store', 'package',
      'box', 'watch', 'briefcase', 'badge-percent', 'scissors', 'plug',
      'battery', 'headphones', 'monitor', 'tablet', 'tv', 'speaker',
      'receipt', 'barcode', 'scan-line',
    ],
  },
  {
    label: 'Alimentação',
    icons: [
      'beer', 'sandwich', 'utensils', 'coffee', 'pizza', 'apple', 'fish',
      'egg-fried', 'ice-cream-cone', 'cookie', 'cake', 'wine', 'grape',
      'cherry', 'banana', 'carrot', 'milk', 'croissant', 'popcorn',
      'cup-soda', 'salad', 'soup', 'beef', 'wheat', 'candy',
      'drumstick', 'citrus',
    ],
  },
  {
    label: 'Casa',
    icons: [
      'air-vent', 'paintbrush', 'house', 'lamp', 'sofa', 'wrench',
      'bath', 'bed', 'plug', 'thermometer', 'door-open', 'key',
      'hammer', 'refrigerator', 'washing-machine', 'microwave', 'fence',
      'armchair', 'toilet', 'shower-head', 'flower-2', 'drill',
      'paint-bucket', 'ruler', 'image', 'cooking-pot', 'archive',
    ],
  },
  {
    label: 'Saúde',
    icons: [
      'syringe', 'heart', 'activity', 'pill', 'stethoscope',
      'hospital', 'thermometer', 'brain', 'eye', 'ear',
      'accessibility', 'heart-pulse', 'cross', 'bandage', 'clipboard-plus',
      'shield-plus', 'scan', 'bone',
    ],
  },
  {
    label: 'Beleza',
    icons: [
      'sparkles', 'spray-can', 'scissors', 'droplet', 'flower-2', 'palette',
      'brush', 'star', 'gem', 'crown', 'glasses', 'smile',
    ],
  },
  {
    label: 'Educação',
    icons: [
      'book-open', 'graduation-cap', 'library', 'pen-tool', 'languages', 'school',
      'book', 'notebook', 'pencil', 'ruler', 'calculator', 'backpack', 'award',
      'bookmark', 'highlighter', 'eraser', 'clipboard', 'file-text',
      'monitor', 'trophy', 'medal',
    ],
  },
  {
    label: 'Família',
    icons: [
      'baby', 'users', 'heart-handshake', 'house', 'paw-print',
      'dog', 'cat', 'bird', 'rabbit', 'squirrel', 'bone',
      'turtle', 'fish', 'bug',
    ],
  },
  {
    label: 'Exercício',
    icons: [
      'dumbbell', 'bike', 'trophy', 'person-standing', 'timer',
      'footprints', 'mountain', 'waves', 'sailboat',
      'medal', 'target', 'flame', 'zap', 'gauge',
    ],
  },
  {
    label: 'Lazer',
    icons: [
      'gamepad-2', 'film', 'music', 'palette', 'camera', 'tv', 'ticket', 'drama',
      'party-popper', 'guitar', 'headphones', 'mic', 'video', 'clapperboard',
      'disc-3', 'dice-5', 'tent', 'mountain', 'sun', 'umbrella',
      'beer', 'martini', 'flame', 'luggage', 'map',
      'binoculars', 'telescope', 'podcast',
    ],
  },
  {
    label: 'Trabalho',
    icons: [
      'briefcase', 'laptop', 'monitor', 'building-2', 'phone', 'mail', 'printer',
      'keyboard', 'mouse', 'headset', 'presentation', 'calendar', 'clock',
      'file', 'folder', 'archive', 'send', 'inbox', 'at-sign', 'paperclip',
      'pen-tool', 'clipboard', 'megaphone', 'lightbulb',
    ],
  },
  {
    label: 'Tecnologia',
    icons: [
      'smartphone', 'tablet', 'laptop', 'monitor', 'tv', 'speaker', 'headphones',
      'camera', 'wifi', 'bluetooth', 'cpu', 'hard-drive', 'usb', 'battery',
      'power', 'settings', 'cloud', 'download', 'upload', 'link',
      'qr-code', 'satellite-dish', 'radio', 'globe',
    ],
  },
  {
    label: 'Outros',
    icons: [
      'star', 'zap', 'shield', 'globe', 'cloud', 'sun', 'moon', 'umbrella',
      'circle', 'square', 'triangle', 'hexagon', 'plus', 'minus', 'x',
      'check', 'flag', 'bookmark', 'pin', 'lock', 'unlock', 'key',
      'info', 'alert-circle', 'help-circle', 'more-horizontal',
      'church', 'candle', 'hand-heart', 'ribbon', 'leaf',
    ],
  },
];

// Helper to check if an icon exists
function iconExists(iconName: string): boolean {
  const pascalName = iconName
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
  return pascalName in icons;
}

// Filter each category to only include icons that actually exist in lucide-react
export const VALID_ICON_CATEGORIES = ICON_CATEGORIES.map((cat) => ({
  ...cat,
  icons: cat.icons.filter((icon) => iconExists(icon)),
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
