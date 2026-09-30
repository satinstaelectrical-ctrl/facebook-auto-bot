import { cn } from "@/lib/cn";

/**
 * Original monogram mark — a rounded square holding a speech bubble with a
 * spark, for "posts written automatically". Deliberately not a recolour or
 * trace of Facebook's own logo or wordmark.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-cyan-500 p-0.5 shadow-md shadow-indigo-500/20",
        className
      )}
    >
      <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-[#0c101c]/90">
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-indigo-400" aria-hidden>
          <path
            d="M12 2L2 7L12 12L22 7L12 2Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M2 17L12 22L22 17"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M2 12L12 17L22 12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className="font-heading text-base font-extrabold tracking-tight text-foreground">
            Fundoral
          </span>
          <span className="rounded-md bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 px-1.5 py-0.5 text-[10px] font-bold text-indigo-400 border border-indigo-500/30 uppercase tracking-wider">
            AI OS
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground font-medium -mt-0.5">
          Marketing Automation
        </span>
      </div>
    </div>
  );
}
