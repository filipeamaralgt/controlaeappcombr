import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

interface PageBackHeaderProps {
  title: string;
  children?: React.ReactNode;
  onBack?: () => void;
}

export function PageBackHeader({ title, children, onBack }: PageBackHeaderProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  return (
    <div className="flex items-center gap-2">
      {isMobile && (
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={onBack ?? (() => navigate('/perfil'))}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      )}
      <h1 className="text-2xl font-bold text-foreground">{title}</h1>
      {children && <div className="ml-auto shrink-0">{children}</div>}
    </div>
  );
}
