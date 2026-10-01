import React from "react";
import { cn } from "@/lib/cn";

export interface PremiumCardProps {
  id?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string; size?: number; weight?: string }> | any;
  action?: React.ReactNode;
  highlighted?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function PremiumCard({
  id,
  title,
  description,
  icon: Icon,
  action,
  highlighted = false,
  className,
  children,
}: PremiumCardProps) {
  const renderIcon = () => {
    if (!Icon) return null;
    if (React.isValidElement(Icon)) {
      return Icon;
    }
    const IconComponent = Icon as React.ComponentType<{ className?: string; size?: number }>;
    return <IconComponent className="h-5 w-5" size={20} />;
  };

  return (
    <div
      id={id}
      className={cn(
        "rounded-2xl border border-border/70 bg-surface/90 backdrop-blur-md shadow-sm transition-all duration-300 overflow-hidden",
        highlighted
          ? "ring-2 ring-rose-500 shadow-xl shadow-rose-500/10 border-rose-500/60 bg-rose-500/[0.02]"
          : "hover:border-border hover:shadow-md",
        className
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 border-b border-border/50 bg-surface-2/30">
        <div className="flex items-start sm:items-center gap-3.5">
          {Icon && (
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 shadow-sm">
              {renderIcon()}
            </div>
          )}
          <div className="space-y-0.5">
            <h3 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
              {title}
            </h3>
            {description && (
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {description}
              </p>
            )}
          </div>
        </div>
        {action && <div className="flex items-center gap-2 flex-shrink-0">{action}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
}

export default PremiumCard;
