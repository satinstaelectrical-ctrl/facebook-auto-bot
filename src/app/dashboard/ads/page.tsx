"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Rocket,
  TrendUp,
  CurrencyDollar,
  Target,
  ArrowSquareOut,
  CalendarCheck,
  Megaphone,
  CheckCircle,
  Clock,
  Sparkle,
} from "@phosphor-icons/react/dist/ssr";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { MetaCampaign } from "@/lib/types";

export default function MetaAdsPage() {
  const [campaigns, setCampaigns] = useState<MetaCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [adAccountId, setAdAccountId] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/facebook/ads/campaigns").then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()),
    ])
      .then(([campData, setData]) => {
        setCampaigns(campData.campaigns || []);
        setAdAccountId(setData.meta_ad_account_id || "");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalSpentDollars = campaigns.reduce((acc, c) => acc + c.budget_cents / 100, 0);
  const activeCount = campaigns.filter((c) => c.status === "ACTIVE").length;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Hero Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
        <div>
          <h1 className="font-heading text-xl font-bold text-foreground flex items-center gap-2">
            <Rocket size={24} weight="fill" className="text-indigo-400" />
            Gestionnaire de Publicités & Boost de Posts (Meta Ads)
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pilotez vos campagnes de sponsoring sponsorisées et amplifiez la portée de vos
            meilleures publications Facebook en quelques clics.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link href="/dashboard/history">
            <Button size="sm">
              <Sparkle size={15} weight="fill" /> Booster un post existant
            </Button>
          </Link>
          {adAccountId && (
            <a
              href={`https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=${adAccountId.replace("act_", "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-surface-2 px-3 py-2 text-xs font-semibold text-foreground hover:bg-surface-3 transition"
            >
              Meta Ads Manager <ArrowSquareOut size={13} />
            </a>
          )}
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400">
            <Megaphone size={22} weight="bold" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Campagnes actives</p>
            <p className="font-heading text-xl font-bold text-foreground">{activeCount}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
            <CurrencyDollar size={22} weight="bold" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Budget investi</p>
            <p className="font-heading text-xl font-bold text-foreground">
              {totalSpentDollars.toFixed(2)} $
            </p>
          </div>
        </Card>

        <Card className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-400">
            <TrendUp size={22} weight="bold" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Portée estimée</p>
            <p className="font-heading text-xl font-bold text-foreground">
              {campaigns.length > 0 ? `${(campaigns.length * 2800).toLocaleString()}+` : "0"}
            </p>
          </div>
        </Card>

        <Card className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400">
            <Target size={22} weight="bold" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total campagnes</p>
            <p className="font-heading text-xl font-bold text-foreground">{campaigns.length}</p>
          </div>
        </Card>
      </div>

      {/* Campaigns Table / Cards */}
      <Card>
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <h2 className="font-heading text-base font-bold text-foreground">
            Historique des campagnes sponsorisées
          </h2>
          <span className="text-xs text-muted-foreground">{campaigns.length} campagne(s)</span>
        </div>

        {loading ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Chargement des campagnes Meta Ads…
          </p>
        ) : campaigns.length === 0 ? (
          <div className="py-14 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400">
              <Rocket size={24} weight="fill" />
            </div>
            <p className="font-medium text-foreground">Aucune campagne sponsorisée pour le moment</p>
            <p className="mx-auto max-w-md text-xs text-muted-foreground">
              Boostez votre premier post Facebook depuis l&apos;onglet Historique pour lancer une campagne
              ciblée (engagement, clics, abonnements).
            </p>
            <Link href="/dashboard/history" className="inline-block pt-2">
              <Button size="sm">Accéder à l&apos;Historique des posts</Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="py-3 font-semibold">Campagne</th>
                  <th className="py-3 font-semibold">Objectif</th>
                  <th className="py-3 font-semibold">Budget</th>
                  <th className="py-3 font-semibold">Durée</th>
                  <th className="py-3 font-semibold">Statut</th>
                  <th className="py-3 font-semibold">Date de création</th>
                  <th className="py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {campaigns.map((camp) => (
                  <tr key={camp.id} className="text-xs hover:bg-surface-2/40 transition">
                    <td className="py-3 pr-4 font-medium text-foreground max-w-[220px] truncate">
                      {camp.name}
                    </td>
                    <td className="py-3 pr-4">
                      <span className="rounded-lg bg-indigo-500/10 px-2 py-0.5 font-medium text-indigo-400">
                        {camp.objective.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3 pr-4 font-semibold text-foreground">
                      {(camp.budget_cents / 100).toFixed(2)} $
                      <span className="text-[10px] text-muted-foreground block">
                        {camp.budget_type === "daily" ? "par jour" : "budget total"}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">
                      {camp.duration_days} jours
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 font-semibold",
                          camp.status === "ACTIVE"
                            ? "text-emerald-400"
                            : "text-amber-400"
                        )}
                      >
                        <CheckCircle size={12} weight="bold" />
                        {camp.status === "ACTIVE" ? "Actif" : "En pause (Prêt)"}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">
                      {new Date(camp.created_at).toLocaleDateString("fr-FR", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3 text-right">
                      {adAccountId ? (
                        <a
                          href={`https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=${adAccountId.replace("act_", "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-indigo-400 hover:underline"
                        >
                          Gérer <ArrowSquareOut size={11} />
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
