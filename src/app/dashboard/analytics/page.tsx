"use client";

import React, { useState } from "react";
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
  InstagramLogo,
  CalendarCheck,
  Trophy,
  ShareNetwork,
} from "@phosphor-icons/react/dist/ssr";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/stat-card";
import { PostsChart } from "@/components/dashboard/posts-chart";

const TOP_POSTS = [
  {
    id: "p1",
    title: "Villa Contemporaine Bastos avec Piscine (Visite Vidéo)",
    channel: "facebook",
    format: "Reel 9:16",
    views: "348,200",
    clicks: "14,800",
    leads: "84 leads",
    conversionRate: "5.6%",
  },
  {
    id: "p2",
    title: "Offre Spéciale E-Commerce : Pack Pro Réduction -30%",
    channel: "whatsapp",
    format: "Diffusion Directe",
    views: "182,400",
    clicks: "9,600",
    leads: "62 leads",
    conversionRate: "6.4%",
  },
  {
    id: "p3",
    title: "Appartement Meublé Standing Bonapriso Douala",
    channel: "facebook",
    format: "Carrousel Photos",
    views: "145,000",
    clicks: "5,400",
    leads: "41 leads",
    conversionRate: "4.2%",
  },
  {
    id: "p4",
    title: "Reel TikTok : Comment doubler ses ventes en 14 jours",
    channel: "instagram",
    format: "Reel 9:16",
    views: "284,000",
    clicks: "8,900",
    leads: "52 leads",
    conversionRate: "3.9%",
  },
];

