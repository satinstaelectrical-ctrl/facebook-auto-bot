"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Lightning,
  Sparkle,
  FacebookLogo,
  WhatsappLogo,
  ChartLineUp,
  Play,
  Pause,
  ArrowRight,
  ArrowDown,
  CheckCircle,
  Plus,
  GearSix,
  ShoppingBag,
  Article,
  Browsers,
  Sliders,
  Check,
  Cpu,
  Clock,
  ArrowsClockwise,
} from "@phosphor-icons/react/dist/ssr";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";

interface WorkflowTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  active: boolean;
  executions: number;
  leadsCaptured: number;
  trigger: {
    title: string;
    source: string;
    icon: string;
    color: string;
  };
  steps: {
    id: string;
    name: string;
    type: "ai" | "filter" | "publish" | "broadcast" | "analytics";
    desc: string;
    icon: string;
    color: string;
  }[];
}

const DEFAULT_WORKFLOWS: WorkflowTemplate[] = [
  {
    id: "wf-1",
    name: "E-Commerce & Shopify Autopilot",
    category: "Boutique en ligne",
    description: "Détecte les nouveaux produits ou promotions et les publie automatiquement avec un visuel et un lien d'achat direct.",
    active: true,
    executions: 142,
    leadsCaptured: 38,
    trigger: {
      title: "Nouveau produit ou promo détecté",
      source: "Boutique Shopify / WooCommerce",
      icon: "🛍",
      color: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
    },
    steps: [
      {
        id: "s1",
        name: "Analyse Produit & Pricing IA",
        type: "ai",
        desc: "L'IA extrait les points forts, calcule la remise et sélectionne le meilleur angle marketing.",
        icon: "🤖",
        color: "border-indigo-500/40 bg-indigo-500/10 text-indigo-400",
      },
      {
        id: "s2",
        name: "Génération Visuel & Copywriting",
        type: "ai",
        desc: "Création d'un texte persuasif avec émojis, hashtags et cadrage optimisé.",
        icon: "✨",
        color: "border-purple-500/40 bg-purple-500/10 text-purple-400",
      },
      {
        id: "s3",
        name: "Publication Page Facebook Feed & Reel",
        type: "publish",
        desc: "Diffusion immédiate sur vos Pages Facebook sélectionnées avec lien UTM traqué.",
        icon: "📘",
        color: "border-blue-500/40 bg-blue-500/10 text-blue-400",
      },
      {
        id: "s4",
        name: "Diffusion Groupes & Communauté WhatsApp",
        type: "broadcast",
        desc: "Envoi automatique d'une alerte aux membres et clients VIP avec lien de commande direct.",
        icon: "📲",
        color: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
      },
      {
        id: "s5",
        name: "Rapport de Performance & CRM Leads",
        type: "analytics",
        desc: "Mesure des clics, capture des numéros WhatsApp entrants et qualification des prospects.",
        icon: "📊",
        color: "border-cyan-500/40 bg-cyan-500/10 text-cyan-400",
      },
    ],
  },
  {
    id: "wf-2",
    name: "Blog WordPress ➔ Réseaux Sociaux",
    category: "Marketing de contenu",
    description: "Transforme chaque article publié en synthèse captivante pour maximiser le trafic vers votre site.",
    active: true,
    executions: 89,
    leadsCaptured: 19,
    trigger: {
      title: "Nouvel article de blog publié",
      source: "WordPress / Flux RSS",
      icon: "📰",
      color: "border-blue-500/40 bg-blue-500/10 text-blue-400",
    },
    steps: [
      {
        id: "s1",
        name: "Extraction & Synthèse IA",
        type: "ai",
        desc: "Lecture automatique de l'article, extraction des 3 leçons clés et création d'un crochet viral.",
        icon: "🧠",
        color: "border-indigo-500/40 bg-indigo-500/10 text-indigo-400",
      },
      {
        id: "s2",
        name: "Publication Facebook avec Image à la Une",
        type: "publish",
        desc: "Partage sur vos réseaux avec lien direct vers le site.",
        icon: "📘",
        color: "border-blue-500/40 bg-blue-500/10 text-blue-400",
      },
      {
        id: "s3",
        name: "Envoi Résumé WhatsApp",
        type: "broadcast",
        desc: "Diffusion du résumé condensé pour les abonnés mobiles.",
        icon: "💬",
        color: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
      },
    ],
  },
  {
    id: "wf-3",
    name: "Annonces Immobilières & Véhicules Flash",
    category: "Plateformes d'annonces",
    description: "Diffuse instantanément toute nouvelle annonce sur les réseaux sociaux pour générer des appels en moins de 10 minutes.",
    active: false,
    executions: 45,
    leadsCaptured: 12,
    trigger: {
      title: "Nouvelle annonce déposée",
      source: "Site d'annonces / Webhook Yamoura",
      icon: "🏠",
      color: "border-amber-500/40 bg-amber-500/10 text-amber-400",
    },
    steps: [
      {
        id: "s1",
        name: "Formatage Annonce & Prix IA",
        type: "ai",
        desc: "Mise en valeur du prix, localisation et caractéristiques phares.",
        icon: "🎯",
        color: "border-indigo-500/40 bg-indigo-500/10 text-indigo-400",
      },
      {
        id: "s2",
        name: "Diffusion Multi-Pages Facebook",
        type: "publish",
        desc: "Publication en carrousel ou photo unique avec lien annonce.",
        icon: "📘",
        color: "border-blue-500/40 bg-blue-500/10 text-blue-400",
      },
      {
        id: "s3",
        name: "Alerte Prospects WhatsApp",
        type: "broadcast",
        desc: "Diffusion aux acheteurs qualifiés en recherche active.",
        icon: "📲",
        color: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
      },
    ],
  },
];

