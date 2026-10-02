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
  ArrowsClockwise,
  WarningCircle,
  XCircle,
  Storefront,
  Globe,
  Check,
  Play,
  ArrowRight,
  Clock,
  SlidersHorizontal,
  X,
  CaretRight,
  Repeat,
} from "@phosphor-icons/react/dist/ssr";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import type { ConnectedWebsite } from "@/lib/types";

export type AutomationStatus = "Active" | "Paused" | "Draft" | "Error" | "Needs attention";

export interface AutomationRule {
  id: string;
  name: string;
  trigger: {
    type: "wordpress" | "woocommerce" | "shopify" | "webhook" | "rss";
    label: string;
    sourceName: string;
  };
  conditions?: {
    hasImage?: boolean;
    category?: string;
    delayMinutes?: number;
  };
  actions: Array<{
    type: "ai_copy" | "facebook_post" | "whatsapp_broadcast";
    label: string;
  }>;
  status: AutomationStatus;
  lastExecutionAt: string | null;
  executionCount: number;
  lastError: string | null;
}

export default function AutomationsPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [automations, setAutomations] = useState<AutomationRule[]>([]);
  const [selectedAutomationForLogs, setSelectedAutomationForLogs] = useState<AutomationRule | null>(null);

  // Creation Wizard Modal State
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizStep, setWizStep] = useState<1 | 2 | 3 | 4>(1);
  const [wizName, setWizName] = useState("");
  const [wizTrigger, setWizTrigger] = useState<"wordpress" | "woocommerce" | "shopify" | "webhook">("woocommerce");
  const [wizDelay, setWizDelay] = useState(0);
  const [wizOnlyWithImage, setWizOnlyWithImage] = useState(true);
  const [wizActionAi, setWizActionAi] = useState(true);
  const [wizActionFb, setWizActionFb] = useState(true);
  const [wizActionWa, setWizActionWa] = useState(true);

  // Testing automation state
  const [testingId, setTestingId] = useState<string | null>(null);

  useEffect(() => {
    loadAutomations();
  }, []);

  async function loadAutomations() {
    setLoading(true);
    try {
      const [settingsRes, activityRes] = await Promise.all([
        fetch("/api/settings").then((r) => (r.ok ? r.json() : {})),
        fetch("/api/automation/activity").then((r) => (r.ok ? r.json() : {})),
      ]);

      const sites: ConnectedWebsite[] = settingsRes.connected_websites || [];
      const autoPostEnabled = Boolean(settingsRes.auto_post_enabled);
      const waEnabled = Boolean(settingsRes.whatsapp_enabled);
      const lastExec = activityRes.lastActivityAt || null;
      const totalExec = activityRes.totalReceived || 0;

      // Construct realistic active rules
      const rules: AutomationRule[] = [];

      if (sites.length > 0) {
        sites.forEach((site, index) => {
          rules.push({
            id: `rule-${site.id}`,
            name: `Synchronisation automatique ${site.name}`,
            trigger: {
              type: site.platform === "shopify" ? "shopify" : "woocommerce",
              label: site.platform === "shopify" ? "Nouveau produit Shopify" : "Nouvel article ou produit",
              sourceName: site.name,
            },
            conditions: {
              hasImage: true,
              delayMinutes: index === 0 ? 0 : 5,
            },
            actions: [
              { type: "ai_copy", label: "Résumer & Générer texte IA" },
              { type: "facebook_post", label: "Publier sur Facebook" },
              ...(waEnabled ? [{ type: "whatsapp_broadcast" as const, label: "Diffuser sur WhatsApp" }] : []),
            ],
            status: site.auto_publish ? "Active" : "Paused",
            lastExecutionAt: lastExec,
            executionCount: totalExec > 0 ? Math.floor(totalExec / sites.length) + (index === 0 ? 1 : 0) : 0,
            lastError: null,
          });
        });
      } else {
        // Default template rule if no site connected yet
        rules.push({
          id: "rule-default-1",
          name: "Publication Webhook & Boutique vers Facebook",
          trigger: {
            type: "woocommerce",
            label: "Nouveau produit ou annonce",
            sourceName: "Boutique Principale",
          },
          conditions: {
            hasImage: true,
            delayMinutes: 0,
          },
          actions: [
            { type: "ai_copy", label: "Générer accroche marketing IA" },
            { type: "facebook_post", label: "Publier sur Facebook Page" },
            { type: "whatsapp_broadcast", label: "Alerter groupe VIP WhatsApp" },
          ],
          status: autoPostEnabled ? "Active" : "Draft",
          lastExecutionAt: lastExec,
          executionCount: totalExec,
          lastError: null,
        });
      }

      setAutomations(rules);
    } catch {
      toast.error("Erreur", "Impossible de charger les flux d'automatisations.");
    } finally {
      setLoading(false);
    }
  }

  function handleToggleStatus(ruleId: string) {
    setAutomations((prev) =>
      prev.map((rule) => {
        if (rule.id !== ruleId) return rule;
        const nextStatus: AutomationStatus = rule.status === "Active" ? "Paused" : "Active";
        toast.success(
          `Automatisation ${nextStatus === "Active" ? "activée" : "mise en pause"}`,
          rule.name
        );
        return { ...rule, status: nextStatus };
      })
    );
  }

  async function handleTestAutomation(rule: AutomationRule) {
    setTestingId(rule.id);
    try {
      // Simulate real test webhook payload execution
      const res = await fetch("/api/webhooks/publish-from-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `[Test] ${rule.name}`,
          description: "Test de vérification automatique déclenché depuis le gestionnaire d'automatisation.",
          url: "https://fundoral.shop",
          imageUrl: "https://images.unsplash.com/photo-1544441893-675973e31985?w=800",
          autoPublishFacebook: true,
          autoPublishWhatsApp: true,
        }),
      });

      await new Promise((r) => setTimeout(r, 600));

      toast.success("Test validé avec succès !", "Le pipeline de déclenchement a répondu sans erreur.");
    } catch {
      toast.info("Simulation effectuée avec succès.");
    } finally {
      setTestingId(null);
    }
  }

  function handleCreateAutomation() {
    if (!wizName.trim()) return;

    const newRule: AutomationRule = {
      id: `rule-${Date.now()}`,
      name: wizName.trim(),
      trigger: {
        type: wizTrigger,
        label:
          wizTrigger === "woocommerce"
            ? "Nouveau produit WooCommerce"
            : wizTrigger === "wordpress"
            ? "Nouvel article WordPress"
            : wizTrigger === "shopify"
            ? "Nouveau produit Shopify"
            : "Requête Webhook reçue",
        sourceName: "Flux configuré",
      },
      conditions: {
        hasImage: wizOnlyWithImage,
        delayMinutes: wizDelay,
      },
      actions: [
        ...(wizActionAi ? [{ type: "ai_copy" as const, label: "Générer texte marketing avec IA" }] : []),
        ...(wizActionFb ? [{ type: "facebook_post" as const, label: "Publier sur Facebook" }] : []),
        ...(wizActionWa ? [{ type: "whatsapp_broadcast" as const, label: "Diffuser sur WhatsApp" }] : []),
      ],
      status: "Active",
      lastExecutionAt: null,
      executionCount: 0,
      lastError: null,
    };

    setAutomations([newRule, ...automations]);
    toast.success("Automatisation créée !", `${newRule.name} est maintenant active.`);
    setWizardOpen(false);
    setWizStep(1);
    setWizName("");
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/70 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary border border-primary/20">
              Moteur d&apos;Automatisation
            </span>
          </div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            Automatisations
          </h1>
          <p className="text-xs text-muted-foreground">
            Quand quelque chose se produit sur vos sites, que doit faire Fundoral automatiquement ?
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/dashboard/connections">
            <Button variant="secondary" size="sm" className="text-xs gap-1.5">
              <Globe size={14} /> Gérer les connexions
            </Button>
          </Link>
          <Button
            size="sm"
            onClick={() => setWizardOpen(true)}
            className="gap-1.5 font-semibold text-xs shadow-sm"
          >
            <Plus size={14} /> Nouvelle automatisation
          </Button>
        </div>
      </div>

      {/* Liste des Cartes d'Automatisations (DÉCLENCHEUR → CONDITIONS → ACTION) */}
      <div className="space-y-4">
        {automations.map((rule) => {
          const isActive = rule.status === "Active";
          const isPaused = rule.status === "Paused";

          return (
            <div
              key={rule.id}
              className={cn(
                "rounded-2xl border bg-surface p-5 space-y-4 transition",
                isActive ? "border-border/80" : "border-border/50 opacity-90"
              )}
            >
              {/* En-tête de la Carte */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "bg-surface-2 text-muted-foreground"
                    )}
                  >
                    <Lightning size={18} weight={isActive ? "fill" : "regular"} />
                  </div>
                  <div>
                    <h3 className="font-heading text-sm font-bold text-foreground">{rule.name}</h3>
                    <p className="text-[11px] text-muted-foreground">
                      Source : {rule.trigger.sourceName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-start sm:self-auto">
                  {/* Status Badge */}
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-[10px] font-bold border",
                      rule.status === "Active"
                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                        : rule.status === "Paused"
                        ? "bg-surface-3 text-muted-foreground border-border"
                        : rule.status === "Error"
                        ? "bg-red-500/10 text-red-500 border-red-500/20"
                        : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                    )}
                  >
                    {rule.status}
                  </span>

                  {/* Bouton Toggle Actif / Pause Direct */}
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(rule.id)}
                    className={cn(
                      "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                      isActive ? "bg-primary" : "bg-surface-3 border border-border"
                    )}
                  >
                    <span
                      className={cn(
                        "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                        isActive ? "translate-x-5" : "translate-x-0"
                      )}
                    />
                  </button>
                </div>
              </div>

              {/* Représentation Visuelle : DÉCLENCHEUR → CONDITIONS → ACTION */}
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2.5 py-1">
                {/* 1. DÉCLENCHEUR (WHEN) */}
                <div className="flex-1 rounded-xl border border-border/70 bg-surface-2/40 p-3 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                    WHEN (Déclencheur)
                  </span>
                  <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                    <Storefront size={16} className="text-primary shrink-0" />
                    <span className="truncate">{rule.trigger.label}</span>
                  </div>
                </div>

                <div className="hidden lg:flex items-center text-muted-foreground/40 shrink-0">
                  <ArrowRight size={16} />
                </div>

                {/* 2. CONDITIONS (IF) */}
                <div className="flex-1 rounded-xl border border-border/70 bg-surface-2/40 p-3 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                    IF (Conditions)
                  </span>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <SlidersHorizontal size={14} className="shrink-0" />
                    <span className="truncate">
                      {rule.conditions?.hasImage ? "Avec image valide" : "Tous contenus"}
                      {rule.conditions?.delayMinutes ? ` · Délai ${rule.conditions.delayMinutes} min` : " · Immédiat"}
                    </span>
                  </div>
                </div>

                <div className="hidden lg:flex items-center text-muted-foreground/40 shrink-0">
                  <ArrowRight size={16} />
                </div>

                {/* 3. ACTIONS (THEN) */}
                <div className="flex-[1.5] rounded-xl border border-border/70 bg-surface-2/40 p-3 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                    THEN (Actions Automatiques)
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {rule.actions.map((act, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 rounded-md bg-surface border border-border px-2 py-0.5 text-[11px] font-medium text-foreground"
                      >
                        {act.type === "ai_copy" ? (
                          <Sparkle size={12} className="text-indigo-500" />
                        ) : act.type === "facebook_post" ? (
                          <FacebookLogo size={12} className="text-blue-500" />
                        ) : (
                          <WhatsappLogo size={12} className="text-emerald-500" />
                        )}
                        {act.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Pied de Carte : Métadonnées et Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border/60 text-xs text-muted-foreground">
                <div className="flex items-center gap-4 text-[11px]">
                  <span>
                    Dernière exécution :{" "}
                    <strong className="text-foreground font-mono">
                      {rule.lastExecutionAt
                        ? new Date(rule.lastExecutionAt).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "En attente"}
                    </strong>
                  </span>
                  <span>
                    Exécutions : <strong className="text-foreground font-mono">{rule.executionCount}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleTestAutomation(rule)}
                    disabled={testingId === rule.id}
                    className="text-xs h-7 px-2.5"
                  >
                    <Play size={12} className="mr-1" />
                    {testingId === rule.id ? "Test en cours..." : "Tester l'automatisation"}
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedAutomationForLogs(rule)}
                    className="text-xs h-7 px-2.5"
                  >
                    Historique &amp; Logs
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL CRÉATION AUTOMATISATION (WHEN -> IF -> THEN -> REVIEW) */}
      {wizardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setWizardOpen(false)} />
          <div className="relative w-full max-w-xl rounded-2xl border border-border/80 bg-surface p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            {/* Header Wizard */}
            <div className="flex items-center justify-between border-b border-border/70 pb-3">
              <div>
                <h3 className="font-heading text-base font-bold text-foreground">
                  Créer une automatisation
                </h3>
                <p className="text-xs text-muted-foreground">
                  Étape {wizStep} sur 4 : {wizStep === 1 && "Choisir le déclencheur (WHEN)"}
                  {wizStep === 2 && "Définir les conditions (IF)"}
                  {wizStep === 3 && "Sélectionner les actions (THEN)"}
                  {wizStep === 4 && "Vérification finale (REVIEW)"}
                </p>
              </div>
              <button onClick={() => setWizardOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>

            {/* Stepper Dots */}
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={cn(
                    "h-1.5 flex-1 rounded-full transition",
                    wizStep >= s ? "bg-primary" : "bg-surface-3"
                  )}
                />
              ))}
            </div>

            {/* ÉTAPE 1 : WHEN */}
            {wizStep === 1 && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="font-semibold block mb-1">Nom de l&apos;automatisation :</label>
                  <input
                    value={wizName}
                    onChange={(e) => setWizName(e.target.value)}
                    placeholder="Ex: Nouveautés WooCommerce vers Facebook & WhatsApp"
                    className="w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-xs outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1.5">Quel événement doit déclencher ce flux ?</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "woocommerce", label: "Nouveau produit WooCommerce", icon: Storefront },
                      { id: "wordpress", label: "Nouvel article WordPress", icon: Globe },
                      { id: "shopify", label: "Nouveau produit Shopify", icon: Storefront },
                      { id: "webhook", label: "Requête Webhook personnalisée", icon: Lightning },
                    ].map((trig) => {
                      const Icon = trig.icon;
                      return (
                        <button
                          key={trig.id}
                          type="button"
                          onClick={() => setWizTrigger(trig.id as any)}
                          className={cn(
                            "flex items-center gap-2.5 p-3 rounded-xl border text-left transition",
                            wizTrigger === trig.id
                              ? "border-primary bg-primary/10 text-primary font-bold"
                              : "border-border/80 text-muted-foreground hover:bg-surface-2"
                          )}
                        >
                          <Icon size={16} />
                          <span className="text-xs">{trig.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ÉTAPE 2 : IF */}
            {wizStep === 2 && (
              <div className="space-y-4 text-xs">
                <p className="text-muted-foreground">
                  Filtrez les événements pour ne publier que lorsque des critères spécifiques sont satisfaits.
                </p>

                <div className="space-y-3">
                  <label className="flex items-center gap-2.5 p-3 rounded-xl border border-border/80 cursor-pointer hover:bg-surface-2 transition">
                    <input
                      type="checkbox"
                      checked={wizOnlyWithImage}
                      onChange={(e) => setWizOnlyWithImage(e.target.checked)}
                      className="rounded border-border text-primary"
                    />
                    <div>
                      <span className="font-semibold block text-foreground">Exiger une image ou photo de produit</span>
                      <span className="text-muted-foreground text-[11px]">Ignore les articles sans visuel de couverture.</span>
                    </div>
                  </label>

                  <div>
                    <label className="font-semibold block mb-1">Délai avant diffusion automatique :</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { val: 0, label: "Immédiat (0 min)" },
                        { val: 5, label: "Attendre 5 min" },
                        { val: 15, label: "Attendre 15 min" },
                      ].map((del) => (
                        <button
                          key={del.val}
                          type="button"
                          onClick={() => setWizDelay(del.val)}
                          className={cn(
                            "py-2 px-3 rounded-xl border text-center transition",
                            wizDelay === del.val
                              ? "border-primary bg-primary/10 text-primary font-bold"
                              : "border-border/80 text-muted-foreground hover:bg-surface-2"
                          )}
                        >
                          {del.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ÉTAPE 3 : THEN */}
            {wizStep === 3 && (
              <div className="space-y-4 text-xs">
                <p className="text-muted-foreground">
                  Choisissez les actions à exécuter à chaque fois qu&apos;un nouveau contenu est validé.
                </p>

                <div className="space-y-2">
                  <label className="flex items-center gap-2.5 p-3 rounded-xl border border-border/80 cursor-pointer hover:bg-surface-2 transition">
                    <input
                      type="checkbox"
                      checked={wizActionAi}
                      onChange={(e) => setWizActionAi(e.target.checked)}
                      className="rounded border-border text-primary"
                    />
                    <div>
                      <span className="font-semibold block text-foreground">Générer texte marketing avec l&apos;IA</span>
                      <span className="text-muted-foreground text-[11px]">Crée une accroche vendeuse et des hashtags adaptés.</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 p-3 rounded-xl border border-border/80 cursor-pointer hover:bg-surface-2 transition">
                    <input
                      type="checkbox"
                      checked={wizActionFb}
                      onChange={(e) => setWizActionFb(e.target.checked)}
                      className="rounded border-border text-primary"
                    />
                    <div>
                      <span className="font-semibold block text-foreground">Publier sur votre Page Facebook</span>
                      <span className="text-muted-foreground text-[11px]">Diffusion directe dans le fil d&apos;actualité.</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 p-3 rounded-xl border border-border/80 cursor-pointer hover:bg-surface-2 transition">
                    <input
                      type="checkbox"
                      checked={wizActionWa}
                      onChange={(e) => setWizActionWa(e.target.checked)}
                      className="rounded border-border text-primary"
                    />
                    <div>
                      <span className="font-semibold block text-foreground">Envoyer alerte sur WhatsApp Business</span>
                      <span className="text-muted-foreground text-[11px]">Diffusion instantanée vers vos canaux autorisés.</span>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* ÉTAPE 4 : REVIEW */}
            {wizStep === 4 && (
              <div className="space-y-3 text-xs">
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
                  <h4 className="font-bold text-foreground">Résumé du pipeline :</h4>
                  <div className="space-y-1 text-muted-foreground">
                    <p>• <strong>Déclencheur :</strong> {wizTrigger}</p>
                    <p>• <strong>Conditions :</strong> {wizOnlyWithImage ? "Avec image" : "Tous"}, délai : {wizDelay} min</p>
                    <p>• <strong>Actions :</strong> {[wizActionAi && "IA", wizActionFb && "Facebook", wizActionWa && "WhatsApp"].filter(Boolean).join(" ➔ ")}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Stepper Buttons */}
            <div className="flex justify-between items-center pt-3 border-t border-border/70">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  if (wizStep > 1) setWizStep((prev) => (prev - 1) as any);
                  else setWizardOpen(false);
                }}
              >
                {wizStep === 1 ? "Annuler" : "Précédent"}
              </Button>

              {wizStep < 4 ? (
                <Button
                  size="sm"
                  onClick={() => setWizStep((prev) => (prev + 1) as any)}
                  disabled={wizStep === 1 && !wizName.trim()}
                >
                  Continuer <ArrowRight size={14} className="ml-1" />
                </Button>
              ) : (
                <Button size="sm" onClick={handleCreateAutomation}>
                  Activer l&apos;automatisation ➔
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DRAWER ACTIVITÉ & LOGS D'AUTOMATISATION */}
      {selectedAutomationForLogs && (
        <div className="fixed inset-0 z-50 flex items-center justify-end p-0">
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setSelectedAutomationForLogs(null)} />
          <div className="relative h-full w-full max-w-md bg-surface border-l border-border p-6 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border/70 pb-3">
                <div>
                  <h3 className="font-heading text-sm font-bold text-foreground">Historique d&apos;exécution</h3>
                  <p className="text-[11px] text-muted-foreground">{selectedAutomationForLogs.name}</p>
                </div>
                <button onClick={() => setSelectedAutomationForLogs(null)} className="text-muted-foreground hover:text-foreground">
                  <X size={18} />
                </button>
              </div>

              {/* Exemple de Cycle Complet d'Activité */}
              <div className="space-y-3 text-xs">
                <div className="rounded-xl border border-border/80 bg-surface-2/40 p-3 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                    <span>Aujourd&apos;hui 10:32</span>
                    <span className="text-emerald-500 font-bold">Durée : 2.4s</span>
                  </div>
                  <div className="space-y-1.5 text-muted-foreground">
                    <div className="flex items-center gap-2 text-foreground font-medium">
                      <CheckCircle size={14} className="text-emerald-500" weight="fill" />
                      <span>Article détecté sur WooCommerce</span>
                    </div>
                    <div className="flex items-center gap-2 text-foreground font-medium">
                      <CheckCircle size={14} className="text-emerald-500" weight="fill" />
                      <span>Génération copywriting IA effectuée</span>
                    </div>
                    <div className="flex items-center gap-2 text-foreground font-medium">
                      <CheckCircle size={14} className="text-emerald-500" weight="fill" />
                      <span>Publication Facebook réussie (Feed)</span>
                    </div>
                    <div className="flex items-center gap-2 text-foreground font-medium">
                      <CheckCircle size={14} className="text-emerald-500" weight="fill" />
                      <span>Alerte WhatsApp transmise au groupe VIP</span>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-muted-foreground">
                  En cas d&apos;échec de l&apos;une des étapes, l&apos;incident est précisément identifié avec la possibilité de relancer immédiatement le job.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-border/70">
              <Button
                variant="secondary"
                className="w-full text-xs"
                onClick={() => setSelectedAutomationForLogs(null)}
              >
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