const ANALYTICS_CHART_DATA = [
  { date: "2026-09-17", label: "17 sept", count: 4, posts: 4, reach: 45000, impressions: 68000, engagement: 2400, clicks: 820 },
  { date: "2026-09-19", label: "19 sept", count: 6, posts: 6, reach: 68000, impressions: 94000, engagement: 3600, clicks: 1200 },
  { date: "2026-09-21", label: "21 sept", count: 8, posts: 8, reach: 98000, impressions: 142000, engagement: 5200, clicks: 1840 },
  { date: "2026-09-23", label: "23 sept", count: 7, posts: 7, reach: 89000, impressions: 126000, engagement: 4800, clicks: 1650 },
  { date: "2026-09-25", label: "25 sept", count: 11, posts: 11, reach: 142000, impressions: 198000, engagement: 7400, clicks: 2450 },
  { date: "2026-09-27", label: "27 sept", count: 14, posts: 14, reach: 185000, impressions: 245000, engagement: 9800, clicks: 3100 },
  { date: "2026-09-29", label: "29 sept", count: 16, posts: 16, reach: 210000, impressions: 290000, engagement: 11200, clicks: 3800 },
  { date: "2026-09-30", label: "Aujourd'hui", count: 18, posts: 18, reach: 245000, impressions: 335000, engagement: 13400, clicks: 4200 },
];

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "all">("30d");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-bold text-indigo-400 border border-indigo-500/20">
              Media Buyer &amp; ROI Cockpit
            </span>
          </div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight text-foreground">
            Analytique &amp; Performances Globales
          </h1>
          <p className="text-xs text-muted-foreground">
            Mesurez l&apos;impact commercial de vos publications, l&apos;acquisition de trafic et la conversion en leads.
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-xl bg-surface-2 p-1 border border-border">
          <button
            onClick={() => setTimeRange("7d")}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
              timeRange === "7d" ? "bg-primary text-white shadow-sm" : "text-muted-foreground"
            }`}
          >
            7 jours
          </button>
          <button
            onClick={() => setTimeRange("30d")}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
              timeRange === "30d" ? "bg-primary text-white shadow-sm" : "text-muted-foreground"
            }`}
          >
            30 jours
          </button>
          <button
            onClick={() => setTimeRange("all")}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
              timeRange === "all" ? "bg-primary text-white shadow-sm" : "text-muted-foreground"
            }`}
          >
            Tout l&apos;historique
          </button>
        </div>
      </div>

      {/* 5 Executive KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard
          label="Publications diffusées"
          value="245"
          icon={CalendarCheck}
          tone="primary"
          trend="+28 ce mois"
        />
        <StatCard
          label="Vues cumulées (Vues & Reach)"
          value="1.2M"
          icon={Eye}
          tone="primary"
          trend="+24.6%"
        />
        <StatCard
          label="Interactions & Engagements"
          value="58.4K"
          icon={MegaphoneSimple}
          tone="success"
          trend="+18.2%"
        />
        <StatCard
          label="Clics sortants vers le site"
          value="18.9K"
          icon={CursorClick}
          tone="success"
          trend="+32.1%"
        />
        <StatCard
          label="Leads & Prospects capturés"
          value="342"
          icon={UsersThree}
          tone="warning"
          trend="+44 qualifiés"
        />
      </div>

      {/* Main Graph & Channel Share */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Performance Chart (8 cols) */}
        <div className="space-y-6 lg:col-span-8">
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-heading text-base font-bold text-foreground">
                  Évolution de l&apos;Audience &amp; Clics générés
                </h2>
                <p className="text-xs text-muted-foreground">
                  Croissance consolidée Facebook Feed, Reels 9:16 et alertes WhatsApp
                </p>
              </div>
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-500/20">
                +24.6% ce mois
              </span>
            </div>
            <PostsChart data={ANALYTICS_CHART_DATA} />
          </Card>
        </div>

        {/* Channel Distribution & Best Product (4 cols) */}
        <div className="space-y-6 lg:col-span-4">
          <Card className="space-y-4">
            <h2 className="font-heading text-base font-bold text-foreground">
              Répartition par Réseau
            </h2>
            <p className="text-xs text-muted-foreground">Origine du trafic et des leads</p>

            <div className="space-y-3 pt-1">
              <div>
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span className="flex items-center gap-1.5 text-foreground">
                    <FacebookLogo size={14} className="text-blue-500" /> Facebook Pages &amp; Ads
                  </span>
                  <span className="font-mono text-muted-foreground">48% (576K vues)</span>
                </div>
                <div className="h-2 w-full rounded-full bg-surface-2 overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: "48%" }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span className="flex items-center gap-1.5 text-foreground">
                    <WhatsappLogo size={14} className="text-emerald-500" /> WhatsApp Direct CRM
                  </span>
                  <span className="font-mono text-muted-foreground">32% (384K vues)</span>
                </div>
                <div className="h-2 w-full rounded-full bg-surface-2 overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: "32%" }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span className="flex items-center gap-1.5 text-foreground">
                    <InstagramLogo size={14} className="text-pink-500" /> Instagram Reels
                  </span>
                  <span className="font-mono text-muted-foreground">20% (240K vues)</span>
                </div>
                <div className="h-2 w-full rounded-full bg-surface-2 overflow-hidden">
                  <div className="h-full bg-pink-500 rounded-full" style={{ width: "20%" }} />
                </div>
              </div>
            </div>
          </Card>

          {/* Star Top Performing Highlight */}
          <div className="rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent p-5 space-y-2">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs">
              <Trophy size={16} weight="fill" />
              <span>Meilleur Contenu du Mois</span>
            </div>
            <h3 className="text-sm font-bold text-foreground">
              Villa Contemporaine Bastos (Reel 9:16)
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              A généré 348 200 vues et 84 leads WhatsApp qualifiés en seulement 6 jours.
            </p>
          </div>
        </div>
      </div>

      {/* Top Performing Content Leaderboard Table */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h2 className="font-heading text-base font-bold text-foreground">
              Top Publications qui Génèrent du Trafic
            </h2>
            <p className="text-xs text-muted-foreground">Classement des contenus par conversion directe</p>
          </div>
          <Link href="/dashboard/history" className="text-xs font-semibold text-indigo-400 hover:underline">
            Voir tout l&apos;historique ↗
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-[11px] text-muted-foreground uppercase font-mono">
                <th className="pb-3 pr-4">Titre de la publication</th>
                <th className="pb-3 pr-4">Canal &amp; Format</th>
                <th className="pb-3 pr-4">Vues Totales</th>
                <th className="pb-3 pr-4">Clics Sortants</th>
                <th className="pb-3 pr-4">Leads Qualifiés</th>
                <th className="pb-3 pr-4">Taux de Conv.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {TOP_POSTS.map((post) => (
                <tr key={post.id} className="hover:bg-surface-2/40 transition">
                  <td className="py-3.5 pr-4 font-semibold text-foreground max-w-xs truncate">
                    {post.title}
                  </td>
                  <td className="py-3.5 pr-4">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-surface-2 px-2 py-1 text-[11px] font-medium capitalize">
                      {post.channel === "facebook" ? (
                        <FacebookLogo size={12} className="text-blue-500" />
                      ) : post.channel === "whatsapp" ? (
                        <WhatsappLogo size={12} className="text-emerald-500" />
                      ) : (
                        <InstagramLogo size={12} className="text-pink-500" />
                      )}
                      {post.format}
                    </span>
                  </td>
                  <td className="py-3.5 pr-4 font-mono font-bold text-foreground">
                    {post.views}
                  </td>
                  <td className="py-3.5 pr-4 font-mono text-indigo-400 font-semibold">
                    {post.clicks}
                  </td>
                  <td className="py-3.5 pr-4 font-mono text-emerald-400 font-bold">
                    {post.leads}
                  </td>
                  <td className="py-3.5 pr-4 font-mono text-foreground font-bold">
                    {post.conversionRate}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
