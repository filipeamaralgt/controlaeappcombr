import { useTheme } from '@/hooks/useTheme';
import { Sun, Moon, Monitor } from 'lucide-react';

const options = [
  { value: 'light' as const, label: 'Claro', Icon: Sun },
  { value: 'dark' as const, label: 'Escuro', Icon: Moon },
  { value: 'system' as const, label: 'Sistema', Icon: Monitor },
];

export function ThemeSelector() {
  const { mode, setMode } = useTheme();

  return (
    <div className="flex gap-2">
      {options.map(({ value, label, Icon }) => (
        <button
          key={value}
          onClick={() => setMode(value)}
          className={`flex flex-1 flex-col items-center gap-2 rounded-xl border p-3 transition-all ${
            mode === value
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border/50 bg-card text-muted-foreground hover:bg-muted'
          }`}
        >
          <Icon className="h-5 w-5" />
          <span className="text-xs font-medium">{label}</span>
        </button>
      ))}
    </div>
  );
}
