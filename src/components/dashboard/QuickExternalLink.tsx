"use client";

import React from "react";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/cn";

export interface QuickExternalLinkProps {
  href: string;
  label: string;
  badge?: string;
  icon?: React.ComponentType<{ className?: string; size?: number }>;
  description?: string;
  className?: string;
}

export function QuickExternalLink({
  href,
  label,
  badge,
  icon: Icon,
  description,
  className,
}: QuickExternalLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={description || label}
      className={cn(
        "group inline-flex items-center gap-2 rounded-xl border border-border/70 bg-surface/80 px-3 py-1.5 text-xs font-medium text-foreground/80 backdrop-blur-sm shadow-sm transition-all duration-200",
        "hover:border-rose-500/40 hover:bg-rose-500/[0.04] hover:text-foreground hover:shadow-md hover:-translate-y-0.5",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500",
        className
      )}
    >
      {Icon && (
        <Icon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-rose-500 transition-colors shrink-0" size={14} />
      )}
      <span className="truncate">{label}</span>
      {badge && (
        <span className="rounded-md bg-surface-3 px-1.5 py-0.5 text-[9px] font-semibold text-muted-foreground group-hover:text-foreground">
          {badge}
        </span>
      )}
      <ArrowUpRight
        size={12}
        className="text-muted-foreground/60 group-hover:text-rose-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0 ml-auto"
      />
    </a>
  );
}

export default QuickExternalLink;