export default function AutomationBuilderPage() {
  const [workflows, setWorkflows] = useState<WorkflowTemplate[]>(DEFAULT_WORKFLOWS);
  const [selectedWfId, setSelectedWfId] = useState<string>("wf-1");
  const [simulating, setSimulating] = useState(false);
  const [simulationStep, setSimulationStep] = useState<number>(-1);

  const selectedWf = workflows.find((w) => w.id === selectedWfId) || workflows[0];

  function toggleWorkflowActive(id: string) {
    setWorkflows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, active: !w.active } : w))
    );
  }

  async function handleSimulate() {
    setSimulating(true);
    setSimulationStep(0);

    const totalSteps = selectedWf.steps.length + 1; // trigger + steps
    for (let i = 0; i <= totalSteps; i++) {
      await new Promise((r) => setTimeout(r, 700));
      setSimulationStep(i);
    }
    setSimulating(false);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-bold text-indigo-400 border border-indigo-500/20">
              Zapier / Make for Social Commerce
            </span>
          </div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight text-foreground">
            Constructeur Visuel d&apos;Automatisations
          </h1>
          <p className="text-xs text-muted-foreground">
            Créez des flux automatisés reliant vos sites e-commerce, blogs et flux à l&apos;IA, Facebook et WhatsApp.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleSimulate}
            disabled={simulating}
          >
            {simulating ? (
              <ArrowsClockwise size={14} className="animate-spin mr-1.5" />
            ) : (
              <Play size={14} weight="fill" className="text-emerald-400 mr-1.5" />
            )}
            {simulating ? "Exécution du flux…" : "Tester le flux en direct"}
          </Button>
          <Link href="/dashboard/connections">
            <Button size="sm">
              <Plus size={14} className="mr-1" /> Connecter un Site
            </Button>
          </Link>
        </div>
      </div>

      {/* Workflow Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {workflows.map((wf) => {
          const isSelected = wf.id === selectedWfId;
          return (
            <div
              key={wf.id}
              onClick={() => setSelectedWfId(wf.id)}
              className={cn(
                "group relative rounded-2xl border p-4 cursor-pointer transition flex flex-col justify-between",
                isSelected
                  ? "border-indigo-500 bg-indigo-500/[0.07] ring-1 ring-indigo-500/30"
                  : "border-border bg-surface-2/40 hover:bg-surface-2"
              )}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {wf.category}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWorkflowActive(wf.id);
                    }}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold transition",
                      wf.active
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                    )}
                  >
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        wf.active ? "bg-emerald-400 animate-pulse" : "bg-zinc-500"
                      )}
                    />
                    {wf.active ? "Actif" : "En pause"}
                  </button>
                </div>

                <h3 className="text-sm font-bold text-foreground group-hover:text-indigo-400 transition">
                  {wf.name}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {wf.description}
                </p>
              </div>

              <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                <span>{wf.executions} exécutions</span>
                <span className="text-emerald-400 font-semibold">{wf.leadsCaptured} leads</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Visual Workflow Canvas (Linear / Zapier Style) */}
      <div className="rounded-3xl border border-border bg-surface p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-lg font-bold text-foreground">
                {selectedWf.name}
              </h2>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-bold border",
                  selectedWf.active
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-zinc-800 text-zinc-400 border-zinc-700"
                )}
              >
                {selectedWf.active ? "● Opérationnel 24/7" : "○ En Pause"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Pipeline visuel automatisé de bout en bout
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={selectedWf.active ? "secondary" : "default"}
              onClick={() => toggleWorkflowActive(selectedWf.id)}
            >
              {selectedWf.active ? <Pause size={14} className="mr-1" /> : <Play size={14} className="mr-1" />}
              {selectedWf.active ? "Mettre en pause" : "Activer ce workflow"}
            </Button>
          </div>
        </div>

        {/* Workflow Diagram Nodes */}
        <div className="flex flex-col items-center max-w-2xl mx-auto py-4 space-y-4">
          {/* TRIGGER NODE */}
          <div
            className={cn(
              "w-full rounded-2xl border-2 p-4 transition-all shadow-md",
              simulationStep >= 0
                ? "border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-500/10"
                : selectedWf.trigger.color
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{selectedWf.trigger.icon}</span>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400 block font-mono">
                    [1] DÉCLENCHEUR (TRIGGER)
                  </span>
                  <h3 className="text-sm font-bold text-foreground">{selectedWf.trigger.title}</h3>
                  <p className="text-xs text-muted-foreground">{selectedWf.trigger.source}</p>
                </div>
              </div>
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-white/10 text-xs font-mono font-bold">
                ✓
              </span>
            </div>
          </div>

          {/* Connector Arrow */}
          <div className="flex flex-col items-center text-muted-foreground">
            <div className="h-6 w-0.5 bg-border" />
            <ArrowDown size={16} className="text-indigo-400 -my-1" />
          </div>

          {/* ACTION NODES */}
          {selectedWf.steps.map((step, idx) => {
            const stepNum = idx + 2;
            const isCompleted = simulationStep >= stepNum;
            const isCurrent = simulationStep === stepNum - 1 && simulating;

            return (
              <React.Fragment key={step.id}>
                <div
                  className={cn(
                    "w-full rounded-2xl border p-4 transition-all shadow-sm",
                    isCurrent
                      ? "border-indigo-400 ring-2 ring-indigo-400/40 bg-indigo-500/10 scale-[1.01]"
                      : isCompleted
                      ? "border-emerald-500/50 bg-emerald-500/[0.05]"
                      : "border-border bg-surface-2/40 hover:bg-surface-2"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{step.icon}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400 font-mono">
                            [{stepNum}] ACTION {step.type.toUpperCase()}
                          </span>
                          {isCurrent && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-indigo-400 animate-pulse">
                              <ArrowsClockwise size={10} className="animate-spin" /> En cours…
                            </span>
                          )}
                          {isCompleted && (
                            <span className="text-[10px] font-bold text-emerald-400">
                              ✓ Exécuté
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-bold text-foreground">{step.name}</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {idx < selectedWf.steps.length - 1 && (
                  <div className="flex flex-col items-center text-muted-foreground">
                    <div className="h-5 w-0.5 bg-border" />
                    <ArrowDown size={14} className="text-indigo-400 -my-1" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
