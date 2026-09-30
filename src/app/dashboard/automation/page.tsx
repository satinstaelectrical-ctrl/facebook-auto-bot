"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Lightning,
  Copy,
  CheckCircle,
  ArrowClockwise,
  Globe,
  Code,
  Check,
  Eye,
  EyeSlash,
  Sparkle,
  FacebookLogo,
  WhatsappLogo,
  InstagramLogo,
  Storefront,
  NewspaperClipping,
  ArrowRight,
  ShieldCheck,
  WarningCircle,
  Clock,
  Broadcast,
  Article,
  ShoppingBag,
  ArrowsClockwise,
  Trash,
} from "@phosphor-icons/react/dist/ssr";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import type { PageCache, ConnectedWebsite } from "@/lib/types";

interface SiteAnalysisResult {
  ok: boolean;
  siteUrl?: string;
  siteTitle?: string;
  platform?: string;
  cms?: string | null;
  hasWordpress?: boolean;
  hasShopify?: boolean;
  hasRss?: boolean;
  hasProducts?: boolean;
  hasImages?: boolean;
  detectedFeeds?: string[];
  samplePost?: { title: string; excerpt?: string; url?: string; image?: string } | null;
  error?: string;
}

interface ActivityStatus {
  lastActivityAt: string | null;
  lastLog: {
    event_type: string;
    title: string | null;
    status: string;
    created_at: string;
  } | null;
  totalReceived: number;
}

