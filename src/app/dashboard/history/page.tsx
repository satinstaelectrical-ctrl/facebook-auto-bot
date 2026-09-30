"use client";

import { useEffect, useState } from "react";
import {
  ArrowSquareOut,
  ThumbsUp,
  ChatCircle,
  ShareFat,
  ArrowClockwise,
  Images,
} from "@phosphor-icons/react/dist/ssr";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import { facebookPostUrl } from "@/lib/types";
import type { Post, PostStatus } from "@/lib/types";

const FILTERS: { label: string; value: PostStatus | "all" }[] = [
  { label: "Tous", value: "all" },
  { label: "Publiés", value: "posted" },
  { label: "Échecs", value: "failed" },
];

interface InsightData {
  likes: number;
  comments: number;
  shares: number;
  loading?: boolean;
}

export default function HistoryPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [filter, setFilter] = useState<PostStatus | "all">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [insights, setInsights] = useState<Record<string, InsightData>>({});
  const [loadingAllInsights, setLoadingAllInsights] = useState(false);

  const loadPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/posts?status=${filter === "all" ? "posted,failed" : filter}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Échec du chargement de l'historique.");
      const list: Post[] = data.posts ?? [];
      setPosts(list);

      // Auto-fetch insights for posted posts
      const postedItems = list.filter((p) => p.status === "posted" && p.facebook_post_id);
      if (postedItems.length > 0) {
        fetchAllInsights(postedItems);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec du chargement de l'historique.");
    } finally {
      setLoading(false);
    }
  };

  const fetchSingleInsight = async (postId: string) => {
    setInsights((prev) => ({ ...prev, [postId]: { ...prev[postId], loading: true } }));
    try {
      const res = await fetch(`/api/posts/${postId}/insights`);
      const data = await res.json();
      if (data.insights) {
        setInsights((prev) => ({ ...prev, [postId]: { ...data.insights, loading: false } }));
      }
    } catch {
      setInsights((prev) => ({ ...prev, [postId]: { likes: 0, comments: 0, shares: 0, loading: false } }));
    }
  };

  const fetchAllInsights = async (items = posts) => {
    const posted = items.filter((p) => p.status === "posted" && p.facebook_post_id);
    if (posted.length === 0) return;

    setLoadingAllInsights(true);
    for (const post of posted) {
      await fetchSingleInsight(post.id);
    }
    setLoadingAllInsights(false);
  };

  useEffect(() => {
    loadPosts();
  }, [filter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                "cursor-pointer rounded-full px-3.5 py-1.5 text-sm font-medium transition",
                filter === f.value
                  ? "bg-primary text-primary-foreground"
                  : "border border-border text-muted-foreground hover:bg-surface-2"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <Button
          size="sm"
          variant="secondary"
          onClick={() => fetchAllInsights()}
          disabled={loadingAllInsights || posts.filter((p) => p.status === "posted").length === 0}
        >
          <ArrowClockwise size={14} className={loadingAllInsights ? "animate-spin" : ""} />
          {loadingAllInsights ? "Actualisation…" : "🔄 Actualiser les statistiques"}
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-sm text-destructive">
          {error}
        </div>
      )}

      {!error && (
        <Card>
          {loading ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Chargement de l&apos;historique…</p>
          ) : posts.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Aucune publication enregistrée pour ce filtre.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="pb-2 font-medium">Publication</th>
                    <th className="hidden pb-2 font-medium sm:table-cell">Page</th>
                    <th className="pb-2 font-medium">Statut</th>
                    <th className="pb-2 font-medium">Performances (Stats)</th>
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 font-medium text-right">Lien direct</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((post) => {
                    const postStats = insights[post.id];
                    const hasMultiImages = post.media_urls && post.media_urls.length > 1;

                    return (
                      <tr key={post.id} className="border-b border-border last:border-0 hover:bg-surface-2/40 transition">
                        {/* Post info & thumbnail */}
                        <td className="max-w-[260px] py-3.5 pr-3">
                          <div className="flex items-center gap-3">
                            <div className="relative shrink-0">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={post.image_url}
                                alt=""
                                className="h-11 w-11 rounded-lg object-cover border border-border"
                              />
                              {hasMultiImages && (
                                <span className="absolute -bottom-1 -right-1 bg-black/80 text-white rounded px-1 py-0.5 text-[9px] font-bold flex items-center gap-0.5">
                                  <Images size={10} /> {post.media_urls?.length}
                                </span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-medium text-foreground">{post.title}</p>
                              <p className="truncate text-xs text-muted-foreground">{post.description}</p>
                              {post.status === "failed" && post.error_message && (
                                <p className="truncate text-xs text-destructive font-medium mt-0.5">
                                  {post.error_message}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Page name */}
                        <td className="hidden py-3.5 pr-3 text-muted-foreground sm:table-cell">
                          <span className="font-medium text-foreground">{post.page_name ?? "—"}</span>
                        </td>

                        {/* Status badge */}
                        <td className="py-3.5 pr-3">
                          <StatusBadge status={post.status} />
                        </td>

                        {/* Analytics stats */}
                        <td className="py-3.5 pr-3">
                          {post.status === "posted" ? (
                            postStats ? (
                              <div className="flex items-center gap-3 text-xs">
                                <span
                                  className="inline-flex items-center gap-1 font-semibold text-foreground/90"
                                  title="Mentions J'aime"
                                >
                                  <ThumbsUp size={14} className="text-blue-500" />
                                  {postStats.likes}
                                </span>
                                <span
                                  className="inline-flex items-center gap-1 font-semibold text-foreground/90"
                                  title="Commentaires"
                                >
                                  <ChatCircle size={14} className="text-emerald-500" />
                                  {postStats.comments}
                                </span>
                                <span
                                  className="inline-flex items-center gap-1 font-semibold text-foreground/90"
                                  title="Partages"
                                >
                                  <ShareFat size={14} className="text-purple-500" />
                                  {postStats.shares}
                                </span>
                              </div>
                            ) : (
                              <button
                                onClick={() => fetchSingleInsight(post.id)}
                                className="text-xs text-primary hover:underline cursor-pointer"
                              >
                                Charger stats
                              </button>
                            )
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>

                        {/* When */}
                        <td className="py-3.5 pr-3 text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(post.posted_at ?? post.created_at).toLocaleString("fr-FR", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>

                        {/* Direct Facebook Link */}
                        <td className="py-3.5 text-right whitespace-nowrap">
                          {post.facebook_post_id ? (
                            <a
                              href={facebookPostUrl(post.facebook_post_id)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 hover:border-primary/50 transition"
                            >
                              Voir sur Facebook <ArrowSquareOut size={13} />
                            </a>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
