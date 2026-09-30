"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Code,
  ArrowClockwise,
  CheckCircle,
  WarningCircle,
  Clock,
  Trash,
  Funnel,
  CaretDown,
  CaretUp,
  Broadcast,
  FacebookLogo,
  WhatsappLogo,
  Globe,
  Lightning,
} from "@phosphor-icons/react/dist/ssr";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import type { AutomationLog } from "@/lib/automation/logger";

const EVENT_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  webhook_received: { label: "Webhook Reçu", color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20", icon: "🌐" },
  ai_generated: { label: "Génération IA", color: "text-purple-400 bg-purple-500/10 border-purple-500/20", icon: "✨" },
  post_published: { label: "Publication Facebook", color: "text-blue-400 bg-blue-500/10 border-blue-500/20", icon: "📘" },
  whatsapp_sent: { label: "Diffusion WhatsApp", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", icon: "💬" },
  api_error: { label: "Erreur API", color: "text-destructive bg-destructive/10 border-destructive/20", icon: "⚠️" },
  test_ping: { label: "Test de Connexion", color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20", icon: "⚡" },
};

export default function AutomationLogsPage() {
  const toast = useToast();
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  async function fetchLogs() {
    setLoading(true);
    try {
      const res = await fetch("/api/logs");
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      } else {
        toast.error("Erreur", "Impossible de charger les logs d'automatisation.");
      }
    } catch {
      toast.error("Erreur", "Erreur réseau lors de la récupération des logs.");
    } finally {
      setLoading(false);
    }
  }

  const filteredLogs = logs.filter((l) => {
    if (filter === "all") return true;
    if (filter === "error") return l.status === "failed" || l.event_type === "api_error";
    return l.event_type === filter;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-bold text-indigo-400 border border-indigo-500/20">
              Journal d&apos;Audit &amp; Télémétrie
            </span>
          </div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight text-foreground">
            Logs API &amp; Automatisations
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Traçabilité intégrale en temps réel des webhooks reçus, générations IA, publications Facebook et diffusions WhatsApp.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/dashboard/automation">
            <Button size="sm" variant="outline">
              <Globe size={14} className="text-indigo-400" />
              Gérer la Connexion Webhook
            </Button>
          </Link>
          <Button size="sm" onClick={fetchLogs} disabled={loading}>
            <ArrowClockwise size={14} className={loading ? "animate-spin" : ""} />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Filter Tabs & Counters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: "all", label: "Tous les événements" },
            { id: "webhook_received", label: "Webhooks" },
            { id: "post_published", label: "Facebook" },
            { id: "whatsapp_sent", label: "WhatsApp" },
            { id: "error", label: "Erreurs uniquement" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={cn(
                "rounded-xl px-3 py-1.5 text-xs font-semibold transition cursor-pointer",
                filter === tab.id
                  ? "bg-primary text-white shadow-sm"
                  : "bg-surface text-muted-foreground hover:bg-surface-2 hover:text-foreground border border-border"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <span className="text-xs text-muted-foreground">
          Affichage de <strong className="text-foreground">{filteredLogs.length}</strong> log(s)
        </span>
      </div>

      {/* Logs Table / Stream */}
      <Card className="border-border bg-surface p-0 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-xs text-muted-foreground">
            <ArrowClockwise size={20} className="animate-spin mx-auto mb-2 text-indigo-400" />
            Chargement des logs serveur...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-xs text-muted-foreground space-y-2">
            <p className="font-semibold text-foreground">Aucun événement enregistré.</p>
            <p className="text-[11px] max-w-sm mx-auto">
              Dès qu&apos;un webhook sera envoyé depuis votre site ou qu&apos;une publication automatique sera déclenchée, les logs détaillés apparaîtront ici.
            </p>
            <div className="pt-2">
              <Link href="/dashboard/automation">
                <Button size="sm" variant="outline">
                  Tester la connexion webhook
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredLogs.map((log) => {
              const meta = EVENT_LABELS[log.event_type] || {
                label: log.event_type,
                color: "text-muted-foreground bg-surface-2 border-border",
                icon: "📄",
              };
              const isExpanded = expandedLogId === log.id;

              return (
                <div key={log.id} className="p-4 hover:bg-surface-2/40 transition">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="text-lg shrink-0 mt-0.5">{meta.icon}</span>

                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              "rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border",
                              meta.color
                            )}
                          >
                            {meta.label}
                          </span>

                          <span
                            className={cn(
                              "rounded-md px-1.5 py-0.2 text-[10px] font-bold uppercase",
                              log.status === "success"
                                ? "text-emerald-400 bg-emerald-500/10"
                                : log.status === "failed"
                                ? "text-destructive bg-destructive/10"
                                : "text-amber-400 bg-amber-500/10"
                            )}
                          >
                            {log.status === "success" ? "✓ Réussi" : log.status === "failed" ? "Échec" : "En cours"}
                          </span>

                          <span className="text-[11px] font-mono text-muted-foreground">
                            source: {log.source}
                          </span>
                        </div>

                        <p className="text-xs font-bold text-foreground truncate">
                          {log.title || "Événement sans titre"}
                        </p>

                        {log.details && (
                          <p className="text-[11px] text-muted-foreground">
                            {log.details}
                          </p>
                        )}

                        {log.error_message && (
                          <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-2.5 py-1 text-[11px] text-destructive font-mono mt-1">
                            Erreur API : {log.error_message}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                      <span className="text-[11px] font-mono text-muted-foreground flex items-center gap-1">
                        <Clock size={12} />
                        {new Date(log.created_at).toLocaleString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </span>

                      {log.payload && (
                        <button
                          type="button"
                          onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                          className="flex items-center gap-1 text-[11px] font-semibold text-indigo-400 hover:underline cursor-pointer"
                        >
                          <span>{isExpanded ? "Masquer Payload" : "Voir Payload"}</span>
                          {isExpanded ? <CaretUp size={12} /> : <CaretDown size={12} />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expandable JSON Payload Drawer */}
                  {isExpanded && log.payload && (
                    <div className="mt-3 rounded-xl border border-border bg-[#080B14] p-3 text-[11px] font-mono text-zinc-300 overflow-x-auto">
                      <div className="text-[10px] text-muted-foreground mb-1 font-bold uppercase tracking-wider">
                        Données brutes (JSON Payload) :
                      </div>
                      <pre>{JSON.stringify(log.payload, null, 2)}</pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
