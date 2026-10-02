"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  MagnifyingGlass,
  MagicWand,
  Lightning,
  FacebookLogo,
  Globe,
  WhatsappLogo,
  ClockCountdown,
  CalendarBlank,
  GearSix,
  Code,
  Scroll,
  ArrowRight,
  X,
  Command,
} from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/cn";

export interface CommandItem {
  id: string;
  title: string;
  category: "Actions Rapides" | "Connexions" | "Automatisations" | "Navigation";
  icon: React.ElementType;
  shortcut?: string;
  href?: string;
  keywords?: string[];
  action?: () => void;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();

  const commands: CommandItem[] = useMemo(
    () => [
      {
        id: "new-post",
        title: "Créer une nouvelle publication (Studio IA)",
        category: "Actions Rapides",
        icon: MagicWand,
        shortcut: "N",
        href: "/dashboard/studio",
        keywords: ["post", "nouveau", "creer", "ia", "studio", "redaction", "feed", "reel"],
      },
      {
        id: "create-automation",
        title: "Créer / Configurer une automatisation",
        category: "Automatisations",
        icon: Lightning,
        shortcut: "A",
        href: "/dashboard/automations",
        keywords: ["automation", "flux", "declencheur", "action", "regle", "wordpress", "woocommerce"],
      },
      {
        id: "connect-facebook",
        title: "Connecter Facebook / Meta Pages",
        category: "Connexions",
        icon: FacebookLogo,
        href: "/dashboard/connections?tab=facebook",
        keywords: ["facebook", "meta", "page", "oauth", "token", "social"],
      },
      {
        id: "connect-website",
        title: "Connecter un site (WordPress, Shopify, RSS, API)",
        category: "Connexions",
        icon: Globe,
        href: "/dashboard/connections?tab=websites",
        keywords: ["site", "wordpress", "shopify", "woocommerce", "e-commerce", "boutique", "rss"],
      },
      {
        id: "connect-whatsapp",
        title: "Connecter WhatsApp Business Cloud API",
        category: "Connexions",
        icon: WhatsappLogo,
        href: "/dashboard/connections?tab=whatsapp",
        keywords: ["whatsapp", "business", "waba", "phone", "crm", "messages"],
      },
      {
        id: "view-webhooks",
        title: "Ouvrir le Webhook Control Center",
        category: "Connexions",
        icon: Code,
        href: "/dashboard/connections?tab=webhooks",
        keywords: ["webhook", "secret", "endpoint", "live", "simulator", "api"],
      },
      {
        id: "view-queue",
        title: "Consulter la File d'attente des publications",
        category: "Navigation",
        icon: ClockCountdown,
        shortcut: "Q",
        href: "/dashboard/queue",
        keywords: ["file", "queue", "attente", "programmation", "scheduled"],
      },
      {
        id: "open-calendar",
        title: "Ouvrir le Calendrier de diffusion",
        category: "Navigation",
        icon: CalendarBlank,
        shortcut: "C",
        href: "/dashboard/calendar",
        keywords: ["calendar", "calendrier", "planning", "semaine", "mois", "horaires"],
      },
      {
        id: "open-history",
        title: "Consulter l'Historique des publications",
        category: "Navigation",
        icon: Scroll,
        href: "/dashboard/history",
        keywords: ["history", "historique", "publies", "logs", "archives"],
      },
      {
        id: "open-settings",
        title: "Ouvrir les Paramètres du système",
        category: "Navigation",
        icon: GearSix,
        href: "/dashboard/settings",
        keywords: ["settings", "parametres", "ia", "workspace", "security", "token", "general"],
      },
    ],
    []
  );

  const filteredCommands = useMemo(() => {
    if (!search.trim()) return commands;
    const q = search.toLowerCase().trim();
    return commands.filter((cmd) => {
      if (cmd.title.toLowerCase().includes(q)) return true;
      if (cmd.category.toLowerCase().includes(q)) return true;
      if (cmd.keywords?.some((k) => k.toLowerCase().includes(q))) return true;
      return false;
    });
  }, [commands, search]);

