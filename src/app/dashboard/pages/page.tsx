"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowClockwise,
  Star,
  CheckCircle,
  Copy,
  MagnifyingGlass,
  MagicWand,
  ShieldCheck,
  FacebookLogo,
} from "@phosphor-icons/react/dist/ssr";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { PageCache } from "@/lib/types";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function PageAvatar({ page }: { page: PageCache }) {
  const [imgFailed, setImgFailed] = useState(false);
  const initials = getInitials(page.name);
  const avatarSrc =
    page.avatar_url || `https://graph.facebook.com/${page.page_id}/picture?type=large`;

  if (imgFailed) {
    return (
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-sm font-bold text-white shadow-md shadow-indigo-500/20">
        {initials}
      </div>
    );
  }

  return (
    <div className="relative h-12 w-12 shrink-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={avatarSrc}
        alt={page.name}
        onError={() => setImgFailed(true)}
        className="h-12 w-12 rounded-2xl border border-white/[0.1] object-cover shadow-md shadow-black/20"
      />
      <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 ring-2 ring-background">
        <FacebookLogo size={10} weight="fill" className="text-white" />
      </div>
    </div>
  );
}

export default function PagesPage() {
  const [pages, setPages] = useState<PageCache[]>([]);
  const [defaultId, setDefaultId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notConnected, setNotConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const load = useCallback(async (refresh: boolean) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    setNotConnected(false);
    try {
      const res = await fetch(`/api/facebook/pages${refresh ? "?refresh=1" : ""}`);
      const data = await res.json();
      if (res.status === 409) {
        setNotConnected(true);
        return;
      }
      if (!res.ok) throw new Error(data.error ?? "Échec du chargement des Pages Facebook.");
      setPages(data.pages ?? []);
      setDefaultId(data.defaultPageId ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec du chargement des Pages Facebook.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load(false);
  }, [load]);

  async function setDefault(page: PageCache) {
    setDefaultId(page.page_id);
    setError(null);
    const res = await fetch("/api/facebook/default-page", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pageId: page.page_id }),
    });
    if (!res.ok) {
      setDefaultId(null);
      setError((await res.json()).error ?? "Impossible de définir cette page par défaut.");
    }
  }

  function copyPageId(id: string) {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const filteredPages = useMemo(() => {
    if (!search.trim()) return pages;
    const q = search.toLowerCase();
    return pages.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        p.page_id.includes(q)
    );
  }, [pages, search]);

  if (notConnected) {
    return (
      <Card className="py-14 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400">
          <FacebookLogo size={32} weight="fill" />
        </div>
        <h2 className="mt-4 font-heading text-lg font-bold text-foreground">
          Facebook n&apos;est pas encore connecté
        </h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
          Connectez votre compte Meta dans les paramètres pour charger automatiquement toutes les
          Pages dont vous êtes administrateur.
        </p>
        <Link href="/dashboard/settings" className="mt-6 inline-block">
          <Button>Aller aux Paramètres</Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-medium text-muted-foreground">
            Gérez et sélectionnez vos Pages Facebook pour la publication directe et l&apos;autopilote.
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <MagnifyingGlass
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher une page…"
              className="h-9 w-48 rounded-xl border border-white/[0.08] bg-surface pl-9 pr-3 text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 sm:w-64"
            />
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => load(true)}
            disabled={refreshing}
            className="shrink-0"
          >
            <ArrowClockwise size={14} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Actualisation…" : "Actualiser"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Grid of Pages */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse p-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-surface-2" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-3/4 rounded bg-surface-2" />
                  <div className="h-3 w-1/2 rounded bg-surface-2" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : filteredPages.length === 0 ? (
        <Card className="py-12 text-center">
          <p className="text-sm text-muted-foreground">
            {pages.length === 0
              ? "Aucune Page trouvée dans le cache Meta."
              : "Aucune page ne correspond à votre recherche."}
          </p>
          {pages.length === 0 && (
            <Button size="sm" onClick={() => load(true)} disabled={refreshing} className="mt-4">
              <ArrowClockwise size={14} className={refreshing ? "animate-spin" : ""} />
              Synchroniser depuis Facebook
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPages.map((page) => {
            const isDefault = page.page_id === defaultId;
            return (
              <Card
                key={page.page_id}
                className={`relative flex flex-col justify-between overflow-hidden border transition-all duration-200 ${
                  isDefault
                    ? "border-indigo-500/50 bg-indigo-950/10 shadow-lg shadow-indigo-500/5 ring-1 ring-indigo-500/20"
                    : "hover:border-white/[0.16]"
                }`}
              >
                {/* Default badge strip */}
                {isDefault && (
                  <div className="absolute top-0 right-0 rounded-bl-xl bg-gradient-to-l from-indigo-600 to-indigo-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow">
                    Active par défaut
                  </div>
                )}

                <div>
                  <div className="flex items-start gap-3.5">
                    <PageAvatar page={page} />
                    <div className="min-w-0 flex-1 pr-12">
                      <h3 className="truncate font-heading text-base font-bold text-foreground">
                        {page.name}
                      </h3>
                      <p className="truncate text-xs text-muted-foreground">
                        {page.category || "Page Facebook"}
                      </p>
                    </div>
                  </div>

                  {/* Page details & ID */}
                  <div className="mt-4 space-y-1.5 rounded-xl border border-white/[0.05] bg-surface-2/60 p-3 text-xs">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>ID Meta</span>
                      <button
                        type="button"
                        onClick={() => copyPageId(page.page_id)}
                        className="inline-flex items-center gap-1 font-mono text-[11px] text-foreground hover:text-indigo-400 transition cursor-pointer"
                        title="Copier l'identifiant"
                      >
                        {copiedId === page.page_id ? (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <CheckCircle size={12} weight="bold" /> Copié
                          </span>
                        ) : (
                          <>
                            {page.page_id}
                            <Copy size={12} />
                          </>
                        )}
                      </button>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Autorisations</span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                        <ShieldCheck size={13} weight="bold" /> Validées
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card footer actions */}
                <div className="mt-5 flex items-center gap-2 border-t border-border pt-4">
                  <Button
                    size="sm"
                    variant={isDefault ? "primary" : "secondary"}
                    onClick={() => setDefault(page)}
                    className="flex-1"
                  >
                    <Star size={14} weight={isDefault ? "fill" : "regular"} />
                    {isDefault ? "Sélectionnée" : "Définir par défaut"}
                  </Button>

                  <Link href={`/dashboard/generate?pageId=${page.page_id}`}>
                    <Button size="sm" variant="secondary" title="Créer un post sur cette page">
                      <MagicWand size={14} />
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
