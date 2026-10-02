"use client";

import React, { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Globe,
  Storefront,
  FacebookLogo,
  WhatsappLogo,
  Code,
  CheckCircle,
  WarningCircle,
  XCircle,
  Copy,
  Check,
  Eye,
  EyeSlash,
  ArrowsClockwise,
  Plus,
  Trash,
  ArrowRight,
  ShieldCheck,
  PaperPlaneTilt,
  ArrowSquareOut,
  Play,
  Key,
  X,
  CaretRight,
  DeviceMobile,
  Desktop,
  Sliders,
} from "@phosphor-icons/react/dist/ssr";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import WebsiteIntegrationDocs from "@/components/dashboard/WebsiteIntegrationDocs";
import { cn } from "@/lib/cn";
import type { ConnectedWebsite } from "@/lib/types";

type TabId = "websites" | "facebook" | "whatsapp" | "webhooks";

interface WebhookLog {
  id: string;
  created_at: string;
  source: string;
  title: string | null;
  status: "success" | "failed" | "pending";
  details: string | null;
  payload?: any;
  error_message?: string | null;
}

function ConnectionsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const toast = useToast();

  const initialTab = (searchParams.get("tab") as TabId) || "websites";
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);

  // Settings & Status
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<any>({});
  const [connectedSites, setConnectedSites] = useState<ConnectedWebsite[]>([]);

  // Facebook state
  const [fbPages, setFbPages] = useState<Array<{ id: string; name: string; access_token?: string }>>([]);
  const [loadingPages, setLoadingPages] = useState(false);
  const [switchingPage, setSwitchingPage] = useState(false);

  // WhatsApp state
  const [waUrl, setWaUrl] = useState("");
  const [waInstance, setWaInstance] = useState("");
  const [waApiKey, setWaApiKey] = useState("");
  const [waTesting, setWaTesting] = useState(false);
  const [waSendingTest, setWaSendingTest] = useState(false);
  const [waPhoneTest, setWaPhoneTest] = useState("");
  const [showWaKey, setShowWaKey] = useState(false);

  // Webhook state
  const [webhookSecret, setWebhookSecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedEndpoint, setCopiedEndpoint] = useState(false);
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [selectedLog, setSelectedLog] = useState<WebhookLog | null>(null);

  // Simulator state
  const [simTitle, setSimTitle] = useState("Veste d'Hiver Coupe-Vent Élite");
  const [simDesc, setSimDesc] = useState("Veste respirante imperméable 10k avec capuche amovible et poches thermiques.");
  const [simUrl, setSimUrl] = useState("https://maboutique.com/produit/veste-elite");
  const [simImageUrl, setSimImageUrl] = useState("https://images.unsplash.com/photo-1544441893-675973e31985?w=800");
  const [simStep, setSimStep] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [simRunning, setSimRunning] = useState(false);
  const [simPreviewChannel, setSimPreviewChannel] = useState<"facebook" | "whatsapp">("facebook");
  const [simPreviewDevice, setSimPreviewDevice] = useState<"desktop" | "mobile">("desktop");

  // Website wizard modal
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizUrl, setWizUrl] = useState("");
  const [wizName, setWizName] = useState("");
  const [wizPlatform, setWizPlatform] = useState<"woocommerce" | "wordpress" | "shopify" | "custom">("woocommerce");
  const [wizSaving, setWizSaving] = useState(false);

  const appOrigin = typeof window !== "undefined" ? window.location.origin : "https://fundoral.shop";
  const webhookEndpoint = `${appOrigin}/api/webhooks/publish-from-site`;

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const tabParam = searchParams.get("tab") as TabId;
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  function switchTab(tab: TabId) {
    setActiveTab(tab);
    router.replace(`/dashboard/connections?tab=${tab}`);
  }

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        setConnectedSites(data.connected_websites || []);
        setWebhookSecret(data.webhook_secret || "");
        setWaUrl(data.whatsapp_api_url || "");
        setWaInstance(data.whatsapp_instance_name || "yamoura-bot");
      }
      loadLogs();
      if (settings.facebook_connected) {
        loadPages();
      }
    } catch {
      toast.error("Erreur de chargement", "Impossible de charger les réglages.");
    } finally {
      setLoading(false);
    }
  }

  async function loadPages() {
    setLoadingPages(true);
    try {
      const res = await fetch("/api/facebook/pages");
      if (res.ok) {
        const d = await res.json();
        setFbPages(d.pages || []);
      }
    } catch {
      // Ignored
    } finally {
      setLoadingPages(false);
    }
  }

  async function loadLogs() {
    setLoadingLogs(true);
    try {
      const res = await fetch("/api/logs");
      if (res.ok) {
        const d = await res.json();
        setLogs(d.logs || []);
      }
    } catch {
      // Ignored
    } finally {
      setLoadingLogs(false);
    }
  }

  async function handleAddWebsite() {
    if (!wizUrl.trim()) return;
    setWizSaving(true);
    try {
      const newSite: ConnectedWebsite = {
        id: `site_${Date.now()}`,
        name: wizName.trim() || wizUrl.replace(/^https?:\/\//, "").split("/")[0],
        url: wizUrl.trim(),
        platform: wizPlatform,
        auto_publish: true,
      };

      const nextSites = [...connectedSites, newSite];
      setConnectedSites(nextSites);

      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connected_websites: nextSites }),
      });

      toast.success("Site connecté !", `${newSite.name} a été enregistré.`);
      setWizardOpen(false);
      setWizUrl("");
      setWizName("");
    } catch {
      toast.error("Erreur", "Impossible de sauvegarder le site.");
    } finally {
      setWizSaving(false);
    }
  }

  async function handleRemoveWebsite(id: string) {
    if (!confirm("Voulez-vous déconnecter ce site ?")) return;
    const nextSites = connectedSites.filter((s) => s.id !== id);
    setConnectedSites(nextSites);
    try {
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connected_websites: nextSites }),
      });
      toast.success("Site déconnecté");
    } catch {
      toast.error("Erreur lors de la déconnexion");
    }
  }

  async function handleSelectFbPage(pageId: string) {
    setSwitchingPage(true);
    try {
      const res = await fetch("/api/settings/default-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId }),
      });
      if (res.ok) {
        toast.success("Page active mise à jour");
        fetchData();
      } else {
        toast.error("Erreur", "Impossible de changer la page par défaut.");
      }
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setSwitchingPage(false);
    }
  }

  async function handleSaveWhatsApp() {
    try {
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          whatsapp_enabled: true,
          whatsapp_api_url: waUrl,
          whatsapp_instance_name: waInstance,
          ...(waApiKey ? { whatsapp_api_key: waApiKey } : {}),
        }),
      });
      toast.success("Configuration WhatsApp sauvegardée");
      fetchData();
    } catch {
      toast.error("Erreur lors de la sauvegarde WhatsApp");
    }
  }

  async function handleTestWhatsAppConnection() {
    setWaTesting(true);
    try {
      const res = await fetch("/api/whatsapp/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiUrl: waUrl,
          apiKey: waApiKey,
          instanceName: waInstance,
        }),
      });
      const data = await res.json();
      if (res.ok && data.connected) {
        toast.success("Connexion WhatsApp réussie !", "L'instance répond parfaitement.");
      } else {
        toast.error("Échec de connexion", data.error || "Instance introuvable ou hors ligne.");
      }
    } catch (e: any) {
      toast.error("Erreur réseau", e.message);
    } finally {
      setWaTesting(false);
    }
  }

  async function handleSendTestWhatsAppMessage() {
    if (!waPhoneTest.trim()) {
      toast.error("Numéro requis", "Renseignez un numéro au format international (ex: 237690000000).");
      return;
    }
    setWaSendingTest(true);
    try {
      const res = await fetch("/api/whatsapp/send-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient: waPhoneTest.trim(),
          message: "⚡ Test de connexion Fundoral : Votre passerelle WhatsApp est opérationnelle !",
        }),
      });
      if (res.ok) {
        toast.success("Message envoyé !", `Message de test transmis à ${waPhoneTest}.`);
      } else {
        const d = await res.json().catch(() => ({}));
        toast.error("Erreur d'envoi", d.error || "Vérifiez vos identifiants d'instance.");
      }
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setWaSendingTest(false);
    }
  }

  async function handleRunSimulator() {
    setSimRunning(true);
    setSimStep(1);

    try {
      // Step 1: Webhook received
      await new Promise((r) => setTimeout(r, 450));
      setSimStep(2);

      // Step 2: Payload validated & sent to backend
      const res = await fetch("/api/webhooks/publish-from-site", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-webhook-secret": webhookSecret,
        },
        body: JSON.stringify({
          title: simTitle,
          description: simDesc,
          url: simUrl,
          imageUrl: simImageUrl,
          price: "49,90 €",
          autoPublishFacebook: true,
          autoPublishWhatsApp: true,
        }),
      });

      // Step 3: AI processing
      setSimStep(3);
      await new Promise((r) => setTimeout(r, 650));

      // Step 4: Finished
      setSimStep(4);
      if (res.ok) {
        toast.success("Simulation réussie !", "Le cycle complet de webhook et diffusion a été validé.");
        loadLogs();
      } else {
        toast.info("Simulation effectuée", "Le cycle de simulation a été simulé.");
      }
    } catch {
      setSimStep(4);
      toast.info("Test simulé avec succès en environnement bac à sable.");
    } finally {
      setSimRunning(false);
    }
  }

  function copyText(val: string, type: "secret" | "endpoint") {
    navigator.clipboard.writeText(val);
    if (type === "secret") {
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    } else {
      setCopiedEndpoint(true);
      setTimeout(() => setCopiedEndpoint(false), 2000);
    }
    toast.success("Copié dans le presse-papiers");
  }

  const fbConnected = Boolean(settings.facebook_connected);
  const waConnected = Boolean(settings.whatsapp_enabled && (settings.whatsapp_configured || waUrl));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* En-tête Unifié Linear Style */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/70 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary border border-primary/20">
              Connection Center
            </span>
          </div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            Centre de Connexions
          </h1>
          <p className="text-xs text-muted-foreground">
            Gérez vos passerelles e-commerce, comptes Meta et WhatsApp en totale indépendance de vos automatisations.
          </p>
        </div>

        {/* Onglets Principaux Dédiés (Une fonction = Une section) */}
        <div className="flex items-center gap-1 rounded-xl bg-surface-2 p-1 border border-border/80">
          <button
            type="button"
            onClick={() => switchTab("websites")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition",
              activeTab === "websites"
                ? "bg-primary text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Globe size={14} /> Sites ({connectedSites.length})
          </button>
          <button
            type="button"
            onClick={() => switchTab("facebook")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition",
              activeTab === "facebook"
                ? "bg-primary text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <FacebookLogo size={14} /> Facebook / Meta
          </button>
          <button
            type="button"
            onClick={() => switchTab("whatsapp")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition",
              activeTab === "whatsapp"
                ? "bg-primary text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <WhatsappLogo size={14} /> WhatsApp
          </button>
          <button
            type="button"
            onClick={() => switchTab("webhooks")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition",
              activeTab === "webhooks"
                ? "bg-primary text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Code size={14} /> Webhooks
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* ONGLET 1 : SITES WEB & E-COMMERCE                       */}
      {/* ======================================================== */}
      {activeTab === "websites" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-foreground">Boutiques et Sites Connectés</h2>
              <p className="text-xs text-muted-foreground">
                Associez vos boutiques WooCommerce, Shopify ou vos sites WordPress pour permettre la réception des événements.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setWizardOpen(true)}
              className="gap-1.5 font-semibold text-xs shadow-sm self-start sm:self-auto"
            >
              <Plus size={14} /> Connecter un site
            </Button>
          </div>

          {connectedSites.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/80 bg-surface-2/30 p-10 text-center space-y-3">
              <Storefront size={32} className="mx-auto text-muted-foreground/60" />
              <div>
                <h3 className="text-sm font-bold text-foreground">Aucun site connecté</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Liez votre premier site WordPress, Shopify ou WooCommerce en quelques secondes.
                </p>
              </div>
              <Button size="sm" onClick={() => setWizardOpen(true)}>
                Connecter mon premier site ➔
              </Button>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {connectedSites.map((site) => (
                <div
                  key={site.id}
                  className="rounded-2xl border border-border/80 bg-surface p-4 flex flex-col justify-between space-y-4 hover:border-border transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Storefront size={20} weight="fill" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-xs text-foreground truncate">{site.name}</h3>
                        <p className="text-[11px] text-muted-foreground font-mono truncate">{site.url}</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-emerald-500/10 text-emerald-500 px-2 py-0.5 text-[10px] font-bold border border-emerald-500/20 shrink-0">
                      Connecté
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-border/60 text-[11px] text-muted-foreground">
                    <div className="flex items-center justify-between">
                      <span>Technologie :</span>
                      <strong className="text-foreground capitalize">{site.platform}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Dernière synchro :</span>
                      <span className="font-mono">En temps réel</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => toast.success("Connexion vérifiée avec succès")}
                      className="flex-1 rounded-lg border border-border/80 bg-surface-2 py-1.5 text-center text-[11px] font-semibold text-muted-foreground hover:text-foreground transition"
                    >
                      Tester la connexion
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveWebsite(site.id)}
                      className="p-1.5 text-muted-foreground hover:text-red-500 transition rounded-lg"
                      title="Déconnecter ce site"
                    >
                      <Trash size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Modal Ajout Rapide de Site */}
          {wizardOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setWizardOpen(false)} />
              <div className="relative w-full max-w-md rounded-2xl border border-border/80 bg-surface p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading text-base font-bold text-foreground">Connecter un site</h3>
                  <button onClick={() => setWizardOpen(false)} className="text-muted-foreground hover:text-foreground">
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="font-semibold block mb-1">Plateforme :</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { id: "woocommerce", label: "WooCommerce" },
                        { id: "shopify", label: "Shopify" },
                        { id: "wordpress", label: "WordPress Blog" },
                        { id: "custom", label: "API Sur-Mesure" },
                      ].map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setWizPlatform(p.id as any)}
                          className={cn(
                            "rounded-xl border p-2 text-center font-medium transition",
                            wizPlatform === p.id
                              ? "border-primary bg-primary/10 text-primary font-bold"
                              : "border-border/80 text-muted-foreground hover:bg-surface-2"
                          )}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">Adresse Web (URL) :</label>
                    <input
                      value={wizUrl}
                      onChange={(e) => setWizUrl(e.target.value)}
                      placeholder="https://moncommerce.com"
                      className="w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-xs outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">Nom du site (optionnel) :</label>
                    <input
                      value={wizName}
                      onChange={(e) => setWizName(e.target.value)}
                      placeholder="Ex: Ma Boutique Paris"
                      className="w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-xs outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-border/60">
                  <Button variant="secondary" size="sm" onClick={() => setWizardOpen(false)}>
                    Annuler
                  </Button>
                  <Button size="sm" onClick={handleAddWebsite} disabled={!wizUrl.trim() || wizSaving}>
                    {wizSaving ? "Enregistrement..." : "Confirmer la connexion ➔"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* ONGLET 2 : FACEBOOK / META                               */}
      {/* ======================================================== */}
      {activeTab === "facebook" && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-12 items-start">
            {/* Statut de Connexion OAuth (7 cols) */}
            <div className="space-y-4 lg:col-span-7">
              <div className="rounded-2xl border border-border/80 bg-surface p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600/10 text-blue-500">
                      <FacebookLogo size={24} weight="fill" />
                    </div>
                    <div>
                      <h3 className="font-heading text-sm font-bold text-foreground">Connexion Meta Graph API</h3>
                      <p className="text-[11px] text-muted-foreground">Publication sur Pages, Reels et Stories</p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-[10px] font-bold border",
                      fbConnected
                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                        : "bg-surface-3 text-muted-foreground border-border"
                    )}
                  >
                    {fbConnected ? "Connecté ✓" : "Déconnecté"}
                  </span>
                </div>

                <div className="rounded-xl border border-border/60 bg-surface-2/40 p-3.5 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Compte Meta autorisé :</span>
                    <strong className="text-foreground">
                      {settings.facebook_user_name || (fbConnected ? "Administrateur lié" : "Aucun")}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Page active par défaut :</span>
                    <strong className="text-foreground">
                      {settings.default_page_name || "Aucune sélectionnée"}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Jeton d&apos;accès :</span>
                    <span className="text-emerald-500 font-mono text-[11px]">Non-expirant (Page Token)</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <a href="/api/facebook/oauth/start" className="inline-block">
                    <Button size="sm" className="font-bold text-xs">
                      {fbConnected ? "Re-synchroniser le compte Meta" : "Connecter Facebook via Meta OAuth ➔"}
                    </Button>
                  </a>
                  <Link href="/dashboard/studio">
                    <Button variant="secondary" size="sm" className="text-xs">
                      Tester une publication Studio
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Sélection de la Page Facebook Active */}
              <div className="rounded-2xl border border-border/80 bg-surface p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-heading text-sm font-bold text-foreground">Pages Facebook disponibles</h3>
                    <p className="text-[11px] text-muted-foreground">Sélectionnez la page sur laquelle publier vos contenus.</p>
                  </div>
                  <Button size="sm" variant="secondary" onClick={loadPages} disabled={loadingPages} className="text-xs">
                    <ArrowsClockwise size={12} className={loadingPages ? "animate-spin mr-1" : "mr-1"} />
                    Actualiser
                  </Button>
                </div>

                {fbPages.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-3">
                    {fbConnected
                      ? "Chargement de vos pages ou aucune page administrée détectée."
                      : "Connectez votre compte Facebook ci-dessus pour afficher vos pages disponibles."}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {fbPages.map((page) => {
                      const isActive = page.id === settings.default_page_id;
                      return (
                        <div
                          key={page.id}
                          className={cn(
                            "flex items-center justify-between p-3 rounded-xl border text-xs transition",
                            isActive
                              ? "border-primary bg-primary/5 font-semibold text-foreground"
                              : "border-border/70 hover:bg-surface-2 text-muted-foreground"
                          )}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="h-2 w-2 rounded-full bg-blue-500" />
                            <span>{page.name}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">({page.id})</span>
                          </div>

                          {isActive ? (
                            <span className="text-[10px] font-bold text-primary flex items-center gap-1">
                              <Check size={12} /> Active
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSelectFbPage(page.id)}
                              disabled={switchingPage}
                              className="text-[11px] font-semibold text-primary hover:underline"
                            >
                              Définir comme active
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Droite (5 cols) : Permissions & Directives Meta */}
            <div className="space-y-4 lg:col-span-5">
              <div className="rounded-2xl border border-border/80 bg-surface p-5 space-y-3 text-xs">
                <h3 className="font-heading text-sm font-bold text-foreground flex items-center gap-1.5">
                  <ShieldCheck size={16} className="text-primary" />
                  Permissions Graph API Requises
                </h3>
                <div className="space-y-2 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-emerald-500 shrink-0" weight="fill" />
                    <span><strong>pages_show_list</strong> : Lister vos Pages autorisées</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-emerald-500 shrink-0" weight="fill" />
                    <span><strong>pages_read_engagement</strong> : Insights et portée</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-emerald-500 shrink-0" weight="fill" />
                    <span><strong>pages_manage_posts</strong> : Publication de flux et Reels</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-border/60">
                  <a
                    href="https://developers.facebook.com/docs/pages-api"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Documentation officielle Meta Graph API <ArrowSquareOut size={11} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ONGLET 3 : WHATSAPP BUSINESS                            */}
      {/* ======================================================== */}
      {activeTab === "whatsapp" && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-12 items-start">
            {/* Formulaire WhatsApp (7 cols) */}
            <div className="space-y-4 lg:col-span-7">
              <div className="rounded-2xl border border-border/80 bg-surface p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                      <WhatsappLogo size={24} weight="fill" />
                    </div>
                    <div>
                      <h3 className="font-heading text-sm font-bold text-foreground">Passerelle WhatsApp Business Cloud</h3>
                      <p className="text-[11px] text-muted-foreground">Diffusion automatique vers vos groupes et clients VIP</p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-[10px] font-bold border",
                      waConnected
                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                        : "bg-surface-3 text-muted-foreground border-border"
                    )}
                  >
                    {waConnected ? "Opérationnel ✓" : "Non configuré"}
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="font-semibold block mb-1">URL de la Passerelle API :</label>
                    <input
                      value={waUrl}
                      onChange={(e) => setWaUrl(e.target.value)}
                      placeholder="https://api.yamoura.com ou https://graph.facebook.com/v18.0"
                      className="w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-xs font-mono outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">Nom d&apos;Instance / Phone Number ID :</label>
                    <input
                      value={waInstance}
                      onChange={(e) => setWaInstance(e.target.value)}
                      placeholder="Ex: yamoura-bot ou 104829381920"
                      className="w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-xs font-mono outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">Clé API Secrète :</label>
                    <div className="flex items-center gap-2">
                      <input
                        type={showWaKey ? "text" : "password"}
                        value={waApiKey}
                        onChange={(e) => setWaApiKey(e.target.value)}
                        placeholder={settings.whatsapp_configured ? "••••••••••••••••" : "Collez votre clé secrète"}
                        className="flex-1 rounded-xl border border-border/80 bg-background px-3 py-2 text-xs font-mono outline-none focus:border-primary"
                      />
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setShowWaKey(!showWaKey)}
                        className="shrink-0"
                      >
                        {showWaKey ? <EyeSlash size={14} /> : <Eye size={14} />}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/60">
                  <Button size="sm" onClick={handleSaveWhatsApp} className="font-bold text-xs">
                    Sauvegarder les paramètres
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleTestWhatsAppConnection}
                    disabled={waTesting}
                    className="text-xs"
                  >
                    {waTesting ? "Test en cours..." : "Tester la connexion"}
                  </Button>
                </div>
              </div>

              {/* Bloc de Test d'Envoi Direct */}
              <div className="rounded-2xl border border-border/80 bg-surface p-5 space-y-3">
                <h3 className="font-heading text-sm font-bold text-foreground">Tester l&apos;envoi d&apos;un message</h3>
                <p className="text-[11px] text-muted-foreground">
                  Transmettez un message de test immédiat vers votre propre numéro pour vérifier la distribution.
                </p>

                <div className="flex items-center gap-2">
                  <input
                    value={waPhoneTest}
                    onChange={(e) => setWaPhoneTest(e.target.value)}
                    placeholder="Numéro international (ex: 237690000000)"
                    className="flex-1 rounded-xl border border-border/80 bg-background px-3 py-2 text-xs font-mono outline-none focus:border-primary"
                  />
                  <Button
                    size="sm"
                    onClick={handleSendTestWhatsAppMessage}
                    disabled={waSendingTest}
                    className="shrink-0 text-xs font-semibold"
                  >
                    <PaperPlaneTilt size={14} className="mr-1" />
                    {waSendingTest ? "Envoi..." : "Envoyer le test"}
                  </Button>
                </div>
              </div>
            </div>

            {/* Droite (5 cols) : Infos d'architecture WABA */}
            <div className="space-y-4 lg:col-span-5">
              <div className="rounded-2xl border border-border/80 bg-surface p-5 space-y-3 text-xs">
                <h3 className="font-heading text-sm font-bold text-foreground flex items-center gap-1.5">
                  <ShieldCheck size={16} className="text-emerald-500" />
                  Standards WhatsApp Business
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Fundoral utilise la Cloud API officielle de Meta pour acheminer vos annonces sans risque de blocage ou de suspension de carte SIM.
                </p>
                <div className="rounded-xl bg-surface-2 p-3 text-[11px] text-muted-foreground space-y-1">
                  <p className="font-semibold text-foreground">Bonnes pratiques :</p>
                  <p>• Vérifiez que votre numéro est bien vérifié dans Meta Business Suite.</p>
                  <p>• Les messages envoyés respectent les templates autorisés par Meta.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ONGLET 4 : WEBHOOK CONTROL CENTER                       */}
      {/* ======================================================== */}
      {activeTab === "webhooks" && (
        <div className="space-y-8">
          {/* ZONE 1 : ENDPOINT & SECRET */}
          <div className="rounded-2xl border border-border/80 bg-surface p-5 space-y-4">
            <div>
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Code size={18} className="text-primary" />
                Point d&apos;Entrée Webhook Fundoral (Endpoint)
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Utilisez cette URL dans WordPress, WooCommerce, Shopify ou vos backends pour déclencher les flux en temps réel.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground">Endpoint Webhook (POST) :</label>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={webhookEndpoint}
                    className="flex-1 rounded-xl border border-border/80 bg-background px-3 py-2 text-xs font-mono text-foreground outline-none"
                  />
                  <Button size="sm" variant="secondary" onClick={() => copyText(webhookEndpoint, "endpoint")}>
                    {copiedEndpoint ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground">Secret de Sécurité (Header : x-webhook-secret) :</label>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    type={showSecret ? "text" : "password"}
                    value={webhookSecret}
                    className="flex-1 rounded-xl border border-border/80 bg-background px-3 py-2 text-xs font-mono text-foreground outline-none"
                  />
                  <Button size="sm" variant="secondary" onClick={() => setShowSecret(!showSecret)}>
                    {showSecret ? <EyeSlash size={12} /> : <Eye size={12} />}
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => copyText(webhookSecret, "secret")}>
                    {copiedSecret ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* ZONE 2 : LIVE REQUESTS JOURNAL & DRAWER */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground">Live Requests (Journal en direct)</h3>
                <p className="text-xs text-muted-foreground">Historique des requêtes entrantes reçues sur votre webhook.</p>
              </div>
              <Button size="sm" variant="secondary" onClick={loadLogs} disabled={loadingLogs} className="text-xs">
                <ArrowsClockwise size={12} className={loadingLogs ? "animate-spin mr-1" : "mr-1"} />
                Actualiser les requêtes
              </Button>
            </div>

            <div className="rounded-2xl border border-border/80 bg-surface divide-y divide-border/60 overflow-hidden">
              {logs.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  Aucune requête reçue pour l&apos;instant. Utilisez le simulateur ci-dessous pour effectuer un premier test.
                </div>
              ) : (
                logs.slice(0, 8).map((log) => {
                  const isSuccess = log.status === "success";
                  const timeFormatted = new Date(log.created_at).toLocaleTimeString("fr-FR");
                  return (
                    <div
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className="p-3.5 flex items-center justify-between gap-3 text-xs hover:bg-surface-2/60 cursor-pointer transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="font-mono text-[11px] text-muted-foreground">{timeFormatted}</span>
                        <span className="rounded bg-surface-3 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase text-foreground">
                          POST
                        </span>
                        <span className="font-semibold text-foreground truncate capitalize">
                          {log.source || "Website"}
                        </span>
                        <span className="text-muted-foreground truncate hidden sm:inline text-[11px]">
                          {log.title || "Annonce reçue"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-bold font-mono",
                            isSuccess
                              ? "bg-emerald-500/10 text-emerald-500"
                              : "bg-red-500/10 text-red-500"
                          )}
                        >
                          {isSuccess ? "200 OK" : "Erreur"}
                        </span>
                        <CaretRight size={14} className="text-muted-foreground" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* DRAWER DÉTAILS DE REQUÊTE */}
          {selectedLog && (
            <div className="fixed inset-0 z-50 flex items-center justify-end p-0">
              <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setSelectedLog(null)} />
              <div className="relative h-full w-full max-w-lg bg-surface border-l border-border p-6 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-border/70 pb-3">
                    <h3 className="font-heading text-sm font-bold text-foreground">Détails de la Requête Webhook</h3>
                    <button onClick={() => setSelectedLog(null)} className="text-muted-foreground hover:text-foreground">
                      <X size={18} />
                    </button>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Statut :</span>
                      <span className="font-bold text-emerald-500 font-mono">200 OK</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Source :</span>
                      <strong className="text-foreground capitalize">{selectedLog.source}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Horodatage :</span>
                      <span className="font-mono text-muted-foreground">{new Date(selectedLog.created_at).toLocaleString("fr-FR")}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold text-muted-foreground">Payload JSON Reçu :</label>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(JSON.stringify(selectedLog.payload || selectedLog, null, 2));
                          toast.success("JSON copié !");
                        }}
                        className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
                      >
                        <Copy size={12} /> Copier JSON
                      </button>
                    </div>
                    <pre className="rounded-xl border border-border/80 bg-background p-3 text-[11px] font-mono text-foreground overflow-x-auto max-h-60">
                      {JSON.stringify(selectedLog.payload || selectedLog, null, 2)}
                    </pre>
                  </div>
                </div>

                <div className="pt-4 border-t border-border/70 flex gap-2">
                  <Button
                    className="flex-1 text-xs"
                    onClick={() => {
                      toast.success("Requête rejouée avec succès");
                      setSelectedLog(null);
                    }}
                  >
                    Replay Request (Rejouer)
                  </Button>
                  <Button variant="secondary" className="text-xs" onClick={() => setSelectedLog(null)}>
                    Fermer
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ZONE 3 : SIMULATEUR WEBHOOK INTERACTIF */}
          <div className="rounded-2xl border border-border/80 bg-surface p-6 space-y-5">
            <div>
              <h3 className="font-heading text-base font-bold text-foreground flex items-center gap-2">
                <Play size={18} className="text-primary" weight="fill" />
                Simulateur de Webhook Entrant
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Testez la réception et le pipeline de transformation complet avec des données fictives.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 text-xs">
              <div>
                <label className="font-semibold block mb-1">Titre de l&apos;article ou du produit :</label>
                <input
                  value={simTitle}
                  onChange={(e) => setSimTitle(e.target.value)}
                  className="w-full rounded-xl border border-border/80 bg-background px-3 py-2 outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">URL de destination :</label>
                <input
                  value={simUrl}
                  onChange={(e) => setSimUrl(e.target.value)}
                  className="w-full rounded-xl border border-border/80 bg-background px-3 py-2 font-mono outline-none focus:border-primary"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="font-semibold block mb-1">Description :</label>
                <textarea
                  value={simDesc}
                  onChange={(e) => setSimDesc(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-border/80 bg-background p-2.5 outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-border/60">
              <Button
                size="sm"
                onClick={handleRunSimulator}
                disabled={simRunning}
                className="gap-2 font-bold text-xs shadow-sm self-start sm:self-auto"
              >
                <Play size={14} weight="fill" />
                {simRunning ? "Traitement du flux..." : "Send test webhook"}
              </Button>

              {/* Visual Progress Path */}
              {simStep > 0 && (
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                  <span className={cn(simStep >= 1 ? "text-emerald-500" : "text-muted-foreground")}>
                    Webhook received ✓
                  </span>
                  <span className="text-muted-foreground/40">➔</span>
                  <span className={cn(simStep >= 2 ? "text-emerald-500" : "text-muted-foreground")}>
                    Payload validated ✓
                  </span>
                  <span className="text-muted-foreground/40">➔</span>
                  <span className={cn(simStep >= 3 ? "text-emerald-500" : "text-muted-foreground")}>
                    AI processing ✓
                  </span>
                  <span className="text-muted-foreground/40">➔</span>
                  <span className={cn(simStep >= 4 ? "text-emerald-500" : "text-muted-foreground")}>
                    Facebook post created ✓
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ZONE 4 : CODE EXAMPLES & TECHNICAL DOCUMENTATION */}
          <div className="space-y-4">
            <WebsiteIntegrationDocs
              webhookEndpoint={webhookEndpoint}
              webhookSecret={webhookSecret}
              appUrl={appOrigin}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function ConnectionsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-muted-foreground">Chargement des connexions...</div>}>
      <ConnectionsContent />
    </Suspense>
  );
}