  const executeCommand = useCallback(
    (cmd: CommandItem) => {
      setOpen(false);
      setSearch("");
      if (cmd.action) {
        cmd.action();
      } else if (cmd.href) {
        router.push(cmd.href);
      }
    },
    [router]
  );

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      } else if (e.key === "Escape" && open) {
        e.preventDefault();
        setOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  function handleListKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1 < filteredCommands.length ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : filteredCommands.length - 1));
    } else if (e.key === "Enter" && filteredCommands[selectedIndex]) {
      e.preventDefault();
      executeCommand(filteredCommands[selectedIndex]);
    }
  }

  return (
    <>
      {/* Trigger Button displayed in Header */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl border border-border/80 bg-surface-2/60 px-3 py-1.5 text-xs text-muted-foreground transition hover:border-border hover:bg-surface-2 hover:text-foreground"
        aria-label="Recherche globale et commandes (Ctrl+K)"
      >
        <MagnifyingGlass size={14} className="shrink-0" />
        <span className="hidden md:inline">Recherche ou action...</span>
        <span className="inline md:hidden">Chercher...</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-border/70 bg-surface-3 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-muted-foreground">
          <Command size={10} />K
        </kbd>
      </button>

      {/* Modal Dialog */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 sm:pt-24">
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
            onClick={() => setOpen(false)}
          />

          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-border/80 bg-surface shadow-2xl animate-in fade-in zoom-in-95 duration-150"
            onKeyDown={handleListKeyDown}
          >
            {/* Input Header */}
            <div className="flex items-center gap-3 border-b border-border/70 px-4 py-3">
              <MagnifyingGlass size={18} className="text-muted-foreground shrink-0" />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tapez une action, un canal ou un mot-clé (ex: woocommerce, facebook, post)..."
                className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
              />
              {search ? (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="rounded-lg p-1 text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                >
                  <X size={14} />
                </button>
              ) : (
                <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                  ESC
                </span>
              )}
            </div>

            {/* Results List */}
            <div className="max-h-80 overflow-y-auto p-2">
              {filteredCommands.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  Aucun résultat trouvé pour &laquo;&nbsp;{search}&nbsp;&raquo;.
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredCommands.map((cmd, idx) => {
                    const isSelected = idx === selectedIndex;
                    const Icon = cmd.icon;
                    return (
                      <div
                        key={cmd.id}
                        onClick={() => executeCommand(cmd)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={cn(
                          "flex items-center justify-between rounded-xl px-3 py-2.5 text-xs cursor-pointer transition",
                          isSelected
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={cn(
                              "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border",
                              isSelected
                                ? "bg-primary/15 border-primary/30 text-primary"
                                : "bg-surface-2 border-border/70 text-muted-foreground"
                            )}
                          >
                            <Icon size={15} weight={isSelected ? "bold" : "regular"} />
                          </div>
                          <span className="truncate text-foreground font-medium">{cmd.title}</span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] text-muted-foreground/70 hidden sm:inline">
                            {cmd.category}
                          </span>
                          {cmd.shortcut && (
                            <kbd className="rounded border border-border/60 bg-surface-2 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-muted-foreground">
                              {cmd.shortcut}
                            </kbd>
                          )}
                          <ArrowRight
                            size={12}
                            className={cn("transition", isSelected ? "opacity-100 text-primary" : "opacity-0")}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-border/60 bg-surface-2/40 px-4 py-2 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-3">
                <span>
                  <kbd className="font-mono">↑</kbd> <kbd className="font-mono">↓</kbd> Naviguer
                </span>
                <span>
                  <kbd className="font-mono">↵</kbd> Valider
                </span>
              </div>
              <span>Fundoral OS</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
