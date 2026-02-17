import { cn } from '@/lib/utils';

interface PhoneFrameProps {
  children: React.ReactNode;
  className?: string;
  hideHomeIndicator?: boolean;
}

export function PhoneFrame({ children, className, hideHomeIndicator }: PhoneFrameProps) {
  return (
    <div className={cn("relative inline-block", className)}>
      {/* iPhone outer shell with green glow */}
      <div className="relative rounded-[3rem] bg-[#1a1a1a] p-[10px] shadow-[0_8px_40px_-8px_hsl(160_84%_39%/0.35),0_20px_60px_-15px_rgba(0,0,0,0.4)]">
        {/* Side button right */}
        <div className="absolute -right-[3px] top-28 w-[3px] h-8 bg-[#1a1a1a] rounded-r-sm" />
        {/* Side buttons left */}
        <div className="absolute -left-[3px] top-20 w-[3px] h-6 bg-[#1a1a1a] rounded-l-sm" />
        <div className="absolute -left-[3px] top-32 w-[3px] h-10 bg-[#1a1a1a] rounded-l-sm" />
        <div className="absolute -left-[3px] top-[11rem] w-[3px] h-10 bg-[#1a1a1a] rounded-l-sm" />

        {/* Inner bezel / screen area */}
        <div className="relative rounded-[2.2rem] overflow-hidden bg-background">
          {/* Status bar */}
          <div className="relative z-30 flex items-center justify-between px-5 pt-3 pb-1 bg-background">
            {/* Time */}
            <span className="text-[9px] font-semibold text-foreground w-10">9:41</span>
            {/* Dynamic Island */}
            <div className="w-[58px] h-[16px] bg-[#1a1a1a] rounded-full" />
            {/* Icons: signal, wifi, battery */}
            <div className="flex items-center gap-[3px] w-10 justify-end">
              {/* Signal bars */}
              <svg width="10" height="8" viewBox="0 0 14 10" fill="none" className="text-foreground">
                <rect x="0" y="7" width="2.5" height="3" rx="0.5" fill="currentColor"/>
                <rect x="3.5" y="5" width="2.5" height="5" rx="0.5" fill="currentColor"/>
                <rect x="7" y="2.5" width="2.5" height="7.5" rx="0.5" fill="currentColor"/>
                <rect x="10.5" y="0" width="2.5" height="10" rx="0.5" fill="currentColor"/>
              </svg>
              {/* Wifi */}
              <svg width="10" height="8" viewBox="0 0 13 10" fill="none" className="text-foreground">
                <path d="M6.5 9.5a1 1 0 100-2 1 1 0 000 2z" fill="currentColor"/>
                <path d="M3.8 6.8a3.8 3.8 0 015.4 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                <path d="M1.5 4.5a6.5 6.5 0 0110 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              {/* Battery */}
              <svg width="15" height="7" viewBox="0 0 20 9" fill="none" className="text-foreground">
                <rect x="0.5" y="0.5" width="16" height="8" rx="2" stroke="currentColor" strokeWidth="0.8"/>
                <rect x="1.5" y="1.5" width="13" height="6" rx="1" fill="currentColor"/>
                <path d="M17.5 3v3a1.5 1.5 0 000-3z" fill="currentColor" opacity="0.4"/>
              </svg>
            </div>
          </div>

          {/* Screen content */}
          <div className="relative">
            {children}
          </div>

          {/* Home indicator */}
          {!hideHomeIndicator && (
            <div className="flex justify-center py-2 bg-background">
              <div className="w-[35%] h-[4px] bg-foreground/20 rounded-full" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
