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
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
      </div>
      {children}
    </div>
  );
}
