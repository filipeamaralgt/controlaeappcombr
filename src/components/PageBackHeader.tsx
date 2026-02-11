import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface PageBackHeaderProps {
  title: string;
  children?: React.ReactNode;
}

export function PageBackHeader({ title, children }: PageBackHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={() => navigate('/perfil')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold text-foreground truncate">{title}</h1>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
