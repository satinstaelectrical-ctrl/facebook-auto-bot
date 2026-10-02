"use client";

import { useEffect, useState } from "react";
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
  Code,
  Scroll,
} from "@phosphor-icons/react/dist/ssr";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/cn";

export interface NavItem {
  href: string;
  label: string;
  icon: any;
  badge?: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const MAIN_NAV_ITEM: NavItem = {
  href: "/dashboard",
  label: "Tableau de bord",
  icon: House,
};

export const TASK_SECTIONS: NavSection[] = [
  {
    title: "Création & Planning",
    items: [
      { href: "/dashboard/studio", label: "Studio de Création", icon: MagicWand, badge: "IA" },
      { href: "/dashboard/calendar", label: "Calendrier", icon: CalendarBlank },
      { href: "/dashboard/queue", label: "File d'attente", icon: ClockCountdown },
      { href: "/dashboard/history", label: "Historique", icon: Scroll },
    ],
  },
  {
    title: "Automatisations & Flux",
    items: [
      { href: "/dashboard/automations", label: "Automatisations", icon: Lightning, badge: "Flux" },
      { href: "/dashboard/connections?tab=webhooks", label: "Webhook Center", icon: Code, badge: "API" },
    ],
  },
  {
    title: "Canaux & Croissance",
    items: [
      { href: "/dashboard/connections", label: "Centre de Connexions", icon: Globe, badge: "Multi-sites" },
      { href: "/dashboard/inbox", label: "Messages & Prospects", icon: ChatsCircle, badge: "CRM" },
      { href: "/dashboard/ads", label: "Publicités Meta Ads", icon: Rocket, badge: "Meta" },
      { href: "/dashboard/analytics", label: "Résultats & Insights", icon: ChartLineUp },
    ],
  },
  {
    title: "Système & Marque",
    items: [
      { href: "/dashboard/settings", label: "Paramètres", icon: GearSix },
      { href: "/dashboard/team", label: "Équipe & Accès", icon: UsersThree },
    ],
  },
];

export const DIAGNOSTIC_NAV: NavItem[] = [
  { href: "/dashboard/logs", label: "Journal d'Audit & Logs", icon: Code },
  { href: "/dashboard/pages", label: "Pages Facebook", icon: FlagBanner },
];

// Flat list for shell title lookup & backwards compatibility
export const NAV: NavItem[] = [
  MAIN_NAV_ITEM,
  ...TASK_SECTIONS.flatMap((s) => s.items),
];

export const SECONDARY_NAV = DIAGNOSTIC_NAV;

export function Sidebar() {
  const pathname = usePathname();
  const [autopilotActive, setAutopilotActive] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          const autoPost = Boolean(data.auto_post_enabled);
          const hasSites =
            Array.isArray(data.connected_websites) &&
            data.connected_websites.some((s: { auto_publish?: boolean }) => s.auto_publish);
          setAutopilotActive(autoPost || hasSites);
        } else {
          setAutopilotActive(false);
        }
      })
      .catch(() => setAutopilotActive(false));
  }, []);

  const isLinkActive = (href: string) => {
    if (href === "/dashboard") return pathname === href;
    return (
      pathname === href ||
      pathname.startsWith(`${href}/`) ||
      (href === "/dashboard/studio" && pathname.startsWith("/dashboard/generate")) ||
      (href === "/dashboard/automations" && pathname.startsWith("/dashboard/automation")) ||
      (href === "/dashboard/connections" && pathname.startsWith("/dashboard/automation"))
    );
  };

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface lg:flex">
      <div className="flex h-16 items-center px-5 border-b border-border/50">
        <Logo />
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {/* Main entry: Dashboard */}
        <div>
          <Link
            href={MAIN_NAV_ITEM.href}
            className={cn(
              "group flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition",
              isLinkActive(MAIN_NAV_ITEM.href)
                ? "bg-primary/10 text-primary shadow-sm"
                : "text-muted-foreground hover:bg-surface-2 hover:text-foreground"
            )}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <MAIN_NAV_ITEM.icon
                size={18}
                weight={isLinkActive(MAIN_NAV_ITEM.href) ? "fill" : "regular"}
                className="shrink-0"
              />
              <span className="truncate">{MAIN_NAV_ITEM.label}</span>
            </div>
          </Link>
        </div>

        {/* Task-based sections: Publier, Suivre, Configurer */}
        {TASK_SECTIONS.map((section) => (
          <div key={section.title} className="space-y-1">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 mb-1">
              {section.title}
            </p>
            <nav className="space-y-0.5">
              {section.items.map((item) => {
                const active = isLinkActive(item.href);
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
        ))}

        {/* Diagnostic tools */}
        <div className="pt-2 border-t border-border/40">
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-1">
            Diagnostic &amp; Logs
          </p>
          <nav className="space-y-0.5">
            {DIAGNOSTIC_NAV.map((item) => {
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
        <Link
          href="/dashboard/automations"
          className="block rounded-2xl border border-border/80 bg-surface-2/60 p-3 space-y-1.5 transition hover:bg-surface-2"
        >
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-bold text-foreground">
              {autopilotActive ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Autopilot Actif
                </>
              ) : (
                <>
                  <span className="inline-flex rounded-full h-2 w-2 bg-muted-foreground/40"></span>
                  Autopilot En veille
                </>
              )}
            </span>
            <span
              className={cn(
                "text-[10px] font-mono font-semibold",
                autopilotActive ? "text-emerald-500 dark:text-emerald-400" : "text-muted-foreground"
              )}
            >
              {autopilotActive ? "24/7" : "Pause"}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-tight">
            {autopilotActive
              ? "Sync automatique site ➔ Facebook & WhatsApp."
              : "Aucune automatisation active. Configurer ➔"}
          </p>
        </Link>
      </div>
    </aside>
  );
}
