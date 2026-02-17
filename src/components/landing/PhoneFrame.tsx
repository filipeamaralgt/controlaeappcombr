import { cn } from '@/lib/utils';

interface PhoneFrameProps {
  children: React.ReactNode;
  className?: string;
}

export function PhoneFrame({ children, className }: PhoneFrameProps) {
  return (
    <div className={cn("relative inline-block", className)}>
      {/* Phone bezel */}
      <div className="relative rounded-[2.5rem] border-[6px] border-foreground/90 bg-foreground/90 shadow-2xl overflow-hidden">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20 w-28 h-6 bg-foreground/90 rounded-b-2xl" />
        {/* Screen */}
        <div className="relative rounded-[2rem] overflow-hidden bg-background">
          {children}
        </div>
      </div>
    </div>
  );
}