export default function AutomationPage() {
  const toast = useToast();

  // Mode: "beginner" (guided) vs "pro" (developer / API webhook)
  const [activeMode, setActiveMode] = useState<"beginner" | "pro">("beginner");

  // Real backend activity status
  const [activity, setActivity] = useState<ActivityStatus>({
    lastActivityAt: null,
    lastLog: null,
    totalReceived: 0,
  });
  const [testingWebhook, setTestingWebhook] = useState(false);

  // Settings & Credentials
  const [webhookSecret, setWebhookSecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [generatingSecret, setGeneratingSecret] = useState(false);
  const [origin, setOrigin] = useState("");

  // Social accounts real state
  const [facebookConnected, setFacebookConnected] = useState(false);
  const [facebookUserName, setFacebookUserName] = useState<string | null>(null);
  const [defaultPageName, setDefaultPageName] = useState<string | null>(null);
  const [pages, setPages] = useState<PageCache[]>([]);
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [whatsappInstance, setWhatsappInstance] = useState<string | null>(null);

  // Connected websites from DB
  const [connectedWebsites, setConnectedWebsites] = useState<ConnectedWebsite[]>([]);

  // Beginner Wizard States
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [siteUrlInput, setSiteUrlInput] = useState("");
  const [analyzingSite, setAnalyzingSite] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<SiteAnalysisResult | null>(null);

  // Chosen automations in Step 2
  const [autoArticles, setAutoArticles] = useState(true);
  const [autoListings, setAutoListings] = useState(true);
  const [autoProducts, setAutoProducts] = useState(true);

  // Saving state
  const [savingSite, setSavingSite] = useState(false);

  // Developer mode documentation snippet tab
  const [codeLang, setCodeLang] = useState<"curl" | "nextjs" | "php" | "wordpress">("curl");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
    loadData();
  }, []);

  async function loadData() {
    try {
      // 1. Fetch settings
      const settingsRes = await fetch("/api/settings");
      if (settingsRes.ok) {
        const data = await settingsRes.json();
        setWebhookSecret(data.webhook_secret || "");
        setFacebookConnected(Boolean(data.facebook_connected));
        setFacebookUserName(data.facebook_user_name || null);
        setDefaultPageName(data.default_page_name || null);
        setWhatsappEnabled(Boolean(data.whatsapp_enabled));
        setWhatsappInstance(data.whatsapp_instance_name || null);
        setConnectedWebsites(data.connected_websites || []);
      }

      // 2. Fetch real Facebook pages
      const pagesRes = await fetch("/api/facebook/pages");
      if (pagesRes.ok) {
        const pData = await pagesRes.json();
        setPages(pData.pages || []);
      }

      // 3. Fetch real activity status
      const actRes = await fetch("/api/automation/activity");
      if (actRes.ok) {
        const actData = await actRes.json();
        setActivity(actData);
      }
    } catch (err) {
      console.error("Erreur de chargement des paramètres d'automatisation:", err);
    }
  }

  async function handleTestConnection() {
    setTestingWebhook(true);
    try {
      const res = await fetch("/api/automation/test-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Vérification manuelle depuis le Dashboard",
          source: "Dashboard Test Ping",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec du test de connexion.");

      toast.success("Test réussi !", "Connexion webhook validée avec succès par le serveur.");
      // Refresh real activity status
      const actRes = await fetch("/api/automation/activity");
      if (actRes.ok) {
        setActivity(await actRes.json());
      }
    } catch (err) {
      toast.error("Erreur de test", err instanceof Error ? err.message : "Impossible de tester la connexion.");
    } finally {
      setTestingWebhook(false);
    }
  }

  async function handleAnalyzeSite() {
    if (!siteUrlInput.trim()) {
      toast.error("URL requise", "Veuillez saisir l'adresse web de votre site.");
      return;
    }

    setAnalyzingSite(true);
    setAnalysisResult(null);

    try {
      const res = await fetch("/api/automation/analyze-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: siteUrlInput.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setAnalysisResult({
          ok: false,
          error: data.error || "Impossible d'analyser ce site web.",
        });
        toast.error("Analyse échouée", data.error || "Site inaccessible ou URL invalide.");
      } else {
        setAnalysisResult(data);
        toast.success("Analyse terminée", "Technologies et flux détectés avec succès.");
      }
    } catch (err) {
      setAnalysisResult({
        ok: false,
        error: "Erreur réseau : impossible de joindre le serveur d'analyse.",
      });
      toast.error("Erreur réseau", "Impossible de joindre le serveur d'analyse.");
    } finally {
      setAnalyzingSite(false);
    }
  }

  async function handleSaveWebsiteAutomation() {
    if (!analysisResult?.ok || !siteUrlInput.trim()) return;
    setSavingSite(true);

    try {
      const newSite: ConnectedWebsite = {
        id: `site_${Date.now()}`,
        name: analysisResult.siteTitle || new URL(analysisResult.siteUrl || siteUrlInput).hostname,
        url: analysisResult.siteUrl || siteUrlInput.trim(),
        platform: (analysisResult.platform as any) || "custom",
        rss_url: analysisResult.detectedFeeds?.[0] || null,
        webhook_secret: crypto.randomUUID().replace(/-/g, ""),
        auto_publish: true,
        target_page_id: pages[0]?.page_id || null,
        last_sync_at: null,
        created_at: new Date().toISOString(),
      };

      const updated = [...connectedWebsites, newSite];
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connected_websites: updated }),
      });

      if (!res.ok) throw new Error("Échec de l'enregistrement du site.");

      setConnectedWebsites(updated);
      toast.success("Site connecté !", "Votre site est prêt pour la publication automatique.");
      setWizardStep(3);
    } catch (err) {
      toast.error("Erreur", err instanceof Error ? err.message : "Erreur de sauvegarde.");
    } finally {
      setSavingSite(false);
    }
  }

  async function handleDeleteWebsite(siteId: string) {
    const updated = connectedWebsites.filter((s) => s.id !== siteId);
    setConnectedWebsites(updated);
    try {
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connected_websites: updated }),
      });
      toast.success("Site supprimé", "L'automatisation liée à ce site a été retirée.");
    } catch {
      toast.error("Erreur", "Impossible de supprimer ce site.");
    }
  }

  async function generateNewSecret() {
    setGeneratingSecret(true);
    try {
      const res = await fetch("/api/automation/webhook/secret", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec de régénération de la clé.");
      setWebhookSecret(data.secret);
      toast.success("Nouvelle clé secrète générée", "Mettez à jour le header de vos requêtes webhook.");
    } catch (err) {
      toast.error("Erreur", err instanceof Error ? err.message : "Impossible de régénérer la clé.");
    } finally {
      setGeneratingSecret(false);
    }
  }

  function copyToClipboard(text: string, type: "url" | "secret") {
    navigator.clipboard.writeText(text);
    if (type === "url") {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } else {
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    }
    toast.success("Copié dans le presse-papiers");
  }

  const webhookEndpoint = `${origin}/api/webhooks/listings`;

  // True connection state: has activity or at least one registered website
  const isConfigured = Boolean(activity.lastActivityAt || connectedWebsites.length > 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-bold text-indigo-400 border border-indigo-500/20">
              Automatisation de Contenu
            </span>
          </div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight text-foreground">
            Connecter mon Site Web
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Détectez automatiquement vos contenus et laissez l&apos;IA rédiger et diffuser sur vos réseaux sociaux.
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="inline-flex rounded-xl border border-border bg-surface p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setActiveMode("beginner")}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition",
              activeMode === "beginner"
                ? "bg-primary text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Sparkle size={14} weight="fill" />
            Mode Débutant (Guidé)
          </button>
          <button
            type="button"
            onClick={() => setActiveMode("pro")}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition",
              activeMode === "pro"
                ? "bg-primary text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Code size={14} />
            Mode Professionnel (API)
          </button>
        </div>
      </div>

      {/* Connection Status Banner (100% Truthful Backend State) */}
      <Card className="border-border bg-surface shadow-sm p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border",
                isConfigured
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                  : "border-border bg-surface-2 text-muted-foreground"
              )}
            >
              {isConfigured ? (
                <CheckCircle size={22} weight="fill" />
              ) : (
                <div className="h-3 w-3 rounded-full bg-zinc-500/40 border border-zinc-400/60" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading text-sm font-bold text-foreground">
                  Connexion Webhook
                </h3>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border",
                    isConfigured
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-surface-2 text-muted-foreground border-border"
                  )}
                >
                  {isConfigured ? "● Connecté & Actif" : "⚪ Non configuré"}
                </span>
              </div>

              <p className="text-xs text-muted-foreground mt-0.5">
                {isConfigured
                  ? `Votre passerelle reçoit les données. Total traité : ${activity.totalReceived} événement(s).`
                  : "Votre site n'a pas encore envoyé de données."}
              </p>

              <div className="flex items-center gap-4 mt-2 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  Dernière activité :{" "}
                  <strong className="text-foreground font-semibold">
                    {activity.lastActivityAt
                      ? new Date(activity.lastActivityAt).toLocaleString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Aucune"}
                  </strong>
                </span>

                {activity.lastLog && (
                  <span className="hidden md:inline-flex items-center gap-1 font-mono text-[10px] text-indigo-400 truncate max-w-xs">
                    Événement : {activity.lastLog.title || activity.lastLog.event_type}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <Button
              size="sm"
              variant="outline"
              onClick={handleTestConnection}
              disabled={testingWebhook}
              className="text-xs font-semibold"
            >
              <ArrowClockwise size={13} className={testingWebhook ? "animate-spin" : ""} />
              {testingWebhook ? "Test en cours..." : "Tester la connexion"}
            </Button>
          </div>
        </div>
      </Card>

      {/* MODE DÉBUTANT : Interface Guidée en 3 Étapes */}
      {activeMode === "beginner" && (
        <div className="space-y-6">
          <Card className="border-border bg-surface p-6 shadow-sm">
            {/* Header Wizard */}
            <div className="mb-6">
              <h2 className="font-heading text-lg font-bold text-foreground">
                Connectez votre site en quelques minutes
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Suivez ce guide simple pour automatiser la détection et la publication de vos nouveaux articles, produits et annonces.
              </p>

              {/* Steps Progress */}
              <div className="mt-5 grid grid-cols-3 gap-2 border-b border-border pb-4">
                <div
                  className={cn(
                    "flex items-center gap-2 text-xs font-bold",
                    wizardStep >= 1 ? "text-indigo-400" : "text-muted-foreground"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                      wizardStep >= 1 ? "bg-indigo-500/20 text-indigo-400" : "bg-surface-2 text-muted-foreground"
                    )}
                  >
                    1
                  </span>
                  <span>1. Ajouter votre site</span>
                </div>

                <div
                  className={cn(
                    "flex items-center gap-2 text-xs font-bold",
                    wizardStep >= 2 ? "text-indigo-400" : "text-muted-foreground"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                      wizardStep >= 2 ? "bg-indigo-500/20 text-indigo-400" : "bg-surface-2 text-muted-foreground"
                    )}
                  >
                    2
                  </span>
                  <span>2. Choisir les automatisations</span>
                </div>

                <div
                  className={cn(
                    "flex items-center gap-2 text-xs font-bold",
                    wizardStep >= 3 ? "text-emerald-400" : "text-muted-foreground"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                      wizardStep >= 3 ? "bg-emerald-500/20 text-emerald-400" : "bg-surface-2 text-muted-foreground"
                    )}
                  >
                    3
                  </span>
                  <span>3. Connexion réseaux</span>
                </div>
              </div>
            </div>

            {/* ÉTAPE 1 : Entrez l'adresse de votre site + Analyser */}
            {wizardStep === 1 && (
              <div className="space-y-5 max-w-2xl">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Adresse web de votre site ou boutique :
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Globe size={16} className="absolute left-3.5 top-3 text-muted-foreground" />
                      <input
                        type="url"
                        placeholder="https://monsite.com ou https://maboutique.com"
                        value={siteUrlInput}
                        onChange={(e) => setSiteUrlInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleAnalyzeSite();
                        }}
                        className="w-full rounded-xl border border-border bg-background pl-9 pr-3 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-indigo-500"
                      />
                    </div>
                    <Button
                      onClick={handleAnalyzeSite}
                      disabled={analyzingSite || !siteUrlInput.trim()}
                      className="font-bold shrink-0"
                    >
                      <Sparkle size={15} weight="fill" className={analyzingSite ? "animate-spin" : ""} />
                      {analyzingSite ? "Analyse en cours..." : "Analyser mon site"}
                    </Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1.5">
                    Compatible avec WordPress, WooCommerce, Shopify, flux RSS ou sites web sur mesure.
                  </p>
                </div>

                {/* Résultat d'analyse en temps réel */}
                {analysisResult && (
                  <div className="mt-4 animate-in fade-in duration-200">
                    {analysisResult.ok ? (
                      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-heading text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                            <CheckCircle size={16} weight="fill" />
                            Analyse terminée avec succès
                          </h3>
                          <span className="text-[10px] font-mono text-muted-foreground">
                            {analysisResult.siteUrl}
                          </span>
                        </div>

                        {/* Checklist détection réelle */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                          <div className="rounded-xl border border-white/[0.08] bg-surface p-2.5">
                            <span className="text-[10px] text-muted-foreground block font-medium">CMS Détecté</span>
                            <span className="font-bold text-foreground flex items-center gap-1 mt-0.5">
                              {analysisResult.cms || "Personnalisé"}
                              <Check size={12} className="text-emerald-400" />
                            </span>
                          </div>

                          <div className="rounded-xl border border-white/[0.08] bg-surface p-2.5">
                            <span className="text-[10px] text-muted-foreground block font-medium">Flux RSS</span>
                            <span className="font-bold text-foreground flex items-center gap-1 mt-0.5">
                              {analysisResult.hasRss ? "Disponible ✓" : "Non disponible"}
                            </span>
                          </div>

                          <div className="rounded-xl border border-white/[0.08] bg-surface p-2.5">
                            <span className="text-[10px] text-muted-foreground block font-medium">Catalogue Produits</span>
                            <span className="font-bold text-foreground flex items-center gap-1 mt-0.5">
                              {analysisResult.hasProducts ? "Détectés ✓" : "Standard"}
                            </span>
                          </div>

                          <div className="rounded-xl border border-white/[0.08] bg-surface p-2.5">
                            <span className="text-[10px] text-muted-foreground block font-medium">Images</span>
                            <span className="font-bold text-foreground flex items-center gap-1 mt-0.5">
                              {analysisResult.hasImages ? "Disponibles ✓" : "Génération IA"}
                            </span>
                          </div>
                        </div>

                        {/* Échantillon de contenu extrait */}
                        {analysisResult.samplePost && (
                          <div className="rounded-xl border border-border bg-surface p-3 flex items-center gap-3">
                            {analysisResult.samplePost.image && (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={analysisResult.samplePost.image}
                                alt=""
                                className="h-12 w-12 rounded-lg object-cover shrink-0"
                              />
                            )}
                            <div className="min-w-0 flex-1">
                              <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block">
                                Échantillon de contenu trouvé
                              </span>
                              <p className="text-xs font-bold text-foreground truncate">
                                {analysisResult.samplePost.title}
                              </p>
                              {analysisResult.samplePost.excerpt && (
                                <p className="text-[11px] text-muted-foreground truncate">
                                  {analysisResult.samplePost.excerpt}
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="pt-2 flex justify-end">
                          <Button
                            onClick={() => setWizardStep(2)}
                            className="font-bold"
                          >
                            Étape 2 : Configurer les publications <ArrowRight size={14} className="ml-1" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 flex items-start gap-3">
                        <WarningCircle size={20} className="text-destructive shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-xs font-bold text-foreground">
                            Aucune source détectée ou site inaccessible
                          </h4>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {analysisResult.error || "Vérifiez que votre URL commence par https:// et est accessible publiquement."}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ÉTAPE 2 : Choisir les automatisations */}
            {wizardStep === 2 && (
              <div className="space-y-6 max-w-3xl">
                <div>
                  <h3 className="font-heading text-sm font-bold text-foreground">
                    Sélectionnez vos flux d&apos;automatisation
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    L&apos;IA génère un texte persuasif, des hashtags et des accroches adaptées à chaque réseau.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  {/* Carte 1: Nouvel article */}
                  <div
                    onClick={() => setAutoArticles(!autoArticles)}
                    className={cn(
                      "rounded-2xl border p-4 cursor-pointer transition flex flex-col justify-between space-y-4",
                      autoArticles
                        ? "border-indigo-500/40 bg-indigo-500/5 shadow-sm"
                        : "border-border bg-surface opacity-60 hover:opacity-100"
                    )}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                          <Article size={18} weight="fill" />
                        </span>
                        <input
                          type="checkbox"
                          checked={autoArticles}
                          onChange={() => {}}
                          className="rounded text-primary focus:ring-primary"
                        />
                      </div>
                      <h4 className="font-heading text-xs font-bold text-foreground">
                        Nouvel article publié
                      </h4>
                      <div className="text-[11px] text-muted-foreground space-y-1">
                        <div className="flex items-center gap-1">
                          <span className="text-indigo-400">↓</span>
                          <span>Créer publication IA</span>
                        </div>
                        <div className="flex items-center gap-1 font-semibold text-foreground">
                          <span className="text-indigo-400">↓</span>
                          <span className="flex items-center gap-1">
                            <FacebookLogo size={12} weight="fill" className="text-blue-500" />
                            Publier sur Facebook
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-indigo-400">
                      {autoArticles ? "✓ Activé" : "Désactivé"}
                    </span>
                  </div>

                  {/* Carte 2: Nouvelle annonce */}
                  <div
                    onClick={() => setAutoListings(!autoListings)}
                    className={cn(
                      "rounded-2xl border p-4 cursor-pointer transition flex flex-col justify-between space-y-4",
                      autoListings
                        ? "border-emerald-500/40 bg-emerald-500/5 shadow-sm"
                        : "border-border bg-surface opacity-60 hover:opacity-100"
                    )}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                          <Storefront size={18} weight="fill" />
                        </span>
                        <input
                          type="checkbox"
                          checked={autoListings}
                          onChange={() => {}}
                          className="rounded text-emerald-500 focus:ring-emerald-500"
                        />
                      </div>
                      <h4 className="font-heading text-xs font-bold text-foreground">
                        Nouvelle annonce ou promo
                      </h4>
                      <div className="text-[11px] text-muted-foreground space-y-1">
                        <div className="flex items-center gap-1">
                          <span className="text-emerald-400">↓</span>
                          <span>Créer texte marketing</span>
                        </div>
                        <div className="flex items-center gap-1 font-semibold text-foreground">
                          <span className="text-emerald-400">↓</span>
                          <span className="flex items-center gap-1">
                            <WhatsappLogo size={12} weight="fill" className="text-emerald-500" />
                            Diffuser sur WhatsApp
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400">
                      {autoListings ? "✓ Activé" : "Désactivé"}
                    </span>
                  </div>

                  {/* Carte 3: Nouveau produit */}
                  <div
                    onClick={() => setAutoProducts(!autoProducts)}
                    className={cn(
                      "rounded-2xl border p-4 cursor-pointer transition flex flex-col justify-between space-y-4",
                      autoProducts
                        ? "border-purple-500/40 bg-purple-500/5 shadow-sm"
                        : "border-border bg-surface opacity-60 hover:opacity-100"
                    )}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                          <ShoppingBag size={18} weight="fill" />
                        </span>
                        <input
                          type="checkbox"
                          checked={autoProducts}
                          onChange={() => {}}
                          className="rounded text-purple-500 focus:ring-purple-500"
                        />
                      </div>
                      <h4 className="font-heading text-xs font-bold text-foreground">
                        Nouveau produit boutique
                      </h4>
                      <div className="text-[11px] text-muted-foreground space-y-1">
                        <div className="flex items-center gap-1">
                          <span className="text-purple-400">↓</span>
                          <span>Créer publicité IA</span>
                        </div>
                        <div className="flex items-center gap-1 font-semibold text-foreground">
                          <span className="text-purple-400">↓</span>
                          <span className="flex items-center gap-1">
                            <Broadcast size={12} className="text-purple-400" />
                            Publier Réseaux &amp; Ads
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-purple-400">
                      {autoProducts ? "✓ Activé" : "Désactivé"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Button variant="secondary" onClick={() => setWizardStep(1)}>
                    Retour
                  </Button>
                  <Button onClick={() => setWizardStep(3)} className="font-bold">
                    Continuer vers la vérification des comptes <ArrowRight size={14} className="ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {/* ÉTAPE 3 : Connexion réseaux sociaux (Uniquement les vraies connexions) */}
            {wizardStep === 3 && (
              <div className="space-y-6 max-w-3xl">
                <div>
                  <h3 className="font-heading text-sm font-bold text-foreground">
                    Comptes sociaux connectés pour la publication
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Seules les connexions backend réelles sont activées pour diffuser vos flux.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {/* Facebook Status */}
                  <div className="rounded-2xl border border-border bg-surface p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FacebookLogo size={20} weight="fill" className="text-blue-500" />
                        <span className="text-xs font-bold text-foreground">Facebook</span>
                      </div>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-bold border",
                          facebookConnected
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-surface-2 text-muted-foreground border-border"
                        )}
                      >
                        {facebookConnected ? "Connecté ✓" : "Non connecté"}
                      </span>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      <span className="block text-[10px]">Compte :</span>
                      <strong className="text-foreground font-semibold truncate block">
                        {facebookConnected ? defaultPageName || facebookUserName || "Page principale" : "Aucun"}
                      </strong>
                    </div>

                    {!facebookConnected && (
                      <Link href="/dashboard/settings">
                        <Button size="sm" variant="outline" className="w-full text-xs">
                          Connecter Facebook
                        </Button>
                      </Link>
                    )}
                  </div>

                  {/* WhatsApp Status */}
                  <div className="rounded-2xl border border-border bg-surface p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <WhatsappLogo size={20} weight="fill" className="text-emerald-500" />
                        <span className="text-xs font-bold text-foreground">WhatsApp</span>
                      </div>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-bold border",
                          whatsappEnabled
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-surface-2 text-muted-foreground border-border"
                        )}
                      >
                        {whatsappEnabled ? "Connecté ✓" : "Non configuré"}
                      </span>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      <span className="block text-[10px]">Passerelle :</span>
                      <strong className="text-foreground font-semibold truncate block">
                        {whatsappEnabled ? whatsappInstance || "Evolution API" : "Aucune passerelle"}
                      </strong>
                    </div>

                    {!whatsappEnabled && (
                      <Link href="/dashboard/settings">
                        <Button size="sm" variant="outline" className="w-full text-xs">
                          Configurer WhatsApp
                        </Button>
                      </Link>
                    )}
                  </div>

                  {/* Instagram Status */}
                  <div className="rounded-2xl border border-border bg-surface p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <InstagramLogo size={20} weight="fill" className="text-pink-500" />
                        <span className="text-xs font-bold text-foreground">Instagram</span>
                      </div>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-bold border",
                          facebookConnected
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-surface-2 text-muted-foreground border-border"
                        )}
                      >
                        {facebookConnected ? "Lié via Meta ✓" : "Non connecté"}
                      </span>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      <span className="block text-[10px]">Compte Pro :</span>
                      <strong className="text-foreground font-semibold truncate block">
                        {facebookConnected ? "Synchronisé avec Page Meta" : "Non lié"}
                      </strong>
                    </div>

                    {!facebookConnected && (
                      <Link href="/dashboard/settings">
                        <Button size="sm" variant="outline" className="w-full text-xs">
                          Lier via Facebook
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="font-heading text-xs font-bold text-foreground">
                      Enregistrer cette automatisation
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Le site analysé sera synchronisé en tâche de fond pour détecter et publier tout nouveau contenu.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" onClick={() => setWizardStep(2)}>
                      Retour
                    </Button>
                    <Button
                      onClick={handleSaveWebsiteAutomation}
                      disabled={savingSite}
                      className="font-bold"
                    >
                      {savingSite ? "Activation..." : "Activer l'automatisation"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Liste des sites connectés */}
          <div className="space-y-3">
            <h3 className="font-heading text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Sites actuellement synchronisés ({connectedWebsites.length})
            </h3>

            {connectedWebsites.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {connectedWebsites.map((site) => (
                  <Card key={site.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                        <Storefront size={20} weight="fill" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-foreground truncate">{site.name}</h4>
                        <p className="text-[11px] font-mono text-muted-foreground truncate max-w-xs">
                          {site.url}
                        </p>
                        <div className="mt-1 flex items-center gap-2 text-[10px]">
                          <span className="font-semibold text-emerald-400">● Actif</span>
                          <span className="text-muted-foreground">
                            Dernière sync :{" "}
                            {site.last_sync_at
                              ? new Date(site.last_sync_at).toLocaleDateString("fr-FR")
                              : "En attente"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteWebsite(site.id)}
                      className="p-1.5 text-muted-foreground hover:text-destructive transition rounded-lg"
                      title="Supprimer ce site"
                    >
                      <Trash size={15} />
                    </button>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-6 text-center text-xs text-muted-foreground border-dashed">
                Aucun site web synchronisé pour le moment. Renseignez l&apos;URL de votre site dans le formulaire ci-dessus pour lancer votre première automatisation.
              </Card>
            )}
          </div>
        </div>
      )}

      {/* MODE PROFESSIONNEL : Section Développeurs & Agences (Webhooks & API) */}
      {activeMode === "pro" && (
        <div className="space-y-6">
          <Card className="border-border bg-surface p-6 shadow-sm space-y-6">
            <div className="border-b border-border pb-4">
              <h2 className="font-heading text-lg font-bold text-foreground flex items-center gap-2">
                <Code size={20} className="text-indigo-400" />
                API Webhook &amp; Développeurs
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Envoyez directement vos requêtes HTTP POST sécurisées depuis vos backends, plateformes CRM ou workflows n8n/Zapier.
              </p>
            </div>

            {/* Endpoints & Secrets */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Endpoint */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  URL Endpoint Webhook :
                </label>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={webhookEndpoint}
                    className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-xs font-mono text-foreground outline-none"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(webhookEndpoint, "url")}
                  >
                    {copiedUrl ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    {copiedUrl ? "Copié !" : "Copier"}
                  </Button>
                </div>
              </div>

              {/* Secret Key */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground">
                    Secret API (x-webhook-secret) :
                  </label>
                  <button
                    type="button"
                    onClick={generateNewSecret}
                    disabled={generatingSecret}
                    className="text-[11px] font-semibold text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <ArrowClockwise size={12} className={generatingSecret ? "animate-spin" : ""} />
                    Régénérer
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    type={showSecret ? "text" : "password"}
                    value={webhookSecret || "Clé non configurée"}
                    className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-xs font-mono text-foreground outline-none"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowSecret(!showSecret)}
                    title={showSecret ? "Masquer" : "Afficher"}
                  >
                    {showSecret ? <EyeSlash size={14} /> : <Eye size={14} />}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(webhookSecret, "secret")}
                    disabled={!webhookSecret}
                  >
                    {copiedSecret ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </Button>
                </div>
              </div>
            </div>

            {/* Events Supported Checkboxes */}
            <div className="rounded-2xl border border-border bg-surface-2/40 p-4 space-y-2">
              <h4 className="text-xs font-bold text-foreground">
                Événements pris en charge (Events) :
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div className="flex items-center gap-2 font-medium text-foreground">
                  <CheckCircle size={15} weight="fill" className="text-emerald-400" />
                  <span>New Article (Blog &amp; Médias)</span>
                </div>
                <div className="flex items-center gap-2 font-medium text-foreground">
                  <CheckCircle size={15} weight="fill" className="text-emerald-400" />
                  <span>New Product (Shopify / Woo)</span>
                </div>
                <div className="flex items-center gap-2 font-medium text-foreground">
                  <CheckCircle size={15} weight="fill" className="text-emerald-400" />
                  <span>New Listing (Petites Annonces)</span>
                </div>
              </div>
            </div>

            {/* Code Documentation Snippets */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-foreground">
                  Documentation &amp; Exemples d&apos;intégration :
                </h4>
                <div className="flex items-center gap-1">
                  {(["curl", "nextjs", "php", "wordpress"] as const).map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setCodeLang(lang)}
                      className={cn(
                        "rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase transition",
                        codeLang === lang
                          ? "bg-primary text-white"
                          : "text-muted-foreground hover:bg-surface-2"
                      )}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              <pre className="overflow-x-auto rounded-2xl border border-border bg-[#080B14] p-4 text-[11px] font-mono text-zinc-300 leading-relaxed">
                {codeLang === "curl" &&
`curl -X POST "${webhookEndpoint}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${webhookSecret || "VOTRE_SECRET_API"}" \\
  -d '{
    "title": "Superbe Villa contemporaine avec piscine",
    "description": "4 chambres, séjour lumineux, terrasse et jardin paysager.",
    "price": "1 500 000 FCFA / mois",
    "location": "Dakar, Almadies",
    "category": "Immobilier",
    "imageUrl": "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1080",
    "listingUrl": "https://monsite.com/annonces/villa-1092",
    "autoPublishFacebook": true,
    "autoPublishWhatsApp": true
  }'`}

                {codeLang === "nextjs" &&
`// Next.js Route Handler / Server Action
export async function notifyBot(listing) {
  const res = await fetch("${webhookEndpoint}", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-webhook-secret": "${webhookSecret || "VOTRE_SECRET_API"}",
    },
    body: JSON.stringify({
      title: listing.title,
      description: listing.description,
      price: listing.price,
      location: listing.location,
      imageUrl: listing.imageUrl,
      listingUrl: listing.url,
      autoPublishFacebook: true,
      autoPublishWhatsApp: true,
    }),
  });
  return res.json();
}`}

                {codeLang === "php" &&
`<?php
$payload = [
  "title" => "Nouveau Produit en Boutique",
  "description" => "Description complète du produit.",
  "price" => "49 €",
  "imageUrl" => "https://monsite.com/photo.jpg",
  "listingUrl" => "https://monsite.com/produits/123",
  "autoPublishFacebook" => true
];

$ch = curl_init("${webhookEndpoint}");
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
  "Content-Type: application/json",
  "x-webhook-secret: ${webhookSecret || "VOTRE_SECRET_API"}"
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$result = curl_exec($ch);
curl_close($ch);
?>`}

                {codeLang === "wordpress" &&
`// functions.php de votre thème WordPress
add_action('publish_post', function($post_id) {
  $post = get_post($post_id);
  $thumb_id = get_post_thumbnail_id($post_id);
  $img_url = wp_get_attachment_image_url($thumb_id, 'full');

  wp_remote_post("${webhookEndpoint}", [
    'headers' => [
      'Content-Type' => 'application/json',
      'x-webhook-secret' => '${webhookSecret || "VOTRE_SECRET_API"}'
    ],
    'body' => json_encode([
      'title' => $post->post_title,
      'description' => wp_strip_all_tags($post->post_excerpt ?: $post->post_content),
      'imageUrl' => $img_url ?: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1080',
      'listingUrl' => get_permalink($post_id),
      'autoPublishFacebook' => true
    ])
  ]);
});`}
              </pre>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
