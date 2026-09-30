"use client";

import { Suspense, useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Buildings,
  Sparkle,
  Globe,
  Cpu,
  ShieldCheck,
  Sliders,
  Sun,
  Moon,
  Desktop,
  Check,
  WarningCircle,
  CheckCircle,
  Copy,
  Eye,
  EyeSlash,
  Trash,
  Plus,
  ArrowClockwise,
  Key,
  FacebookLogo,
  WhatsappLogo,
  InstagramLogo,
  LinkedinLogo,
  TiktokLogo,
  Rocket,
  Lock,
  Code,
  Users,
  QrCode,
  MagnifyingGlass,
  Info,
  ArrowUpRight,
  ArrowsClockwise,
  LinkSimple,
  LinkBreak,
} from "@phosphor-icons/react/dist/ssr";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTheme, type ThemeMode } from "@/components/theme-toggle";
import { cn } from "@/lib/cn";
import type { ImageSourcePref, AIProvider } from "@/lib/types";

// ============================================================================
// Types & Constants
// ============================================================================

export type FeatureState = "not_configured" | "connecting" | "connected" | "error" | "disabled";

export type SettingsTabId =
  | "workspace"
  | "brand"
  | "channels"
  | "ai"
  | "security"
  | "advanced";

interface SettingsCategory {
  id: SettingsTabId;
  label: string;
  description: string;
  icon: React.ComponentType<{ size?: number; weight?: "regular" | "bold" | "fill"; className?: string }>;
  badge?: string;
  keywords: string[];
}

const CATEGORIES: SettingsCategory[] = [
  {
    id: "workspace",
    label: "Organisation",
    description: "Nom de l'espace, administrateur, fuseau horaire et apparence",
    icon: Buildings,
    keywords: ["workspace", "organisation", "entreprise", "nom", "email", "langue", "fuseau", "timezone", "thème", "clair", "sombre", "system"],
  },
  {
    id: "brand",
    label: "Identité de marque IA",
    description: "Ton éditorial, style rédactionnel, hashtags et signature",
    icon: Sparkle,
    badge: "IA",
    keywords: ["marque", "brand", "voix", "ton", "style", "signature", "hashtags", "mots interdits", "prohibited"],
  },
  {
    id: "channels",
    label: "Réseaux connectés",
    description: "Facebook, WhatsApp Business, Instagram, LinkedIn et TikTok",
    icon: Globe,
    badge: "5",
    keywords: ["réseaux", "canaux", "facebook", "whatsapp", "instagram", "linkedin", "tiktok", "meta", "oauth", "groupes"],
  },
  {
    id: "ai",
    label: "Fournisseurs IA",
    description: "OpenAI, Claude, Gemini, OpenRouter et modèles gratuits",
    icon: Cpu,
    badge: "BYOK",
    keywords: ["ia", "ai", "fournisseurs", "openai", "claude", "anthropic", "gemini", "openrouter", "b.ai", "clé api", "byok"],
  },
  {
    id: "security",
    label: "Sécurité & Secrets",
    description: "Sessions actives, chiffrement AES-256, clé secrète et audit",
    icon: Lock,
    keywords: ["sécurité", "security", "chiffrement", "aes-256", "sessions", "secret", "webhook secret", "logs", "audit"],
  },
  {
    id: "advanced",
    label: "Avancé & Développeurs",
    description: "Webhooks, autopilot, Meta Ads et documentation API",
    icon: Sliders,
    keywords: ["avancé", "advanced", "webhooks", "autopilot", "meta ads", "api", "curl", "json", "développeurs", "cron"],
  },
];

const TIMEZONES = [
  "Europe/Paris",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Brussels",
  "Europe/Zurich",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "America/Montreal",
  "Africa/Douala",
  "Africa/Casablanca",
  "Africa/Dakar",
  "Asia/Dubai",
  "Asia/Karachi",
  "Asia/Kolkata",
  "UTC",
];

interface SettingsState {
  facebook_connected: boolean;
  facebook_configured?: boolean;
  facebook_app_id: string | null;
  facebook_config_id: string | null;
  facebook_app_secret_set?: boolean;
  facebook_user_name: string | null;
  default_page_name: string | null;
  image_source: ImageSourcePref;
  utm_suffix: string;
  auto_post_enabled: boolean;
  posts_per_day: number;
  posting_hours: number[];
  timezone: string;
  topic_source?: "mine" | "trending" | "mixed";
  preferred_ai_provider?: AIProvider;
  ai_model_name?: string;
  openai_base_url?: string;
  openai_configured?: boolean;
  anthropic_configured?: boolean;
  gemini_configured?: boolean;
  openrouter_configured?: boolean;
  meta_ad_account_id?: string;
  webhook_secret?: string;
  whatsapp_enabled?: boolean;
  whatsapp_api_url?: string;
  whatsapp_instance_name?: string;
  whatsapp_target_groups?: Array<{ id: string; name: string; enabled: boolean }>;
  whatsapp_configured?: boolean;
  workspace_name?: string;
  admin_email?: string;
  brand_name?: string;
  brand_description?: string;
  brand_tone?: string;
  brand_style?: string;
  brand_prohibited_words?: string;
  brand_hashtags?: string;
  brand_signature?: string;
  language?: string;
  theme_preference?: "light" | "dark" | "system";
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsSkeleton />}>
      <SettingsForm />
    </Suspense>
  );
}

function SettingsSkeleton() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 animate-pulse">
      <div className="h-8 w-64 rounded-xl bg-surface-2" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="h-64 rounded-2xl bg-surface-2" />
        <div className="md:col-span-3 h-96 rounded-2xl bg-surface-2" />
      </div>
    </div>
  );
}

// ============================================================================
// Main Settings Form
// ============================================================================

function SettingsForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { mode: currentTheme, setTheme } = useTheme();

  // Active Tab from URL with fallback
  const initialTab = (searchParams.get("tab") as SettingsTabId) || "workspace";
  const [activeTab, setActiveTab] = useState<SettingsTabId>(
    CATEGORIES.some((c) => c.id === initialTab) ? initialTab : "workspace"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [proMode, setProMode] = useState(false);

  // Core settings state from server
  const [settings, setSettings] = useState<SettingsState | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Form Fields State
  // Workspace
  const [workspaceName, setWorkspaceName] = useState("Fundoral Workspace");
  const [adminEmail, setAdminEmail] = useState("contact@fundoral.shop");
  const [language, setLanguage] = useState("fr");
  const [timezone, setTimezone] = useState("Europe/Paris");

  // Brand Voice & Identity
  const [brandName, setBrandName] = useState("Fundoral");
  const [brandDescription, setBrandDescription] = useState("");
  const [brandTone, setBrandTone] = useState("vendeur");
  const [brandStyle, setBrandStyle] = useState("moderne");
  const [brandProhibitedWords, setBrandProhibitedWords] = useState("");
  const [brandHashtags, setBrandHashtags] = useState("#business #marketing #automation");
  const [brandSignature, setBrandSignature] = useState("📍 Livraison rapide | 📲 WhatsApp disponible 24/7");

  // Meta App Credentials
  const [appId, setAppId] = useState("");
  const [appSecret, setAppSecret] = useState("");
  const [configId, setConfigId] = useState("");
  const [savingCreds, setSavingCreds] = useState(false);
  const [credsError, setCredsError] = useState<string | null>(null);
  const [redirectUri, setRedirectUri] = useState("");
  const [disconnecting, setDisconnecting] = useState(false);

  // BYOK AI Credentials & Custom Base URL
  const [preferredAi, setPreferredAi] = useState<AIProvider>("free");
  const [aiModelName, setAiModelName] = useState("");
  const [openAiBaseUrl, setOpenAiBaseUrl] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [anthropicKey, setAnthropicKey] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [openrouterKey, setOpenrouterKey] = useState("");
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [showAdvancedAi, setShowAdvancedAi] = useState(false);
  const [testingAi, setTestingAi] = useState<string | null>(null);
  const [aiTestResult, setAiTestResult] = useState<{
    ok: boolean;
    provider?: string;
    model?: string;
    latencyMs?: number;
    error?: string;
  } | null>(null);

  // WhatsApp Gateway
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [whatsappApiUrl, setWhatsappApiUrl] = useState("");
  const [whatsappApiKey, setWhatsappApiKey] = useState("");
  const [whatsappInstanceName, setWhatsappInstanceName] = useState("yamoura-bot");
  const [whatsappTargetGroups, setWhatsappTargetGroups] = useState<Array<{ id: string; name: string; enabled: boolean }>>([]);
  const [testingWhatsApp, setTestingWhatsApp] = useState(false);
  const [whatsAppTestResult, setWhatsAppTestResult] = useState<{
    connected: boolean;
    state: string;
    qrCode?: string | null;
    pairingCode?: string | null;
    error?: string | null;
  } | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [fetchingGroups, setFetchingGroups] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupJid, setNewGroupJid] = useState("");
  const [testingSendWa, setTestingSendWa] = useState(false);
  const [testSendWaTarget, setTestSendWaTarget] = useState("");
  const [testSendWaResult, setTestSendWaResult] = useState<{ success: boolean; error?: string } | null>(null);

  // Meta Ads Account
  const [metaAdAccount, setMetaAdAccount] = useState("");
  const [verifyingAds, setVerifyingAds] = useState(false);
  const [adsVerification, setAdsVerification] = useState<{
    ok: boolean;
    adAccountId: string;
    accountName?: string;
    currency?: string;
    accountStatus?: string;
    amountSpent?: string;
    hasAdsPermission: boolean;
    warning?: string;
    error?: string;
  } | null>(null);

  // Autopilot & Webhook
  const [autoPostEnabled, setAutoPostEnabled] = useState(false);
  const [postsPerDay, setPostsPerDay] = useState(3);
  const [postingHours, setPostingHours] = useState<number[]>([9, 13, 18]);
  const [webhookSecret, setWebhookSecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [webhookTestResult, setWebhookTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  // Common UI State
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [savingCategory, setSavingCategory] = useState<SettingsTabId | null>(null);
  const [savedSuccess, setSavedSuccess] = useState<SettingsTabId | null>(null);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);

  // Compute canonical Redirect URI
  useEffect(() => {
    let origin = window.location.origin;
    if (
      origin.startsWith("http://") &&
      !origin.includes("localhost") &&
      !origin.includes("127.0.0.1")
    ) {
      origin = origin.replace(/^http:\/\//, "https://");
    }
    setRedirectUri(`${origin}/api/facebook/oauth/callback`);
  }, []);

  // Sync tab with URL
  const handleTabChange = (tabId: SettingsTabId) => {
    setActiveTab(tabId);
    setSaveErrorMessage(null);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tabId);
    window.history.replaceState({}, "", url.toString());
  };

  // Fetch settings on mount
  useEffect(() => {
    setLoading(true);
    fetch("/api/settings")
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error ?? "Échec du chargement des paramètres.");
        setSettings(data);

        // Populate state
        setWorkspaceName(data.workspace_name || "Fundoral Workspace");
        setAdminEmail(data.admin_email || "contact@fundoral.shop");
        setLanguage(data.language || "fr");
        setTimezone(data.timezone || "Europe/Paris");

        setBrandName(data.brand_name || "Fundoral");
        setBrandDescription(data.brand_description || "");
        setBrandTone(data.brand_tone || "vendeur");
        setBrandStyle(data.brand_style || "moderne");
        setBrandProhibitedWords(data.brand_prohibited_words || "");
        setBrandHashtags(data.brand_hashtags || "#business #marketing #automation");
        setBrandSignature(data.brand_signature || "📍 Livraison rapide | 📲 WhatsApp disponible 24/7");

        setAppId(data.facebook_app_id ?? "");
        setConfigId(data.facebook_config_id ?? "");

        setPreferredAi(data.preferred_ai_provider ?? "free");
        setAiModelName(data.ai_model_name ?? "");
        setOpenAiBaseUrl(data.openai_base_url ?? "");

        setMetaAdAccount(data.meta_ad_account_id ?? "");
        setWebhookSecret(data.webhook_secret ?? "");

        setWhatsappEnabled(Boolean(data.whatsapp_enabled));
        setWhatsappApiUrl(data.whatsapp_api_url ?? "");
        setWhatsappInstanceName(data.whatsapp_instance_name ?? "yamoura-bot");
        setWhatsappTargetGroups(data.whatsapp_target_groups ?? []);

        setAutoPostEnabled(Boolean(data.auto_post_enabled));
        setPostsPerDay(data.posts_per_day || 3);
        setPostingHours(data.posting_hours || [9, 13, 18]);
      })
      .catch((err) => setLoadError(err instanceof Error ? err.message : "Erreur de chargement."))
      .finally(() => setLoading(false));
  }, []);

  // Copy helper
  function copyToClipboard(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  }

  // Unified Saver
  async function saveSection(tabId: SettingsTabId, patch: Record<string, unknown>) {
    setSavingCategory(tabId);
    setSaveErrorMessage(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur lors de la sauvegarde.");
      setSettings(data);
      setSavedSuccess(tabId);
      setTimeout(() => setSavedSuccess(null), 3000);
    } catch (err) {
      setSaveErrorMessage(err instanceof Error ? err.message : "Erreur d'enregistrement.");
    } finally {
      setSavingCategory(null);
    }
  }

  // Meta App Credentials Save
  async function saveCredentials() {
    setCredsError(null);
    if (!appId.trim()) {
      setCredsError("Indiquez l'App ID de votre application Meta.");
      return;
    }
    if (!appSecret.trim() && !settings?.facebook_app_secret_set) {
      setCredsError("Indiquez l'App Secret de votre application Meta.");
      return;
    }

    setSavingCreds(true);
    try {
      const res = await fetch("/api/facebook/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appId: appId.trim(),
          appSecret: appSecret.trim() || undefined,
          configId: configId.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Impossible d'enregistrer ces identifiants Meta.");

      setAppSecret("");
      setSettings((s) =>
        s
          ? {
              ...s,
              facebook_app_id: appId.trim(),
              facebook_config_id: configId.trim() || null,
              facebook_app_secret_set: true,
              facebook_configured: true,
            }
          : s
      );
      setSavedSuccess("channels");
      setTimeout(() => setSavedSuccess(null), 3000);
    } catch (err) {
      setCredsError(err instanceof Error ? err.message : "Erreur d'enregistrement.");
    } finally {
      setSavingCreds(false);
    }
  }

  // Disconnect Facebook
  async function disconnectFacebook() {
    if (
      !confirm(
        "Attention : Déconnecter Facebook supprimera les autorisations de publication automatique pour vos pages. Voulez-vous continuer ?"
      )
    )
      return;

    setDisconnecting(true);
    try {
      await fetch("/api/facebook/disconnect", { method: "POST" });
      setSettings((s) =>
        s
          ? {
              ...s,
              facebook_connected: false,
              facebook_user_name: null,
              default_page_name: null,
            }
          : s
      );
      setSavedSuccess("channels");
      setTimeout(() => setSavedSuccess(null), 3000);
    } finally {
      setDisconnecting(false);
    }
  }

  // Test AI Connection
  async function testAi(providerName: string, key?: string) {
    setTestingAi(providerName);
    setAiTestResult(null);
    try {
      const startTime = performance.now();
      const res = await fetch("/api/ai/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseUrl: openAiBaseUrl.trim() || undefined,
          apiKey: key?.trim() || openaiKey.trim() || undefined,
          model: aiModelName.trim() || undefined,
        }),
      });
      const latencyMs = Math.round(performance.now() - startTime);
      const data = await res.json();
      if (!res.ok || data.ok === false) {
        setAiTestResult({
          ok: false,
          provider: providerName,
          error: data.error || "Échec de validation de la clé API.",
        });
      } else {
        setAiTestResult({
          ok: true,
          provider: providerName,
          model: data.model || "Modèle validé",
          latencyMs,
        });
      }
    } catch (e) {
      setAiTestResult({
        ok: false,
        provider: providerName,
        error: e instanceof Error ? e.message : "Erreur réseau lors du test.",
      });
    } finally {
      setTestingAi(null);
    }
  }

  // Test WhatsApp
  async function testWhatsApp() {
    setTestingWhatsApp(true);
    setWhatsAppTestResult(null);
    try {
      const res = await fetch("/api/whatsapp/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiUrl: whatsappApiUrl.trim() || undefined,
          apiKey: whatsappApiKey.trim() || undefined,
          instanceName: whatsappInstanceName.trim() || undefined,
        }),
      });
      const data = await res.json();
      setWhatsAppTestResult(data);
      if (data.qrCode) {
        setShowQrModal(true);
      }
    } catch (e) {
      setWhatsAppTestResult({
        connected: false,
        state: "refused",
        error: e instanceof Error ? e.message : "Erreur de connexion à la passerelle.",
      });
    } finally {
      setTestingWhatsApp(false);
    }
  }

  // Verify Meta Ads Account
  async function verifyAdsAccount() {
    if (!metaAdAccount.trim()) {
      alert("Veuillez renseigner un ID de compte publicitaire (ex: act_1234567890).");
      return;
    }
    setVerifyingAds(true);
    setAdsVerification(null);
    try {
      const res = await fetch("/api/facebook/ads/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adAccountId: metaAdAccount.trim() }),
      });
      const data = await res.json();
      setAdsVerification(data);
    } catch (e) {
      setAdsVerification({
        ok: false,
        adAccountId: metaAdAccount,
        hasAdsPermission: false,
        error: e instanceof Error ? e.message : "Erreur de vérification du compte publicitaire.",
      });
    } finally {
      setVerifyingAds(false);
    }
  }

  // Filter categories by search
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return CATEGORIES;
    const q = searchQuery.toLowerCase().trim();
    return CATEGORIES.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.keywords.some((k) => k.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  if (loadError) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive flex items-start gap-3">
          <WarningCircle size={22} className="shrink-0 mt-0.5" />
          <div>
            <h3 className="font-heading font-bold text-base">Impossible de charger les paramètres</h3>
            <p className="mt-1">{loadError}</p>
            <Button size="sm" variant="outline" className="mt-3" onClick={() => window.location.reload()}>
              <ArrowClockwise size={14} /> Réessayer
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (loading || !settings) {
    return <SettingsSkeleton />;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-2 border-b border-border">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Paramètres &amp; Configuration
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gérez votre organisation, vos identifiants de marque, canaux connectés et intelligence artificielle.
          </p>
        </div>

        {/* Search & Mode Switcher */}
        <div className="flex items-center gap-2.5">
          <div className="relative w-full sm:w-60">
            <MagnifyingGlass
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <input
              type="text"
              placeholder="Rechercher un réglage..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition shadow-sm"
            />
          </div>

          <button
            type="button"
            onClick={() => setProMode(!proMode)}
            className={cn(
              "flex h-8 items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition cursor-pointer shrink-0 shadow-sm",
              proMode
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border bg-surface text-muted-foreground hover:bg-surface-2 hover:text-foreground"
            )}
            title="Basculer entre la vue simplifiée et la vue avancée"
          >
            <Sliders size={14} weight={proMode ? "bold" : "regular"} />
            <span className="hidden sm:inline">{proMode ? "Mode Expert" : "Mode Simple"}</span>
          </button>
        </div>
      </div>

      {/* Global Success / Error Banners */}
      {saveErrorMessage && (
        <div className="flex items-center gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive animate-in fade-in">
          <WarningCircle size={16} className="shrink-0" />
          <span>{saveErrorMessage}</span>
        </div>
      )}

      {/* Main Layout: Left Navigation + Right Content */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        {/* Navigation Sidebar */}
        <aside className="md:col-span-4 lg:col-span-3 space-y-1">
          {/* Mobile Category Dropdown */}
          <div className="md:hidden mb-4">
            <label className="text-xs font-semibold text-muted-foreground block mb-1">
              Catégorie active
            </label>
            <select
              value={activeTab}
              onChange={(e) => handleTabChange(e.target.value as SettingsTabId)}
              className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary shadow-sm"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Desktop Categories List */}
          <nav className="hidden md:block space-y-1">
            {filteredCategories.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeTab === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleTabChange(cat.id)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-medium text-left transition group cursor-pointer",
                    isActive
                      ? "bg-primary/10 text-primary font-bold shadow-sm border border-primary/20"
                      : "text-muted-foreground hover:bg-surface hover:text-foreground border border-transparent"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon size={18} weight={isActive ? "fill" : "regular"} className="shrink-0" />
                    <span className="truncate">{cat.label}</span>
                  </div>
                  {cat.badge && (
                    <span
                      className={cn(
                        "rounded-md px-1.5 py-0.5 text-[10px] font-bold shrink-0",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "bg-surface-2 text-muted-foreground group-hover:bg-surface-3"
                      )}
                    >
                      {cat.badge}
                    </span>
                  )}
                </button>
              );
            })}

            {filteredCategories.length === 0 && (
              <p className="p-3 text-center text-xs text-muted-foreground">
                Aucun paramètre trouvé pour &quot;{searchQuery}&quot;.
              </p>
            )}
          </nav>

          {/* Quick Info Card */}
          <div className="hidden md:block mt-6 p-4 rounded-2xl border border-border bg-surface-2/60 text-xs text-muted-foreground space-y-2">
            <div className="flex items-center gap-2 font-bold text-foreground">
              <ShieldCheck size={16} className="text-emerald-500" />
              <span>Chiffrement certifié</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Toutes vos clés API et secrets de connexion sont protégés par un chiffrement AES-256-GCM côté serveur.
            </p>
          </div>
        </aside>

        {/* Right Content Area */}
        <main className="md:col-span-8 lg:col-span-9 space-y-6">
          {/* ========================================================== */}
          {/* TAB 1: WORKSPACE / ORGANISATION                            */}
          {/* ========================================================== */}
          {activeTab === "workspace" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <Card>
                <div className="flex items-start justify-between pb-4 border-b border-border">
                  <div>
                    <h2 className="font-heading font-bold text-base text-foreground flex items-center gap-2">
                      <Buildings size={20} className="text-primary" />
                      Espace de Travail &amp; Organisation
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Personnalisez les détails généraux de votre compte et de votre équipe.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    loading={savingCategory === "workspace"}
                    onClick={() =>
                      saveSection("workspace", {
                        workspace_name: workspaceName.trim(),
                        admin_email: adminEmail.trim(),
                        language,
                        timezone,
                      })
                    }
                  >
                    {savedSuccess === "workspace" ? "Enregistré ✓" : "Enregistrer"}
                  </Button>
                </div>

                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">
                      Nom de l&apos;Organisation ou Espace
                    </label>
                    <input
                      value={workspaceName}
                      onChange={(e) => setWorkspaceName(e.target.value)}
                      placeholder="Ex: Fundoral E-Commerce"
                      className="w-full rounded-xl border border-border bg-surface-2 px-3.5 py-2 text-xs text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                    />
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Apparaît dans vos rapports et en-têtes d&apos;emails.
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">
                      Email de l&apos;Administrateur
                    </label>
                    <input
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="contact@fundoral.shop"
                      className="w-full rounded-xl border border-border bg-surface-2 px-3.5 py-2 text-xs text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                    />
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Destinataire des alertes d&apos;autopilote et de synchronisation.
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">
                      Langue de l&apos;interface
                    </label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full rounded-xl border border-border bg-surface-2 px-3.5 py-2 text-xs text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                    >
                      <option value="fr">🇫🇷 Français (Standard)</option>
                      <option value="en">🇬🇧 English</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">
                      Fuseau Horaire de Publication
                    </label>
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="w-full rounded-xl border border-border bg-surface-2 px-3.5 py-2 text-xs text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                    >
                      {TIMEZONES.map((tz) => (
                        <option key={tz} value={tz}>
                          {tz}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </Card>

              {/* Theme Preference Card */}
              <Card>
                <div className="flex items-start justify-between pb-3 border-b border-border">
                  <div>
                    <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-2">
                      <Sun size={18} className="text-amber-500" />
                      Apparence &amp; Thème Visuel
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Choisissez votre mode d&apos;affichage préféré. Mémorisé sur tous vos appareils.
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Light Mode Option */}
                  <button
                    type="button"
                    onClick={() => setTheme("light")}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-2xl border text-center transition cursor-pointer",
                      currentTheme === "light"
                        ? "border-primary bg-primary/5 text-primary ring-2 ring-primary/20 font-bold"
                        : "border-border bg-surface-2/60 text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                    )}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                      <Sun size={22} weight="bold" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">Clair</p>
                      <p className="text-[10px] text-muted-foreground">Idéal pour le travail de jour</p>
                    </div>
                  </button>

                  {/* Dark Mode Option */}
                  <button
                    type="button"
                    onClick={() => setTheme("dark")}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-2xl border text-center transition cursor-pointer",
                      currentTheme === "dark"
                        ? "border-primary bg-primary/5 text-primary ring-2 ring-primary/20 font-bold"
                        : "border-border bg-surface-2/60 text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                    )}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                      <Moon size={22} weight="bold" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">Sombre</p>
                      <p className="text-[10px] text-muted-foreground">Confort visuel et contraste</p>
                    </div>
                  </button>

                  {/* System Mode Option */}
                  <button
                    type="button"
                    onClick={() => setTheme("system")}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-2xl border text-center transition cursor-pointer",
                      currentTheme === "system"
                        ? "border-primary bg-primary/5 text-primary ring-2 ring-primary/20 font-bold"
                        : "border-border bg-surface-2/60 text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                    )}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-3 text-foreground">
                      <Desktop size={22} weight="bold" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">Système</p>
                      <p className="text-[10px] text-muted-foreground">Suit le réglage de votre OS</p>
                    </div>
                  </button>
                </div>
              </Card>
            </div>
          )}

          {/* ========================================================== */}
          {/* TAB 2: IDENTITÉ DE MARQUE IA                               */}
          {/* ========================================================== */}
          {activeTab === "brand" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <Card>
                <div className="flex items-start justify-between pb-4 border-b border-border">
                  <div>
                    <h2 className="font-heading font-bold text-base text-foreground flex items-center gap-2">
                      <Sparkle size={20} className="text-primary" weight="fill" />
                      Identité de Marque &amp; Brand Voice IA
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Définissez l&apos;ADN de communication et le ton que l&apos;IA adoptera pour rédiger vos publications sociales.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    loading={savingCategory === "brand"}
                    onClick={() =>
                      saveSection("brand", {
                        brand_name: brandName.trim(),
                        brand_description: brandDescription.trim(),
                        brand_tone: brandTone,
                        brand_style: brandStyle,
                        brand_prohibited_words: brandProhibitedWords.trim(),
                        brand_hashtags: brandHashtags.trim(),
                        brand_signature: brandSignature.trim(),
                      })
                    }
                  >
                    {savedSuccess === "brand" ? "Enregistré ✓" : "Enregistrer la marque"}
                  </Button>
                </div>

                <div className="mt-5 space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-semibold text-foreground block mb-1">
                        Nom officiel de la Marque :
                      </label>
                      <input
                        value={brandName}
                        onChange={(e) => setBrandName(e.target.value)}
                        placeholder="Ex: Fundoral"
                        className="w-full rounded-xl border border-border bg-surface-2 px-3.5 py-2 text-xs text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-foreground block mb-1">
                        Ton de communication IA :
                      </label>
                      <select
                        value={brandTone}
                        onChange={(e) => setBrandTone(e.target.value)}
                        className="w-full rounded-xl border border-border bg-surface-2 px-3.5 py-2 text-xs text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                      >
                        <option value="vendeur">🛍 Vendeur &amp; Conversion (E-commerce / Offres directes)</option>
                        <option value="professionnel">💼 Professionnel &amp; Expert (B2B / SaaS / Agence)</option>
                        <option value="premium">💎 Luxe &amp; Haut de Gamme (Immobilier / Prestigieux)</option>
                        <option value="humoristique">😄 Viral &amp; Humoristique (Communautaire / TikTok)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-foreground block mb-1">
                      Description de votre activité &amp; proposition de valeur :
                    </label>
                    <textarea
                      rows={2}
                      value={brandDescription}
                      onChange={(e) => setBrandDescription(e.target.value)}
                      placeholder="Ex: Plateforme marketing tout-en-un d'automatisation sociale pour PME et e-commerçants..."
                      className="w-full rounded-xl border border-border bg-surface-2 px-3.5 py-2 text-xs text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                    />
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      L&apos;IA s&apos;appuie sur cette description pour comprendre vos produits et vos arguments clés.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-semibold text-foreground block mb-1">
                        Style rédactionnel :
                      </label>
                      <select
                        value={brandStyle}
                        onChange={(e) => setBrandStyle(e.target.value)}
                        className="w-full rounded-xl border border-border bg-surface-2 px-3.5 py-2 text-xs text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                      >
                        <option value="moderne">Moderne &amp; Épuré (Phrases courtes, émojis ciblés)</option>
                        <option value="storytelling">Storytelling &amp; Émotion (Accroche narrative forte)</option>
                        <option value="direct">Direct &amp; Percutant (Appel à l&apos;action immédiat)</option>
                        <option value="pedagogique">Informatif &amp; Pédagogique (Conseils à forte valeur)</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-semibold text-foreground block mb-1">
                        Mots ou termes interdits (Blacklist) :
                      </label>
                      <input
                        value={brandProhibitedWords}
                        onChange={(e) => setBrandProhibitedWords(e.target.value)}
                        placeholder="Ex: arnaque, pas cher, urgent, gratuit"
                        className="w-full rounded-xl border border-border bg-surface-2 px-3.5 py-2 text-xs text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-semibold text-foreground block mb-1">
                        Hashtags officiels de la marque :
                      </label>
                      <input
                        value={brandHashtags}
                        onChange={(e) => setBrandHashtags(e.target.value)}
                        placeholder="#fundoral #business #automation"
                        className="w-full rounded-xl border border-border bg-surface-2 px-3.5 py-2 text-xs font-mono text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-foreground block mb-1">
                        Signature automatique de fin de post :
                      </label>
                      <input
                        value={brandSignature}
                        onChange={(e) => setBrandSignature(e.target.value)}
                        placeholder="📍 Douala | 📲 WhatsApp disponible 24/7"
                        className="w-full rounded-xl border border-border bg-surface-2 px-3.5 py-2 text-xs text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                      />
                    </div>
                  </div>

                  {/* Live AI Sample Preview */}
                  <div className="mt-4 rounded-xl border border-border bg-surface-2/70 p-3.5 space-y-1.5">
                    <p className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                      <Sparkle size={13} className="text-primary" /> Exemple de rendu généré par l&apos;IA :
                    </p>
                    <p className="text-xs text-foreground/90 italic leading-relaxed">
                      &quot;🚀 Découvrez la nouvelle gamme {brandName} ! Conçue pour optimiser vos performances sans compromis. Profitez dès aujourd&apos;hui de nos offres exclusives.
                      <br />
                      {brandSignature}
                      <br />
                      <span className="font-mono text-primary text-[11px]">{brandHashtags}</span>&quot;
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* ========================================================== */}
          {/* TAB 3: RÉSEAUX CONNECTÉS (CONNECTED CHANNELS)             */}
          {/* ========================================================== */}
          {activeTab === "channels" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-heading font-bold text-base text-foreground flex items-center gap-2">
                    <Globe size={20} className="text-primary" />
                    Canaux &amp; Réseaux Sociaux Connectés
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Statut réel et contrôle des passerelles de diffusion. Aucun statut fictif.
                  </p>
                </div>
                <Link href="/dashboard/connections">
                  <Button size="sm" variant="outline">
                    <Sliders size={13} /> Gestion multi-pages ↗
                  </Button>
                </Link>
              </div>

              {/* 1. Facebook Channel Card */}
              <Card>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500 shrink-0">
                      <FacebookLogo size={28} weight="fill" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-heading font-bold text-sm text-foreground">Facebook &amp; Meta Graph</h3>
                        {settings.facebook_connected ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <CheckCircle size={12} weight="bold" /> Connecté
                          </span>
                        ) : settings.facebook_configured === false ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            Non configuré
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-surface-3 px-2.5 py-0.5 text-[10px] font-bold text-muted-foreground">
                            Prêt à connecter
                          </span>
                        )}
                      </div>

                      {settings.facebook_connected ? (
                        <p className="text-xs text-foreground font-medium mt-1">
                          Connecté en tant que <strong>{settings.facebook_user_name ?? "Administrateur"}</strong>
                          {settings.default_page_name && (
                            <span className="text-muted-foreground"> — Page active : {settings.default_page_name}</span>
                          )}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground mt-1">
                          Permet la publication automatique des posts, stories et reels sur vos pages Facebook.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {settings.facebook_connected ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={disconnectFacebook}
                        loading={disconnecting}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <LinkBreak size={14} /> Se déconnecter
                      </Button>
                    ) : (
                      // eslint-disable-next-line @next/next/no-html-link-for-pages
                      <a
                        href={
                          settings.facebook_config_id
                            ? `/api/facebook/oauth/start?config_id=${encodeURIComponent(settings.facebook_config_id.trim())}`
                            : "/api/facebook/oauth/start"
                        }
                        aria-disabled={settings.facebook_configured === false}
                        className={settings.facebook_configured === false ? "pointer-events-none" : undefined}
                      >
                        <Button size="sm" disabled={settings.facebook_configured === false}>
                          <LinkSimple size={14} /> Se connecter à Facebook
                        </Button>
                      </a>
                    )}
                  </div>
                </div>

                {/* Meta App Setup (Collapsed if connected, visible if needed) */}
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground mb-2">
                    <span className="flex items-center gap-1.5">
                      <Key size={14} /> Identifiants de l&apos;application Meta (App ID &amp; App Secret)
                    </span>
                    <a
                      href="https://developers.facebook.com/apps"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      developers.facebook.com/apps ↗
                    </a>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <input
                        value={appId}
                        onChange={(e) => setAppId(e.target.value)}
                        placeholder="App ID Meta (ex: 1234567890123456)"
                        className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs font-mono text-foreground outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <input
                        type="password"
                        value={appSecret}
                        onChange={(e) => setAppSecret(e.target.value)}
                        placeholder={
                          settings.facebook_app_secret_set
                            ? "•••••••••••• (enregistrée — retapez pour modifier)"
                            : "App Secret Meta"
                        }
                        className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs font-mono text-foreground outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  {credsError && <p className="text-xs text-destructive mt-1.5">{credsError}</p>}

                  <div className="mt-2.5 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-muted-foreground truncate max-w-sm">
                      URI de redirection OAuth : <code className="font-mono">{redirectUri}</code>
                    </span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => copyToClipboard(redirectUri, "redirectUri")}
                      >
                        {copiedKey === "redirectUri" ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                        Copier l&apos;URI
                      </Button>
                      <Button size="sm" onClick={saveCredentials} loading={savingCreds}>
                        Enregistrer
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>

              {/* 2. WhatsApp Business Channel Card */}
              <Card>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 shrink-0">
                      <WhatsappLogo size={28} weight="fill" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-heading font-bold text-sm text-foreground">Passerelle WhatsApp Business</h3>
                        {whatsAppTestResult?.connected || (settings.whatsapp_configured && settings.whatsapp_enabled) ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <CheckCircle size={12} weight="bold" /> En ligne &amp; Connecté
                          </span>
                        ) : whatsAppTestResult?.state === "connecting" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            <QrCode size={12} weight="bold" /> Scan QR requis
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-surface-3 px-2.5 py-0.5 text-[10px] font-bold text-muted-foreground">
                            Non connecté
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Diffusion automatique d&apos;annonces dans vos canaux et groupes WhatsApp cibles via Evolution API ou WhatsApp Web.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button size="sm" variant="secondary" onClick={testWhatsApp} loading={testingWhatsApp}>
                      <ArrowClockwise size={13} className={testingWhatsApp ? "animate-spin" : ""} />
                      Tester la connexion
                    </Button>
                    <Button
                      size="sm"
                      loading={savingCategory === "channels"}
                      onClick={() =>
                        saveSection("channels", {
                          whatsapp_enabled: whatsappEnabled,
                          whatsapp_api_url: whatsappApiUrl.trim() || null,
                          whatsapp_instance_name: whatsappInstanceName.trim() || "yamoura-bot",
                          whatsapp_target_groups: whatsappTargetGroups,
                          ...(whatsappApiKey.trim() ? { whatsapp_api_key: whatsappApiKey.trim() } : {}),
                        })
                      }
                    >
                      {savedSuccess === "channels" ? "Enregistré ✓" : "Enregistrer WhatsApp"}
                    </Button>
                  </div>
                </div>

                {/* WhatsApp Auto-Diffusion Toggle & Inputs */}
                <div className="mt-4 pt-4 border-t border-border space-y-3">
                  <div className="flex items-center justify-between rounded-xl border border-border bg-surface-2 p-3">
                    <div>
                      <p className="text-xs font-semibold text-foreground">
                        Diffusion automatique sur réception d&apos;annonce
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Publie automatiquement l&apos;image et les détails dans les groupes WhatsApp cibles sélectionnés.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={whatsappEnabled}
                      onChange={(e) => setWhatsappEnabled(e.target.checked)}
                      className="h-4 w-4 rounded accent-emerald-500 cursor-pointer"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="text-xs font-semibold text-muted-foreground block mb-1">
                        URL de la passerelle API (Evolution API)
                      </label>
                      <input
                        value={whatsappApiUrl}
                        onChange={(e) => setWhatsappApiUrl(e.target.value)}
                        placeholder="https://wa.yamoura.com ou http://localhost:8080"
                        className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs font-mono text-foreground outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground block mb-1">
                        Nom de session / Instance
                      </label>
                      <input
                        value={whatsappInstanceName}
                        onChange={(e) => setWhatsappInstanceName(e.target.value)}
                        placeholder="yamoura-bot"
                        className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs font-mono text-foreground outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">
                      Clé d&apos;API / Token secret de la passerelle
                    </label>
                    <input
                      type="password"
                      value={whatsappApiKey}
                      onChange={(e) => setWhatsappApiKey(e.target.value)}
                      placeholder={
                        settings.whatsapp_configured
                          ? "•••••••••••• (enregistrée — retapez pour modifier)"
                          : "Clé API secrète de la passerelle WhatsApp"
                      }
                      className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs font-mono text-foreground outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Test Result Message */}
                  {whatsAppTestResult && (
                    <div
                      className={cn(
                        "rounded-xl border p-3 text-xs",
                        whatsAppTestResult.connected
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : whatsAppTestResult.state === "connecting"
                          ? "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          : "border-destructive/30 bg-destructive/10 text-destructive"
                      )}
                    >
                      {whatsAppTestResult.connected ? (
                        <p className="flex items-center gap-2 font-medium">
                          <CheckCircle size={14} weight="bold" /> Passerelle WhatsApp connectée avec succès ! Session active.
                        </p>
                      ) : whatsAppTestResult.state === "connecting" ? (
                        <div className="flex items-center justify-between">
                          <p className="flex items-center gap-2 font-medium">
                            <QrCode size={14} weight="bold" /> En attente d&apos;appairage. Scannez le QR Code depuis votre téléphone.
                          </p>
                          <Button size="sm" variant="secondary" onClick={() => setShowQrModal(true)}>
                            Ouvrir le QR Code
                          </Button>
                        </div>
                      ) : (
                        <p className="flex items-center gap-2 font-medium">
                          <WarningCircle size={14} weight="bold" /> {whatsAppTestResult.error || "Impossible de joindre la passerelle."}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Target Groups Management */}
                  <div className="pt-3 border-t border-border">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Users size={14} className="text-emerald-500" /> Groupes cibles autorisés ({whatsappTargetGroups.length})
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        placeholder="Nom du groupe (ex: Yamoura Immo)"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        className="rounded-xl border border-border bg-surface-2 px-3 py-1.5 text-xs text-foreground outline-none focus:border-emerald-500"
                      />
                      <input
                        placeholder="JID ou Numéro (ex: 1203630123@g.us)"
                        value={newGroupJid}
                        onChange={(e) => setNewGroupJid(e.target.value)}
                        className="rounded-xl border border-border bg-surface-2 px-3 py-1.5 text-xs font-mono text-foreground outline-none focus:border-emerald-500"
                      />
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={!newGroupJid.trim()}
                        onClick={() => {
                          if (!newGroupJid.trim()) return;
                          const name = newGroupName.trim() || newGroupJid.trim();
                          const updated = [...whatsappTargetGroups, { id: newGroupJid.trim(), name, enabled: true }];
                          setWhatsappTargetGroups(updated);
                          setNewGroupName("");
                          setNewGroupJid("");
                        }}
                      >
                        <Plus size={13} /> Ajouter le groupe
                      </Button>
                    </div>

                    <div className="mt-2 space-y-1">
                      {whatsappTargetGroups.map((g) => (
                        <div
                          key={g.id}
                          className="flex items-center justify-between rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <input
                              type="checkbox"
                              checked={g.enabled}
                              onChange={() =>
                                setWhatsappTargetGroups(
                                  whatsappTargetGroups.map((item) =>
                                    item.id === g.id ? { ...item, enabled: !item.enabled } : item
                                  )
                                )
                              }
                              className="rounded accent-emerald-500 cursor-pointer"
                            />
                            <span className="font-semibold text-foreground truncate">{g.name}</span>
                            <span className="font-mono text-[10px] text-muted-foreground truncate">{g.id}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setWhatsappTargetGroups(whatsappTargetGroups.filter((item) => item.id !== g.id))
                            }
                            className="text-muted-foreground hover:text-destructive cursor-pointer"
                          >
                            <Trash size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>

              {/* 3. Instagram, LinkedIn & TikTok Overview Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Instagram */}
                <Card className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-pink-500/10 text-pink-500">
                        <InstagramLogo size={20} weight="fill" />
                      </div>
                      <span className="text-xs font-bold text-foreground">Instagram</span>
                    </div>
                    <span className="rounded-full bg-surface-3 px-2 py-0.5 text-[9px] font-semibold text-muted-foreground">
                      {settings.facebook_connected ? "Lié via Meta" : "Non configuré"}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-tight">
                    {settings.facebook_connected
                      ? "Synchronisé automatiquement via le compte Meta professionnel relié à votre page."
                      : "Nécessite la connexion préalable de votre compte Facebook."}
                  </p>
                </Card>

                {/* LinkedIn */}
                <Card className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
                        <LinkedinLogo size={20} weight="fill" />
                      </div>
                      <span className="text-xs font-bold text-foreground">LinkedIn</span>
                    </div>
                    <span className="rounded-full bg-surface-3 px-2 py-0.5 text-[9px] font-semibold text-muted-foreground">
                      Disponible
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-tight">
                    Diffusion automatisée des posts sur votre profil ou page entreprise via la passerelle Webhook.
                  </p>
                </Card>

                {/* TikTok */}
                <Card className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500">
                        <TiktokLogo size={20} weight="fill" />
                      </div>
                      <span className="text-xs font-bold text-foreground">TikTok</span>
                    </div>
                    <span className="rounded-full bg-surface-3 px-2 py-0.5 text-[9px] font-semibold text-muted-foreground">
                      Vidéo 9:16
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-tight">
                    Téléversement direct pour les vidéos et reels courts via les endpoints automatisés.
                  </p>
                </Card>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* TAB 4: FOURNISSEURS IA (AI PROVIDERS)                      */}
          {/* ========================================================== */}
          {activeTab === "ai" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <Card>
                <div className="flex items-start justify-between pb-4 border-b border-border">
                  <div>
                    <h2 className="font-heading font-bold text-base text-foreground flex items-center gap-2">
                      <Cpu size={20} className="text-primary" weight="fill" />
                      Fournisseurs IA &amp; Clés API (BYOK)
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Renseignez vos propres clés pour bénéficier des modèles les plus récents (GPT-4o, Claude 3.5 Sonnet, Gemini).
                    </p>
                  </div>
                  <Button
                    size="sm"
                    loading={savingCategory === "ai"}
                    onClick={() =>
                      saveSection("ai", {
                        preferred_ai_provider: preferredAi,
                        ai_model_name: aiModelName.trim() || null,
                        openai_base_url: openAiBaseUrl.trim() || null,
                        ...(openaiKey.trim() ? { openai_api_key: openaiKey.trim() } : {}),
                        ...(anthropicKey.trim() ? { anthropic_api_key: anthropicKey.trim() } : {}),
                        ...(geminiKey.trim() ? { gemini_api_key: geminiKey.trim() } : {}),
                        ...(openrouterKey.trim() ? { openrouter_api_key: openrouterKey.trim() } : {}),
                      })
                    }
                  >
                    {savedSuccess === "ai" ? "Clés enregistrées ✓" : "Enregistrer les clés"}
                  </Button>
                </div>

                {/* Main Provider Selector */}
                <div className="mt-5">
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    Fournisseur d&apos;intelligence artificielle principal :
                  </label>
                  <select
                    value={preferredAi}
                    onChange={(e) => setPreferredAi(e.target.value as AIProvider)}
                    className="w-full rounded-xl border border-border bg-surface-2 px-3.5 py-2 text-sm text-foreground outline-none focus:border-primary shadow-sm"
                  >
                    <option value="free">🤖 Modèles gratuits par défaut (Groq / Pollinations / Fallback)</option>
                    <option value="openai">🧠 OpenAI / B.AI Endpoint (Recommandé - GPT-4o)</option>
                    <option value="anthropic">⚡ Anthropic Claude (Claude 3.5 Sonnet)</option>
                    <option value="gemini">💎 Google Gemini (Gemini 1.5 Pro / Flash)</option>
                    <option value="openrouter">🌐 OpenRouter (Catalogue unifié)</option>
                  </select>
                </div>

                {/* Individual Providers Grid */}
                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* OpenAI / B.AI */}
                  <div className="p-3.5 rounded-2xl border border-border bg-surface-2/60 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-foreground">OpenAI / B.AI</span>
                      {settings.openai_configured ? (
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <Check size={11} weight="bold" /> Enregistrée
                        </span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">Clé requise</span>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type={showKeys["openai"] ? "text" : "password"}
                        placeholder={settings.openai_configured ? "•••••••••••• (enregistrée)" : "sk-... ou clé B.AI"}
                        value={openaiKey}
                        onChange={(e) => setOpenaiKey(e.target.value)}
                        className="w-full rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-mono text-foreground outline-none focus:border-primary pr-8"
                      />
                      <button
                        type="button"
                        onClick={() => setShowKeys({ ...showKeys, openai: !showKeys["openai"] })}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        {showKeys["openai"] ? <EyeSlash size={13} /> : <Eye size={13} />}
                      </button>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="w-full text-xs"
                      loading={testingAi === "openai"}
                      disabled={!openaiKey && !settings.openai_configured}
                      onClick={() => testAi("OpenAI / B.AI", openaiKey)}
                    >
                      Tester la connexion
                    </Button>
                  </div>

                  {/* Anthropic Claude */}
                  <div className="p-3.5 rounded-2xl border border-border bg-surface-2/60 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-foreground">Anthropic Claude</span>
                      {settings.anthropic_configured ? (
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <Check size={11} weight="bold" /> Enregistrée
                        </span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">Clé requise</span>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type={showKeys["anthropic"] ? "text" : "password"}
                        placeholder={settings.anthropic_configured ? "•••••••••••• (enregistrée)" : "sk-ant-..."}
                        value={anthropicKey}
                        onChange={(e) => setAnthropicKey(e.target.value)}
                        className="w-full rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-mono text-foreground outline-none focus:border-primary pr-8"
                      />
                      <button
                        type="button"
                        onClick={() => setShowKeys({ ...showKeys, anthropic: !showKeys["anthropic"] })}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        {showKeys["anthropic"] ? <EyeSlash size={13} /> : <Eye size={13} />}
                      </button>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="w-full text-xs"
                      loading={testingAi === "anthropic"}
                      disabled={!anthropicKey && !settings.anthropic_configured}
                      onClick={() => testAi("Anthropic Claude", anthropicKey)}
                    >
                      Tester la connexion
                    </Button>
                  </div>

                  {/* Google Gemini */}
                  <div className="p-3.5 rounded-2xl border border-border bg-surface-2/60 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-foreground">Google Gemini</span>
                      {settings.gemini_configured ? (
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <Check size={11} weight="bold" /> Enregistrée
                        </span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">Clé requise</span>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type={showKeys["gemini"] ? "text" : "password"}
                        placeholder={settings.gemini_configured ? "•••••••••••• (enregistrée)" : "AIzaSy..."}
                        value={geminiKey}
                        onChange={(e) => setGeminiKey(e.target.value)}
                        className="w-full rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-mono text-foreground outline-none focus:border-primary pr-8"
                      />
                      <button
                        type="button"
                        onClick={() => setShowKeys({ ...showKeys, gemini: !showKeys["gemini"] })}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        {showKeys["gemini"] ? <EyeSlash size={13} /> : <Eye size={13} />}
                      </button>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="w-full text-xs"
                      loading={testingAi === "gemini"}
                      disabled={!geminiKey && !settings.gemini_configured}
                      onClick={() => testAi("Google Gemini", geminiKey)}
                    >
                      Tester la connexion
                    </Button>
                  </div>

                  {/* OpenRouter */}
                  <div className="p-3.5 rounded-2xl border border-border bg-surface-2/60 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-foreground">OpenRouter</span>
                      {settings.openrouter_configured ? (
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <Check size={11} weight="bold" /> Enregistrée
                        </span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">Clé requise</span>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type={showKeys["openrouter"] ? "text" : "password"}
                        placeholder={settings.openrouter_configured ? "•••••••••••• (enregistrée)" : "sk-or-..."}
                        value={openrouterKey}
                        onChange={(e) => setOpenrouterKey(e.target.value)}
                        className="w-full rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-mono text-foreground outline-none focus:border-primary pr-8"
                      />
                      <button
                        type="button"
                        onClick={() => setShowKeys({ ...showKeys, openrouter: !showKeys["openrouter"] })}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        {showKeys["openrouter"] ? <EyeSlash size={13} /> : <Eye size={13} />}
                      </button>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="w-full text-xs"
                      loading={testingAi === "openrouter"}
                      disabled={!openrouterKey && !settings.openrouter_configured}
                      onClick={() => testAi("OpenRouter", openrouterKey)}
                    >
                      Tester la connexion
                    </Button>
                  </div>
                </div>

                {/* Real Test Result Banner */}
                {aiTestResult && (
                  <div
                    className={cn(
                      "mt-4 rounded-xl border p-3 text-xs",
                      aiTestResult.ok
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "border-destructive/30 bg-destructive/10 text-destructive"
                    )}
                  >
                    {aiTestResult.ok ? (
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 font-semibold">
                          <CheckCircle size={15} weight="bold" /> Connexion validée avec succès sur {aiTestResult.provider} ({aiTestResult.model})
                        </span>
                        {aiTestResult.latencyMs && (
                          <span className="font-mono text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded-md">
                            {aiTestResult.latencyMs}ms
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="flex items-center gap-2 font-medium">
                        <WarningCircle size={15} weight="bold" /> Échec du test {aiTestResult.provider} : {aiTestResult.error}
                      </p>
                    )}
                  </div>
                )}

                {/* Collapsible Advanced AI Section */}
                <div className="mt-5 pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setShowAdvancedAi(!showAdvancedAi)}
                    className="flex items-center justify-between w-full text-xs font-bold text-foreground hover:text-primary transition cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Sliders size={14} /> Options Avancées de l&apos;IA (Base URL personnalisée &amp; Modèles)
                    </span>
                    <span>{showAdvancedAi ? "▲ Replier" : "▼ Déplier"}</span>
                  </button>

                  {showAdvancedAi && (
                    <div className="mt-3 space-y-3 pt-2 text-xs">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-semibold text-muted-foreground">
                            Custom Base URL OpenAI / B.AI
                          </label>
                          <a
                            href="https://docs.b.ai/llmservice/api/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            Documentation B.AI API ↗
                          </a>
                        </div>
                        <input
                          placeholder="https://api.b.ai/v1 ou https://api.openai.com/v1"
                          value={openAiBaseUrl}
                          onChange={(e) => setOpenAiBaseUrl(e.target.value)}
                          className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 font-mono text-xs text-foreground outline-none focus:border-primary"
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-muted-foreground block mb-1">
                          Nom du modèle personnalisé (Override)
                        </label>
                        <input
                          placeholder="Ex: b-ai-default, gpt-4o, claude-3-5-sonnet-20241022"
                          value={aiModelName}
                          onChange={(e) => setAiModelName(e.target.value)}
                          className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 font-mono text-xs text-foreground outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}

          {/* ========================================================== */}
          {/* TAB 5: SÉCURITÉ & SECRETS (SECURITY)                        */}
          {/* ========================================================== */}
          {activeTab === "security" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <Card>
                <div className="flex items-start justify-between pb-4 border-b border-border">
                  <div>
                    <h2 className="font-heading font-bold text-base text-foreground flex items-center gap-2">
                      <Lock size={20} className="text-primary" />
                      Sécurité, Secrets &amp; Contrôle d&apos;Accès
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Contrôlez les sessions actives, clés secrètes d&apos;API et privilèges d&apos;administration.
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-5 text-xs">
                  {/* Active Session Card */}
                  <div className="flex items-center justify-between p-3.5 rounded-2xl border border-border bg-surface-2/60">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                        <ShieldCheck size={20} weight="fill" />
                      </div>
                      <div>
                        <p className="font-bold text-foreground">Session Administrateur Active</p>
                        <p className="text-[11px] text-muted-foreground">
                          Authentifiée via cookie sécurisé HttpOnly SameSite=Lax (Session valide).
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      Actif
                    </span>
                  </div>

                  {/* Secret Webhook Token Management */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="font-bold text-foreground">
                        Clé Secrète de l&apos;API Webhook (x-webhook-secret) :
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowSecret(!showSecret)}
                        className="text-primary hover:underline text-[11px] cursor-pointer"
                      >
                        {showSecret ? "Masquer la clé" : "Afficher la clé"}
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type={showSecret ? "text" : "password"}
                        readOnly
                        value={webhookSecret || "Non configuré"}
                        className="flex-1 rounded-xl border border-border bg-surface-2 px-3.5 py-2 font-mono text-xs text-foreground outline-none"
                      />
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => copyToClipboard(webhookSecret, "webhookSecret")}
                        disabled={!webhookSecret}
                      >
                        {copiedKey === "webhookSecret" ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                        Copier
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          if (!confirm("Régénérer une nouvelle clé secrète invalidera immédiatement l'ancienne. Continuer ?")) return;
                          const newKey = "sec_" + crypto.randomUUID().replace(/-/g, "");
                          setWebhookSecret(newKey);
                          await saveSection("security", { webhook_secret: newKey });
                        }}
                      >
                        Régénérer
                      </Button>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Cette clé doit être fournie dans le header <code className="font-mono">x-webhook-secret</code> lors de chaque requête HTTP reçue.
                    </p>
                  </div>

                  {/* Team Permissions Link */}
                  <div className="flex items-center justify-between p-3.5 rounded-2xl border border-border bg-surface-2/60">
                    <div>
                      <p className="font-bold text-foreground">Permissions d&apos;Équipe &amp; Collaborateurs</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Gérez les rôles des utilisateurs (Administrateur, Éditeur de contenu, Observateur).
                      </p>
                    </div>
                    <Link href="/dashboard/team">
                      <Button size="sm" variant="outline">
                        <Users size={13} /> Gérer l&apos;équipe ↗
                      </Button>
                    </Link>
                  </div>

                  {/* Audit Logs Link */}
                  <div className="flex items-center justify-between p-3.5 rounded-2xl border border-border bg-surface-2/60">
                    <div>
                      <p className="font-bold text-foreground">Journal d&apos;Audit &amp; Historique des Événements</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Consultez tous les événements récents, publications et erreurs d&apos;API en direct.
                      </p>
                    </div>
                    <Link href="/dashboard/logs">
                      <Button size="sm" variant="outline">
                        <Code size={13} /> Consulter les logs ↗
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* ========================================================== */}
          {/* TAB 6: AVANCÉ & DÉVELOPPEURS (ADVANCED)                    */}
          {/* ========================================================== */}
          {activeTab === "advanced" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Autopilot Scheduling */}
              <Card>
                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <div>
                    <h2 className="font-heading font-bold text-base text-foreground flex items-center gap-2">
                      <Rocket size={20} className="text-primary" />
                      Autopilote &amp; Planification de Publication
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Configurez la cadence et les plages horaires autorisées pour les posts automatiques.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    loading={savingCategory === "advanced"}
                    onClick={() =>
                      saveSection("advanced", {
                        auto_post_enabled: autoPostEnabled,
                        posts_per_day: postsPerDay,
                        posting_hours: postingHours,
                      })
                    }
                  >
                    {savedSuccess === "advanced" ? "Enregistré ✓" : "Enregistrer"}
                  </Button>
                </div>

                <div className="mt-4 space-y-4 text-xs">
                  <div className="flex items-center justify-between rounded-xl border border-border bg-surface-2 p-3">
                    <div>
                      <p className="font-bold text-foreground">Activer l&apos;Autopilote Social</p>
                      <p className="text-[11px] text-muted-foreground">
                        Permet au robot de diffuser automatiquement sur les créneaux sélectionnés.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={autoPostEnabled}
                      onChange={(e) => setAutoPostEnabled(e.target.checked)}
                      className="h-4 w-4 rounded accent-primary cursor-pointer"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-semibold text-foreground block mb-1">
                        Nombre de publications par jour (1 à 20) :
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={postsPerDay}
                        onChange={(e) => setPostsPerDay(Number(e.target.value))}
                        className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs text-foreground outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-muted-foreground block mb-1">
                        Fuseau horaire de référence :
                      </label>
                      <input
                        readOnly
                        value={timezone}
                        className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs text-muted-foreground outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-foreground block mb-1.5">
                      Créneaux horaires de publication autorisés (0h à 23h) :
                    </label>
                    <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
                      {Array.from({ length: 24 }, (_, h) => h).map((hour) => {
                        const isSelected = postingHours.includes(hour);
                        return (
                          <button
                            key={hour}
                            type="button"
                            onClick={() => {
                              const updated = isSelected
                                ? postingHours.filter((h) => h !== hour)
                                : [...postingHours, hour].sort((a, b) => a - b);
                              setPostingHours(updated);
                            }}
                            className={cn(
                              "rounded-lg py-1.5 text-center text-xs font-semibold transition cursor-pointer",
                              isSelected
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "bg-surface-2 text-muted-foreground hover:bg-surface-3 hover:text-foreground"
                            )}
                          >
                            {hour}h
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Webhook Configuration & Testing */}
              <Card>
                <div className="flex items-start justify-between pb-3 border-b border-border">
                  <div>
                    <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-2">
                      <Code size={18} className="text-primary" />
                      Endpoint Webhook pour Sites Externes
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Recevez instantanément chaque nouvelle annonce depuis votre boutique ou site e-commerce.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={testingWebhook}
                    onClick={async () => {
                      setTestingWebhook(true);
                      setWebhookTestResult(null);
                      try {
                        const res = await fetch("/api/automation/test-webhook", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            title: "Ping de vérification Webhook",
                            source: "Paramètres Fundoral",
                          }),
                        });
                        const data = await res.json();
                        setWebhookTestResult({
                          ok: res.ok,
                          message: data.message || "Webhook validé avec succès !",
                        });
                      } catch {
                        setWebhookTestResult({
                          ok: false,
                          message: "Échec du test de communication webhook.",
                        });
                      } finally {
                        setTestingWebhook(false);
                      }
                    }}
                  >
                    <ArrowClockwise size={13} className={testingWebhook ? "animate-spin" : ""} />
                    Tester le Webhook
                  </Button>
                </div>

                <div className="mt-4 space-y-3 text-xs">
                  <div>
                    <label className="font-semibold text-muted-foreground block mb-1">
                      URL Endpoint POST :
                    </label>
                    <div className="flex gap-2">
                      <input
                        readOnly
                        value={
                          typeof window !== "undefined"
                            ? `${window.location.origin}/api/webhooks/listings`
                            : "/api/webhooks/listings"
                        }
                        className="flex-1 rounded-xl border border-border bg-surface-2 px-3 py-2 font-mono text-xs text-foreground outline-none"
                      />
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          copyToClipboard(
                            `${window.location.origin}/api/webhooks/listings`,
                            "webhookEndpoint"
                          )
                        }
                      >
                        {copiedKey === "webhookEndpoint" ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                        Copier
                      </Button>
                    </div>
                  </div>

                  {webhookTestResult && (
                    <div
                      className={cn(
                        "rounded-xl border p-2.5 text-xs",
                        webhookTestResult.ok
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "border-destructive/30 bg-destructive/10 text-destructive"
                      )}
                    >
                      <p className="flex items-center gap-1.5 font-medium">
                        {webhookTestResult.ok ? <CheckCircle size={14} weight="bold" /> : <WarningCircle size={14} weight="bold" />}
                        {webhookTestResult.message}
                      </p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Meta Ads Account */}
              <Card>
                <div className="flex items-start justify-between pb-3 border-b border-border">
                  <div>
                    <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-2">
                      <Rocket size={18} className="text-primary" />
                      Compte Publicitaire Meta Ads (Marketing API)
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Renseignez votre ID de compte publicitaire pour sponsoriser automatiquement vos publications.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    loading={savingCategory === "advanced"}
                    onClick={() => saveSection("advanced", { meta_ad_account_id: metaAdAccount.trim() || null })}
                  >
                    Enregistrer
                  </Button>
                </div>

                <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 text-xs">
                  <input
                    placeholder="Ex: act_1234567890"
                    value={metaAdAccount}
                    onChange={(e) => setMetaAdAccount(e.target.value)}
                    className="flex-1 rounded-xl border border-border bg-surface-2 px-3 py-2 font-mono text-xs text-foreground outline-none focus:border-primary"
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={verifyingAds}
                    disabled={!metaAdAccount.trim()}
                    onClick={verifyAdsAccount}
                  >
                    Vérifier sur Meta Graph API
                  </Button>
                </div>

                {adsVerification && (
                  <div
                    className={cn(
                      "mt-3 rounded-xl border p-3 text-xs space-y-1.5",
                      adsVerification.ok
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "border-destructive/30 bg-destructive/10 text-destructive"
                    )}
                  >
                    {adsVerification.ok ? (
                      <p className="flex items-center gap-1.5 font-bold">
                        <CheckCircle size={14} weight="bold" /> Compte publicitaire validé : {adsVerification.accountName} ({adsVerification.currency})
                      </p>
                    ) : (
                      <p className="flex items-center gap-1.5 font-bold">
                        <WarningCircle size={14} weight="bold" /> {adsVerification.error || "Compte publicitaire introuvable."}
                      </p>
                    )}
                  </div>
                )}
              </Card>
            </div>
          )}
        </main>
      </div>

      {/* WhatsApp QR Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-2xl text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 mb-3">
              <WhatsappLogo size={28} weight="fill" />
            </div>
            <h3 className="font-heading font-bold text-foreground text-base">
              Lier votre compte WhatsApp
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Ouvrez WhatsApp &gt; <strong>Appareils connectés</strong> &gt; <strong>Connecter un appareil</strong>, puis scannez ce QR Code.
            </p>

            <div className="my-5 flex justify-center">
              {whatsAppTestResult?.qrCode ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={
                    whatsAppTestResult.qrCode.startsWith("data:")
                      ? whatsAppTestResult.qrCode
                      : `data:image/png;base64,${whatsAppTestResult.qrCode}`
                  }
                  alt="QR Code WhatsApp"
                  className="h-56 w-56 rounded-xl border border-border bg-white p-2.5 shadow-inner"
                />
              ) : (
                <div className="flex h-56 w-56 items-center justify-center rounded-xl border border-dashed border-border bg-surface-2 text-xs text-muted-foreground p-4">
                  Génération du QR Code ou session déjà active...
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="flex-1"
                onClick={testWhatsApp}
                loading={testingWhatsApp}
              >
                Actualiser
              </Button>
              <Button size="sm" className="flex-1" onClick={() => setShowQrModal(false)}>
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
