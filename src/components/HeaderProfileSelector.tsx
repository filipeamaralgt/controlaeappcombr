import { useSpendingProfiles } from '@/hooks/useSpendingProfiles';
import { useProfileFilter } from '@/hooks/useProfileFilter';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronDown, User } from 'lucide-react';

export function HeaderProfileSelector() {
  const { data: profiles } = useSpendingProfiles();
  const { profileFilter, setProfileFilter } = useProfileFilter();

  if (!profiles || profiles.length === 0) return null;

  const selected = profiles.find((p) => p.id === profileFilter);
  const label = selected ? selected.name : 'Todos';
  const icon = selected?.icon || null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-9 gap-1.5 px-2.5 text-sm font-medium">
          {icon ? (
            <span className="text-base leading-none">{icon}</span>
          ) : (
            <User className="h-4 w-4" />
          )}
          <span className="max-w-[80px] truncate">{label}</span>
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[160px]">
        <DropdownMenuItem
          onClick={() => setProfileFilter(null)}
          className={!profileFilter ? 'bg-accent' : ''}
        >
          <User className="mr-2 h-4 w-4" />
          Todos
        </DropdownMenuItem>
        {profiles.map((p) => (
          <DropdownMenuItem
            key={p.id}
            onClick={() => setProfileFilter(p.id)}
            className={profileFilter === p.id ? 'bg-accent' : ''}
          >
            <span className="mr-2 text-base leading-none">{p.icon}</span>
            {p.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
