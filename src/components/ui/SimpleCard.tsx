import * as React from "react";
import { cn } from "@/lib/utils";

export type SimpleCardProps = React.HTMLAttributes<HTMLDivElement>;

export const SimpleCard = React.forwardRef<HTMLDivElement, SimpleCardProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "p-2 bg-white/5 border border-white/20 hover:bg-white/10 hover:border-amber-600/40 rounded-lg transition-all duration-200",
          className
        )}
        {...props}
      />
    );
  }
);
SimpleCard.displayName = "SimpleCard";
