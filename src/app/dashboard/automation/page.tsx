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
  ArrowSquareOut,
  Question,
  Sliders,
  CaretRight,
  CaretLeft,
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

  // Mode: "beginner" (guided 5-step wizard) vs "pro" (developer webhook / API)
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

  // 5-Step Guided Wizard States
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [siteUrlInput, setSiteUrlInput] = useState("");
  const [analyzingSite, setAnalyzingSite] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<SiteAnalysisResult | null>(null);

  // Step 3: Chosen Destinations
  const [selectedPageId, setSelectedPageId] = useState<string>("");
  const [includeWhatsApp, setIncludeWhatsApp] = useState<boolean>(true);

  // Step 4: Diffusion Rules & Mode
  const [autoArticles, setAutoArticles] = useState(true);
  const [autoListings, setAutoListings] = useState(true);
  const [autoProducts, setAutoProducts] = useState(true);
  const [publishMode, setPublishMode] = useState<"direct" | "approval">("direct");

  // Step 5: Test & Activate
  const [testSent, setTestSent] = useState(false);
  const [testSuccess, setTestSuccess] = useState<boolean | null>(null);
  const [savingSite, setSavingSite] = useState(false);

  // Developer mode documentation snippet tab
  const [codeLang, setCodeLang] = useState<"nextjs" | "curl" | "php" | "wordpress">("nextjs");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
    loadData();
  }, []);

  async function loadData() {
    try {
      const [settingsRes, pagesRes, actRes] = await Promise.all([
        fetch("/api/settings").then((r) => (r.ok ? r.json() : {})),
        fetch("/api/facebook/pages").then((r) => (r.ok ? r.json() : { pages: [] })),
        fetch("/api/automation/activity").then((r) => (r.ok ? r.json() : { totalReceived: 0, lastActivityAt: null, lastLog: null })),
      ]);

      setWebhookSecret(settingsRes.webhook_secret || "");
      setFacebookConnected(Boolean(settingsRes.facebook_connected));
      setFacebookUserName(settingsRes.facebook_user_name || null);
      setDefaultPageName(settingsRes.default_page_name || null);
      setWhatsappEnabled(Boolean(settingsRes.whatsapp_enabled));
      setWhatsappInstance(settingsRes.whatsapp_instance_name || null);
      setConnectedWebsites(settingsRes.connected_websites || []);

      const pList: PageCache[] = pagesRes.pages || [];
      setPages(pList);
      if (pList.length > 0 && !selectedPageId) {
        setSelectedPageId(settingsRes.default_page_id || pList[0].page_id);
      }

      setActivity(actRes);
    } catch {
      // Fallback
    }
  }

  // Step 1: Real Site Analysis
  async function handleAnalyzeSite(e: React.FormEvent) {
    e.preventDefault();
    if (!siteUrlInput.trim()) return;

    setAnalyzingSite(true);
    setAnalysisResult(null);

    try {
      const res = await fetch("/api/automation/analyze-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: siteUrlInput.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setAnalysisResult({
          ok: false,
          error: data.error || "Impossible d'analyser ce site web. Vérifiez que l'adresse est accessible.",
        });
        toast.show(data.error || "Site inaccessible ou URL invalide.", "error");
      } else {
        setAnalysisResult(data);
        toast.show("Site analysé et technologies identifiées !", "success");
      }
    } catch {
      setAnalysisResult({
        ok: false,
        error: "Erreur réseau : impossible de joindre le serveur d'analyse.",
      });
      toast.show("Impossible d'analyser ce site web.", "error");
    } finally {
      setAnalyzingSite(false);
    }
  }

  // Step 5: Test Ping
  async function handleSendTestEvent() {
    setTestingWebhook(true);
    setTestSuccess(null);
    try {
      const res = await fetch("/api/webhooks/publish-from-site", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-webhook-secret": webhookSecret,
        },
        body: JSON.stringify({
          title: "Événement de Test Fundoral",
          description: "Vérification de la chaîne de publication automatique et de transmission des données.",
          price: "Test",
          imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1080",
          listingUrl: siteUrlInput || "https://monsite.com/test",
          autoPublishFacebook: false, // Safe test ping without uncontrolled publication
          autoPublishWhatsApp: false,
        }),
      });

      if (res.ok) {
        setTestSent(true);
        setTestSuccess(true);
        toast.show("Événement de test reçu et validé avec succès !", "success");
        loadData();
      } else {
        const d = await res.json();
        setTestSuccess(false);
        toast.show(d.error || "Échec de validation de l'événement de test.", "error");
      }
    } catch {
      setTestSuccess(false);
      toast.show("Erreur réseau lors de l'envoi du test.", "error");
    } finally {
      setTestingWebhook(false);
    }
  }

  // Final Activation
  async function handleActivateAutomation() {
    if (!siteUrlInput.trim()) return;
    setSavingSite(true);

    try {
      const newSite: ConnectedWebsite = {
        id: `site_${Date.now()}`,
        name: analysisResult?.siteTitle || new URL(siteUrlInput).hostname,
        url: siteUrlInput.trim(),
        platform: (analysisResult?.platform as any) || "custom",
        rss_url: analysisResult?.detectedFeeds?.[0] || null,
        webhook_secret: crypto.randomUUID().replace(/-/g, ""),
        auto_publish: publishMode === "direct",
        target_page_id: selectedPageId || null,
        last_sync_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };

      const updated = [...connectedWebsites, newSite];
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connected_websites: updated }),
      });

      if (!res.ok) throw new Error("Échec de l'activation.");

      setConnectedWebsites(updated);
      toast.show("Règle d'automatisation activée avec succès !", "success");
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Erreur de sauvegarde.", "error");
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
      toast.show("Site retiré des automatisations.", "success");
    } catch {
      toast.show("Impossible de supprimer ce site.", "error");
    }
  }

  async function generateNewSecret() {
    if (!confirm("Attention : Régénérer ce secret révoquera immédiatement l'ancien. Vous devrez mettre à jour vos webhooks. Continuer ?")) {
      return;
    }
    setGeneratingSecret(true);
    try {
      const res = await fetch("/api/automation/webhook/secret", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec de régénération de la clé.");
      setWebhookSecret(data.secret);
      toast.show("Nouveau secret webhook généré. Pensez à mettre à jour vos variables d'environnement.", "success");
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Impossible de régénérer la clé.", "error");
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
    toast.show("Copié dans le presse-papiers !", "success");
  }

  const webhookEndpoint = `${origin}/api/webhooks/publish-from-site`;
  const isConfigured = activity.totalReceived > 0 || connectedWebsites.length > 0;
  const totalConnectorsAvailable = 6; // WordPress, Shopify, WooCommerce, Flux RSS, Meta Pages, WhatsApp API
  const totalAccountsConnected = (connectedWebsites.length > 0 ? 1 : 0) + (facebookConnected ? 1 : 0) + (whatsappEnabled ? 1 : 0);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Hero Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
        <div>
          <h1 className="font-heading text-xl font-bold text-foreground flex items-center gap-2">
            <Lightning size={24} weight="fill" className="text-primary" />
            Connexions de Sites &amp; Flux de Diffusion
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Connectez votre site web, autorisez vos comptes officiels et automatisez la diffusion de vos nouvelles annonces.
          </p>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center rounded-xl bg-surface-2 p-1 border border-border">
          <button
            type="button"
            onClick={() => setActiveMode("beginner")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
              activeMode === "beginner"
                ? "bg-primary text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Sparkle size={14} weight="fill" /> Assistant Guidé
          </button>

          <button
            type="button"
            onClick={() => setActiveMode("pro")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
              activeMode === "pro"
                ? "bg-primary text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Code size={14} /> Développeurs &amp; Webhooks
          </button>
        </div>
      </div>

      {/* Summary Banner: Distinguish Available Connectors from Real Connected Accounts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-muted-foreground">Connecteurs disponibles</p>
            <p className="font-heading text-lg font-bold text-foreground">{totalConnectorsAvailable}</p>
          </div>
          <span className="text-[10px] text-muted-foreground">WordPress, Shopify, RSS, Meta...</span>
        </Card>

        <Card className="p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-muted-foreground">Comptes réellement connectés</p>
            <p className="font-heading text-lg font-bold text-foreground">{totalAccountsConnected}</p>
          </div>
          <span className={cn("text-[10px] font-semibold", totalAccountsConnected > 0 ? "text-emerald-500" : "text-amber-500")}>
            {totalAccountsConnected > 0 ? "Vérifié en direct" : "Configuration requise"}
          </span>
        </Card>

        <Card className="p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-muted-foreground">Événements de flux reçus</p>
            <p className="font-heading text-lg font-bold text-foreground">{activity.totalReceived}</p>
          </div>
          <span className="text-[10px] text-muted-foreground font-mono">
            {activity.lastActivityAt ? "Activité récente" : "Aucune donnée"}
          </span>
        </Card>
      </div>

      {/* Real Connection Status Card */}
      <Card className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border",
                isConfigured
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                  : "border-border bg-surface-2 text-muted-foreground"
              )}
            >
              {isConfigured ? (
                <CheckCircle size={22} weight="fill" />
              ) : (
                <div className="h-3 w-3 rounded-full bg-muted-foreground/40 border border-muted-foreground/60" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading text-sm font-bold text-foreground">
                  Connexion Webhook &amp; Flux
                </h3>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border",
                    isConfigured
                      ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
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
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleSendTestEvent}
              disabled={testingWebhook}
              className="text-xs font-semibold"
            >
              <ArrowClockwise size={13} className={testingWebhook ? "animate-spin mr-1" : "mr-1"} />
              {testingWebhook ? "Test en cours..." : "Tester la connexion"}
            </Button>
          </div>
        </div>
      </Card>

      {/* GUIDED 5-STEP WIZARD */}
      {activeMode === "beginner" && (
        <Card className="p-6 space-y-6">
          {/* Wizard Header & Stepper */}
          <div>
            <h2 className="font-heading text-lg font-bold text-foreground">
              Assistant de Configuration &amp; Diffusion Automatique
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Parcours officiel en 5 étapes pour automatiser la détection et la publication de vos annonces.
            </p>

            {/* Stepper indicators */}
            <div className="mt-5 grid grid-cols-5 gap-2 border-b border-border pb-4 text-xs font-semibold">
              {[
                { num: 1, title: "1. Mon Site" },
                { num: 2, title: "2. Mes Comptes" },
                { num: 3, title: "3. Destinations" },
                { num: 4, title: "4. Ma Diffusion" },
                { num: 5, title: "5. Test & Activation" },
              ].map((s) => (
                <button
                  key={s.num}
                  type="button"
                  onClick={() => {
                    // Only allow jumping back to completed or current steps
                    if (s.num <= wizardStep || (s.num === 2 && analysisResult?.ok)) {
                      setWizardStep(s.num as any);
                    }
                  }}
                  className={cn(
                    "flex items-center justify-center p-2 rounded-xl text-center transition",
                    wizardStep === s.num
                      ? "bg-primary text-white shadow-sm"
                      : wizardStep > s.num
                      ? "bg-surface-2 text-foreground hover:bg-surface-3"
                      : "text-muted-foreground/60 cursor-not-allowed"
                  )}
                >
                  <span className="truncate">{s.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* STEP 1: Connecter mon site */}
          {wizardStep === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-heading text-sm font-bold text-foreground">
                  Étape 1 : Saisissez l&apos;adresse de votre site web
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Fundoral analyse la technologie de votre site (WordPress, Shopify, WooCommerce ou Flux RSS) pour préparer la connexion adaptée.
                </p>
              </div>

              <form onSubmit={handleAnalyzeSite} className="flex gap-2">
                <input
                  type="url"
                  required
                  placeholder="https://mon-agence-immobiliere.com"
                  value={siteUrlInput}
                  onChange={(e) => setSiteUrlInput(e.target.value)}
                  className="flex-1 rounded-xl border border-border bg-surface-2 px-3.5 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                />
                <Button type="submit" size="sm" disabled={analyzingSite}>
                  {analyzingSite ? "Analyse…" : "Analyser mon site"}
                </Button>
              </form>

              {/* Analysis Result */}
              {analysisResult && (
                <div
                  className={cn(
                    "rounded-2xl border p-4 text-xs space-y-3",
                    analysisResult.ok
                      ? "border-emerald-500/30 bg-emerald-500/10"
                      : "border-destructive/30 bg-destructive/10"
                  )}
                >
                  {analysisResult.ok ? (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle size={18} weight="fill" className="text-emerald-500" />
                          <span className="font-bold text-foreground">
                            Site vérifié : {analysisResult.siteTitle || analysisResult.siteUrl}
                          </span>
                        </div>
                        <span className="rounded bg-surface-2 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-foreground">
                          {analysisResult.platform || "CMS Web"}
                        </span>
                      </div>

                      <div className="text-[11px] text-muted-foreground space-y-1">
                        <p>✓ Protocole de communication détecté avec succès.</p>
                        {analysisResult.hasRss ? (
                          <p className="text-amber-500">
                            ℹ️ Mode Flux RSS : Les contenus seront vérifiés toutes les 15 minutes par tâche d&apos;arrière-plan (pas de fausse promesse d&apos;instantané).
                          </p>
                        ) : (
                          <p className="text-emerald-500">
                            ⚡ Mode Webhook instantané : Détection et diffusion en temps réel lors de chaque publication.
                          </p>
                        )}
                      </div>

                      <div className="pt-2 flex flex-wrap justify-between items-center gap-2">
                        <div className="flex flex-wrap items-center gap-3 text-[11px]">
                          <a
                            href="https://developer.wordpress.org/rest-api/using-the-rest-api/authentication/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-1 font-medium"
                          >
                            Documentation officielle WordPress <ArrowSquareOut size={11} />
                          </a>
                          <span className="text-muted-foreground">•</span>
                          <a
                            href="https://shopify.dev/docs/apps/build/webhooks"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-1 font-medium"
                          >
                            Webhooks Shopify <ArrowSquareOut size={11} />
                          </a>
                        </div>
                        <Button size="sm" onClick={() => setWizardStep(2)}>
                          Passer à l&apos;étape 2 : Connecter mes comptes <CaretRight size={14} className="ml-1" />
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 text-destructive">
                      <WarningCircle size={18} weight="bold" />
                      <span>{analysisResult.error}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Connecter mes comptes (Facebook & WhatsApp) */}
          {wizardStep === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-heading text-sm font-bold text-foreground">
                  Étape 2 : Autorisez vos comptes officiels de diffusion
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Autorisez vos Pages Facebook et votre accès WhatsApp via les parcours officiels Meta.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Facebook Card */}
                <div className="rounded-2xl border border-border bg-surface-2/40 p-4 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FacebookLogo size={22} weight="fill" className="text-blue-500" />
                        <span className="font-bold text-xs text-foreground">Pages Facebook</span>
                      </div>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-bold",
                          facebookConnected ? "bg-emerald-500/10 text-emerald-500" : "bg-surface-3 text-muted-foreground"
                        )}
                      >
                        {facebookConnected ? "Autorisé" : "Non connecté"}
                      </span>
                    </div>

                    <p className="text-[11px] text-muted-foreground">
                      {facebookConnected
                        ? `Connecté en tant que ${facebookUserName || "Utilisateur Facebook"}. Pages disponibles : ${pages.length}`
                        : "Connectez votre profil Facebook pour récupérer vos Pages professionnelles."}
                    </p>

                    <div className="text-[10px] text-muted-foreground space-y-1 pt-1">
                      <a
                        href="https://developers.facebook.com/docs/pages-api/getting-started/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1"
                      >
                        Démarrage Pages API (Meta) <ArrowSquareOut size={10} />
                      </a>
                      <a
                        href="https://developers.facebook.com/tools/debug/accesstoken/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1"
                      >
                        Débogueur officiel de jetons Meta <ArrowSquareOut size={10} />
                      </a>
                      <a
                        href="https://developers.facebook.com/apps/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1"
                      >
                        Applications Meta <ArrowSquareOut size={10} />
                      </a>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Link href="/dashboard/settings?tab=general">
                      <Button size="sm" variant={facebookConnected ? "secondary" : "default"} className="w-full">
                        {facebookConnected ? "Gérer / Reconnecter Facebook" : "Connecter Facebook"}
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* WhatsApp Card */}
                <div className="rounded-2xl border border-border bg-surface-2/40 p-4 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <WhatsappLogo size={22} weight="fill" className="text-emerald-500" />
                        <span className="font-bold text-xs text-foreground">WhatsApp Business Platform</span>
                      </div>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-bold",
                          whatsappEnabled ? "bg-emerald-500/10 text-emerald-500" : "bg-surface-3 text-muted-foreground"
                        )}
                      >
                        {whatsappEnabled ? "Actif" : "Non connecté"}
                      </span>
                    </div>

                    <p className="text-[11px] text-muted-foreground">
                      {whatsappEnabled
                        ? `Instance officielle active (${whatsappInstance || "Passerelle Cloud"}).`
                        : "Diffusion vers vos prospects et groupes professionnels éligibles."}
                    </p>

                    <div className="text-[10px] text-muted-foreground space-y-1 pt-1">
                      <a
                        href="https://business.whatsapp.com/developers/developer-hub"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1"
                      >
                        Centre développeur WhatsApp <ArrowSquareOut size={10} />
                      </a>
                      <a
                        href="https://developers.facebook.com/docs/whatsapp/embedded-signup/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1"
                      >
                        Connexion intégrée (Embedded Signup) <ArrowSquareOut size={10} />
                      </a>
                      <a
                        href="https://business.facebook.com/wa/manage/home/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1"
                      >
                        WhatsApp Manager (Numéros &amp; Comptes) <ArrowSquareOut size={10} />
                      </a>
                      <a
                        href="https://developers.facebook.com/docs/whatsapp/business-management-api/get-started"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1"
                      >
                        Guide Business Management API <ArrowSquareOut size={10} />
                      </a>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Link href="/dashboard/settings?tab=general">
                      <Button size="sm" variant={whatsappEnabled ? "secondary" : "default"} className="w-full">
                        {whatsappEnabled ? "Gérer WhatsApp" : "Configurer WhatsApp"}
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Credential Distinctions Notice */}
              <div className="rounded-xl border border-border bg-surface-2/60 p-3.5 text-xs text-muted-foreground space-y-1.5">
                <div className="font-semibold text-foreground flex items-center gap-1.5">
                  <Info size={15} className="text-primary" />
                  Comprendre les identifiants, tokens et clés de sécurité :
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                  <div className="p-2 rounded-lg bg-surface border border-border/50">
                    <span className="font-semibold text-foreground block">Jeton d&apos;accès Meta (Page Token) :</span>
                    Clé émise par Meta conférant le droit de publier sur votre Page sans partager de mot de passe.
                  </div>
                  <div className="p-2 rounded-lg bg-surface border border-border/50">
                    <span className="font-semibold text-foreground block">Identifiant de compte (WABA ID / Ad Account) :</span>
                    Identifiant unique de votre entité d&apos;entreprise dans le Business Manager Meta.
                  </div>
                  <div className="p-2 rounded-lg bg-surface border border-border/50">
                    <span className="font-semibold text-foreground block">Identifiant de numéro (Phone Number ID) :</span>
                    Identifiant technique du numéro WhatsApp certifié pour l&apos;envoi de messages.
                  </div>
                  <div className="p-2 rounded-lg bg-surface border border-border/50">
                    <span className="font-semibold text-foreground block">Secret Webhook Fundoral :</span>
                    Clé privée générée par Fundoral. Votre site l&apos;utilise pour signer ses envois HTTP POST.
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <Button size="sm" variant="secondary" onClick={() => setWizardStep(1)}>
                  <CaretLeft size={14} className="mr-1" /> Retour
                </Button>
                <Button size="sm" onClick={() => setWizardStep(3)}>
                  Continuer vers Destinations <CaretRight size={14} className="ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: Choisir mes destinations */}
          {wizardStep === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-heading text-sm font-bold text-foreground">
                  Étape 3 : Choisissez vos destinations de publication effectives
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Sélectionnez les Pages Facebook et numéros effectivement accessibles avec votre jeton.
                </p>
              </div>

              <div className="space-y-3">
                {/* Page Selection */}
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Page Facebook de destination principale :
                  </label>
                  {pages.length > 0 ? (
                    <select
                      value={selectedPageId}
                      onChange={(e) => setSelectedPageId(e.target.value)}
                      className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                    >
                      {pages.map((p) => (
                        <option key={p.page_id} value={p.page_id}>
                          {p.name} (ID: {p.page_id})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-500">
                      Aucune Page Facebook détectée sur ce compte. Veuillez vérifier vos autorisations Meta dans Paramètres.
                    </div>
                  )}
                </div>

                {/* WhatsApp Destinations with Official Distinctions */}
                <div className="rounded-2xl border border-border bg-surface-2/40 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <WhatsappLogo size={18} weight="fill" className="text-emerald-500" />
                      <span className="font-bold text-xs text-foreground">Destinations WhatsApp</span>
                    </div>
                    <label className="flex items-center gap-2 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeWhatsApp}
                        onChange={(e) => setIncludeWhatsApp(e.target.checked)}
                        className="rounded border-border text-primary focus:ring-0"
                      />
                      <span className="font-semibold text-foreground">Diffuser également sur WhatsApp</span>
                    </label>
                  </div>

                  <div className="text-[11px] text-muted-foreground space-y-2 border-t border-border pt-2">
                    <p className="font-semibold text-foreground">Distinction officielle des canaux WhatsApp :</p>
                    <ul className="list-disc list-inside space-y-1 pl-1">
                      <li>
                        <strong className="text-foreground">Messagerie professionnelle individuelle :</strong> Notification 1-to-1 de vos prospects via l&apos;API Cloud officielle.
                      </li>
                      <li>
                        <strong className="text-foreground">Groupes professionnels :</strong> Réservé aux groupes où votre bot est administrateur vérifié. <span className="text-amber-500 font-medium">Un lien d&apos;invitation (chat.whatsapp.com) ne permet pas la publication automatisée par API.</span>
                      </li>
                      <li>
                        <strong className="text-foreground">Chaînes WhatsApp :</strong> Sujettes aux approbations Meta. Si l&apos;API n&apos;est pas accessible, un partage manuel guidé est proposé.
                      </li>
                    </ul>
                    <div className="pt-1">
                      <a
                        href="https://developers.facebook.com/documentation/business-messaging/whatsapp/groups"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline inline-flex items-center gap-1 font-semibold"
                      >
                        Documentation officielle WhatsApp Groups API <ArrowSquareOut size={10} />
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <Button size="sm" variant="secondary" onClick={() => setWizardStep(2)}>
                  <CaretLeft size={14} className="mr-1" /> Retour
                </Button>
                <Button size="sm" onClick={() => setWizardStep(4)}>
                  Continuer vers Règles de Diffusion <CaretRight size={14} className="ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 4: Définir ma diffusion */}
          {wizardStep === 4 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-heading text-sm font-bold text-foreground">
                  Étape 4 : Définissez vos règles de diffusion et mode de publication
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Choisissez les contenus à relayer et si vous préférez une publication instantanée ou une validation manuelle préalable.
                </p>
              </div>

              {/* Mode Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => setPublishMode("direct")}
                  className={cn(
                    "rounded-2xl border p-4 cursor-pointer transition space-y-1.5",
                    publishMode === "direct"
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "border-border bg-surface-2/40 hover:bg-surface-2"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-foreground">Publication Automatique Directe</span>
                    {publishMode === "direct" && <CheckCircle size={16} weight="fill" className="text-primary" />}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Dès qu&apos;une annonce est publiée sur votre site, Fundoral génère le texte optimisé et la diffuse immédiatement vers vos canaux.
                  </p>
                </div>

                <div
                  onClick={() => setPublishMode("approval")}
                  className={cn(
                    "rounded-2xl border p-4 cursor-pointer transition space-y-1.5",
                    publishMode === "approval"
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "border-border bg-surface-2/40 hover:bg-surface-2"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-foreground">Validation Humaine Requise</span>
                    {publishMode === "approval" && <CheckCircle size={16} weight="fill" className="text-primary" />}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Les publications préparées sont stockées en brouillons dans votre Studio ou File d&apos;attente pour relecture avant validation.
                  </p>
                </div>
              </div>

              {/* Content categories */}
              <div className="rounded-2xl border border-border bg-surface-2/40 p-4 space-y-2">
                <h4 className="text-xs font-bold text-foreground">Types d&apos;annonces concernées :</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoArticles}
                      onChange={(e) => setAutoArticles(e.target.checked)}
                      className="rounded border-border text-primary"
                    />
                    <span>Articles de Blog &amp; Actualités</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoProducts}
                      onChange={(e) => setAutoProducts(e.target.checked)}
                      className="rounded border-border text-primary"
                    />
                    <span>Produits E-Commerce</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoListings}
                      onChange={(e) => setAutoListings(e.target.checked)}
                      className="rounded border-border text-primary"
                    />
                    <span>Petites Annonces &amp; Immobilier</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <Button size="sm" variant="secondary" onClick={() => setWizardStep(3)}>
                  <CaretLeft size={14} className="mr-1" /> Retour
                </Button>
                <Button size="sm" onClick={() => setWizardStep(5)}>
                  Continuer vers Test &amp; Activation <CaretRight size={14} className="ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 5: Tester et activer */}
          {wizardStep === 5 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-heading text-sm font-bold text-foreground">
                  Étape 5 : Testez la transmission et activez votre règle
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Vérifiez la réception effective d&apos;un événement de test avant d&apos;activer la règle de synchronisation.
                </p>
              </div>

              {/* Test payload trigger */}
              <div className="rounded-2xl border border-border bg-surface-2/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-xs text-foreground">Événement de test de transmission</p>
                    <p className="text-[11px] text-muted-foreground">
                      Envoie une charge utile simulant la publication d&apos;une annonce depuis votre site.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleSendTestEvent}
                    disabled={testingWebhook}
                  >
                    <ArrowClockwise size={13} className={testingWebhook ? "animate-spin mr-1" : "mr-1"} />
                    {testingWebhook ? "Vérification…" : "Envoyer un événement de test"}
                  </Button>
                </div>

                {testSuccess !== null && (
                  <div
                    className={cn(
                      "rounded-xl border p-3 text-xs flex items-center gap-2 font-semibold",
                      testSuccess
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                        : "border-destructive/30 bg-destructive/10 text-destructive"
                    )}
                  >
                    {testSuccess ? (
                      <>
                        <CheckCircle size={16} weight="fill" />
                        <span>Transmission validée ! Le serveur Fundoral a correctement authentifié l&apos;événement.</span>
                      </>
                    ) : (
                      <>
                        <WarningCircle size={16} weight="bold" />
                        <span>Erreur lors du test. Veuillez vérifier votre secret webhook.</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Summary of Rule before Activation */}
              <div className="rounded-2xl border border-border bg-surface p-4 text-xs space-y-2">
                <h4 className="font-bold text-foreground">Récapitulatif de votre règle :</h4>
                <div className="grid grid-cols-2 gap-2 text-muted-foreground text-[11px]">
                  <div>Site source : <strong className="text-foreground">{siteUrlInput || "Site web"}</strong></div>
                  <div>Page Facebook cible : <strong className="text-foreground">{selectedPageId || "Page par défaut"}</strong></div>
                  <div>Mode : <strong className="text-foreground">{publishMode === "direct" ? "Publication directe" : "Validation manuelle"}</strong></div>
                  <div>WhatsApp : <strong className="text-foreground">{includeWhatsApp ? "Activé" : "Désactivé"}</strong></div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <Button size="sm" variant="secondary" onClick={() => setWizardStep(4)}>
                  <CaretLeft size={14} className="mr-1" /> Retour
                </Button>
                <Button size="sm" onClick={handleActivateAutomation} disabled={savingSite}>
                  <Sparkle size={14} className="mr-1" /> {savingSite ? "Activation…" : "Activer la règle d'automatisation"}
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* MODE PROFESSIONNEL / DEVELOPPEURS */}
      {activeMode === "pro" && (
        <div className="space-y-6">
          <Card className="p-6 space-y-5">
            <div>
              <h2 className="font-heading text-lg font-bold text-foreground flex items-center gap-2">
                <Code size={20} className="text-primary" />
                API Webhook &amp; Développeurs
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Envoyez directement vos requêtes HTTP POST sécurisées depuis vos backends, plateformes CRM ou workflows n8n/Zapier.
              </p>
            </div>

            {/* Credential Explanation Box */}
            <div className="rounded-2xl border border-border bg-surface-2/60 p-4 text-xs space-y-2">
              <h4 className="font-bold text-foreground flex items-center gap-1.5">
                <Question size={16} className="text-primary" />
                Comprendre vos identifiants de sécurité
              </h4>
              <ul className="space-y-1 text-muted-foreground text-[11px] list-disc list-inside">
                <li><strong>Secret Webhook Fundoral :</strong> Généré par Fundoral, ce secret authentifie vos requêtes entrantes (<code className="font-mono">x-webhook-secret</code>). Stockez-le dans vos variables d&apos;environnement.</li>
                <li><strong>Jeton d&apos;accès Meta (User Token) :</strong> Fourni par Meta pour gérer vos Pages et vos boosts publicitaires. Il reste protégé sur votre serveur et n&apos;est jamais exposé au client.</li>
                <li><strong>Identifiant de Page (Page ID) :</strong> L&apos;identifiant public de votre Page Facebook de destination.</li>
              </ul>
            </div>

            {/* Credentials Fields */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-foreground block mb-1">
                  URL Endpoint Webhook :
                </label>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    type="text"
                    value={webhookEndpoint}
                    className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-xs font-mono text-foreground outline-none"
                  />
                  <Button size="sm" variant="secondary" onClick={() => copyToClipboard(webhookEndpoint, "url")}>
                    {copiedUrl ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    <span className="ml-1">{copiedUrl ? "Copié" : "Copier"}</span>
                  </Button>
                </div>
              </div>

              {/* Secret Key with Masking & Rotation */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-foreground">
                    Secret API (x-webhook-secret) :
                  </label>
                  <button
                    type="button"
                    onClick={generateNewSecret}
                    disabled={generatingSecret}
                    className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
                  >
                    <ArrowClockwise size={12} className={generatingSecret ? "animate-spin" : ""} />
                    Régénérer le secret (Rotation)
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
                    variant="secondary"
                    onClick={() => setShowSecret(!showSecret)}
                    title={showSecret ? "Masquer" : "Afficher"}
                  >
                    {showSecret ? <EyeSlash size={14} /> : <Eye size={14} />}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => copyToClipboard(webhookSecret, "secret")}
                    disabled={!webhookSecret}
                  >
                    {copiedSecret ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    <span className="ml-1">{copiedSecret ? "Copié" : "Copier"}</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Code Documentation Snippets - Using ONLY environment variables */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-foreground">
                  Documentation &amp; Exemples d&apos;Intégration :
                </h3>
                <div className="flex items-center rounded-xl bg-surface-2 p-1 border border-border">
                  {(["nextjs", "curl", "php", "wordpress"] as const).map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setCodeLang(lang)}
                      className={cn(
                        "rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase transition",
                        codeLang === lang ? "bg-primary text-white" : "text-muted-foreground hover:bg-surface-3"
                      )}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              <pre className="overflow-x-auto rounded-2xl border border-border bg-[#0B0F19] p-4 text-[11px] font-mono text-zinc-300 leading-relaxed">
                {codeLang === "nextjs" &&
`// Next.js Route Handler / Server Action
// Le secret est stocké de manière sécurisée dans .env.local
export async function notifyFundoral(listing) {
  const res = await fetch("${webhookEndpoint}", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-webhook-secret": process.env.FUNDORAL_WEBHOOK_SECRET, // Variable d'environnement
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

                {codeLang === "curl" &&
`# Le secret est lu depuis la variable d'environnement de votre serveur
curl -X POST "${webhookEndpoint}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: $FUNDORAL_WEBHOOK_SECRET" \\
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

                {codeLang === "php" &&
`<?php
// Lecture sécurisée de la variable d'environnement
$secret = getenv('FUNDORAL_WEBHOOK_SECRET');

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
  "x-webhook-secret: " . $secret
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

  // Définissez FUNDORAL_WEBHOOK_SECRET dans votre wp-config.php
  $secret = defined('FUNDORAL_WEBHOOK_SECRET') ? FUNDORAL_WEBHOOK_SECRET : getenv('FUNDORAL_WEBHOOK_SECRET');

  wp_remote_post("${webhookEndpoint}", [
    'headers' => [
      'Content-Type' => 'application/json',
      'x-webhook-secret' => $secret
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

      {/* Connected Websites Registry */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h3 className="font-heading text-base font-bold text-foreground">
              Sites et passerelles connectés ({connectedWebsites.length})
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Liste des règles de synchronisation actives sur votre organisation.
            </p>
          </div>
        </div>

        {connectedWebsites.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            Aucun site web n&apos;est encore configuré. Utilisez l&apos;Assistant Guidé ci-dessus pour connecter votre premier site.
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {connectedWebsites.map((site) => (
              <div key={site.id} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-2 border border-border text-foreground">
                    <Globe size={18} />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground flex items-center gap-1.5">
                      {site.name}
                      <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[9px] font-mono uppercase text-muted-foreground">
                        {site.platform}
                      </span>
                    </div>
                    <div className="text-[11px] text-muted-foreground">{site.url}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-500 text-[11px]">
                    <CheckCircle size={12} weight="fill" /> Actif
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteWebsite(site.id)}
                    className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition cursor-pointer"
                    title="Supprimer ce site"
                  >
                    <Trash size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
