import { cn } from "@/lib/cn";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-surface text-foreground p-5 shadow-sm transition-all duration-200",
        className
      )}
      {...props}
    />
  );
}
