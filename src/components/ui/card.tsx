import { cn } from "@/lib/cn";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/[0.08] bg-[#111624]/80 backdrop-blur-xl p-5 shadow-lg shadow-black/20 transition-all duration-200",
        className
      )}
      {...props}
    />
  );
}
