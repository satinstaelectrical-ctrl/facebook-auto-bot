"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Lightning,
  Sparkle,
  FacebookLogo,
  WhatsappLogo,
  CheckCircle,
  Plus,
  Trash,
  Clock,
  ArrowsClockwise,
  WarningCircle,
  ArrowDown,
  DotsSixVertical,
  Play,
  Cpu,
  Storefront,
  Globe,
  Sliders,
  Check,
} from "@phosphor-icons/react/dist/ssr";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import type { ConnectedWebsite } from "@/lib/types";

interface AutomationBlock {
  id: string;
  type: "trigger" | "ai_action" | "action";
  title: string;
  description: string;
  source: string;
  status: "active" | "waiting" | "error" | "inactive";
  lastExecution: string | null;
  error: string | null;
  icon: string;
}

export default function AutomationBuilderPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);

  // Real backend settings
  const [facebookConnected, setFacebookConnected] = useState(false);
  const [defaultPageName, setDefaultPageName] = useState<string | null>(null);
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [aiConfigured, setAiConfigured] = useState(false);
  const [connectedSites, setConnectedSites] = useState<ConnectedWebsite[]>([]);

  // Real activity data
  const [lastActivityAt, setLastActivityAt] = useState<string | null>(null);
  const [totalExecutions, setTotalExecutions] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);

  // Workflow builder blocks
  const [blocks, setBlocks] = useState<AutomationBlock[]>([]);
  const [draggedBlockIdx, setDraggedBlockIdx] = useState<number | null>(null);

  useEffect(() => {
    loadRealWorkflowData();
  }, []);

  async function loadRealWorkflowData() {
    setLoading(true);
    try {
      // 1. Fetch settings
      const settingsRes = await fetch("/api/settings");
      let fbConn = false;
      let fbPage: string | null = null;
      let waConn = false;
      let aiReady = false;
      let sites: ConnectedWebsite[] = [];

      if (settingsRes.ok) {
        const s = await settingsRes.json();
        fbConn = Boolean(s.facebook_connected);
        fbPage = s.default_page_name || s.facebook_user_name || null;
        waConn = Boolean(s.whatsapp_enabled);
        aiReady = Boolean(s.openai_configured || s.anthropic_configured || s.gemini_configured || s.preferred_ai_provider === "free");
        sites = s.connected_websites || [];

        setFacebookConnected(fbConn);
        setDefaultPageName(fbPage);
        setWhatsappEnabled(waConn);
        setAiConfigured(aiReady);
        setConnectedSites(sites);
      }

      // 2. Fetch real logs and activity
      const [actRes, logsRes] = await Promise.all([
        fetch("/api/automation/activity"),
        fetch("/api/logs"),
      ]);

      let lastAct: string | null = null;
      let totExec = 0;
      let detectedError: string | null = null;

      if (actRes.ok) {
        const actData = await actRes.json();
        lastAct = actData.lastActivityAt;
        totExec = actData.totalReceived || 0;
      }

      if (logsRes.ok) {
        const logsData = await logsRes.json();
        const logs = logsData.logs || [];
        const errLog = logs.find((l: any) => l.status === "failed" && l.error_message);
        if (errLog) detectedError = errLog.error_message;
      }

      setLastActivityAt(lastAct);
      setTotalExecutions(totExec);
      setLastError(detectedError);

      // Build real initial blocks based on actual DB configurations
      const primarySite = sites[0];
      const initialBlocks: AutomationBlock[] = [
        {
          id: "block-trigger-1",
          type: "trigger",
          title: primarySite ? `Nouveau contenu sur ${primarySite.name}` : "Nouveau produit ou article web",
          description: primarySite
            ? `Surveillance du flux ${primarySite.url}`
            : "En écoute des requêtes webhook ou flux RSS",
          source: primarySite ? primarySite.platform : "Webhook / RSS",
          status: sites.length > 0 || totExec > 0 ? "active" : "waiting",
          lastExecution: lastAct,
          error: null,
          icon: "⚡",
        },
        {
          id: "block-ai-1",
          type: "ai_action",
          title: "Générer la description & copywriting IA",
          description: "L'IA analyse le contenu, crée une accroche percutante et sélectionne les meilleurs hashtags.",
          source: "Moteur IA Marketing",
          status: aiReady ? "active" : "waiting",
          lastExecution: lastAct,
          error: null,
          icon: "✨",
        },
        {
          id: "block-action-fb",
          type: "action",
          title: "Publier sur Facebook",
          description: fbConn
            ? `Diffusion automatique sur la Page ${fbPage || "sélectionnée"}`
            : "Compte Facebook non connecté",
          source: "Meta Graph API",
          status: fbConn ? "active" : "inactive",
          lastExecution: lastAct,
          error: detectedError && detectedError.includes("Facebook") ? detectedError : null,
          icon: "📘",
        },
        {
          id: "block-action-wa",
          type: "action",
          title: "Envoyer alerte sur WhatsApp",
          description: waConn
            ? "Diffusion instantanée aux groupes et canaux clients VIP"
            : "Passerelle WhatsApp non activée",
          source: "WhatsApp Gateway",
          status: waConn ? "active" : "inactive",
          lastExecution: lastAct,
          error: detectedError && detectedError.includes("WhatsApp") ? detectedError : null,
          icon: "💬",
        },
      ];

      setBlocks(initialBlocks);
    } catch (err) {
      console.error("Erreur de chargement du constructeur d'automatisation:", err);
    } finally {
      setLoading(false);
    }
  }

  // Drag and Drop handlers
  function handleDragStart(idx: number) {
    setDraggedBlockIdx(idx);
  }

  function handleDragOver(e: React.DragEvent, targetIdx: number) {
    e.preventDefault();
    if (draggedBlockIdx === null || draggedBlockIdx === targetIdx) return;
    const next = [...blocks];
    const item = next.splice(draggedBlockIdx, 1)[0];
    next.splice(targetIdx, 0, item);
    setDraggedBlockIdx(targetIdx);
    setBlocks(next);
  }

  function handleDragEnd() {
    setDraggedBlockIdx(null);
  }

  function handleAddActionBlock(type: "fb" | "wa" | "ai") {
    const newBlock: AutomationBlock = {
      id: `block-custom-${Date.now()}`,
      type: type === "ai" ? "ai_action" : "action",
      title:
        type === "ai"
          ? "Action IA : Traduction ou résumé personnalisé"
          : type === "fb"
          ? "Action : Publication Page Facebook additionnelle"
          : "Action : Notification WhatsApp membre",
      description: "Étape ajoutée dans le pipeline d'automatisation",
      source: type === "ai" ? "Assistant IA" : type === "fb" ? "Meta API" : "WhatsApp",
      status: "active",
      lastExecution: null,
      error: null,
      icon: type === "ai" ? "🤖" : type === "fb" ? "📘" : "💬",
    };
    setBlocks([...blocks, newBlock]);
    toast.success("Bloc ajouté", "Vous pouvez le réorganiser par glisser-déposer.");
  }

  function handleDeleteBlock(id: string) {
    if (blocks.length <= 1) {
      toast.error("Impossible", "Votre pipeline doit comporter au moins un bloc.");
      return;
    }
    setBlocks(blocks.filter((b) => b.id !== id));
    toast.success("Bloc retiré du pipeline");
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-bold text-indigo-400 border border-indigo-500/20">
              Automation Builder
            </span>
          </div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight text-foreground">
            Constructeur Visuel de Workflows
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Configurez et ordonnez vos déclencheurs et actions d&apos;automatisation par glisser-déposer.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/dashboard/automation">
            <Button size="sm" variant="outline">
              <Globe size={14} className="text-indigo-400" />
              Connecter un Site
            </Button>
          </Link>
          <Button size="sm" onClick={loadRealWorkflowData} disabled={loading}>
            <ArrowsClockwise size={14} className={loading ? "animate-spin" : ""} />
            Actualiser les états
          </Button>
        </div>
      </div>

      {/* Real Execution KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border-border bg-surface">
          <span className="text-[11px] font-semibold text-muted-foreground block">
            Événements Exécutés
          </span>
          <span className="font-heading text-xl font-extrabold text-foreground mt-1 block">
            {totalExecutions}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {totalExecutions === 0 ? "Aucun événement reçu à ce jour" : "Événements traités par l'IA"}
          </span>
        </Card>

        <Card className="p-4 border-border bg-surface">
          <span className="text-[11px] font-semibold text-muted-foreground block">
            Dernière Exécution
          </span>
          <span className="font-heading text-sm font-bold text-foreground mt-1 block">
            {lastActivityAt
              ? new Date(lastActivityAt).toLocaleString("fr-FR", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "Jamais"}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {lastActivityAt ? "Horodatage vérifié serveur" : "En attente du premier flux"}
          </span>
        </Card>

        <Card className="p-4 border-border bg-surface">
          <span className="text-[11px] font-semibold text-muted-foreground block">
            État du Pipeline
          </span>
          <span className="font-heading text-sm font-bold flex items-center gap-1.5 mt-1">
            {lastError ? (
              <span className="text-destructive flex items-center gap-1">
                <WarningCircle size={15} weight="fill" /> Attention requise
              </span>
            ) : totalExecutions > 0 ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle size={15} weight="fill" /> Opérationnel
              </span>
            ) : (
              <span className="text-zinc-400 flex items-center gap-1">
                ⚪ En attente de configuration
              </span>
            )}
          </span>
          <span className="text-[10px] text-muted-foreground truncate block max-w-xs">
            {lastError || "Aucune anomalie détectée"}
          </span>
        </Card>
      </div>

      {/* Visual Workflow Canvas */}
      <Card className="border-border bg-surface p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div>
            <h2 className="font-heading text-base font-bold text-foreground flex items-center gap-2">
              <Lightning size={18} weight="fill" className="text-amber-400" />
              Pipeline d&apos;Automatisation Actif
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Glissez et déposez les cartes pour réorganiser l&apos;ordre d&apos;exécution.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAddActionBlock("fb")}
              className="text-xs"
            >
              <Plus size={13} /> Action FB
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAddActionBlock("wa")}
              className="text-xs"
            >
              <Plus size={13} /> Action WhatsApp
            </Button>
          </div>
        </div>

        {/* Blocks Column */}
        <div className="mt-6 space-y-4 max-w-2xl mx-auto">
          {blocks.map((block, idx) => (
            <React.Fragment key={block.id}>
              {/* Connector line between blocks */}
              {idx > 0 && (
                <div className="flex items-center justify-center -my-1">
                  <div className="flex flex-col items-center">
                    <div className="h-4 w-0.5 bg-border" />
                    <ArrowDown size={14} className="text-indigo-400 -my-0.5" />
                    <div className="h-4 w-0.5 bg-border" />
                  </div>
                </div>
              )}

              {/* Block Card */}
              <div
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDragEnd={handleDragEnd}
                className={cn(
                  "relative rounded-2xl border p-4.5 bg-surface-2/40 shadow-sm transition group cursor-grab active:cursor-grabbing",
                  draggedBlockIdx === idx
                    ? "opacity-40 border-dashed border-indigo-500 scale-98"
                    : "hover:border-indigo-500/50 hover:bg-surface-2",
                  block.status === "active"
                    ? "border-emerald-500/30"
                    : block.status === "error"
                    ? "border-destructive/40"
                    : "border-border"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 text-muted-foreground/60 group-hover:text-foreground transition cursor-grab">
                      <DotsSixVertical size={18} weight="bold" />
                    </div>

                    <div className="text-xl shrink-0 mt-0.5">{block.icon}</div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-surface px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-muted-foreground border border-border">
                          {block.type === "trigger"
                            ? "TRIGGER"
                            : block.type === "ai_action"
                            ? "ACTION IA"
                            : "ACTION"}
                        </span>
                        <h3 className="font-heading text-xs font-bold text-foreground">
                          {block.title}
                        </h3>
                      </div>

                      <p className="text-xs text-muted-foreground">
                        {block.description}
                      </p>

                      {/* Real Block Metrics Strip */}
                      <div className="pt-2 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground border-t border-border/40 mt-2">
                        <span className="flex items-center gap-1">
                          Statut :{" "}
                          <strong
                            className={cn(
                              "font-semibold",
                              block.status === "active"
                                ? "text-emerald-400"
                                : block.status === "error"
                                ? "text-destructive"
                                : block.status === "waiting"
                                ? "text-amber-400"
                                : "text-muted-foreground"
                            )}
                          >
                            {block.status === "active"
                              ? "Actif ✓"
                              : block.status === "error"
                              ? "Erreur"
                              : block.status === "waiting"
                              ? "En attente"
                              : "Non configuré"}
                          </strong>
                        </span>

                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          Dernière exécution :{" "}
                          <strong className="text-foreground font-semibold">
                            {block.lastExecution
                              ? new Date(block.lastExecution).toLocaleTimeString("fr-FR", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "Jamais"}
                          </strong>
                        </span>

                        <span className="flex items-center gap-1">
                          Erreur :{" "}
                          <strong
                            className={cn(
                              "font-semibold",
                              block.error ? "text-destructive truncate max-w-xs" : "text-zinc-400"
                            )}
                          >
                            {block.error || "Aucune"}
                          </strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Block Actions */}
                  {blocks.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleDeleteBlock(block.id)}
                      className="p-1.5 text-muted-foreground/60 hover:text-destructive transition rounded-lg"
                      title="Supprimer ce bloc"
                    >
                      <Trash size={14} />
                    </button>
                  )}
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
      </Card>
    </div>
  );
}
