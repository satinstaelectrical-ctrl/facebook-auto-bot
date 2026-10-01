import React from "react";
import { cn } from "@/lib/cn";

export interface PremiumRowProps {
  id?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  highlighted?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function PremiumRow({
  id,
  title,
  description,
  highlighted = false,
  className,
  children,
}: PremiumRowProps) {
  return (
    <div
      id={id}
      className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 border-b border-border/40 last:border-b-0 transition-colors duration-200",
        highlighted && "bg-rose-500/5 ring-1 ring-inset ring-rose-500/30",
        className
      )}
    >
      <div className="space-y-1 sm:max-w-[45%] flex-1">
        <div className="text-sm font-semibold text-foreground tracking-tight">{title}</div>
        {description && (
          <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
        )}
      </div>
      {children && (
        <div className="w-full sm:w-auto sm:min-w-[260px] sm:max-w-md flex-1 flex items-center sm:justify-end">
          {children}
        </div>
      )}
    </div>
  );
}

export default PremiumRow;
