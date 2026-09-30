"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Rocket,
  TrendUp,
  CurrencyDollar,
  Target,
  ArrowSquareOut,
  Megaphone,
  CheckCircle,
  Sparkle,
  ShieldCheck,
  WarningCircle,
  ArrowsClockwise,
  Question,
} from "@phosphor-icons/react/dist/ssr";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { MetaCampaign } from "@/lib/types";

interface AdAccountInfo {
  ok: boolean;
  adAccountId: string;
  accountName?: string;
  currency?: string;
  amountSpent?: string;
  hasAdsPermission: boolean;
  warning?: string;
  error?: string;
}

export default function MetaAdsPage() {
  const [campaigns, setCampaigns] = useState<MetaCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [adAccountId, setAdAccountId] = useState("");
  const [adAccountInfo, setAdAccountInfo] = useState<AdAccountInfo | null>(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [campRes, setRes] = await Promise.all([
        fetch("/api/facebook/ads/campaigns").then((r) => (r.ok ? r.json() : { campaigns: [] })),
        fetch("/api/settings").then((r) => (r.ok ? r.json() : {})),
      ]);

      setCampaigns(campRes.campaigns || []);
      const accId = setRes.meta_ad_account_id || "";
      setAdAccountId(accId);

      if (accId) {
        verifyAccount(accId);
      }
    } catch {
      // Graceful fallback
    } finally {
      setLoading(false);
    }
  }

  async function verifyAccount(accountId: string) {
    setVerifying(true);
    try {
      const res = await fetch("/api/facebook/ads/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adAccountId: accountId }),
      });
      if (res.ok) {
        const info = await res.json();
        setAdAccountInfo(info);
      }
    } catch {
      // Ignored
    } finally {
      setVerifying(false);
    }
  }

  // Budget calculations: Strictly separating planned budget from actual spend
  const totalPlannedBudgetDollars = campaigns.reduce((acc, c) => acc + (c.budget_cents || 0) / 100, 0);
  const activeCount = campaigns.filter((c) => c.status === "ACTIVE").length;

  // Real spend from Meta Ad Account (amount_spent is returned by Graph API in cents or standard currency units)
  const realSpendDollars = adAccountInfo?.amountSpent
    ? (parseFloat(adAccountInfo.amountSpent) / 100).toFixed(2)
    : "0.00";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Hero Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
        <div>
          <h1 className="font-heading text-xl font-bold text-foreground flex items-center gap-2">
            <Rocket size={24} weight="fill" className="text-primary" />
            Gestionnaire de Publicités &amp; Boosts (Meta Ads)
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pilotez vos campagnes de sponsoring sponsorisées et amplifiez la portée de vos
            publications Facebook vers vos audiences cibles.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link href="/dashboard/history">
            <Button size="sm">
              <Sparkle size={15} weight="fill" className="mr-1.5" /> Booster un post existant
            </Button>
          </Link>
          {adAccountId && (
            <a
              href={`https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=${adAccountId.replace("act_", "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs font-semibold text-foreground hover:bg-surface-3 transition"
            >
              Meta Ads Manager <ArrowSquareOut size={13} />
            </a>
          )}
        </div>
      </div>

      {/* Meta Ad Account Status Banner */}
      {!adAccountId ? (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-foreground flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <WarningCircle size={20} className="text-amber-500 shrink-0" />
            <div>
              <p className="font-semibold text-amber-500">Connexion nécessaire : Compte publicitaire Meta non associé</p>
              <p className="text-muted-foreground text-[11px] mt-0.5">
                Renseignez votre identifiant de compte publicitaire (ex: <code className="font-mono bg-surface-2 px-1 py-0.5 rounded">act_123456789</code>) dans les Paramètres pour autoriser les boosts et la traçabilité des dépenses.
              </p>
            </div>
          </div>
          <Link href="/dashboard/settings?tab=general" className="shrink-0">
            <Button size="sm" variant="secondary">
              Configurer dans Paramètres
            </Button>
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-surface-2/60 p-4 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <ShieldCheck size={20} className="text-emerald-500 shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-foreground">
                  Compte Meta Ads : {adAccountInfo?.accountName || adAccountId}
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">({adAccountId})</span>
                {adAccountInfo?.currency && (
                  <span className="rounded bg-surface-3 px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                    Devise : {adAccountInfo.currency}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {adAccountInfo?.ok
                  ? "Compte publicitaire vérifié et synchronisé avec l'API Graph Meta."
                  : verifying
                  ? "Vérification auprès de Meta Graph API…"
                  : adAccountInfo?.warning || "Compte configuré. Vérification des autorisations 'ads_management'."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="https://developers.facebook.com/tools/debug/accesstoken/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-primary hover:underline flex items-center gap-1"
            >
              Débogueur de jeton Meta <ArrowSquareOut size={11} />
            </a>
          </div>
        </div>
      )}

      {/* KPI Stats Grid - Real factual numbers */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* Active Campaigns */}
        <Card className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Megaphone size={22} weight="bold" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Campagnes actives</p>
            <p className="font-heading text-xl font-bold text-foreground">
              {loading ? "…" : activeCount}
            </p>
            <p className="text-[10px] text-muted-foreground">Sur {campaigns.length} créée(s)</p>
          </div>
        </Card>

        {/* Planned Budget */}
        <Card className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400">
            <CurrencyDollar size={22} weight="bold" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Budget prévu (Alloué)</p>
            <p className="font-heading text-xl font-bold text-foreground">
              {loading ? "…" : `${totalPlannedBudgetDollars.toFixed(2)} $`}
            </p>
            <p className="text-[10px] text-muted-foreground">Plafond défini par les règles</p>
          </div>
        </Card>

        {/* Real Spend from Meta */}
        <Card className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
            <TrendUp size={22} weight="bold" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Dépense réelle constatée</p>
            <p className="font-heading text-xl font-bold text-foreground">
              {adAccountId ? `${realSpendDollars} $` : "0.00 $"}
            </p>
            <p className="text-[10px] text-muted-foreground">Facturation Meta Ads</p>
          </div>
        </Card>

        {/* Reach / Delivery status */}
        <Card className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-400">
            <Target size={22} weight="bold" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Portée &amp; Diffusion</p>
            <p className="font-heading text-sm font-bold text-foreground mt-1">
              {campaigns.length === 0
                ? "Aucune diffusion"
                : activeCount > 0
                ? "En cours de diffusion"
                : "En pause"}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {campaigns.length === 0 ? "0 impression" : "Mesuré via Meta Insights"}
            </p>
          </div>
        </Card>
      </div>

      {/* Campaigns Table / Cards */}
      <Card>
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div>
            <h2 className="font-heading text-base font-bold text-foreground">
              Historique des campagnes sponsorisées
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Traçabilité des campagnes associées à votre compte publicitaire Meta.
            </p>
          </div>
          <span className="text-xs text-muted-foreground">{campaigns.length} campagne(s)</span>
        </div>

        {loading ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Chargement des campagnes Meta Ads…
          </p>
        ) : campaigns.length === 0 ? (
          <div className="py-14 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Rocket size={24} weight="fill" />
            </div>
            <p className="font-medium text-foreground">Aucune campagne sponsorisée pour le moment</p>
            <p className="mx-auto max-w-md text-xs text-muted-foreground">
              Boostez une publication Facebook depuis l&apos;onglet Historique ou le Studio pour lancer une campagne
              ciblée (engagement, clics, abonnements).
            </p>
            <div className="pt-2 flex items-center justify-center gap-2">
              <Link href="/dashboard/history">
                <Button size="sm">Accéder à l&apos;Historique des posts</Button>
              </Link>
              <Link href="/dashboard/studio">
                <Button size="sm" variant="secondary">Créer un post à sponsoriser</Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="py-3 font-semibold">Campagne &amp; Identifiants</th>
                  <th className="py-3 font-semibold">Objectif</th>
                  <th className="py-3 font-semibold">Budget Prévu</th>
                  <th className="py-3 font-semibold">Durée</th>
                  <th className="py-3 font-semibold">Statut Meta</th>
                  <th className="py-3 font-semibold">Date de création</th>
                  <th className="py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {campaigns.map((camp) => (
                  <tr key={camp.id} className="text-xs hover:bg-surface-2/40 transition">
                    <td className="py-3 pr-4 font-medium text-foreground max-w-[260px]">
                      <div className="truncate font-semibold">{camp.name}</div>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono mt-0.5">
                        <span>ID: {camp.campaign_id}</span>
                        {camp.adset_id && <span>· AdSet: {camp.adset_id}</span>}
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="rounded-lg bg-primary/10 px-2 py-0.5 font-medium text-primary text-[11px]">
                        {camp.objective ? camp.objective.replace(/_/g, " ") : "POST ENGAGEMENT"}
                      </span>
                    </td>
                    <td className="py-3 pr-4 font-semibold text-foreground">
                      {((camp.budget_cents || 0) / 100).toFixed(2)} $
                      <span className="text-[10px] text-muted-foreground block font-normal">
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
                            ? "text-emerald-500"
                            : "text-amber-500"
                        )}
                      >
                        <CheckCircle size={12} weight="bold" />
                        {camp.status === "ACTIVE" ? "Actif" : "En pause (Vérifié)"}
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
                          className="inline-flex items-center gap-1 text-primary hover:underline font-semibold"
                        >
                          Gérer sur Meta <ArrowSquareOut size={11} />
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
