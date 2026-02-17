import { cn } from '@/lib/utils';

interface PhoneFrameProps {
  children: React.ReactNode;
  className?: string;
}

export function PhoneFrame({ children, className }: PhoneFrameProps) {
  return (
    <div className={cn("relative inline-block", className)}>
      {/* iPhone outer shell */}
      <div className="relative rounded-[3rem] bg-[#1a1a1a] p-[10px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.4)]">
        {/* Side button right */}
        <div className="absolute -right-[3px] top-28 w-[3px] h-8 bg-[#1a1a1a] rounded-r-sm" />
        {/* Side buttons left */}
        <div className="absolute -left-[3px] top-20 w-[3px] h-6 bg-[#1a1a1a] rounded-l-sm" />
        <div className="absolute -left-[3px] top-32 w-[3px] h-10 bg-[#1a1a1a] rounded-l-sm" />
        <div className="absolute -left-[3px] top-[11rem] w-[3px] h-10 bg-[#1a1a1a] rounded-l-sm" />

        {/* Inner bezel / screen area */}
        <div className="relative rounded-[2.2rem] overflow-hidden bg-background">
          {/* Dynamic Island */}
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-20 w-[90px] h-[25px] bg-[#1a1a1a] rounded-full" />

          {/* Screen content */}
          <div className="relative">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
