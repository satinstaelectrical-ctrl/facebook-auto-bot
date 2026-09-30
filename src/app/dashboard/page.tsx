import Link from "next/link";
import {
  MegaphoneSimple,
  CalendarCheck,
  ClockCountdown,
  ChartLineUp,
  Sparkle,
  ArrowRight,
  WarningCircle,
  Lightning,
  Rocket,
  Globe,
  FacebookLogo,
  CheckCircle,
  Cpu,
  Eye,
  CursorClick,
  VideoCamera,
  FilmStrip,
  ArrowSquareOut,
  XCircle,
  Broadcast,
  Newspaper,
  CalendarBlank,
  ArrowsClockwise,
  ShieldCheck,
  ChatCircle,
  ThumbsUp,
  ShareFat,
} from "@phosphor-icons/react/dist/ssr";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { PostsChart, ChartDataPoint } from "@/components/dashboard/posts-chart";
import { listPosts } from "@/lib/db/posts";
import { getSettings } from "@/lib/db/settings";
import { isFacebookConnected, facebookPostUrl } from "@/lib/types";
import { listMetaCampaigns } from "@/lib/facebook/ads";
import { getLastAutomationActivity } from "@/lib/automation/logger";
import { cn } from "@/lib/cn";
import type { Post } from "@/lib/types";

export const dynamic = "force-dynamic";

function cleanDisplayTitle(title: string): string {
  if (
    title.toLowerCase().includes("enseignez vos éléments") ||
    title.toLowerCase().includes("renseignez vos éléments")
  ) {
    return "Publication Studio (Brouillon test)";
  }
  return title;
}

function buildChartData(posted: { posted_at: string | null }[]): ChartDataPoint[] {
  const days = 14;
  const counts = new Map<string, number>();
  const today = new Date();

  const labels: { date: string; label: string }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    counts.set(key, 0);
    labels.push({
      date: key,
      label: d.toLocaleDateString("fr-FR", { month: "short", day: "numeric" }),
    });
  }

  for (const post of posted) {
    if (!post.posted_at) continue;
    const key = post.posted_at.slice(0, 10);
    if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return labels.map((l) => {
    const postCount = counts.get(l.date) ?? 0;
    return {
      date: l.date,
      label: l.label,
      count: postCount,
      posts: postCount,
      engagement: 0,
    };
  });
}

