"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  List,
  X,
  SignOut,
} from "@phosphor-icons/react/dist/ssr";
import { Sidebar, NAV, MAIN_NAV_ITEM, TASK_SECTIONS, DIAGNOSTIC_NAV } from "@/components/dashboard/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/logo";
import { ToastProvider } from "@/components/ui/toast";
import { cn } from "@/lib/cn";

const TITLES: Record<string, string> = {
  "/dashboard": "Tableau de Bord & Autopilot IA",
  "/dashboard/studio": "Studio de Création & IA",
  "/dashboard/generate": "Publication Directe & Programmation",
  "/dashboard/automations": "Constructeur d'Automatisations",
  "/dashboard/automation": "Connexions de Sites & Flux",
  "/dashboard/calendar": "Calendrier de Publication",
  "/dashboard/connections": "Centre de Connexions Sites & Réseaux",
  "/dashboard/ads": "Campagnes & Boosts Meta Ads",
  "/dashboard/inbox": "Messages et Prospects (CRM)",
  "/dashboard/analytics": "Résultats & Performances",
  "/dashboard/team": "Gestion de l'Équipe & Rôles",
  "/dashboard/settings": "Paramètres & Marque",
  "/dashboard/queue": "File d'attente des publications",
  "/dashboard/history": "Historique des publications",
  "/dashboard/logs": "Journal d'Audit & Logs API",
  "/dashboard/pages": "Pages Facebook connectées",
};

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const title =
    TITLES[pathname] ?? TITLES[Object.keys(TITLES).find((k) => pathname.startsWith(k)) ?? ""] ?? "";

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

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
    <ToastProvider>
      <div className="flex min-h-screen bg-background">
        <Sidebar />

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-surface p-4 shadow-2xl overflow-y-auto">
            <div className="mb-4 flex items-center justify-between">
              <Logo className="[&>span]:text-base" />
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-2"
              >
                <X size={18} />
              </button>
            </div>

            {/* Dashboard Home */}
            <div className="mb-3">
              <Link
                href={MAIN_NAV_ITEM.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition",
                  isLinkActive(MAIN_NAV_ITEM.href)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                )}
              >
                <MAIN_NAV_ITEM.icon size={19} weight={isLinkActive(MAIN_NAV_ITEM.href) ? "fill" : "regular"} />
                {MAIN_NAV_ITEM.label}
              </Link>
            </div>

            {/* Grouped Sections */}
            <div className="flex-1 space-y-4">
              {TASK_SECTIONS.map((section) => (
                <div key={section.title} className="space-y-1">
                  <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
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
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            "flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition",
                            active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-surface-2"
                          )}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon size={18} weight={active ? "fill" : "regular"} />
                            <span>{item.label}</span>
                          </div>
                          {item.badge && (
                            <span className="rounded-md bg-surface-3 px-1.5 py-0.5 text-[9px] font-bold uppercase text-muted-foreground">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </nav>
                </div>
              ))}

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
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "flex items-center gap-2.5 rounded-xl px-3 py-1.5 text-xs font-medium transition",
                          active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-surface-2"
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
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-surface px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-2 lg:hidden"
            >
              <List size={19} />
            </button>
            <h1 className="font-heading text-lg font-bold text-foreground">{title}</h1>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={logout}
              aria-label="Se déconnecter"
              className="flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-sm font-medium text-muted-foreground transition hover:bg-surface-2 hover:text-foreground"
            >
              <SignOut size={16} />
              <span className="hidden sm:inline">Se déconnecter</span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
    </ToastProvider>
  );
}
