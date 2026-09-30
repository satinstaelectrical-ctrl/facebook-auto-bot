import type { Icon } from "@phosphor-icons/react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";

export function StatCard({
  label,
  value,
  icon: IconCmp,
  tone = "default",
  trend,
}: {
  label: string;
  value: string | number;
  icon: Icon;
  tone?: "default" | "primary" | "success" | "warning";
  trend?: string;
}) {
  const toneStyles = {
    default: "bg-surface-2 text-foreground",
    primary: "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20",
    success: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  }[tone];

  return (
    <Card className="flex items-center justify-between p-5 hover:border-white/[0.14] transition-all">
      <div className="flex items-center gap-3.5 min-w-0">
        <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-sm", toneStyles)}>
          <IconCmp size={22} weight="bold" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-muted-foreground whitespace-normal leading-tight">{label}</p>
          <p className="font-heading text-2xl font-extrabold text-foreground tracking-tight mt-0.5">{value}</p>
        </div>
      </div>
      {trend && (
        <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20 shrink-0">
          {trend}
        </span>
      )}
    </Card>
  );
}
