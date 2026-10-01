"use client";

import React from "react";
import { CheckCircle, WarningCircle, Clock, XCircle } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/cn";

export type StatusPillVariant = "active" | "warning" | "error" | "pending" | "neutral";

export interface StatusPillProps {
  status: StatusPillVariant;
  label: string;
  sublabel?: string;
  icon?: boolean;
  className?: string;
}

export function StatusPill({
  status,
  label,
  sublabel,
  icon = true,
  className,
}: StatusPillProps) {
  const getVariantStyles = () => {
    switch (status) {
      case "active":
        return {
          wrapper: "bg-emerald-500/10 text-emerald-500 border-emerald-500/25 dark:bg-emerald-500/15 dark:text-emerald-400",
          iconColor: "text-emerald-500 dark:text-emerald-400",
          Icon: CheckCircle,
          weight: "fill" as const,
        };
      case "warning":
        return {
          wrapper: "bg-amber-500/10 text-amber-500 border-amber-500/25 dark:bg-amber-500/15 dark:text-amber-400",
          iconColor: "text-amber-500 dark:text-amber-400",
          Icon: WarningCircle,
          weight: "bold" as const,
        };
      case "error":
        return {
          wrapper: "bg-destructive/10 text-destructive border-destructive/25 dark:bg-destructive/15",
          iconColor: "text-destructive",
          Icon: XCircle,
          weight: "fill" as const,
        };
      case "pending":
        return {
          wrapper: "bg-blue-500/10 text-blue-500 border-blue-500/25 dark:bg-blue-500/15 dark:text-blue-400",
          iconColor: "text-blue-500 dark:text-blue-400",
          Icon: Clock,
          weight: "bold" as const,
        };
      case "neutral":
      default:
        return {
          wrapper: "bg-surface-3 text-muted-foreground border-border/80",
          iconColor: "text-muted-foreground",
          Icon: null,
          weight: "regular" as const,
        };
    }
  };

  const config = getVariantStyles();
  const IconComponent = config.Icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border backdrop-blur-sm shadow-sm transition-colors",
        config.wrapper,
        className
      )}
    >
      {icon && IconComponent && (
        <IconComponent size={14} weight={config.weight} className={config.iconColor} />
      )}
      <span>{label}</span>
      {sublabel && (
        <span className="text-[10px] opacity-75 font-normal">({sublabel})</span>
      )}
    </span>
  );
}

export default StatusPill;