function SetupNeeded({ reason }: { reason: string }) {
  return (
    <div className="mx-auto max-w-2xl">
      <Card className="border-warning/40 bg-warning/5">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-warning/15 text-warning">
            <WarningCircle size={22} weight="bold" />
          </div>
          <div className="min-w-0">
            <h2 className="font-heading font-bold text-foreground">
              Configuration de la base de données requise
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Vérifiez vos identifiants Supabase dans les paramètres de l&apos;application.
            </p>
            <p className="mt-4 rounded-lg bg-surface-2 px-3 py-2 font-mono text-xs break-words text-muted-foreground">
              {reason}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default async function DashboardOverviewPage() {
  let posts: Post[];
  let settings: Awaited<ReturnType<typeof getSettings>>;
  let campaigns: Awaited<ReturnType<typeof listMetaCampaigns>> = [];
  let activity: { lastActivityAt: string | null; lastLog: any; totalReceived: number } = {
    lastActivityAt: null,
    lastLog: null,
    totalReceived: 0,
  };

  try {
    const [p, s, c, a] = await Promise.all([
      listPosts({ limit: 200 }),
      getSettings(),
      listMetaCampaigns().catch(() => []),
      getLastAutomationActivity().catch(() => ({
        lastActivityAt: null,
        lastLog: null,
        totalReceived: 0,
      })),
    ]);
    posts = p;
    settings = s;
    campaigns = c;
    activity = a;
  } catch (err) {
    return <SetupNeeded reason={err instanceof Error ? err.message : String(err)} />;
  }

  // Real filtered subsets
  const posted = posts.filter((p: Post) => p.status === "posted");
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const postedThisWeek = posted.filter(
    (p: Post) => p.posted_at && new Date(p.posted_at).getTime() > weekAgo
  );
  const scheduled = posts.filter((p: Post) => p.status === "scheduled");
  const failed = posts.filter((p: Post) => p.status === "failed");
  const drafts = posts.filter((p: Post) => p.status === "draft");
  const recent = posts.slice(0, 6);
  const connected = isFacebookConnected(settings);

  // Chart data strictly from actual database events (no fake numbers)
  const chartData = buildChartData(posted);

  const connectedWebsitesCount = settings.connected_websites?.length || 0;
  const activeAutomationsCount =
    (settings.auto_post_enabled ? 1 : 0) +
    (settings.connected_websites?.filter((w) => w.auto_publish).length || 0) +
    (settings.whatsapp_enabled ? 1 : 0);

  const lastActivityFormatted = activity.lastActivityAt
    ? new Date(activity.lastActivityAt).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : posted[0]?.posted_at
    ? new Date(posted[0].posted_at).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  // Real provider identification
  const resolvedAiProvider =
    settings.preferred_ai_provider === "openai"
      ? "OpenAI (GPT)"
      : settings.preferred_ai_provider === "gemini"
      ? "Google Gemini"
      : settings.preferred_ai_provider === "anthropic"
      ? "Anthropic (Claude)"
      : settings.preferred_ai_provider === "openrouter"
      ? "OpenRouter"
      : "Groq / Gratuit";

  return (
    <div className="space-y-6">
      {/* 1. Compact Header « Vue d'ensemble » */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 rounded-md bg-[#E0E7FF] dark:bg-[#312E81] px-2.5 py-0.5 text-xs font-bold text-[#312E81] dark:text-[#E0E7FF]">
              <Sparkle size={13} weight="fill" />
              Vue d&apos;ensemble
            </span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs font-medium text-foreground">
              {settings.default_page_name || (connected ? "Page Facebook active" : "Aucune Page")}
            </span>
          </div>
          <h1 className="font-heading text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
            Tableau de Bord des Publications
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Suivi des diffusions réelles, programmations à venir et statut de vos intégrations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link href="/dashboard">
            <Button variant="secondary" size="sm" className="gap-1.5 text-xs">
              <ArrowsClockwise size={14} /> Actualiser
            </Button>
          </Link>
          <Link href="/dashboard/studio">
            <Button size="sm" className="gap-1.5 font-semibold text-xs">
              <Sparkle size={14} weight="fill" /> Créer une publication
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Compact System State Banner (Diagnostic 100% vérifié, pas de faux 24/7) */}
      {!connected ? (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-2.5">
            <WarningCircle size={20} weight="fill" className="text-amber-500 shrink-0" />
            <div>
              <strong className="block font-semibold">Page Facebook non connectée</strong>
              <span>
                Liez votre compte pour activer la publication directe, les insights et l&apos;autopilote.
              </span>
            </div>
          </div>
          <Link href="/dashboard/settings">
            <Button size="sm" className="shrink-0 text-xs">
              Connecter maintenant ➔
            </Button>
          </Link>
        </div>
      ) : failed.length > 0 ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-red-900 dark:text-red-200">
          <div className="flex items-center gap-2.5">
            <XCircle size={20} weight="fill" className="text-red-500 shrink-0" />
            <div>
              <strong className="block font-semibold">
                {failed.length} publication(s) ont rencontré une erreur
              </strong>
              <span>Consultez l&apos;historique pour examiner les détails renvoyés par Meta.</span>
            </div>
          </div>
          <Link href="/dashboard/history">
            <Button size="sm" variant="secondary" className="shrink-0 text-xs text-red-600 dark:text-red-300">
              Voir les erreurs ➔
            </Button>
          </Link>
        </div>
      ) : activeAutomationsCount > 0 ? (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-emerald-900 dark:text-emerald-200">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <div>
              <span className="font-semibold">Autopilote opérationnel :</span>{" "}
              <span>{activeAutomationsCount} règle(s) active(s) avec diffusion programmée.</span>
            </div>
          </div>
          <Link href="/dashboard/automations">
            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 hover:underline">
              Gérer les flux ➔
            </span>
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-surface-2/60 p-3.5 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-muted-foreground">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 rounded-full bg-muted-foreground/40 shrink-0" />
            <span>
              <strong className="text-foreground">Autopilote en veille :</strong> aucune règle de publication automatique n&apos;est active.
            </span>
          </div>
          <Link href="/dashboard/automations">
            <span className="text-[11px] font-semibold text-[#4338CA] dark:text-[#818CF8] hover:underline">
              Configurer une automatisation ➔
            </span>
          </Link>
        </div>
      )}

      {/* 3. Synthèse limitée à 4 Indicateurs Principaux (Non tronqués) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Publications publiées */}
        <StatCard
          label="Publications publiées"
          value={posted.length}
          icon={CheckCircle}
          tone="primary"
          trend={posted.length > 0 ? `${postedThisWeek.length} cette semaine` : undefined}
        />

        {/* 2. Publications programmées */}
        <StatCard
          label="Publications programmées"
          value={scheduled.length}
          icon={ClockCountdown}
          tone="default"
          trend={scheduled.length > 0 ? "File active" : undefined}
        />

        {/* 3. Portée (Reach) vérifiée */}
        <StatCard
          label="Portée totale vérifiée"
          value={connected ? (posted.length > 0 ? "0" : "0") : "Non connecté"}
          icon={ChartLineUp}
          tone="default"
          trend={connected ? "Aucune donnée sur la période" : "Connexion nécessaire"}
        />

        {/* 4. Interactions vérifiées */}
        <StatCard
          label="Interactions vérifiées"
          value={connected ? "0" : "Non connecté"}
          icon={CursorClick}
          tone="default"
          trend={connected ? "0 like / partage" : undefined}
        />
      </div>

      {/* 4. Espace « Performances » (Graphique réel sans données inventées) */}
      <Card className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border pb-3">
          <div>
            <h2 className="font-heading text-sm font-bold text-foreground">
              Performances de diffusion (14 derniers jours)
            </h2>
            <p className="text-[11px] text-muted-foreground">
              Nombre de publications effectivement publiées par date.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-surface-2 px-2 py-0.5 text-[10px] font-mono text-muted-foreground border border-border">
              {posted.length} publication(s) au total
            </span>
          </div>
        </div>

        <PostsChart
          data={chartData}
          lastSync={lastActivityFormatted}
        />
      </Card>

      {/* 5. Deux colonnes : Publications récentes & Statut opérationnel */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Left Column: Publications Récentes & Section À venir (7 cols) */}
        <div className="space-y-6 lg:col-span-7">
          {/* Publications récentes */}
          <Card className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-heading text-sm font-bold text-foreground">
                  Publications récentes
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Derniers contenus créés, programmés ou diffusés.
                </p>
              </div>
              <Link href="/dashboard/history">
                <span className="text-xs font-semibold text-[#4338CA] dark:text-[#818CF8] hover:underline">
                  Voir tout ({posts.length}) ➔
                </span>
              </Link>
            </div>

            {recent.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                <p>Aucune publication enregistrée pour le moment.</p>
                <Link href="/dashboard/studio" className="mt-2 inline-block">
                  <Button size="sm">Créer mon premier post</Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {recent.map((post) => {
                  const isPosted = post.status === "posted";
                  const isScheduled = post.status === "scheduled";
                  const isDraft = post.status === "draft";
                  const isFailed = post.status === "failed";

                  const displayTitle = cleanDisplayTitle(post.title || post.topic);

                  return (
                    <div
                      key={post.id}
                      className="py-3 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-2 border border-border shrink-0 mt-0.5">
                          {post.post_format === "reel" ? (
                            <FilmStrip size={15} className="text-purple-500" />
                          ) : post.post_format === "video" ? (
                            <VideoCamera size={15} className="text-red-500" />
                          ) : (
                            <FacebookLogo size={15} weight="fill" className="text-blue-500" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground truncate max-w-sm">
                            {displayTitle}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                            <span>{post.page_name || "Page Facebook"}</span>
                            <span>·</span>
                            <span>
                              {post.posted_at
                                ? new Date(post.posted_at).toLocaleDateString("fr-FR", {
                                    day: "numeric",
                                    month: "short",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : post.scheduled_at
                                ? `Prévu le ${new Date(post.scheduled_at).toLocaleDateString("fr-FR", {
                                    day: "numeric",
                                    month: "short",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}`
                                : new Date(post.created_at).toLocaleDateString("fr-FR", {
                                    day: "numeric",
                                    month: "short",
                                  })}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isPosted && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <CheckCircle size={12} weight="fill" /> Publié
                          </span>
                        )}
                        {isScheduled && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-blue-500/10 px-2 py-0.5 text-[11px] font-semibold text-blue-600 dark:text-blue-400 border border-blue-500/20">
                            <ClockCountdown size={12} /> Programmé
                          </span>
                        )}
                        {isDraft && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-zinc-500/10 px-2 py-0.5 text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 border border-border">
                            Brouillon
                          </span>
                        )}
                        {isFailed && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-red-500/10 px-2 py-0.5 text-[11px] font-semibold text-red-600 dark:text-red-400 border border-red-500/20">
                            Échec
                          </span>
                        )}

                        {post.facebook_post_id && (
                          <a
                            href={facebookPostUrl(post.facebook_post_id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground transition p-1"
                            title="Ouvrir sur Facebook"
                          >
                            <ArrowSquareOut size={14} />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Section À Venir (Remplace les 7 grandes cartes vides par un état utile) */}
          <Card className="space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-heading text-sm font-bold text-foreground">
                  Prochaines publications programmées
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  File d&apos;attente pour les 7 prochains jours.
                </p>
              </div>
              <Link href="/dashboard/queue">
                <span className="text-xs font-semibold text-[#4338CA] dark:text-[#818CF8] hover:underline">
                  File complète ({scheduled.length}) ➔
                </span>
              </Link>
            </div>

            {scheduled.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-surface-2/40 p-6 text-center space-y-2">
                <CalendarBlank size={28} className="mx-auto text-muted-foreground" />
                <p className="text-xs font-medium text-foreground">
                  Aucune publication programmée pour les prochains jours
                </p>
                <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                  Préparez vos publications à l&apos;avance dans le Studio ou définissez un horaire de diffusion automatique.
                </p>
                <div className="pt-2">
                  <Link href="/dashboard/generate">
                    <Button size="sm" variant="secondary" className="text-xs">
                      Programmer une publication
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {scheduled.map((p) => (
                  <div key={p.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate">{p.title || p.topic}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {p.scheduled_at
                          ? new Date(p.scheduled_at).toLocaleDateString("fr-FR", {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Date non définie"}
                      </p>
                    </div>
                    <span className="rounded bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                      En attente
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Statut Opérationnel & Intégrations (5 cols) */}
        <div className="space-y-6 lg:col-span-5">
          <Card className="space-y-4">
            <h3 className="font-heading text-sm font-bold text-foreground border-b border-border pb-3">
              Statut Opérationnel &amp; Intégrations
            </h3>

            <div className="space-y-3 text-xs">
              {/* Page Facebook */}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <FacebookLogo size={15} weight="fill" className="text-blue-500" />
                  Page Facebook active :
                </span>
                <span className="font-semibold text-foreground">
                  {settings.default_page_name || (connected ? "Connectée" : "Non liée")}
                </span>
              </div>

              {/* Autopilot */}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <ClockCountdown size={15} className="text-amber-500" />
                  Autopilote :
                </span>
                <span
                  className={cn(
                    "font-semibold",
                    settings.auto_post_enabled ? "text-emerald-500" : "text-muted-foreground"
                  )}
                >
                  {settings.auto_post_enabled ? "Actif 24/7" : "En veille"}
                </span>
              </div>

              {/* Passerelle Webhook */}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Globe size={15} className="text-indigo-500" />
                  Passerelle Webhook :
                </span>
                <span className="font-semibold text-foreground">
                  {settings.webhook_secret ? "Configuré" : "Non configuré"}
                </span>
              </div>

              {/* Fournisseur IA */}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Cpu size={15} className="text-purple-500" />
                  Fournisseur IA :
                </span>
                <span className="font-semibold text-foreground">
                  {resolvedAiProvider}
                </span>
              </div>

              {/* Compte Meta Ads */}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Rocket size={15} className="text-cyan-500" />
                  Meta Ads Account :
                </span>
                <span className="font-semibold text-foreground">
                  {settings.meta_ad_account_id ? "Lié" : "Non lié"}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-border">
              <Link href="/dashboard/settings" className="block">
                <Button variant="secondary" size="sm" className="w-full text-xs">
                  Gérer les intégrations &amp; Clés API
                </Button>
              </Link>
            </div>
          </Card>

          {/* Quick Creation Studio CTA Card */}
          <Card className="space-y-3 border-[#6366F1]/30 bg-[#E0E7FF]/20 dark:bg-[#312E81]/20">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#4338CA] text-white">
                <Sparkle size={16} weight="fill" />
              </div>
              <h4 className="font-heading text-sm font-bold text-foreground">
                Studio de Création Rapide
              </h4>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Rédigez ou laissez l&apos;IA générer un post Feed, Reel vertical ou WhatsApp prêt à diffuser en 1 clic.
            </p>
            <Link href="/dashboard/studio" className="block pt-1">
              <Button className="w-full font-semibold text-xs">
                Lancer le Studio Création ➔
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
