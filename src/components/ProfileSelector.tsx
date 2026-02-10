import { useSpendingProfiles } from '@/hooks/useSpendingProfiles';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface ProfileSelectorProps {
  value: string | null;
  onChange: (profileId: string | null) => void;
  type?: 'expense' | 'income';
  date?: string;
}

export function ProfileSelector({ value, onChange, type = 'expense', date }: ProfileSelectorProps) {
  const { data: profiles } = useSpendingProfiles();

  if (!profiles || profiles.length === 0) return null;

  return (
    <div className="space-y-2">
      <Label>{(() => {
        const isFuture = date ? new Date(date + 'T12:00:00') > new Date() : false;
        if (type === 'income') return isFuture ? 'Quem receberá?' : 'Quem recebeu?';
        return isFuture ? 'Quem gastará?' : 'Quem gastou?';
      })()}</Label>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onChange(null)}
          className={cn(
            'flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-all border',
            !value
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border text-muted-foreground hover:bg-muted/60'
          )}
        >
          Todos
        </button>
        {profiles.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onChange(p.id)}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all border',
              value === p.id
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:bg-muted/60'
            )}
          >
            <span>{p.icon}</span>
            {p.name}
          </button>
        ))}
      </div>
    </div>
  );
}
