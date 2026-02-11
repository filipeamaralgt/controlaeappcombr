import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

interface GreenPageHeaderProps {
  title: string;
  subtitle: string;
  children?: React.ReactNode;
}

export function GreenPageHeader({ title, subtitle, children }: GreenPageHeaderProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  return (
    <div className="bg-gradient-to-br from-primary/85 to-primary rounded-b-3xl px-4 pb-6 pt-10 text-primary-foreground shadow-lg shadow-primary/20">
      <div className="max-w-2xl mx-auto">
        {isMobile && (
          <button
            onClick={() => navigate('/perfil')}
            className="mb-3 flex items-center gap-1.5 text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar
          </button>
        )}
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-sm text-primary-foreground/70 mt-0.5">{subtitle}</p>
        {children}
      </div>
    </div>
  );
}
