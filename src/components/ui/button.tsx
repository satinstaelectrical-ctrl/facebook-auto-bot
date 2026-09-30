import React from "react";
import { cn } from "@/lib/cn";

export type Variant =
  | "primary"
  | "default"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger"
  | "destructive"
  | "emerald"
  | "glow";

type Size = "sm" | "md" | "lg" | "icon";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:brightness-110 active:scale-[0.98]",
  default:
    "bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:brightness-110 active:scale-[0.98]",
  secondary:
    "border border-border bg-surface-2 text-foreground hover:bg-surface-3 hover:border-border/80 active:scale-[0.98]",
  outline:
    "border border-border bg-transparent text-foreground hover:bg-surface-2 active:scale-[0.98]",
  ghost:
    "text-muted-foreground hover:bg-surface-2 hover:text-foreground active:scale-[0.98]",
  danger:
    "bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/20 active:scale-[0.98]",
  destructive:
    "bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/20 active:scale-[0.98]",
  emerald:
    "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:brightness-110 active:scale-[0.98]",
  glow:
    "border border-indigo-500/40 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-500/20 shadow-sm shadow-indigo-500/20 active:scale-[0.98]",
};

const SIZES: Record<Size, string> = {
  sm: "h-8.5 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2.5",
  icon: "h-9 w-9 p-0 justify-center",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        "inline-flex cursor-pointer select-none items-center justify-center rounded-xl font-medium transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50 disabled:transform-none",
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...props}
    >
      {loading ? (
        <>
          <svg
            className="animate-spin h-4 w-4 shrink-0 text-current opacity-80"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="opacity-90">{children}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
