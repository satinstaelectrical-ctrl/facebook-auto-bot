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
} from "@phosphor-icons/react/dist/ssr";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { PostsChart } from "@/components/dashboard/posts-chart";
import { listPosts } from "@/lib/db/posts";
import { getSettings } from "@/lib/db/settings";
import { isFacebookConnected } from "@/lib/types";
import { listMetaCampaigns } from "@/lib/facebook/ads";
import { cn } from "@/lib/cn";
import type { Post } from "@/lib/types";

export const dynamic = "force-dynamic";

function buildChartData(posted: { posted_at: string | null }[]) {
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

  return labels.map((l) => ({ ...l, count: counts.get(l.date) ?? 0 }));
}

function buildScheduleTimeline(scheduledPosts: Post[], postingHours: number[]) {
  const days = 7;
  const timeline: {
    date: Date;
    label: string;
    isToday: boolean;
    posts: Post[];
    autoHours: number[];
  }[] = [];

  const now = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    const dayStr = d.toISOString().slice(0, 10);

    const postsForDay = scheduledPosts.filter((p) => {
      if (!p.scheduled_at) return false;
      return p.scheduled_at.slice(0, 10) === dayStr;
    });

    timeline.push({
      date: d,
      label:
        i === 0
          ? "Aujourd'hui"
          : i === 1
          ? "Demain"
          : d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" }),
      isToday: i === 0,
      posts: postsForDay,
      autoHours: postingHours,
    });
  }
  return timeline;
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
              Base de données non configurée
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Vérifiez vos variables d&apos;environnement Supabase ou exécutez le script SQL.
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

  try {
    const [p, s, c] = await Promise.all([
      listPosts({ limit: 200 }),
      getSettings(),
      listMetaCampaigns().catch(() => []),
    ]);
    posts = p;
    settings = s;
    campaigns = c;
  } catch (err) {
    return <SetupNeeded reason={err instanceof Error ? err.message : String(err)} />;
  }

  const posted = posts.filter((p: Post) => p.status === "posted");
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const postedThisWeek = posted.filter(
    (p: Post) => p.posted_at && new Date(p.posted_at).getTime() > weekAgo
  );
  const scheduled = posts.filter((p: Post) => p.status === "scheduled");
  const failed = posts.filter((p: Post) => p.status === "failed");
  const recent = posts.slice(0, 6);
  const connected = isFacebookConnected(settings);

  const chartData = buildChartData(posted);
  const timeline = buildScheduleTimeline(scheduled, settings.posting_hours || [9, 14, 20]);
  const estimatedReach = posted.length * 1420 + campaigns.length * 3500;

  return (
    <div className="space-y-6">
      {/* Welcome Banner & Quick Action Buttons */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
        <div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight text-foreground">
            Vue d&apos;ensemble &amp; Métriques SaaS
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tableau de bord de publication automatique Facebook, gestion des flux IA et campagnes
            Meta Ads.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/dashboard/generate">
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold">
              <Sparkle size={15} weight="fill" /> Studio Création
            </Button>
          </Link>
          <Link href="/dashboard/automation">
            <Button size="sm" variant="secondary">
              <Lightning size={15} weight="fill" className="text-amber-400" /> Automation Web
            </Button>
          </Link>
          <Link href="/dashboard/ads">
            <Button size="sm" variant="secondary">
              <Rocket size={15} weight="fill" className="text-purple-400" /> Meta Ads
            </Button>
          </Link>
        </div>
      </div>

      {!connected && (
        <Card className="flex flex-col items-start justify-between gap-4 border-indigo-500/30 bg-indigo-500/5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
              <FacebookLogo size={22} weight="fill" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Connectez votre compte Facebook</p>
              <p className="text-xs text-muted-foreground">
                Liez vos Pages pour démarrer la publication en direct, les webhooks et l&apos;autopilote.
              </p>
            </div>
          </div>
          <Link href="/dashboard/settings">
            <Button size="sm">
              Connecter maintenant <ArrowRight size={14} />
            </Button>
          </Link>
        </Card>
      )}

      {/* 4 Primary KPI Stat Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Portée totale estimée"
          value={estimatedReach > 0 ? `~${estimatedReach.toLocaleString()}` : "0"}
          icon={ChartLineUp}
          tone="primary"
          trend="+18.4%"
        />
        <StatCard
          label="Publications diffusées"
          value={posted.length}
          icon={MegaphoneSimple}
          tone="success"
          trend="+12.0%"
        />
        <StatCard
          label="File d'attente (Queue)"
          value={scheduled.length}
          icon={ClockCountdown}
          tone="warning"
        />
        <StatCard
          label="Campagnes Meta Ads"
          value={campaigns.length}
          icon={Rocket}
          tone="primary"
        />
      </div>

      {/* Main Core Grid: Performance Chart & Visual Calendar */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column (8 cols): Chart + Visual Schedule Timeline */}
        <div className="space-y-6 lg:col-span-8">
          {/* Chart Card */}
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-heading text-base font-bold text-foreground">
                  Publications diffusées — 14 derniers jours
                </h2>
                <p className="text-xs text-muted-foreground">
                  Fréquence quotidienne de diffusion sur vos Pages Facebook
                </p>
              </div>
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-400">
                {postedThisWeek.length} cette semaine
              </span>
            </div>
            <PostsChart data={chartData} />
          </Card>

          {/* Visual Schedule Timeline (Calendrier des 7 prochains jours) */}
          <Card>
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h2 className="font-heading text-base font-bold text-foreground flex items-center gap-2">
                  <CalendarCheck size={18} className="text-indigo-400" />
                  Calendrier visuel des publications (7 prochains jours)
                </h2>
                <p className="text-xs text-muted-foreground">
                  Aperçu de la file d&apos;attente et des créneaux autopilote prévus
                </p>
              </div>
              <Link href="/dashboard/queue" className="text-xs font-medium text-indigo-400 hover:underline">
                Gérer la file ↗
              </Link>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-7 overflow-x-auto pb-2">
              {timeline.map((day, idx) => (
                <div
                  key={idx}
                  className={`rounded-2xl border p-3 flex flex-col justify-between min-w-[110px] transition ${
                    day.isToday
                      ? "border-indigo-500/50 bg-indigo-500/10 ring-1 ring-indigo-500/30"
                      : "border-white/[0.06] bg-surface-2/40"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">{day.label}</span>
                      {day.isToday && (
                        <span className="h-2 w-2 rounded-full bg-indigo-400 animate-ping" />
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground block mt-0.5">
                      {day.date.toLocaleDateString("fr-FR", { day: "numeric", month: "numeric" })}
                    </span>

                    {/* Posts for this day */}
                    <div className="mt-2.5 space-y-1.5">
                      {day.posts.length > 0 ? (
                        day.posts.map((p) => (
                          <div
                            key={p.id}
                            className="rounded-lg bg-surface border border-white/[0.08] p-1.5 shadow-sm"
                            title={p.title}
                          >
                            <p className="truncate text-[10px] font-semibold text-foreground">
                              {p.title}
                            </p>
                            <span className="text-[9px] text-indigo-400 font-bold block">
                              {p.scheduled_at
                                ? new Date(p.scheduled_at).toLocaleTimeString("fr-FR", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "Prévu"}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-lg border border-dashed border-white/[0.06] p-2 text-center">
                          <span className="text-[10px] text-muted-foreground block">
                            {settings.auto_post_enabled ? "Créneaux auto" : "Libre"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-white/[0.05] text-[10px] text-muted-foreground text-center">
                    {day.posts.length} post(s)
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column (4 cols): SaaS Status & Quick Generator */}
        <div className="space-y-6 lg:col-span-4">
          {/* SaaS Operational Status Widget */}
          <Card>
            <h3 className="font-heading text-sm font-bold text-foreground pb-2 border-b border-border">
              État opérationnel du SaaS
            </h3>

            <div className="mt-3 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <FacebookLogo size={14} className="text-blue-400" /> Page connectée
                </span>
                <span className="font-semibold text-foreground truncate max-w-[140px]">
                  {settings.default_page_name ?? "Aucune"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Cpu size={14} className="text-purple-400" /> Fournisseur IA
                </span>
                <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-bold text-purple-400 uppercase">
                  {settings.preferred_ai_provider ?? "Gratuit"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Lightning size={14} className="text-amber-400" /> Autopilote
                </span>
                <span
                  className={cn(
                    "font-bold",
                    settings.auto_post_enabled ? "text-emerald-400" : "text-muted-foreground"
                  )}
                >
                  {settings.auto_post_enabled
                    ? `Actif · ${settings.posts_per_day}/jour`
                    : "En pause"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Globe size={14} className="text-indigo-400" /> Passerelle Webhook
                </span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle size={12} weight="bold" /> En écoute
                </span>
              </div>
            </div>
          </Card>

          {/* Quick Generate Action Card */}
          <Card className="flex flex-col justify-between">
            <div>
              <h2 className="font-heading text-base font-bold text-foreground">Studio de création rapide</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Générez un post prêt à publier avec texte percutant, hashtags et image en 1 clic.
              </p>
            </div>

            <Link href="/dashboard/generate" className="mt-5">
              <Button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold">
                <Sparkle size={16} weight="fill" /> Créer un post maintenant
              </Button>
            </Link>
          </Card>
        </div>
      </div>

      {/* Recent Activity Table */}
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-base font-bold text-foreground">
            Dernières publications créées
          </h2>
          <Link href="/dashboard/history" className="text-xs font-semibold text-indigo-400 hover:underline">
            Voir tout l&apos;historique ↗
          </Link>
        </div>

        {recent.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Aucun post pour l&apos;instant — générez votre première publication pour la voir ici.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="pb-2 font-medium">Aperçu</th>
                  <th className="pb-2 font-medium">Titre</th>
                  <th className="hidden pb-2 font-medium sm:table-cell">Page cible</th>
                  <th className="pb-2 font-medium">Statut</th>
                  <th className="pb-2 font-medium text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recent.map((post: Post) => (
                  <tr key={post.id} className="hover:bg-surface-2/40 transition">
                    <td className="w-10 py-2.5 pr-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={post.image_url}
                        alt=""
                        className="h-10 w-10 rounded-xl object-cover border border-white/[0.08]"
                      />
                    </td>
                    <td className="max-w-[260px] truncate py-2.5 pr-3 font-semibold text-foreground">
                      {post.title}
                    </td>
                    <td className="hidden py-2.5 pr-3 text-muted-foreground sm:table-cell">
                      {post.page_name ?? "—"}
                    </td>
                    <td className="py-2.5 pr-3">
                      <StatusBadge status={post.status} />
                    </td>
                    <td className="py-2.5 text-right text-muted-foreground">
                      {new Date(post.created_at).toLocaleDateString("fr-FR", {
                        month: "short",
                        day: "numeric",
                      })}
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
