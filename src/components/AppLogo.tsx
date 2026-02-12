import { useTheme } from '@/hooks/useTheme';
import logoLight from '@/assets/logo-light.png';
import logoDark from '@/assets/logo-dark.png';
import { cn } from '@/lib/utils';

interface AppLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: 'h-8 w-8',
  md: 'h-9 w-9',
  lg: 'h-20 w-20',
};

export function AppLogo({ size = 'md', className }: AppLogoProps) {
  const { theme } = useTheme();
  const src = theme === 'dark' ? logoDark : logoLight;

  return (
    <img
      src={src}
      alt="Controlaê"
      className={cn(sizeMap[size], 'shrink-0 object-contain', className)}
    />
  );
}
