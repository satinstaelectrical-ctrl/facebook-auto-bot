"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  House,
  MagicWand,
  Lightning,
  CalendarBlank,
  Globe,
  Rocket,
  ChatsCircle,
  ChartLineUp,
  UsersThree,
  GearSix,
  ClockCountdown,
  FlagBanner,
} from "@phosphor-icons/react/dist/ssr";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/cn";

export const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: House },
  { href: "/dashboard/studio", label: "AI Studio", icon: MagicWand, badge: "IA" },
  { href: "/dashboard/automations", label: "Automations", icon: Lightning, badge: "Zapier" },
  { href: "/dashboard/calendar", label: "Calendrier", icon: CalendarBlank },
  { href: "/dashboard/connections", label: "Connexions", icon: Globe, badge: "Sites & Réseaux" },
  { href: "/dashboard/ads", label: "Campagnes Ads", icon: Rocket },
  { href: "/dashboard/inbox", label: "Inbox AI", icon: ChatsCircle, badge: "CRM" },
  { href: "/dashboard/analytics", label: "Analytics", icon: ChartLineUp },
  { href: "/dashboard/team", label: "Équipe", icon: UsersThree },
  { href: "/dashboard/settings", label: "Paramètres", icon: GearSix },
];

export const SECONDARY_NAV = [
  { href: "/dashboard/queue", label: "File d'attente", icon: ClockCountdown },
  { href: "/dashboard/pages", label: "Pages Facebook", icon: FlagBanner },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface lg:flex">
      <div className="flex h-16 items-center px-5 border-b border-border/50">
        <Logo />
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        <div>
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 mb-1.5">
            Plateforme Marketing IA
          </p>
          <nav className="space-y-1">
            {NAV.map((item) => {
              const active =
                item.href === "/dashboard"
                  ? pathname === item.href
                  : pathname === item.href ||
                    pathname.startsWith(`${item.href}/`) ||
                    (item.href === "/dashboard/studio" && pathname.startsWith("/dashboard/generate")) ||
                    (item.href === "/dashboard/automations" && pathname.startsWith("/dashboard/automation"));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition",
                    active
                      ? "bg-primary/10 text-primary shadow-sm"
                      : "text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon size={18} weight={active ? "fill" : "regular"} className="shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={cn(
                        "rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                        active
                          ? "bg-primary/20 text-primary"
                          : "bg-surface-3 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div>
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 mb-1.5">
            Outils &amp; File
          </p>
          <nav className="space-y-0.5">
            {SECONDARY_NAV.map((item) => {
              const active = pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl px-3 py-1.5 text-xs font-medium transition",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                  )}
                >
                  <Icon size={16} weight={active ? "fill" : "regular"} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Real-time Autopilot Status Card */}
      <div className="p-3 border-t border-border/60">
        <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent p-3 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-bold text-foreground">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Autopilot Actif
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-semibold">24/7</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-tight">
            Sync automatique site ➔ Facebook &amp; WhatsApp.
          </p>
        </div>
      </div>
    </aside>
  );
}
