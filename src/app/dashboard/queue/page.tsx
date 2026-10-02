"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Rocket,
  Trash,
  PencilSimple,
  X,
  Check,
  ClockCountdown,
  FacebookLogo,
  WhatsappLogo,
  ArrowSquareOut,
  CalendarBlank,
  Plus,
} from "@phosphor-icons/react/dist/ssr";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { facebookPostUrl } from "@/lib/types";
import { cn } from "@/lib/cn";
import type { Post } from "@/lib/types";

function toLocalInputValue(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function QueuePage() {
  const toast = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTime, setDraftTime] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/posts?status=draft,scheduled");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Impossible de charger la file d'attente.");
      setPosts(data.posts ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function postNow(id: string) {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/posts/${id}/post-now`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.post?.status === "failed") throw new Error(data.post.error_message ?? "Échec de publication.");
      if (data.post?.facebook_post_id) setPublishedUrl(facebookPostUrl(data.post.facebook_post_id));
      toast.success("Publication diffusée en direct sur Facebook !");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de publication.");
      toast.error("Erreur de diffusion", err instanceof Error ? err.message : "");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: string) {
    if (!confirm("Voulez-vous retirer cette publication de la file ?")) return;
    setBusyId(id);
    try {
      await fetch(`/api/posts/${id}`, { method: "DELETE" });
      toast.success("Publication retirée de la file");
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function saveSchedule(id: string) {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduledAt: draftTime ? new Date(draftTime).toISOString() : null,
          status: draftTime ? "scheduled" : "draft",
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setEditingId(null);
      toast.success("Horaire mis à jour !");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de mettre à jour l'horaire.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/70 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary border border-primary/20">
              Distribution &amp; File Active
            </span>
          </div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            File d&apos;attente des Publications
          </h1>
          <p className="text-xs text-muted-foreground">
            Contenus programmés ou brouillons prêts à être injectés sur vos réseaux et groupes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/dashboard/calendar">
            <Button variant="secondary" size="sm" className="text-xs gap-1.5">
              <CalendarBlank size={14} /> Voir le calendrier
            </Button>
          </Link>
          <Link href="/dashboard/studio">
            <Button size="sm" className="text-xs font-semibold gap-1.5 shadow-sm">
              <Plus size={14} /> Créer un post
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {publishedUrl && (
        <div className="flex items-center justify-between rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-800 dark:text-emerald-300">
          <span>Publication diffusée avec succès sur Facebook 🎉</span>
          <a
            href={publishedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold underline flex items-center gap-1"
          >
            Voir la publication <ArrowSquareOut size={13} />
          </a>
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-border/80 bg-surface p-12 text-center text-xs text-muted-foreground">
          Chargement de la file d&apos;attente…
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/80 bg-surface-2/30 p-12 text-center space-y-3">
          <ClockCountdown size={32} className="mx-auto text-muted-foreground/60" />
          <h3 className="font-bold text-sm text-foreground">Aucune publication dans la file</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Générez un contenu dans le Studio ou activez une règle d&apos;automatisation pour alimenter automatiquement votre file de diffusion.
          </p>
          <Link href="/dashboard/studio" className="inline-block pt-1">
            <Button size="sm">Ouvrir le Studio de création</Button>
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl border border-border/80 bg-surface divide-y divide-border/60 overflow-hidden shadow-sm">
          {posts.map((post) => {
            const isScheduled = post.status === "scheduled";
            const dateStr = post.scheduled_at;
            const formattedDate = dateStr
              ? new Date(dateStr).toLocaleString("fr-FR", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "Non planifié";

            return (
              <div key={post.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs hover:bg-surface-2/30 transition">
                <div className="flex items-start gap-3.5 min-w-0">
                  {post.image_url ? (
                    <img
                      src={post.image_url}
                      alt=""
                      className="h-14 w-14 rounded-xl object-cover border border-border/60 shrink-0"
                    />
                  ) : (
                    <div className="h-14 w-14 rounded-xl bg-surface-2 flex items-center justify-center text-muted-foreground shrink-0 border border-border/60">
                      <FacebookLogo size={22} />
                    </div>
                  )}

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-foreground text-xs truncate max-w-md">
                        {post.title || post.topic}
                      </p>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-bold border",
                          isScheduled
                            ? "bg-primary/10 text-primary border-primary/20"
                            : "bg-surface-3 text-muted-foreground border-border"
                        )}
                      >
                        {isScheduled ? "Programmé" : "Brouillon"}
                      </span>
                    </div>

                    <p className="text-muted-foreground line-clamp-1 text-[11px] leading-relaxed">
                      {post.description}
                    </p>

                    <p className="text-[10px] text-muted-foreground font-mono">
                      Page : <strong className="text-foreground">{post.page_name || "Page principale"}</strong>
                      {isScheduled && ` · Prévu pour le ${formattedDate}`}
                    </p>

                    {/* Inline Date Rescheduling Bar */}
                    {editingId === post.id && (
                      <div className="pt-2 flex items-center gap-2">
                        <input
                          type="datetime-local"
                          value={draftTime}
                          onChange={(e) => setDraftTime(e.target.value)}
                          className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs outline-none focus:border-primary font-mono"
                        />
                        <button
                          onClick={() => saveSchedule(post.id)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                          title="Enregistrer"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface-2 text-muted-foreground hover:bg-surface-3"
                          title="Annuler"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setEditingId(post.id);
                      setDraftTime(toLocalInputValue(post.scheduled_at));
                    }}
                    className="text-xs h-8 px-2.5"
                  >
                    <PencilSimple size={13} className="mr-1" /> Reprogrammer
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => postNow(post.id)}
                    disabled={busyId === post.id}
                    className="text-xs h-8 px-3 font-semibold"
                  >
                    <Rocket size={13} weight="fill" className="mr-1" />
                    {busyId === post.id ? "Diffusion..." : "Publier maintenant"}
                  </Button>

                  <button
                    onClick={() => remove(post.id)}
                    disabled={busyId === post.id}
                    className="p-2 text-muted-foreground hover:text-red-500 transition rounded-lg"
                    title="Supprimer"
                  >
                    <Trash size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
