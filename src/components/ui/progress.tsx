import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "@/lib/utils";

interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  gradient?: boolean;
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, gradient = false, ...props }, ref) => {
  const pct = value || 0;

  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn("relative h-4 w-full overflow-hidden rounded-full bg-secondary", className)}
      {...props}
    >
      <div
        className="h-full transition-all"
        style={{
          width: `${pct}%`,
          background: gradient
            ? "linear-gradient(90deg, #e0e0e0, #404040)"
            : "hsl(var(--primary))",
        }}
      />
    </ProgressPrimitive.Root>
  );
});
Progress.displayName = "Progress";

export { Progress };
