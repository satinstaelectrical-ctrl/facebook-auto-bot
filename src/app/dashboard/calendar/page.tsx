"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  CalendarBlank,
  Clock,
  CheckCircle,
  Plus,
  Sparkle,
  FacebookLogo,
  WhatsappLogo,
  ArrowRight,
  Eye,
  CaretLeft,
  CaretRight,
  Globe,
  Trash,
  WarningCircle,
  ListBullets,
  Calendar,
} from "@phosphor-icons/react/dist/ssr";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import type { Post } from "@/lib/types";

const DAYS = [
  { name: "Lundi", short: "Lun" },
  { name: "Mardi", short: "Mar" },
  { name: "Mercredi", short: "Mer" },
  { name: "Jeudi", short: "Jeu" },
  { name: "Vendredi", short: "Ven" },
  { name: "Samedi", short: "Sam" },
  { name: "Dimanche", short: "Dim" },
];

export default function ContentCalendarPage() {
  const toast = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [timezone, setTimezone] = useState("UTC");
  const [filterChannel, setFilterChannel] = useState<"all" | "scheduled" | "posted">("all");
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "agenda">("grid");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadCalendarData();
  }, []);

  async function loadCalendarData() {
    setLoading(true);
    try {
      const [postsRes, settingsRes] = await Promise.all([
        fetch("/api/posts").then((r) => (r.ok ? r.json() : { posts: [] })),
        fetch("/api/settings").then((r) => (r.ok ? r.json() : {})),
      ]);

      setPosts(postsRes.posts || []);
      setTimezone(
        settingsRes.timezone ||
          Intl.DateTimeFormat().resolvedOptions().timeZone ||
          "Africa/Douala"
      );
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }

  async function handleCancelPost(postId: string) {
    if (!confirm("Voulez-vous annuler et supprimer cette publication ?")) return;
    setDeletingId(postId);
    try {
      const res = await fetch(`/api/posts/${postId}`, { method: "DELETE" });
      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
        if (selectedPost?.id === postId) setSelectedPost(null);
        toast.show("Publication supprimée avec succès.", "success");
      } else {
        toast.show("Impossible de supprimer la publication.", "error");
      }
    } catch {
      toast.show("Erreur réseau.", "error");
    } finally {
      setDeletingId(null);
    }
  }

  // Filter posts
  const filteredPosts = posts.filter((p) => {
    if (filterChannel === "scheduled") return p.status === "scheduled";
    if (filterChannel === "posted") return p.status === "posted";
    return p.status === "scheduled" || p.status === "posted";
  });

  // Map post date to day of week (0 = Monday, 6 = Sunday)
  function getDayIndex(dateString: string): number {
    const d = new Date(dateString);
    const day = d.getDay(); // 0 is Sun, 1 is Mon...
    return day === 0 ? 6 : day - 1;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary border border-primary/20">
              Planification &amp; Diffusion
            </span>
          </div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight text-foreground">
            Calendrier des Publications
          </h1>
          <p className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
            <span>Visualisez vos publications programmées et publiées.</span>
            <span className="inline-flex items-center gap-1 rounded bg-surface-2 px-1.5 py-0.5 text-[11px] font-mono text-foreground border border-border">
              <Globe size={12} /> Fuseau : {timezone}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* View toggle (Grid / Agenda) */}
          <div className="flex items-center rounded-xl bg-surface-2 p-1 border border-border">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "rounded-lg px-2.5 py-1 text-xs font-semibold transition flex items-center gap-1.5",
                viewMode === "grid"
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Calendar size={13} />
              <span className="hidden sm:inline">Grille</span>
            </button>
            <button
              onClick={() => setViewMode("agenda")}
              className={cn(
                "rounded-lg px-2.5 py-1 text-xs font-semibold transition flex items-center gap-1.5",
                viewMode === "agenda"
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <ListBullets size={13} />
              <span className="hidden sm:inline">Agenda</span>
            </button>
          </div>

          {/* Status filter */}
          <div className="flex items-center rounded-xl bg-surface-2 p-1 border border-border">
            <button
              onClick={() => setFilterChannel("all")}
              className={cn(
                "rounded-lg px-2.5 py-1 text-xs font-semibold transition",
                filterChannel === "all"
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Tous
            </button>
            <button
              onClick={() => setFilterChannel("scheduled")}
              className={cn(
                "rounded-lg px-2.5 py-1 text-xs font-semibold transition",
                filterChannel === "scheduled"
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Planifiés
            </button>
            <button
              onClick={() => setFilterChannel("posted")}
              className={cn(
                "rounded-lg px-2.5 py-1 text-xs font-semibold transition",
                filterChannel === "posted"
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Publiés
            </button>
          </div>

          <Link href="/dashboard/studio">
            <Button size="sm">
              <Plus size={14} className="mr-1" /> Programmer un post
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <Card className="py-16 text-center text-xs text-muted-foreground">
          Chargement du calendrier…
        </Card>
      ) : filteredPosts.length === 0 ? (
        <Card className="py-16 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <CalendarBlank size={24} weight="fill" />
          </div>
          <p className="font-semibold text-foreground text-sm">
            Aucune publication planifiée pour le moment
          </p>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Créez une annonce dans le Studio ou activez une règle de synchronisation automatique pour planifier vos diffusions sur vos réseaux.
          </p>
          <div className="pt-2">
            <Link href="/dashboard/studio">
              <Button size="sm">Créer une publication</Button>
            </Link>
          </div>
        </Card>
      ) : viewMode === "agenda" ? (
        /* Mobile / Agenda View */
        <div className="space-y-3">
          {filteredPosts.map((post) => {
            const dateStr = post.scheduled_at || post.posted_at || post.created_at;
            const dateObj = new Date(dateStr);
            const isScheduled = post.status === "scheduled";

            return (
              <Card key={post.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {post.image_url ? (
                    <img
                      src={post.image_url}
                      alt=""
                      className="h-12 w-12 rounded-lg object-cover shrink-0"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-surface-2 shrink-0 text-muted-foreground">
                      <FacebookLogo size={20} />
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={cn(
                          "rounded px-2 py-0.5 text-[10px] font-bold uppercase",
                          isScheduled
                            ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                            : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                        )}
                      >
                        {isScheduled ? "Programmé" : "Publié"}
                      </span>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        {dateObj.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    <h3 className="font-semibold text-foreground text-sm truncate">{post.title}</h3>
                    <p className="text-xs text-muted-foreground truncate">{post.description}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Destination : {post.page_name || "Page Facebook"} · {dateObj.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    onClick={() => setSelectedPost(post)}
                    className="inline-flex items-center gap-1 rounded-xl border border-border bg-surface-2 px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-surface-3 transition"
                  >
                    <Eye size={13} /> Aperçu
                  </button>
                  <button
                    onClick={() => handleCancelPost(post.id)}
                    disabled={deletingId === post.id}
                    title="Supprimer cette publication"
                    className="inline-flex items-center justify-center rounded-xl border border-border bg-surface-2 p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition cursor-pointer"
                  >
                    <Trash size={14} />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Desktop 7-Day Grid View */
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {DAYS.map((day, dayIndex) => {
            const dayPosts = filteredPosts.filter((p) => {
              const d = p.scheduled_at || p.posted_at || p.created_at;
              return getDayIndex(d) === dayIndex;
            });

            return (
              <div
                key={day.name}
                className="flex flex-col rounded-2xl border border-border bg-surface p-3 min-h-[320px]"
              >
                <div className="flex items-center justify-between border-b border-border/60 pb-2 mb-2">
                  <span className="font-bold text-xs text-foreground">{day.name}</span>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {dayPosts.length}
                  </span>
                </div>

                <div className="flex-1 space-y-2 overflow-y-auto">
                  {dayPosts.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-[11px] text-muted-foreground/40 italic">
                      Aucun post
                    </div>
                  ) : (
                    dayPosts.map((post) => {
                      const isScheduled = post.status === "scheduled";
                      const dateObj = new Date(post.scheduled_at || post.posted_at || post.created_at);

                      return (
                        <div
                          key={post.id}
                          onClick={() => setSelectedPost(post)}
                          className="group rounded-xl border border-border/80 bg-surface-2/60 p-2 text-xs space-y-1 hover:border-primary/50 transition cursor-pointer"
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className={cn(
                                "rounded px-1.5 py-0.5 text-[9px] font-bold uppercase",
                                isScheduled
                                  ? "bg-amber-500/10 text-amber-500"
                                  : "bg-emerald-500/10 text-emerald-500"
                              )}
                            >
                              {isScheduled ? "Programmé" : "Publié"}
                            </span>
                            <span className="font-mono text-[10px] text-muted-foreground">
                              {dateObj.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>

                          <p className="font-semibold text-foreground truncate">{post.title}</p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {post.page_name || "Facebook"}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Post Detail / Preview Modal */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setSelectedPost(null)}
          />
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="font-heading text-lg font-bold text-foreground">
                Détail de la publication
              </h2>
              <button
                onClick={() => setSelectedPost(null)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                ✕
              </button>
            </div>

            {selectedPost.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selectedPost.image_url}
                alt=""
                className="h-44 w-full rounded-xl object-cover border border-border"
              />
            )}

            <div>
              <span
                className={cn(
                  "rounded px-2 py-0.5 text-[10px] font-bold uppercase",
                  selectedPost.status === "scheduled"
                    ? "bg-amber-500/10 text-amber-500"
                    : "bg-emerald-500/10 text-emerald-500"
                )}
              >
                {selectedPost.status === "scheduled" ? "Publication programmée" : "Déjà publiée"}
              </span>
              <h3 className="font-heading text-base font-bold text-foreground mt-2">
                {selectedPost.title}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 whitespace-pre-line leading-relaxed">
                {selectedPost.description}
              </p>
            </div>

            <div className="rounded-xl border border-border bg-surface-2 p-3 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Destination :</span>
                <span className="font-semibold text-foreground">
                  {selectedPost.page_name || "Page Facebook"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Horodatage :</span>
                <span className="font-mono text-foreground">
                  {new Date(
                    selectedPost.scheduled_at || selectedPost.posted_at || selectedPost.created_at
                  ).toLocaleString("fr-FR", { timeZone: timezone })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fuseau horaire :</span>
                <span className="font-mono text-foreground">{timezone}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => handleCancelPost(selectedPost.id)}
                className="inline-flex items-center gap-1.5 text-xs text-destructive hover:underline cursor-pointer"
              >
                <Trash size={14} /> Annuler et supprimer ce post
              </button>

              <Button size="sm" onClick={() => setSelectedPost(null)}>
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
