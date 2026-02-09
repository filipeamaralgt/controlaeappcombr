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
      'baby', 'users', 'heart-handshake', 'house', 'smile', 'heart',
      'hand-heart', 'backpack', 'blocks', 'book-open',
      'stroller', 'user-round', 'users-round',
    ],
  },
  {
    label: 'Pets',
    icons: [
      'paw-print', 'dog', 'cat', 'bird', 'fish', 'rabbit', 'squirrel',
      'bug', 'turtle', 'bone', 'carrot',
    ],
  },
  {
    label: 'Exercício',
    icons: [
      'dumbbell', 'bike', 'trophy', 'person-standing', 'timer',
      'footprints', 'mountain', 'waves', 'sailboat', 'swim',
      'medal', 'target', 'flame', 'zap', 'gauge', 'heart-pulse',
      'activity', 'volleyball', 'goal', 'swords',
      'running', 'yoga', 'tennis-ball',
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

// ~150 preset colors organized by hue, each row saturated → light
export const PRESET_COLORS = [
  // Vermelho
  '#cc0000', '#ef4444', '#f87171', '#fca5a5', '#fecaca',
  // Coral
  '#dc2626', '#f05252', '#ff7a7a', '#ffb8b8', '#ffd6d6',
  // Laranja-vermelho
  '#ea580c', '#f97316', '#fb923c', '#fdba74', '#fed7aa',
  // Laranja
  '#e65100', '#ff8000', '#ff9a33', '#ffb366', '#ffcc99',
  // Laranja-claro
  '#f57c00', '#ffa040', '#ffb566', '#ffc98c', '#ffddb3',
  // Amarelo-laranja
  '#f59e0b', '#f9bc51', '#fbcb74', '#fdda97', '#fee9ba',
  // Amarelo
  '#eab308', '#f4cd42', '#f9da5f', '#fde77c', '#fff4a3',
  // Amarelo-lima
  '#cabd08', '#e0d722', '#ebe42f', '#f0ec60', '#f5f490',
  // Lima
  '#84cc16', '#a4dc46', '#b4e45e', '#c8ee82', '#dcf4a6',
  // Verde-lima
  '#65a30d', '#86c52f', '#9bd44a', '#b0e365', '#c5ee8c',
  // Verde
  '#16a34a', '#2ec462', '#4dd47a', '#72e09a', '#96ecba',
  // Verde-menta
  '#00c853', '#33e880', '#5cee9c', '#85f4b8', '#aefad4',
  // Teal
  '#00bfa5', '#2adfc1', '#50e5cf', '#76ebdd', '#9cf1eb',
  // Teal-cyan
  '#0d9488', '#1dbbac', '#3dcebe', '#5ddbd0', '#80e8e2',
  // Ciano
  '#0891b2', '#18b9da', '#3ccade', '#60dbe2', '#84ece6',
  // Ciano-claro
  '#00bcd4', '#2adcf0', '#55e2f2', '#80e8f4', '#aaeef6',
  // Azul-céu
  '#0ea5e9', '#42bff3', '#66ccf5', '#8ad9f7', '#aee6f9',
  // Azul
  '#2563eb', '#5187f1', '#6e9df4', '#8bb3f7', '#a8c9fa',
  // Azul-royal
  '#1d4ed8', '#4372e0', '#5e8ae6', '#79a2ec', '#94baf2',
  // Índigo
  '#3730a3', '#5950bd', '#7068c8', '#8780d3', '#9e98de',
  // Violeta
  '#4f46e5', '#716aeb', '#8a84f0', '#a39ef5', '#bcb8fa',
  // Roxo
  '#7c3aed', '#9862f3', '#aa7ef6', '#bc9af9', '#ceb6fc',
  // Roxo-escuro
  '#9333ea', '#af5df0', '#bf7af3', '#cf97f6', '#dfb4f9',
  // Magenta
  '#a21caf', '#c240c9', '#d060d6', '#de80e3', '#eca0f0',
  // Magenta-rosa
  '#c026d3', '#d854eb', '#e070f0', '#e88cf5', '#f0a8fa',
  // Rosa-forte
  '#db2777', '#e75399', '#ed6eaa', '#f389bb', '#f9a4cc',
  // Rosa
  '#ec4899', '#f272b3', '#f58dc4', '#f8a8d5', '#fbc3e6',
  // Rosa-claro
  '#f06292', '#f688ae', '#f99bbc', '#fcaeca', '#ffc1d8',
  // Marrom
  '#795548', '#9b776c', '#ac887e', '#bd9990', '#ceaaa2',
  // Cinza-quente
  '#78716c', '#9c9590', '#aea7a2', '#c0b9b4', '#d2cbc6',
  // Cinza
  '#6b7280', '#8f96a0', '#a1a8b0', '#b3bac0', '#c5ccd0',
  // Cinza-azulado
  '#64748b', '#8898ad', '#9aaabe', '#acbccf', '#becee0',
];
