import { cn } from "@/lib/cn";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/[0.08] dark:border-zinc-800/80 bg-surface dark:bg-zinc-900/50 backdrop-blur-xl p-5 shadow-sm shadow-black/[0.04] transition-all duration-200",
        className
      )}
      {...props}
    />
  );
}
