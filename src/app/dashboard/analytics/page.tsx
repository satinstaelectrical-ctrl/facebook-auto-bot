"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ChartLineUp,
  Eye,
  MegaphoneSimple,
  CursorClick,
  UsersThree,
  ArrowSquareOut,
  FacebookLogo,
  WhatsappLogo,
  CalendarCheck,
  Trophy,
  Sparkle,
  WarningCircle,
  ThumbsUp,
  ChatCircle,
  ShareFat,
} from "@phosphor-icons/react/dist/ssr";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/stat-card";
import { facebookPostUrl, type Post } from "@/lib/types";

interface PostInsight {
  likes: number;
  comments: number;
  shares: number;
}

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "all">("30d");
  const [posts, setPosts] = useState<Post[]>([]);
  const [insights, setInsights] = useState<Record<string, PostInsight>>({});
  const [whatsappLogsCount, setWhatsappLogsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  async function loadAnalyticsData() {
    setLoading(true);
    try {
      const [postsRes, waRes] = await Promise.all([
        fetch("/api/posts?status=posted").then((r) => (r.ok ? r.json() : { posts: [] })),
        fetch("/api/whatsapp/logs").then((r) => (r.ok ? r.json() : { logs: [] })),
      ]);

      const loadedPosts: Post[] = postsRes.posts || [];
      setPosts(loadedPosts);
      setWhatsappLogsCount((waRes.logs || []).length);

      // Fetch real insights for published posts
      const insightsMap: Record<string, PostInsight> = {};
      await Promise.all(
        loadedPosts.slice(0, 10).map(async (p) => {
          if (p.facebook_post_id) {
            try {
              const res = await fetch(`/api/posts/${p.id}/insights`);
              if (res.ok) {
                const data = await res.json();
                if (data.insights) {
                  insightsMap[p.id] = data.insights;
                }
              }
            } catch {
              // Graceful
            }
          }
        })
      );
      setInsights(insightsMap);
    } catch {
      // Graceful
    } finally {
      setLoading(false);
    }
  }

  // Calculate real metrics
  const totalPublishedPosts = posts.length;
  const totalLikes = Object.values(insights).reduce((acc, i) => acc + (i.likes || 0), 0);
  const totalComments = Object.values(insights).reduce((acc, i) => acc + (i.comments || 0), 0);
  const totalShares = Object.values(insights).reduce((acc, i) => acc + (i.shares || 0), 0);
  const totalEngagements = totalLikes + totalComments + totalShares;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary border border-primary/20">
              Métriques &amp; Performances Réelles
            </span>
          </div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight text-foreground">
            Résultats &amp; Analytique des Publications
          </h1>
          <p className="text-xs text-muted-foreground">
            Consultez les résultats vérifiés de vos publications, issus directement de l&apos;API Graph Facebook et de vos journaux d&apos;envoi WhatsApp.
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-xl bg-surface-2 p-1 border border-border">
          <button
            onClick={() => setTimeRange("7d")}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
              timeRange === "7d" ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            7 jours
          </button>
          <button
            onClick={() => setTimeRange("30d")}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
              timeRange === "30d" ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            30 jours
          </button>
          <button
            onClick={() => setTimeRange("all")}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
              timeRange === "all" ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Tout l&apos;historique
          </button>
        </div>
      </div>

      {/* KPI Cards: Factual data with explicit source attribution */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Publications Facebook diffusées"
          value={loading ? "…" : String(totalPublishedPosts)}
          icon={CalendarCheck}
          tone="primary"
          trend="Source : Base de données vérifiée"
        />

        <StatCard
          label="Diffusions WhatsApp effectuées"
          value={loading ? "…" : String(whatsappLogsCount)}
          icon={WhatsappLogo}
          tone="success"
          trend="Source : Journaux WhatsApp API"
        />

        <StatCard
          label="Interactions & Engagements"
          value={loading ? "…" : String(totalEngagements)}
          icon={MegaphoneSimple}
          tone="primary"
          trend="Likes, commentaires & partages"
        />

        <StatCard
          label="Mentions J'aime certifiées"
          value={loading ? "…" : String(totalLikes)}
          icon={ThumbsUp}
          tone="success"
          trend="Source : Meta Graph API"
        />
      </div>

      {/* Breakdown by destination channel */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h2 className="font-heading text-base font-bold text-foreground">
                Distribution des diffusions par canal
              </h2>
              <p className="text-xs text-muted-foreground">
                Répartition vérifiée des contenus partagés selon les destinations autorisées.
              </p>
            </div>
            <span className="text-xs text-muted-foreground font-mono">
              Total : {totalPublishedPosts + whatsappLogsCount}
            </span>
          </div>

          {totalPublishedPosts === 0 && whatsappLogsCount === 0 ? (
            <div className="py-12 text-center space-y-2">
              <ChartLineUp size={28} className="mx-auto text-muted-foreground/50" />
              <p className="text-sm font-semibold text-foreground">Aucune diffusion enregistrée sur cette période</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Connectez vos Pages Facebook et vos groupes WhatsApp pour visualiser la répartition de vos publications.
              </p>
              <div className="pt-2">
                <Link href="/dashboard/studio">
                  <Button size="sm">Créer une première publication</Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              {/* Facebook Bar */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <FacebookLogo size={16} weight="fill" className="text-blue-500" />
                    Pages Facebook
                  </span>
                  <span className="font-mono text-muted-foreground">
                    {totalPublishedPosts} publication(s)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-surface-2 overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{
                      width: `${
                        totalPublishedPosts + whatsappLogsCount > 0
                          ? (totalPublishedPosts / (totalPublishedPosts + whatsappLogsCount)) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              {/* WhatsApp Bar */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <WhatsappLogo size={16} weight="fill" className="text-emerald-500" />
                    Diffusions WhatsApp
                  </span>
                  <span className="font-mono text-muted-foreground">
                    {whatsappLogsCount} message(s) envoyé(s)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-surface-2 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{
                      width: `${
                        totalPublishedPosts + whatsappLogsCount > 0
                          ? (whatsappLogsCount / (totalPublishedPosts + whatsappLogsCount)) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Source and Data Quality Notice */}
        <Card className="space-y-3">
          <h2 className="font-heading text-sm font-bold text-foreground flex items-center gap-2">
            <Trophy size={18} className="text-amber-500" />
            Intégrité des Données
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Fundoral applique une politique stricte d&apos;intégrité : aucun chiffre d&apos;engagement ni estimation de portée n&apos;est simulé.
          </p>
          <div className="space-y-2 pt-1 text-xs border-t border-border">
            <div className="flex items-start gap-2 text-muted-foreground">
              <span className="text-emerald-500 font-bold">✓</span>
              <span><strong>Facebook :</strong> Métriques récupérées en temps réel via l&apos;API Graph Meta.</span>
            </div>
            <div className="flex items-start gap-2 text-muted-foreground">
              <span className="text-emerald-500 font-bold">✓</span>
              <span><strong>WhatsApp :</strong> Accusés de remise enregistrés à l&apos;envoi, sans estimation arbitraire de lectures.</span>
            </div>
          </div>
          <div className="pt-2">
            <Link href="/dashboard/history">
              <Button size="sm" variant="secondary" className="w-full">
                Consulter l&apos;Historique complet
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* Top Publications Table */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h2 className="font-heading text-base font-bold text-foreground">
              Dernières publications diffusées
            </h2>
            <p className="text-xs text-muted-foreground">
              Contenus effectivement publiés sur vos destinations autorisées.
            </p>
          </div>
          <Link href="/dashboard/history" className="text-xs text-primary hover:underline font-semibold">
            Voir tout l&apos;historique ➔
          </Link>
        </div>

        {posts.length === 0 ? (
          <div className="py-10 text-center space-y-2">
            <CalendarCheck size={28} className="mx-auto text-muted-foreground/50" />
            <p className="text-xs font-semibold text-foreground">Aucune publication récente</p>
            <p className="text-[11px] text-muted-foreground">
              Publiez votre première annonce ou configurez un webhook pour alimenter automatiquement vos résultats.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-[11px] text-muted-foreground uppercase font-mono">
                  <th className="pb-3 pr-4 font-semibold">Publication</th>
                  <th className="pb-3 pr-4 font-semibold">Destination</th>
                  <th className="pb-3 pr-4 font-semibold">Mentions J&apos;aime</th>
                  <th className="pb-3 pr-4 font-semibold">Commentaires</th>
                  <th className="pb-3 pr-4 font-semibold">Partages</th>
                  <th className="pb-3 pr-4 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {posts.map((post) => {
                  const stat = insights[post.id];
                  return (
                    <tr key={post.id} className="hover:bg-surface-2/40 transition">
                      <td className="py-3.5 pr-4 max-w-[260px]">
                        <div className="font-semibold text-foreground truncate">{post.title}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {new Date(post.posted_at || post.created_at).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                      </td>

                      <td className="py-3.5 pr-4">
                        <span className="inline-flex items-center gap-1 rounded bg-blue-500/10 text-blue-500 px-2 py-0.5 font-bold text-[10px]">
                          Facebook {post.page_name ? `· ${post.page_name}` : ""}
                        </span>
                      </td>

                      <td className="py-3.5 pr-4 font-mono font-semibold text-foreground">
                        {stat ? stat.likes : "—"}
                      </td>

                      <td className="py-3.5 pr-4 font-mono font-semibold text-foreground">
                        {stat ? stat.comments : "—"}
                      </td>

                      <td className="py-3.5 pr-4 font-mono font-semibold text-foreground">
                        {stat ? stat.shares : "—"}
                      </td>

                      <td className="py-3.5 pr-4 text-right">
                        {post.facebook_post_id ? (
                          <a
                            href={facebookPostUrl(post.facebook_post_id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:underline font-semibold"
                          >
                            Voir <ArrowSquareOut size={11} />
                          </a>
                        ) : (
                          <span className="text-muted-foreground">—</span>
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
    </div>
  );
}
