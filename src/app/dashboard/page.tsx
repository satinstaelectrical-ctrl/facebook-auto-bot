import Link from "next/link";
import {
  Sparkle,
  ArrowRight,
  WarningCircle,
  Lightning,
  Globe,
  FacebookLogo,
  CheckCircle,
  ClockCountdown,
  ArrowSquareOut,
  XCircle,
  CalendarBlank,
  ArrowsClockwise,
  ShieldCheck,
  WhatsappLogo,
  ShareNetwork,
  Plus,
} from "@phosphor-icons/react/dist/ssr";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { listPosts } from "@/lib/db/posts";
import { getSettings } from "@/lib/db/settings";
import { isFacebookConnected, facebookPostUrl } from "@/lib/types";
import { getLastAutomationActivity } from "@/lib/automation/logger";
import { cn } from "@/lib/cn";
import type { Post } from "@/lib/types";

export const dynamic = "force-dynamic";

function cleanDisplayTitle(title: string): string {
  if (
    title.toLowerCase().includes("enseignez vos éléments") ||
    title.toLowerCase().includes("renseignez vos éléments")
  ) {
    return "Publication Studio";
  }
  return title;
}

function SetupNeeded({ reason }: { reason: string }) {
  return (
    <div className="mx-auto max-w-2xl py-8">
      <Card className="border-warning/40 bg-warning/5 p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-warning/15 text-warning">
            <WarningCircle size={22} weight="bold" />
          </div>
          <div className="min-w-0">
            <h2 className="font-heading font-bold text-foreground">
              Configuration de la base de données requise
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Vérifiez vos identifiants Supabase dans les paramètres ou les variables d&apos;environnement.
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
  let activity: { lastActivityAt: string | null; lastLog: any; totalReceived: number } = {
    lastActivityAt: null,
    lastLog: null,
    totalReceived: 0,
  };

  try {
    const [p, s, a] = await Promise.all([
      listPosts({ limit: 100 }),
      getSettings(),
      getLastAutomationActivity().catch(() => ({
        lastActivityAt: null,
        lastLog: null,
        totalReceived: 0,
      })),
    ]);
    posts = p;
    settings = s;
    activity = a;
  } catch (err) {
    return <SetupNeeded reason={err instanceof Error ? err.message : String(err)} />;
  }

  // Filtered post subsets
  const posted = posts.filter((p: Post) => p.status === "posted");
  const todayStr = new Date().toISOString().slice(0, 10);
  const postsToday = posted.filter((p: Post) => p.posted_at && p.posted_at.startsWith(todayStr)).length;

  const scheduled = posts
    .filter((p: Post) => p.status === "scheduled")
    .sort((a, b) => {
      const ta = a.scheduled_at ? new Date(a.scheduled_at).getTime() : 0;
      const tb = b.scheduled_at ? new Date(b.scheduled_at).getTime() : 0;
      return ta - tb;
    });

  const failed = posts.filter((p: Post) => p.status === "failed");
  const recent = posts.slice(0, 5);

  const fbConnected = isFacebookConnected(settings);
  const totalAttempted = posted.length + failed.length;
  const successRate = totalAttempted > 0 ? Math.round((posted.length / totalAttempted) * 100) : 100;

  const activeAutomationsCount =
    (settings.auto_post_enabled ? 1 : 0) +
    (settings.connected_websites?.filter((w) => w.auto_publish).length || 0) +
    (settings.whatsapp_enabled ? 1 : 0);

  const connectedChannelsCount =
    (fbConnected ? 1 : 0) +
    (settings.connected_websites?.length || 0) +
    (settings.whatsapp_enabled ? 1 : 0);

  // Issues needing attention
  const attentionItems: Array<{
    id: string;
    title: string;
    description: string;
    actionLabel: string;
    actionHref: string;
    severity: "warning" | "error" | "info";
  }> = [];

  if (!fbConnected) {
    attentionItems.push({
      id: "fb-missing",
      title: "Page Facebook déconnectée",
      description: "Connectez votre compte Meta pour activer la publication automatique et le Studio.",
      actionLabel: "Connecter Facebook",
      actionHref: "/dashboard/connections?tab=facebook",
      severity: "warning",
    });
  }

  if (failed.length > 0) {
    attentionItems.push({
      id: "failed-posts",
      title: `${failed.length} publication(s) en échec`,
      description: "Des erreurs ont été renvoyées par Meta. Consultez l'historique pour diagnostiquer et relancer.",
      actionLabel: "Examiner les erreurs",
      actionHref: "/dashboard/history",
      severity: "error",
    });
  }

  if (settings.whatsapp_enabled && !settings.whatsapp_instance_name && !settings.whatsapp_api_url) {
    attentionItems.push({
      id: "wa-incomplete",
      title: "Configuration WhatsApp incomplète",
      description: "L'option WhatsApp est activée mais vos identifiants d'instance ne sont pas encore renseignés.",
      actionLabel: "Configurer WhatsApp",
      actionHref: "/dashboard/connections?tab=whatsapp",
      severity: "warning",
    });
  }

  if (scheduled.length > 0) {
    attentionItems.push({
      id: "scheduled-queue",
      title: `${scheduled.length} publication(s) en attente dans la file`,
      description: "Des contenus sont programmés et seront diffusés aux dates prévues par le cron.",
      actionLabel: "Voir la file d'attente",
      actionHref: "/dashboard/queue",
      severity: "info",
    });
  }

  const userName = settings.facebook_user_name || "Créateur";

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* 1. Header Standardisé Linear / Stripe */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/70 pb-5">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            Bonjour {userName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Voici ce qui se passe dans votre système d&apos;automatisation Fundoral.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/dashboard/studio">
            <Button size="sm" className="gap-1.5 font-semibold text-xs shadow-sm">
              <Sparkle size={14} weight="fill" /> Nouvelle publication
            </Button>
          </Link>
          <Link href="/dashboard/automations">
            <Button variant="secondary" size="sm" className="gap-1.5 text-xs">
              <Lightning size={14} /> Gérer les flux
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Exactement 4 KPIs Principaux (Strictement scannables, aucun faux chiffre) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Publications aujourd'hui */}
        <div className="rounded-2xl border border-border/80 bg-surface p-4 space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Publications aujourd&apos;hui</span>
            <CheckCircle size={18} className="text-primary" weight="bold" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-heading text-2xl sm:text-3xl font-extrabold text-foreground">
              {postsToday}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {posted.length} au total
            </span>
          </div>
        </div>

        {/* KPI 2: Taux de réussite */}
        <div className="rounded-2xl border border-border/80 bg-surface p-4 space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Taux de réussite</span>
            <ShieldCheck size={18} className="text-emerald-500" weight="bold" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-heading text-2xl sm:text-3xl font-extrabold text-foreground">
              {successRate}%
            </span>
            <span className="text-[11px] text-muted-foreground">
              {failed.length === 0 ? "0 échec" : `${failed.length} échec(s)`}
            </span>
          </div>
        </div>

        {/* KPI 3: Automatisations actives */}
        <div className="rounded-2xl border border-border/80 bg-surface p-4 space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Automatisations actives</span>
            <Lightning size={18} className="text-indigo-500" weight="fill" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-heading text-2xl sm:text-3xl font-extrabold text-foreground">
              {activeAutomationsCount}
            </span>
            <span className="text-[11px] text-muted-foreground font-mono">
              {activeAutomationsCount > 0 ? "En veille active" : "Désactivé"}
            </span>
          </div>
        </div>

        {/* KPI 4: Canaux connectés */}
        <div className="rounded-2xl border border-border/80 bg-surface p-4 space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Canaux connectés</span>
            <ShareNetwork size={18} className="text-blue-500" weight="bold" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-heading text-2xl sm:text-3xl font-extrabold text-foreground">
              {connectedChannelsCount}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {fbConnected ? "Meta lié" : "Aucun réseau"}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Section « Needs Attention » */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Nécessite votre attention
          </h2>
          <span className="text-[11px] text-muted-foreground font-mono">
            {attentionItems.length === 0 ? "Tout est nominal" : `${attentionItems.length} élément(s)`}
          </span>
        </div>

        {attentionItems.length === 0 ? (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400">
            <div className="flex items-center gap-2.5">
              <CheckCircle size={18} weight="fill" className="text-emerald-500" />
              <span>Système stable : toutes vos intégrations fonctionnent normalement sans anomalie.</span>
            </div>
            <Link
              href="/dashboard/connections"
              className="text-[11px] font-semibold hover:underline shrink-0"
            >
              Centre de connexions ➔
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {attentionItems.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition",
                  item.severity === "error"
                    ? "border-red-500/30 bg-red-500/5 text-red-700 dark:text-red-300"
                    : item.severity === "warning"
                    ? "border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-300"
                    : "border-border/80 bg-surface text-foreground"
                )}
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  {item.severity === "error" ? (
                    <XCircle size={18} weight="fill" className="text-red-500 shrink-0 mt-0.5" />
                  ) : item.severity === "warning" ? (
                    <WarningCircle size={18} weight="fill" className="text-amber-500 shrink-0 mt-0.5" />
                  ) : (
                    <ClockCountdown size={18} weight="fill" className="text-primary shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0">
                    <strong className="block font-semibold">{item.title}</strong>
                    <p className="text-muted-foreground mt-0.5 text-[11px]">{item.description}</p>
                  </div>
                </div>

                <Link href={item.actionHref} className="shrink-0 self-start sm:self-center">
                  <Button
                    size="sm"
                    variant={item.severity === "warning" ? "default" : "secondary"}
                    className="text-xs h-8 px-3"
                  >
                    {item.actionLabel} ➔
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Deux Colonnes : Prochaines publications (Upcoming) & Activité Récente */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Colonne Gauche (7 cols) : Upcoming (Prochaines Publications) */}
        <div className="space-y-3 lg:col-span-7">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <CalendarBlank size={16} className="text-primary" />
              Prochaines publications programmées
            </h2>
            <Link
              href="/dashboard/queue"
              className="text-xs font-semibold text-primary hover:underline"
            >
              Gérer la file ({scheduled.length}) ➔
            </Link>
          </div>

          <div className="rounded-2xl border border-border/80 bg-surface divide-y divide-border/60 overflow-hidden">
            {scheduled.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground space-y-2">
                <ClockCountdown size={24} className="mx-auto text-muted-foreground/60" />
                <p>Aucune publication programmée pour le moment.</p>
                <Link href="/dashboard/studio" className="inline-block mt-1">
                  <Button size="sm" variant="secondary" className="text-xs">
                    Créer et programmer un post
                  </Button>
                </Link>
              </div>
            ) : (
              scheduled.slice(0, 4).map((post) => {
                const dateFormatted = post.scheduled_at
                  ? new Date(post.scheduled_at).toLocaleDateString("fr-FR", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "Date non définie";

                return (
                  <div key={post.id} className="p-3.5 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold">
                        <FacebookLogo size={18} weight="fill" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate">
                          {cleanDisplayTitle(post.title || post.topic)}
                        </p>
                        <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                          {dateFormatted}
                        </p>
                      </div>
                    </div>

                    <Link href={`/dashboard/queue`}>
                      <span className="text-[11px] font-semibold text-muted-foreground hover:text-foreground">
                        Modifier
                      </span>
                    </Link>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Colonne Droite (5 cols) : Recent Activity (Journal Condensé) */}
        <div className="space-y-3 lg:col-span-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <ArrowsClockwise size={16} className="text-muted-foreground" />
              Activité récente
            </h2>
            <Link
              href="/dashboard/history"
              className="text-xs font-semibold text-primary hover:underline"
            >
              Historique complet ➔
            </Link>
          </div>

          <div className="rounded-2xl border border-border/80 bg-surface divide-y divide-border/60 overflow-hidden">
            {recent.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">
                Aucune activité enregistrée.
              </div>
            ) : (
              recent.map((post) => {
                const isPosted = post.status === "posted";
                const isFailed = post.status === "failed";
                const isScheduled = post.status === "scheduled";

                const dateStr = post.posted_at || post.scheduled_at || post.created_at;
                const formattedTime = dateStr
                  ? new Date(dateStr).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "";

                return (
                  <div key={post.id} className="p-3.5 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={cn(
                          "h-2 w-2 rounded-full shrink-0",
                          isPosted
                            ? "bg-emerald-500"
                            : isFailed
                            ? "bg-red-500"
                            : isScheduled
                            ? "bg-primary"
                            : "bg-muted-foreground/40"
                        )}
                      />
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {cleanDisplayTitle(post.title || post.topic)}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          {isPosted ? "Diffusé" : isFailed ? "Échec" : isScheduled ? "Programmé" : "Brouillon"} · {formattedTime}
                        </p>
                      </div>
                    </div>

                    {isPosted && post.facebook_post_id && (
                      <a
                        href={facebookPostUrl(post.facebook_post_id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground shrink-0"
                        title="Voir sur Facebook"
                      >
                        <ArrowSquareOut size={14} />
                      </a>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
