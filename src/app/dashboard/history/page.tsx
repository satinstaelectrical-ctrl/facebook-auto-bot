"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowSquareOut,
  ThumbsUp,
  ChatCircle,
  ShareFat,
  ArrowClockwise,
  Images,
  Rocket,
  X,
  Target,
  CurrencyDollar,
  CalendarCheck,
  CheckCircle,
  WarningCircle,
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

const COUNTRY_PRESETS = [
  { code: "CM", label: "Cameroun", flag: "🇨🇲" },
  { code: "CI", label: "Côte d'Ivoire", flag: "🇨🇮" },
  { code: "SN", label: "Sénégal", flag: "🇸🇳" },
  { code: "FR", label: "France", flag: "🇫🇷" },
  { code: "GA", label: "Gabon", flag: "🇬🇦" },
  { code: "CD", label: "RDC", flag: "🇨🇩" },
  { code: "BE", label: "Belgique", flag: "🇧🇪" },
  { code: "CA", label: "Canada", flag: "🇨🇦" },
  { code: "MA", label: "Maroc", flag: "🇲🇦" },
  { code: "TG", label: "Togo", flag: "🇹🇬" },
  { code: "BJ", label: "Bénin", flag: "🇧🇯" },
];

export default function HistoryPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [filter, setFilter] = useState<PostStatus | "all">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [insights, setInsights] = useState<Record<string, InsightData>>({});
  const [loadingAllInsights, setLoadingAllInsights] = useState(false);

  // Boost Modal state
  const [boostModalPost, setBoostModalPost] = useState<Post | null>(null);
  const [adAccountId, setAdAccountId] = useState("");
  const [budgetDollars, setBudgetDollars] = useState(10);
  const [budgetType, setBudgetType] = useState<"daily" | "lifetime">("daily");
  const [durationDays, setDurationDays] = useState(7);
  const [objective, setObjective] = useState<
    "POST_ENGAGEMENT" | "LINK_CLICKS" | "OUTCOME_TRAFFIC" | "PAGE_LIKES"
  >("POST_ENGAGEMENT");

  // Real Meta Ads Geographic & Demographic Targeting States
  const [targetCountries, setTargetCountries] = useState<string[]>(["CM", "CI", "FR"]);
  const [targetCities, setTargetCities] = useState("");
  const [ageMin, setAgeMin] = useState(18);
  const [ageMax, setAgeMax] = useState(65);
  const [gender, setGender] = useState<"all" | "men" | "women">("all");
  const [customCountryInput, setCustomCountryInput] = useState("");

  const [boosting, setBoosting] = useState(false);
  const [boostSuccess, setBoostSuccess] = useState<string | null>(null);
  const [boostError, setBoostError] = useState<string | null>(null);

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
      setInsights((prev) => ({
        ...prev,
        [postId]: { likes: 0, comments: 0, shares: 0, loading: false },
      }));
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

    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.meta_ad_account_id) setAdAccountId(d.meta_ad_account_id);
      })
      .catch(() => {});
  }, [filter]);

  function openBoostModal(post: Post) {
    setBoostModalPost(post);
    setBoostSuccess(null);
    setBoostError(null);
  }

  async function handleLaunchBoost() {
    if (!boostModalPost) return;
    if (targetCountries.length === 0) {
      setBoostError("Veuillez sélectionner au moins un pays de diffusion obligatoire.");
      return;
    }
    setBoosting(true);
    setBoostError(null);
    setBoostSuccess(null);

    try {
      const res = await fetch("/api/facebook/ads/boost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: boostModalPost.id,
          adAccountId: adAccountId || undefined,
          budgetDollars,
          budgetType,
          durationDays,
          objective,
          targetCountries,
          targetCities: targetCities.split(",").map((s) => s.trim()).filter(Boolean),
          ageMin,
          ageMax,
          gender,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Échec de création du boost Meta Ads.");

      setBoostSuccess("Campagne Meta Ads réelle créée avec succès sur votre compte Facebook ! 🎉");
    } catch (err) {
      setBoostError(err instanceof Error ? err.message : "Erreur lors de la création du boost.");
    } finally {
      setBoosting(false);
    }
  }

  function toggleCountry(code: string) {
    setTargetCountries((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  }

  function addCustomCountry() {
    const code = customCountryInput.trim().toUpperCase();
    if (code.length === 2 && !targetCountries.includes(code)) {
      setTargetCountries((prev) => [...prev, code]);
      setCustomCountryInput("");
    }
  }

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
          {loadingAllInsights ? "Actualisation…" : "Actualiser les statistiques"}
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
            <p className="py-10 text-center text-sm text-muted-foreground">
              Chargement de l&apos;historique…
            </p>
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
                    <th className="hidden pb-2 font-medium sm:table-cell">Réseau &amp; Page</th>
                    <th className="pb-2 font-medium">Statut</th>
                    <th className="pb-2 font-medium">Performances</th>
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {posts.map((post) => {
                    const postStats = insights[post.id];
                    const hasMultiImages = post.media_urls && post.media_urls.length > 1;

                    return (
                      <tr
                        key={post.id}
                        className="hover:bg-surface-2/40 transition text-xs"
                      >
                        {/* Post info & thumbnail */}
                        <td className="max-w-[260px] py-3.5 pr-3">
                          <div className="flex items-center gap-3">
                            <div className="relative shrink-0">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={post.image_url}
                                alt=""
                                className="h-11 w-11 rounded-xl object-cover border border-white/[0.08]"
                              />
                              {hasMultiImages && (
                                <span className="absolute -bottom-1 -right-1 bg-black/80 text-white rounded px-1 py-0.5 text-[9px] font-bold flex items-center gap-0.5">
                                  <Images size={10} /> {post.media_urls?.length}
                                </span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-foreground">{post.title}</p>
                              <p className="truncate text-xs text-muted-foreground">
                                {post.description}
                              </p>
                              {post.status === "failed" && post.error_message && (
                                <div className="mt-1 rounded-md bg-destructive/10 border border-destructive/20 px-2 py-0.5 text-[11px] text-destructive font-mono truncate max-w-xs">
                                  Erreur API : {post.error_message}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Network & Page name */}
                        <td className="hidden py-3.5 pr-3 text-muted-foreground sm:table-cell">
                          <div className="flex items-center gap-1.5">
                            <span className="rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 font-bold text-[10px]">
                              Facebook
                            </span>
                            <span className="font-medium text-foreground truncate max-w-[120px]">
                              {post.page_name ?? "Page Principale"}
                            </span>
                          </div>
                        </td>

                        {/* Status badge */}
                        <td className="py-3.5 pr-3">
                          {post.status === "posted" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400 border border-emerald-500/20">
                              <CheckCircle size={12} weight="fill" /> Réussi
                            </span>
                          ) : post.status === "failed" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-0.5 text-[11px] font-bold text-destructive border border-destructive/20">
                              <WarningCircle size={12} weight="fill" /> Échec
                            </span>
                          ) : (
                            <StatusBadge status={post.status} />
                          )}
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

                        {/* Action buttons (Direct Link + Boost) */}
                        <td className="py-3.5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-2">
                            {post.status === "posted" && (
                              <button
                                type="button"
                                onClick={() => openBoostModal(post)}
                                className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 px-3 py-1.5 text-xs font-bold text-white shadow-md shadow-indigo-500/20 hover:from-indigo-500 hover:to-purple-500 transition cursor-pointer"
                              >
                                <Rocket size={13} weight="fill" /> Booster ce post
                              </button>
                            )}

                            {post.facebook_post_id ? (
                              <a
                                href={facebookPostUrl(post.facebook_post_id)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 rounded-xl border border-white/[0.08] bg-surface-2 px-2.5 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition"
                              >
                                <ArrowSquareOut size={13} />
                              </a>
                            ) : null}
                          </div>
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

      {/* Boost Modal */}
      {boostModalPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setBoostModalPost(null)}
          />
          <div className="relative w-full max-w-lg rounded-2xl border border-white/[0.1] bg-surface p-6 shadow-2xl shadow-black/50">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h2 className="font-heading text-lg font-bold text-foreground flex items-center gap-2">
                <Rocket size={20} weight="fill" className="text-indigo-400" />
                Booster la publication (Meta Ads)
              </h2>
              <button
                onClick={() => setBoostModalPost(null)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Post preview strip */}
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-white/[0.08] bg-surface-2/60 p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={boostModalPost.image_url}
                alt=""
                className="h-12 w-12 rounded-lg object-cover shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-foreground">{boostModalPost.title}</p>
                <p className="truncate text-[11px] text-muted-foreground">
                  Page : {boostModalPost.page_name ?? "Facebook"}
                </p>
              </div>
            </div>

            {/* Form Fields */}
            <div className="mt-4 space-y-4 text-xs">
              {/* Ad Account ID */}
              <div>
                <label className="font-semibold text-muted-foreground">
                  Identifiant Compte Publicitaire (act_...)
                </label>
                <input
                  placeholder="ex: act_1234567890"
                  value={adAccountId}
                  onChange={(e) => setAdAccountId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/[0.08] bg-background px-3 py-2 text-sm outline-none focus:border-indigo-500"
                />
              </div>

              {/* Objective Selector */}
              <div>
                <label className="font-semibold text-muted-foreground">Objectif de la campagne</label>
                <div className="mt-1.5 grid grid-cols-3 gap-2">
                  {[
                    { val: "POST_ENGAGEMENT", label: "🎯 Interactions", desc: "Likes & partages" },
                    { val: "LINK_CLICKS", label: "🔗 Trafic / Clics", desc: "Visites site web" },
                    { val: "PAGE_LIKES", label: "⭐ Abonnés", desc: "Notoriété de page" },
                  ].map((obj) => (
                    <button
                      key={obj.val}
                      type="button"
                      onClick={() => setObjective(obj.val as typeof objective)}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition ${
                        objective === obj.val
                          ? "border-indigo-500 bg-indigo-500/10 text-indigo-300 ring-1 ring-indigo-500/30"
                          : "border-white/[0.08] bg-surface-2 text-muted-foreground hover:border-white/[0.16]"
                      }`}
                    >
                      <p className="font-bold text-foreground">{obj.label}</p>
                      <p className="text-[10px] mt-0.5">{obj.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Warning if Ad Account is not configured */}
              {!adAccountId && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <WarningCircle size={15} weight="fill" />
                    Compte publicitaire Meta non configuré
                  </p>
                  <p className="text-[11px] text-amber-200/80 leading-relaxed">
                    Pour diffuser de réelles annonces sur Facebook, vous devez renseigner votre ID de compte publicitaire Meta (ex: <code className="font-mono text-white">act_123456789</code>) dans les Réglages.
                  </p>
                  <Link href="/dashboard/settings" className="inline-block pt-1 font-semibold underline hover:text-white">
                    Configurer dans Paramètres ↗
                  </Link>
                </div>
              )}

              {/* REAL GEOGRAPHIC TARGETING (Mandatory) */}
              <div className="rounded-xl border border-white/[0.08] bg-zinc-900/60 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                    <Target size={15} className="text-indigo-400" />
                    Ciblage géographique réel (Pays de diffusion) *
                  </label>
                  <span className="text-[11px] text-indigo-400 font-bold">
                    {targetCountries.length} pays sélectionné(s)
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {COUNTRY_PRESETS.map((country) => {
                    const selected = targetCountries.includes(country.code);
                    return (
                      <button
                        key={country.code}
                        type="button"
                        onClick={() => toggleCountry(country.code)}
                        className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-medium cursor-pointer transition ${
                          selected
                            ? "bg-indigo-600 text-white font-bold shadow-sm ring-1 ring-indigo-400"
                            : "bg-surface-2 text-muted-foreground border border-white/[0.08] hover:border-white/[0.2]"
                        }`}
                      >
                        <span>{country.flag}</span>
                        <span>{country.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Custom ISO Code Input */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    placeholder="Autre pays (ex: US, ES, DE)"
                    value={customCountryInput}
                    onChange={(e) => setCustomCountryInput(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomCountry())}
                    maxLength={2}
                    className="w-48 rounded-xl border border-white/[0.08] bg-background px-3 py-1.5 text-xs font-mono uppercase outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={addCustomCountry}
                    disabled={customCountryInput.trim().length !== 2}
                    className="rounded-xl border border-white/[0.1] bg-surface-2 px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-surface-3 disabled:opacity-40"
                  >
                    + Ajouter pays
                  </button>
                </div>

                {/* Specific Cities */}
                <div className="pt-1 border-t border-white/[0.04]">
                  <label className="text-[11px] font-semibold text-muted-foreground">
                    Villes ciblées précises (facultatif, séparées par virgules)
                  </label>
                  <input
                    placeholder="Ex: Douala, Yaoundé, Abidjan, Dakar, Paris..."
                    value={targetCities}
                    onChange={(e) => setTargetCities(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/[0.08] bg-background px-3 py-1.5 text-xs outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* DEMOGRAPHIC TARGETING (Age & Gender) */}
              <div className="rounded-xl border border-white/[0.08] bg-zinc-900/60 p-3.5 space-y-2.5">
                <label className="font-semibold text-foreground text-xs block">
                  Ciblage démographique (Âge &amp; Genre)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground block">
                      Tranche d&apos;âge ({ageMin} à {ageMax >= 65 ? "65+ ans" : `${ageMax} ans`})
                    </label>
                    <div className="mt-1.5 flex items-center gap-2">
                      <select
                        value={ageMin}
                        onChange={(e) => setAgeMin(Number(e.target.value))}
                        className="flex-1 rounded-xl border border-white/[0.08] bg-background px-2.5 py-1.5 text-xs outline-none focus:border-indigo-500"
                      >
                        {[18, 21, 25, 30, 35, 40, 45, 50].map((a) => (
                          <option key={a} value={a}>Min : {a} ans</option>
                        ))}
                      </select>
                      <span className="text-xs text-muted-foreground">à</span>
                      <select
                        value={ageMax}
                        onChange={(e) => setAgeMax(Number(e.target.value))}
                        className="flex-1 rounded-xl border border-white/[0.08] bg-background px-2.5 py-1.5 text-xs outline-none focus:border-indigo-500"
                      >
                        {[25, 30, 35, 40, 45, 50, 55, 60, 65].map((a) => (
                          <option key={a} value={a}>Max : {a >= 65 ? "65+ ans" : `${a} ans`}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground block">Genre ciblé</label>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      {[
                        { val: "all", label: "Tous" },
                        { val: "men", label: "Hommes" },
                        { val: "women", label: "Femmes" },
                      ].map((g) => (
                        <button
                          key={g.val}
                          type="button"
                          onClick={() => setGender(g.val as typeof gender)}
                          className={`flex-1 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition ${
                            gender === g.val
                              ? "border-indigo-500 bg-indigo-600 text-white font-bold"
                              : "border-white/[0.08] bg-surface-2 text-muted-foreground hover:border-white/[0.16]"
                          }`}
                        >
                          {g.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Budget Definition */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-muted-foreground">Budget</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setBudgetType("daily")}
                      className={`text-[11px] font-semibold ${
                        budgetType === "daily" ? "text-indigo-400 underline" : "text-muted-foreground"
                      }`}
                    >
                      Par jour
                    </button>
                    <span className="text-muted-foreground">|</span>
                    <button
                      type="button"
                      onClick={() => setBudgetType("lifetime")}
                      className={`text-[11px] font-semibold ${
                        budgetType === "lifetime"
                          ? "text-indigo-400 underline"
                          : "text-muted-foreground"
                      }`}
                    >
                      Budget total
                    </button>
                  </div>
                </div>

                <div className="mt-1.5 flex items-center gap-2">
                  {[5, 10, 20, 50].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setBudgetDollars(amt)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer transition ${
                        budgetDollars === amt
                          ? "border-indigo-500 bg-indigo-600 text-white"
                          : "border-white/[0.08] bg-surface-2 text-muted-foreground hover:border-white/[0.16]"
                      }`}
                    >
                      {amt} $
                    </button>
                  ))}
                  <div className="relative flex-1">
                    <input
                      type="number"
                      min={1}
                      value={budgetDollars}
                      onChange={(e) => setBudgetDollars(Math.max(1, Number(e.target.value)))}
                      className="w-full rounded-xl border border-white/[0.08] bg-background px-3 py-1.5 text-xs outline-none focus:border-indigo-500 pl-6"
                    />
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                      $
                    </span>
                  </div>
                </div>
              </div>

              {/* Duration Definition */}
              <div>
                <label className="font-semibold text-muted-foreground">Durée de la campagne</label>
                <div className="mt-1.5 flex items-center gap-2">
                  {[3, 7, 14, 30].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setDurationDays(days)}
                      className={`flex-1 py-1.5 rounded-xl border text-xs font-bold cursor-pointer transition ${
                        durationDays === days
                          ? "border-indigo-500 bg-indigo-600 text-white"
                          : "border-white/[0.08] bg-surface-2 text-muted-foreground hover:border-white/[0.16]"
                      }`}
                    >
                      {days} jours
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary note */}
              <div className="rounded-xl border border-white/[0.05] bg-surface-2/40 p-3 text-[11px] text-muted-foreground space-y-1">
                <div className="flex justify-between">
                  <span>Dépense estimée totale :</span>
                  <span className="font-bold text-foreground">
                    {budgetType === "daily" ? budgetDollars * durationDays : budgetDollars} $
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Portée estimée :</span>
                  <span className="font-semibold text-emerald-400">
                    ~{(budgetDollars * 350).toLocaleString()} personnes / jour
                  </span>
                </div>
              </div>

              {/* Feedback messages */}
              {boostError && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                  {boostError}
                </div>
              )}

              {boostSuccess && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400 flex items-center justify-between">
                  <span>{boostSuccess}</span>
                  <Link href="/dashboard/ads" className="font-bold underline underline-offset-2">
                    Voir les campagnes ↗
                  </Link>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="mt-5 flex items-center justify-end gap-2 border-t border-border pt-4">
              <Button variant="secondary" onClick={() => setBoostModalPost(null)}>
                Fermer
              </Button>
              <Button
                onClick={handleLaunchBoost}
                disabled={boosting || !adAccountId}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
              >
                <Rocket size={14} weight="fill" />
                {boosting ? "Création sur Meta…" : "Lancer la campagne Meta Ads"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
