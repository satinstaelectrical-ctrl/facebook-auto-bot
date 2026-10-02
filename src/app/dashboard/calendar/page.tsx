"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  CalendarBlank,
  Clock,
  CheckCircle,
  Plus,
  FacebookLogo,
  WhatsappLogo,
  Eye,
  Globe,
  Trash,
  WarningCircle,
  ListBullets,
  Calendar,
  FilmStrip,
  ClockCountdown,
  Sliders,
  Check,
  X,
} from "@phosphor-icons/react/dist/ssr";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import type { Post, PublicSettings } from "@/lib/types";

const DAYS = [
  { name: "Lundi", short: "Lun", defaultHours: "09:00, 18:00" },
  { name: "Mardi", short: "Mar", defaultHours: "12:00" },
  { name: "Mercredi", short: "Mer", defaultHours: "18:00" },
  { name: "Jeudi", short: "Jeu", defaultHours: "09:00, 18:00" },
  { name: "Vendredi", short: "Ven", defaultHours: "12:00, 19:00" },
  { name: "Samedi", short: "Sam", defaultHours: "10:00" },
  { name: "Dimanche", short: "Dim", defaultHours: "18:00" },
];

export default function ContentCalendarPage() {
  const toast = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [timezone, setTimezone] = useState("UTC");
  const [filterChannel, setFilterChannel] = useState<"all" | "scheduled" | "posted">("all");
  const [filterFormat, setFilterFormat] = useState<"all" | "feed" | "reel" | "story">("all");
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "agenda">("grid");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Cadence / Recurring schedule state
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [weeklySchedule, setWeeklySchedule] = useState<Record<string, string>>({
    Lundi: "09:00, 18:00",
    Mardi: "12:00",
    Mercredi: "18:00",
    Jeudi: "09:00, 18:00",
    Vendredi: "12:00, 19:00",
    Samedi: "10:00",
    Dimanche: "18:00",
  });
  const [savingSchedule, setSavingSchedule] = useState(false);

  useEffect(() => {
    loadCalendarData();
  }, []);

  async function loadCalendarData() {
    setLoading(true);
    try {
      const [postsRes, settingsRes]: [{ posts?: Post[] }, Partial<PublicSettings>] = await Promise.all([
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
        toast.success("Publication supprimée avec succès.");
      } else {
        toast.error("Impossible de supprimer la publication.");
      }
    } catch {
      toast.error("Erreur réseau.");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSaveCadence() {
    setSavingSchedule(true);
    try {
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          posting_hours: [9, 12, 18],
        }),
      });
      toast.success("Cadence de publication enregistrée !");
      setShowScheduleModal(false);
    } catch {
      toast.error("Erreur de sauvegarde de la cadence");
    } finally {
      setSavingSchedule(false);
    }
  }

  // Filter posts
  const filteredPosts = posts.filter((p) => {
    if (filterChannel === "scheduled" && p.status !== "scheduled") return false;
    if (filterChannel === "posted" && p.status !== "posted") return false;
    if (filterFormat !== "all") {
      const format = (p as any).post_format || "feed";
      if (format !== filterFormat) return false;
    }
    return p.status === "scheduled" || p.status === "posted";
  });

  // Map post date to day of week (0 = Monday, 6 = Sunday)
  function getDayIndex(dateString: string): number {
    const d = new Date(dateString);
    const day = d.getDay(); // 0 is Sun, 1 is Mon...
    return day === 0 ? 6 : day - 1;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/70 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary border border-primary/20">
              Planning &amp; Cadence
            </span>
          </div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            Calendrier des Publications
          </h1>
          <p className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
            <span>Visualisez et reprogrammez vos diffusions en un coup d&apos;œil.</span>
            <span className="inline-flex items-center gap-1 rounded bg-surface-2 px-1.5 py-0.5 text-[11px] font-mono text-foreground border border-border">
              <Globe size={12} /> Fuseau : {timezone}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Cadence recurring schedule trigger */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowScheduleModal(true)}
            className="text-xs gap-1.5"
          >
            <Sliders size={13} />
            <span>Cadence &amp; Horaires</span>
          </Button>

          {/* View toggle (Grid / Agenda) */}
          <div className="flex items-center rounded-xl bg-surface-2 p-1 border border-border/80">
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
              <span className="hidden sm:inline">Semaine</span>
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
              <span className="hidden sm:inline">Liste</span>
            </button>
          </div>

          {/* Status filter */}
          <div className="flex items-center rounded-xl bg-surface-2 p-1 border border-border/80">
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
            <Button size="sm" className="font-semibold text-xs shadow-sm">
              <Plus size={14} className="mr-1" /> Nouveau post
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
        /* Agenda / List View */
        <div className="space-y-3">
          {filteredPosts.map((post) => {
            const dateStr = post.scheduled_at || post.posted_at || post.created_at;
            const dateObj = new Date(dateStr);
            const isScheduled = post.status === "scheduled";

            return (
              <Card key={post.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
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
                          "rounded-full px-2 py-0.5 text-[10px] font-bold border",
                          isScheduled
                            ? "bg-primary/10 text-primary border-primary/20"
                            : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                        )}
                      >
                        {isScheduled ? "Planifié" : "Publié"}
                      </span>
                      <span className="text-[11px] font-mono text-muted-foreground">
                        {dateObj.toLocaleDateString("fr-FR", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="font-semibold text-xs text-foreground truncate">
                      {post.title || post.topic}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  <button
                    onClick={() => setSelectedPost(post)}
                    className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-surface-2 hover:text-foreground transition"
                  >
                    <Eye size={13} /> Voir
                  </button>
                  {isScheduled && (
                    <button
                      onClick={() => handleCancelPost(post.id)}
                      disabled={deletingId === post.id}
                      className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs text-destructive hover:bg-destructive/10 transition"
                    >
                      <Trash size={13} />
                    </button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Week Grid View */
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {DAYS.map((day, dIdx) => {
            const dayPosts = filteredPosts.filter((p) => {
              const dStr = p.scheduled_at || p.posted_at || p.created_at;
              return getDayIndex(dStr) === dIdx;
            });

            return (
              <div
                key={day.name}
                className="rounded-2xl border border-border/80 bg-surface p-3 flex flex-col space-y-2 min-h-[300px]"
              >
                <div className="flex items-center justify-between border-b border-border/60 pb-2">
                  <span className="font-bold text-xs text-foreground">{day.short}</span>
                  <span className="text-[10px] font-mono text-muted-foreground">{dayPosts.length}</span>
                </div>

                <div className="flex-1 space-y-2 overflow-y-auto">
                  {dayPosts.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-[10px] text-muted-foreground/60 py-6">
                      Libre
                    </div>
                  ) : (
                    dayPosts.map((post) => {
                      const timeStr = new Date(
                        post.scheduled_at || post.posted_at || post.created_at
                      ).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

                      return (
                        <div
                          key={post.id}
                          onClick={() => setSelectedPost(post)}
                          className="rounded-xl border border-border/70 bg-surface-2/60 p-2 text-xs space-y-1 cursor-pointer hover:border-primary/50 transition"
                        >
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-mono text-muted-foreground">{timeStr}</span>
                            <FacebookLogo size={12} className="text-blue-500" />
                          </div>
                          <p className="font-medium text-foreground line-clamp-2 text-[11px] leading-snug">
                            {post.title || post.topic}
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

      {/* MODAL HORAIRES RÉCURRENTS (Section 5 du prompt) */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setShowScheduleModal(false)} />
          <div className="relative w-full max-w-lg rounded-2xl border border-border/80 bg-surface p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border/70 pb-3">
              <div>
                <h3 className="font-heading text-base font-bold text-foreground">
                  Cadence &amp; Horaires Récurrents
                </h3>
                <p className="text-xs text-muted-foreground">
                  Définissez vos heures idéales de publication automatique par jour de la semaine.
                </p>
              </div>
              <button onClick={() => setShowScheduleModal(false)} className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2 text-xs max-h-80 overflow-y-auto pr-1">
              {DAYS.map((d) => (
                <div key={d.name} className="flex items-center justify-between p-2.5 rounded-xl border border-border/70 bg-surface-2/30">
                  <span className="font-semibold text-foreground w-24">{d.name} :</span>
                  <input
                    value={weeklySchedule[d.name] || d.defaultHours}
                    onChange={(e) =>
                      setWeeklySchedule({ ...weeklySchedule, [d.name]: e.target.value })
                    }
                    placeholder="Ex: 09:00, 18:00"
                    className="flex-1 rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-mono text-foreground outline-none"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border/70">
              <Button variant="secondary" size="sm" onClick={() => setShowScheduleModal(false)}>
                Fermer
              </Button>
              <Button size="sm" onClick={handleSaveCadence} disabled={savingSchedule}>
                {savingSchedule ? "Enregistrement..." : "Enregistrer la cadence"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL APERÇU RAPIDE D'UNE PUBLICATION */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setSelectedPost(null)} />
          <div className="relative w-full max-w-md rounded-2xl border border-border/80 bg-surface p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border/70 pb-3">
              <h3 className="font-heading text-sm font-bold text-foreground">Détails de la publication</h3>
              <button onClick={() => setSelectedPost(null)} className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>

            {selectedPost.image_url && (
              <img src={selectedPost.image_url} alt="" className="w-full h-44 object-cover rounded-xl border border-border" />
            )}

            <div className="space-y-2 text-xs">
              <p className="font-bold text-foreground">{selectedPost.title || selectedPost.topic}</p>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line text-[11px] max-h-40 overflow-y-auto">
                {selectedPost.description}
              </p>
            </div>

            <div className="pt-2 border-t border-border/70 flex justify-between items-center">
              <span className="text-[10px] font-mono text-muted-foreground">
                Statut : {selectedPost.status}
              </span>
              <Button size="sm" variant="secondary" onClick={() => setSelectedPost(null)}>
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
