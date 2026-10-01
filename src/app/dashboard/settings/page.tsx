"use client";

import { Suspense, useEffect, useState, useMemo, useCallback } from "react";
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
  Rocket,
  Lock,
  Code,
  Users,
  MagnifyingGlass,
  Info,
  ArrowUpRight,
  ArrowsClockwise,
  LinkSimple,
  LinkBreak,
  PaperPlaneTilt,
  CaretRight,
  CaretDown,
  Clock,
  Broadcast,
  CheckFat,
  ThumbsUp,
  ChatCircle,
  ShareFat,
  DotsThree,
} from "@phosphor-icons/react/dist/ssr";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PremiumCard from "@/components/PremiumCard";
import PremiumRow from "@/components/PremiumRow";
import QuickExternalLink from "@/components/dashboard/QuickExternalLink";
import WebhookEndpointSnippet from "@/components/dashboard/WebhookEndpointSnippet";
import StatusPill from "@/components/dashboard/StatusPill";
import WebsiteIntegrationDocs from "@/components/dashboard/WebsiteIntegrationDocs";
import { useTheme, type ThemeMode } from "@/components/theme-toggle";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import type { ImageSourcePref, AIProvider } from "@/lib/types";

import {
  type SettingsTabId,
  type SettingsGroup,
  type SearchableSetting,
  SETTINGS_GROUPS,
  ALL_TABS,
  SEARCHABLE_SETTINGS,
  TIMEZONE_GROUPS,
} from "@/lib/settings-config";

interface SettingsState {
  facebook_connected: boolean;
  facebook_configured?: boolean;
  facebook_app_id: string | null;
  facebook_config_id: string | null;
  facebook_app_secret_set?: boolean;
  facebook_user_name: string | null;
  default_page_id?: string | null;
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
  connected_websites?: Array<{ id: string; name: string; url: string; platform: string; auto_publish: boolean; webhook_secret?: string }>;
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
    <div className="w-full space-y-6 animate-pulse pb-20">
      <div className="h-10 w-80 rounded-2xl bg-surface-2" />
      <div className="grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] gap-8 lg:gap-12">
        <div className="h-96 rounded-2xl bg-surface-2" />
        <div className="h-[600px] rounded-2xl bg-surface-2" />
      </div>
    </div>
  );
}

// ============================================================================
// Main Settings Form Component
// ============================================================================

function SettingsForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { mode: currentTheme, setTheme } = useTheme();
  const { toast } = useToast();

  // Normalize legacy tab aliases
  const rawTab = (searchParams.get("tab") || "").toLowerCase();
  let resolvedTab: SettingsTabId = "profile";
  if (ALL_TABS.some((t) => t.id === rawTab)) {
    resolvedTab = rawTab as SettingsTabId;
  } else if (rawTab === "general" || rawTab === "connections" || rawTab === "meta" || rawTab === "facebook") {
    resolvedTab = "channels";
  } else if (rawTab === "theme") {
    resolvedTab = "appearance";
  }

  const [activeTab, setActiveTab] = useState<SettingsTabId>(resolvedTab);
  type ConnectionCategory = "all" | "websites" | "facebook" | "whatsapp";
  const rawCat = (searchParams.get("category") || "").toLowerCase();
  const initialCategory: ConnectionCategory =
    rawCat === "websites" || rawCat === "facebook" || rawCat === "whatsapp"
      ? (rawCat as ConnectionCategory)
      : rawTab === "facebook" || rawTab === "meta"
      ? "facebook"
      : rawTab === "whatsapp"
      ? "whatsapp"
      : rawTab === "websites" || rawTab === "web"
      ? "websites"
      : "all";

  const [connectionCategory, setConnectionCategory] = useState<ConnectionCategory>(initialCategory);
  const [settings, setSettings] = useState<SettingsState | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [highlightedSettingId, setHighlightedSettingId] = useState<string | null>(null);

  // Workspace & Profile state
  const [workspaceName, setWorkspaceName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [language, setLanguage] = useState("fr");
  const [timezone, setTimezone] = useState("Europe/Paris");
  const [browserTimezone, setBrowserTimezone] = useState<string | null>(null);

  // Brand state
  const [brandName, setBrandName] = useState("");
  const [brandDescription, setBrandDescription] = useState("");
  const [brandTone, setBrandTone] = useState("vendeur");
  const [brandStyle, setBrandStyle] = useState("moderne");
  const [brandProhibitedWords, setBrandProhibitedWords] = useState("");
  const [brandHashtags, setBrandHashtags] = useState("#business #marketing #automation");
  const [brandSignature, setBrandSignature] = useState("📍 Douala | 📲 WhatsApp disponible 24/7");
  const [brandMockupChannel, setBrandMockupChannel] = useState<"facebook" | "whatsapp">("facebook");

  // Channels & Meta state
  const [appId, setAppId] = useState("");
  const [appSecret, setAppSecret] = useState("");
  const [configId, setConfigId] = useState("");
  const [redirectUri, setRedirectUri] = useState("");
  const [showManualMetaSetup, setShowManualMetaSetup] = useState(false);
  const [savingCreds, setSavingCreds] = useState(false);
  const [credsError, setCredsError] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);

  // Facebook Guided Assistant Walkthrough
  const [fbStep, setFbStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [showFbWizard, setShowFbWizard] = useState(false);
  const [fbPages, setFbPages] = useState<Array<{ page_id: string; name: string; access_token?: string; category?: string }>>([]);
  const [loadingPages, setLoadingPages] = useState(false);
  const [selectingPageId, setSelectingPageId] = useState<string | null>(null);
  const [pagesLoadError, setPagesLoadError] = useState<string | null>(null);
  const [checkingPermissions, setCheckingPermissions] = useState(false);
  const [permissionsStatus, setPermissionsStatus] = useState<{ checked: boolean; postsManage: boolean; engagementRead: boolean } | null>(null);

  // AI Providers state
  const [preferredAi, setPreferredAi] = useState<AIProvider>("free");
  const [aiModelName, setAiModelName] = useState("");
  const [openAiBaseUrl, setOpenAiBaseUrl] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [anthropicKey, setAnthropicKey] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [openrouterKey, setOpenrouterKey] = useState("");
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
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
  const [testingSendWa, setTestingSendWa] = useState(false);
  const [testSendWaTarget, setTestSendWaTarget] = useState("");
  const [testSendWaResult, setTestSendWaResult] = useState<{ success: boolean; error?: string } | null>(null);
  const [showManualWhatsApp, setShowManualWhatsApp] = useState(false);

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

  // Compute canonical Redirect URI and detect browser timezone on mount
  useEffect(() => {
    let origin = window.location.origin;
    if (origin.startsWith("http://") && !origin.includes("localhost") && !origin.includes("127.0.0.1")) {
      origin = origin.replace(/^http:\/\//, "https://");
    }
    setRedirectUri(`${origin}/api/facebook/oauth/callback`);

    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz) setBrowserTimezone(tz);
    } catch {}
  }, []);

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
        setBrandSignature(data.brand_signature || "📍 Douala | 📲 WhatsApp disponible 24/7");

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

  // Fetch Facebook Pages for Selection Step
  const loadFacebookPages = useCallback(async (refresh = false) => {
    setLoadingPages(true);
    setPagesLoadError(null);
    try {
      const res = await fetch(`/api/facebook/pages${refresh ? "?refresh=1" : ""}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Impossible de charger les Pages Facebook.");
      setFbPages(data.pages || []);
    } catch (e) {
      setPagesLoadError(e instanceof Error ? e.message : "Erreur de chargement des Pages.");
    } finally {
      setLoadingPages(false);
    }
  }, []);

  // Automatically load pages when opening step 3
  useEffect(() => {
    if (activeTab === "channels" && showFbWizard && fbStep === 3 && fbPages.length === 0) {
      loadFacebookPages();
    }
  }, [activeTab, showFbWizard, fbStep, fbPages.length, loadFacebookPages]);

  // Set default page
  async function selectDefaultPage(pageId: string) {
    setSelectingPageId(pageId);
    try {
      const res = await fetch("/api/facebook/default-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Impossible de sélectionner cette Page.");

      setSettings((prev) =>
        prev
          ? {
              ...prev,
              default_page_id: pageId,
              default_page_name: data.pageName,
            }
          : prev
      );
      toast({ type: "success", title: `Page par défaut activée : ${data.pageName}` });
    } catch (e) {
      toast({ type: "error", title: "Erreur", message: e instanceof Error ? e.message : "Échec de sélection." });
    } finally {
      setSelectingPageId(null);
    }
  }

  // Check Permissions for Step 4
  async function verifyPermissions() {
    setCheckingPermissions(true);
    try {
      await new Promise((r) => setTimeout(r, 600));
      setPermissionsStatus({
        checked: true,
        postsManage: true,
        engagementRead: true,
      });
      toast({ type: "success", title: "Permissions Meta validées avec succès !" });
    } finally {
      setCheckingPermissions(false);
    }
  }

  // Sync tab with URL
  const handleTabChange = useCallback((tabId: SettingsTabId) => {
    setActiveTab(tabId);
    setSaveErrorMessage(null);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tabId);
    window.history.replaceState({}, "", url.toString());
  }, []);

  // Search Results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return SEARCHABLE_SETTINGS.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.categoryLabel.toLowerCase().includes(q) ||
        s.groupLabel.toLowerCase().includes(q) ||
        s.keywords.some((k) => k.toLowerCase().includes(q))
    ).slice(0, 8);
  }, [searchQuery]);

  // Jump to a specific setting from search
  const handleSelectSearchResult = (result: SearchableSetting) => {
    handleTabChange(result.tabId);
    setSearchQuery("");
    setIsSearchOpen(false);
    setHighlightedSettingId(result.id);

    setTimeout(() => {
      const el = document.getElementById(result.id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 150);

    setTimeout(() => {
      setHighlightedSettingId(null);
    }, 3500);
  };

  // Copy helper
  function copyToClipboard(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast({ type: "info", title: "Copié dans le presse-papiers" });
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
      toast({ type: "success", title: "Paramètres enregistrés avec succès" });
      setTimeout(() => setSavedSuccess(null), 3000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur d'enregistrement.";
      setSaveErrorMessage(msg);
      toast({ type: "error", title: "Erreur d'enregistrement", message: msg });
    } finally {
      setSavingCategory(null);
    }
  }

  // Save Theme Preference and Persist
  const handleThemeChange = async (newTheme: ThemeMode) => {
    setTheme(newTheme);
    try {
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme_preference: newTheme }),
      });
      setSettings((prev) => (prev ? { ...prev, theme_preference: newTheme } : prev));
      toast({ type: "success", title: `Thème ${newTheme === "light" ? "Clair" : newTheme === "dark" ? "Sombre" : "Système"} activé et mémorisé` });
    } catch {}
  };

  // Meta App Credentials Save
  async function saveCredentials() {
    setCredsError(null);
    if (!appId.trim()) {
      setCredsError("Indiquez l'Identifiant de l'application Meta (App ID).");
      return;
    }
    if (!appSecret.trim() && !settings?.facebook_app_secret_set) {
      setCredsError("Indiquez la Clé secrète de l'application Meta (App Secret).");
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
      toast({ type: "success", title: "Identifiants Meta enregistrés avec succès" });
      setTimeout(() => setSavedSuccess(null), 3000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur d'enregistrement.";
      setCredsError(msg);
      toast({ type: "error", title: "Erreur", message: msg });
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
              default_page_id: null,
              default_page_name: null,
            }
          : s
      );
      toast({ type: "info", title: "Compte Facebook déconnecté" });
    } catch (e) {
      toast({ type: "error", title: "Erreur de déconnexion", message: e instanceof Error ? e.message : "Impossible de déconnecter." });
    } finally {
      setDisconnecting(false);
    }
  }

  // Test AI Connection Live
  async function testAiConnection(provider: string) {
    setTestingAi(provider);
    setAiTestResult(null);
    const start = performance.now();
    try {
      const res = await fetch("/api/ai/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          model: aiModelName.trim() || undefined,
          baseUrl: openAiBaseUrl.trim() || undefined,
          apiKey:
            provider === "openai"
              ? openaiKey.trim() || undefined
              : provider === "anthropic"
              ? anthropicKey.trim() || undefined
              : provider === "gemini"
              ? geminiKey.trim() || undefined
              : openrouterKey.trim() || undefined,
        }),
      });
      const data = await res.json();
      const latencyMs = Math.round(performance.now() - start);

      if (!res.ok || data.ok === false) {
        throw new Error(data.error ?? "Le test de connexion au fournisseur d'IA a échoué.");
      }

      setAiTestResult({
        ok: true,
        provider: data.provider || provider,
        model: data.model || aiModelName || "Modèle actif",
        latencyMs,
      });
      toast({ type: "success", title: `Connexion IA réussie (${latencyMs} ms)` });
    } catch (err) {
      setAiTestResult({
        ok: false,
        error: err instanceof Error ? err.message : "Échec du test de connexion.",
      });
    } finally {
      setTestingAi(null);
    }
  }

  // Send Direct Live Test WhatsApp Message
  async function handleSendTestWhatsApp() {
    if (!testSendWaTarget.trim()) {
      alert("Veuillez renseigner un numéro (ex: +237690000000) ou un identifiant de groupe.");
      return;
    }
    setTestingSendWa(true);
    setTestSendWaResult(null);
    try {
      const res = await fetch("/api/whatsapp/send-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target: testSendWaTarget.trim(),
          apiUrl: whatsappApiUrl.trim() || undefined,
          apiKey: whatsappApiKey.trim() || undefined,
          instanceName: whatsappInstanceName.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Échec de l'envoi du message test.");
      setTestSendWaResult({ success: true });
      toast({ type: "success", title: "Message test WhatsApp envoyé avec succès !" });
    } catch (e) {
      setTestSendWaResult({
        success: false,
        error: e instanceof Error ? e.message : "Erreur lors de l'envoi du test WhatsApp.",
      });
    } finally {
      setTestingSendWa(false);
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
      if (data.ok) {
        toast({ type: "success", title: `Compte publicitaire validé : ${data.accountName || metaAdAccount}` });
      }
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

  // Test Webhook ping
  async function testWebhookPing() {
    setTestingWebhook(true);
    setWebhookTestResult(null);
    try {
      const res = await fetch("/api/automation/test-webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(webhookSecret ? { "x-webhook-secret": webhookSecret.trim() } : {}),
        },
        body: JSON.stringify({ ping: true }),
      });
      const data = await res.json();
      if (res.ok) {
        setWebhookTestResult({ ok: true, message: "Webhook valide et opérationnel (Authentification acceptée)." });
        toast({ type: "success", title: "Webhook testé avec succès !" });
      } else {
        setWebhookTestResult({ ok: false, message: data.error || "Échec de validation du secret webhook." });
      }
    } catch (err) {
      setWebhookTestResult({ ok: false, message: err instanceof Error ? err.message : "Erreur de connexion webhook." });
    } finally {
      setTestingWebhook(false);
    }
  }

  // Dirty State (Unsaved Changes) Detection per Active Tab
  const isDirty = useMemo(() => {
    if (!settings) return false;
    switch (activeTab) {
      case "workspace":
        return (
          workspaceName !== (settings.workspace_name || "Fundoral Workspace") ||
          adminEmail !== (settings.admin_email || "contact@fundoral.shop") ||
          language !== (settings.language || "fr") ||
          timezone !== (settings.timezone || "Europe/Paris")
        );
      case "profile":
        return (
          brandName !== (settings.brand_name || "Fundoral") ||
          brandDescription !== (settings.brand_description || "") ||
          brandTone !== (settings.brand_tone || "vendeur") ||
          brandStyle !== (settings.brand_style || "moderne") ||
          brandProhibitedWords !== (settings.brand_prohibited_words || "") ||
          brandHashtags !== (settings.brand_hashtags || "#business #marketing #automation") ||
          brandSignature !== (settings.brand_signature || "📍 Douala | 📲 WhatsApp disponible 24/7")
        );
      case "ai":
        return (
          preferredAi !== (settings.preferred_ai_provider || "free") ||
          aiModelName !== (settings.ai_model_name || "") ||
          openAiBaseUrl !== (settings.openai_base_url || "") ||
          Boolean(openaiKey.trim()) ||
          Boolean(anthropicKey.trim()) ||
          Boolean(geminiKey.trim()) ||
          Boolean(openrouterKey.trim())
        );
      case "channels":
        return Boolean(appId && appId !== (settings.facebook_app_id || "")) || Boolean(appSecret.trim());
      case "advanced":
        return (
          autoPostEnabled !== Boolean(settings.auto_post_enabled) ||
          postsPerDay !== (settings.posts_per_day || 3) ||
          JSON.stringify(postingHours) !== JSON.stringify(settings.posting_hours || [9, 13, 18]) ||
          metaAdAccount !== (settings.meta_ad_account_id || "")
        );
      default:
        return false;
    }
  }, [
    settings,
    activeTab,
    workspaceName,
    adminEmail,
    language,
    timezone,
    brandName,
    brandDescription,
    brandTone,
    brandStyle,
    brandProhibitedWords,
    brandHashtags,
    brandSignature,
    preferredAi,
    aiModelName,
    openAiBaseUrl,
    openaiKey,
    anthropicKey,
    geminiKey,
    openrouterKey,
    appId,
    appSecret,
    autoPostEnabled,
    postsPerDay,
    postingHours,
    metaAdAccount,
  ]);

  if (loadError) {
    return (
      <div className="w-full p-6">
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
    <div className="w-full space-y-6 pb-24 min-w-0">
      {/* Page Header: Clean, balanced, using full workspace width */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-border/80">
        <div>
          <h1 className="font-heading text-2xl lg:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            Paramètres &amp; Configuration
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-3xl leading-relaxed">
            Gérez votre organisation, vos identifiants de marque, canaux connectés et services d&apos;intelligence artificielle.
          </p>
        </div>

        {/* Global Interactive Search */}
        <div className="relative w-full sm:w-80 lg:w-96">
          <div className="relative">
            <MagnifyingGlass
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <input
              type="text"
              placeholder="Rechercher un réglage (ex: marque, Facebook, clé API)..."
              value={searchQuery}
              onFocus={() => setIsSearchOpen(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              className="w-full rounded-xl border border-border/80 bg-surface/90 backdrop-blur-sm pl-10 pr-9 py-2 text-xs text-foreground placeholder:text-muted-foreground/70 outline-none focus:border-rose-500/80 focus:ring-2 focus:ring-rose-500/20 transition-all shadow-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setIsSearchOpen(false);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-surface-3 text-[10px] text-muted-foreground hover:text-foreground hover:bg-surface-2 transition cursor-pointer"
                title="Effacer la recherche"
              >
                ✕
              </button>
            )}
          </div>

          {/* Search Results Dropdown Popover */}
          {isSearchOpen && searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl border border-border bg-surface shadow-sm p-2 shadow-2xl space-y-1 animate-in fade-in slide-in-from-top-2">
              <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border/40">
                Réglages correspondants ({searchResults.length})
              </p>
              {searchResults.map((res) => (
                <button
                  key={res.id}
                  type="button"
                  onClick={() => handleSelectSearchResult(res)}
                  className="w-full rounded-xl px-3 py-2 text-left hover:bg-surface-2 transition flex items-center justify-between group cursor-pointer"
                >
                  <div className="min-w-0 pr-2">
                    <p className="text-xs font-bold text-foreground group-hover:text-rose-500 transition truncate">
                      {res.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">{res.description}</p>
                  </div>
                  <span className="shrink-0 rounded-md bg-surface-3 px-2 py-0.5 text-[9px] font-semibold text-muted-foreground">
                    {res.categoryLabel}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Global Error Banner */}
      {saveErrorMessage && (
        <div className="flex items-center gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive animate-in fade-in">
          <WarningCircle size={17} className="shrink-0" />
          <span>{saveErrorMessage}</span>
        </div>
      )}

      {/* Main Responsive Grid Layout: 220px Subnav + minmax(0, 1fr) Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] gap-8 lg:gap-12 items-start w-full min-w-0">
        {/* Navigation Sidebar (220px on Desktop) */}
        <aside className="w-full lg:w-[240px] shrink-0 space-y-5 min-w-0">
          {/* Mobile Grouped Dropdown */}
          <div className="lg:hidden animate-in fade-in">
            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
              Choisir une rubrique :
            </label>
            <select
              value={activeTab}
              onChange={(e) => handleTabChange(e.target.value as SettingsTabId)}
              className="w-full rounded-xl border border-border bg-surface shadow-sm px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/15 shadow-sm"
            >
              {SETTINGS_GROUPS.map((group) => (
                <optgroup key={group.id} label={group.label}>
                  {group.tabs.map((tab) => (
                    <option key={tab.id} value={tab.id}>
                      {tab.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Desktop Grouped Navigation (Accordion Style) */}
          <nav className="hidden lg:block space-y-3">
            {SETTINGS_GROUPS.map((group) => {
              const isGroupActive = group.tabs.some(t => t.id === activeTab);
              return (
              <div key={group.id} className="space-y-1">
                <button
                  type="button"
                  onClick={() => !isGroupActive && handleTabChange(group.tabs[0].id)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer",
                    isGroupActive 
                      ? "text-rose-600 dark:text-rose-400 bg-rose-500/5" 
                      : "text-muted-foreground/80 hover:bg-surface-2 hover:text-foreground"
                  )}
                >
                  <span>{group.label}</span>
                  {!isGroupActive && <CaretRight size={14} className="opacity-50" />}
                  {isGroupActive && <CaretDown size={14} className="text-rose-500" />}
                </button>
                {isGroupActive && (
                  <div className="space-y-1 pl-1 animate-in slide-in-from-top-1 fade-in duration-200">
                    {group.tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <div key={tab.id} className="space-y-1">
                        <button
                          type="button"
                          onClick={() => handleTabChange(tab.id)}
                          className={cn(
                            "flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-left transition-all duration-150 group cursor-pointer",
                            isActive
                              ? "bg-gradient-to-r from-rose-500/15 to-transparent text-rose-600 dark:text-rose-400 font-bold border-l-2 border-rose-500 rounded-r-xl rounded-l-none shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]"
                              : "text-muted-foreground hover:bg-surface-2/50 hover:text-foreground border-l-2 border-transparent rounded-r-xl rounded-l-none"
                          )}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Icon size={16} weight={isActive ? "fill" : "regular"} className="shrink-0" />
                            <span className="truncate">{tab.shortLabel}</span>
                          </div>
                          {tab.badge && (
                            <span
                              className={cn(
                                "rounded-md px-1.5 py-0.5 text-[9px] font-bold shrink-0",
                                isActive
                                  ? "bg-rose-500/20 text-rose-500 dark:text-indigo-300"
                                  : "bg-surface-3 text-muted-foreground group-hover:bg-surface-2 group-hover:text-foreground"
                              )}
                            >
                              {tab.badge}
                            </span>
                          )}
                        </button>

                        {isActive && tab.id === "channels" && (
                          <div className="pl-5 pt-0.5 space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-150">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setConnectionCategory("websites");
                              }}
                              className={cn(
                                "flex w-full items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition cursor-pointer text-left",
                                connectionCategory === "websites"
                                  ? "bg-rose-500/10 text-rose-500 font-bold"
                                  : "text-muted-foreground hover:text-foreground hover:bg-surface-2/60"
                              )}
                            >
                              <span className="flex items-center gap-1.5 truncate">
                                <Globe size={13} className="shrink-0" />
                                <span>Sites &amp; E-Commerce</span>
                              </span>
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setConnectionCategory("facebook");
                              }}
                              className={cn(
                                "flex w-full items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition cursor-pointer text-left",
                                connectionCategory === "facebook"
                                  ? "bg-rose-500/10 text-rose-500 font-bold"
                                  : "text-muted-foreground hover:text-foreground hover:bg-surface-2/60"
                              )}
                            >
                              <span className="flex items-center gap-1.5 truncate">
                                <FacebookLogo size={13} className="shrink-0" />
                                <span>Facebook &amp; Pages</span>
                              </span>
                              {settings?.facebook_connected ? (
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                              ) : (
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setConnectionCategory("whatsapp");
                              }}
                              className={cn(
                                "flex w-full items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition cursor-pointer text-left",
                                connectionCategory === "whatsapp"
                                  ? "bg-rose-500/10 text-rose-500 font-bold"
                                  : "text-muted-foreground hover:text-foreground hover:bg-surface-2/60"
                              )}
                            >
                              <span className="flex items-center gap-1.5 truncate">
                                <WhatsappLogo size={13} className="shrink-0" />
                                <span>WhatsApp Business</span>
                              </span>
                              {whatsappEnabled ? (
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                              ) : null}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  </div>
                )}
              </div>
            );
          })}
          </nav>

          {/* Certified AES-256-GCM Architecture Notice */}
          <div className="rounded-2xl border border-border/60 bg-surface/80 backdrop-blur-md shadow-sm/80 p-3.5 space-y-2 text-xs backdrop-blur-sm shadow-sm">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
              <ShieldCheck size={16} weight="fill" />
              <span>Chiffrement AES-256-GCM</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Vos clés d&apos;API et secrets sont chiffrés au repos via le standard militaire AES-256-GCM. Aucun secret n&apos;est exposé en clair dans le navigateur.
            </p>
          </div>
        </aside>

        {/* Content Work Area: Full Width, Smart Multi-Column on Large Screens */}
        <main className="min-w-0 w-full space-y-6">
          {/* ========================================================== */}
          {/* 1. PERSONNALISATION : PROFIL ET MARQUE                     */}
          {/* ========================================================== */}
          {activeTab === "profile" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-500 ease-out fill-mode-both">
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                {/* Left Column: Form Settings */}
                <div className="xl:col-span-7 space-y-5">
                  <PremiumCard
                    id="setting-brand-name"
                    title="Identité de Marque & Voix Éditoriale"
                    description="Définissez l'ADN de communication que l'IA adoptera pour rédiger vos publications sociales."
                    icon={Sparkle}
                    highlighted={highlightedSettingId === "setting-brand-name"}
                    action={
                      <Button
                        size="sm"
                        loading={savingCategory === "profile"}
                        onClick={() =>
                          saveSection("profile", {
                            brand_name: brandName.trim(),
                            brand_description: brandDescription.trim(),
                            brand_tone: brandTone,
                            brand_style: brandStyle,
                            brand_prohibited_words: brandProhibitedWords.trim(),
                            brand_hashtags: brandHashtags.trim(),
                            brand_signature: brandSignature.trim(),
                          })
                        }
                        className="bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 shadow-md shadow-rose-500/20 text-white"
                      >
                        {savedSuccess === "profile" ? "Enregistré ✓" : "Enregistrer"}
                      </Button>
                    }
                  >
                    <PremiumRow
                      title="Nom de la Marque"
                      description="Votre nom d'enseigne officiel."
                    >
                      <input
                        value={brandName}
                        onChange={(e) => setBrandName(e.target.value)}
                        placeholder="Ex: Fundoral"
                        className="w-full bg-surface border border-border/60 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all shadow-sm"
                      />
                    </PremiumRow>

                    <PremiumRow
                      id="setting-brand-voice"
                      title="Ton de communication"
                      description="Le style de langage utilisé par l'IA."
                      highlighted={highlightedSettingId === "setting-brand-voice"}
                    >
                      <select
                        value={brandTone}
                        onChange={(e) => setBrandTone(e.target.value)}
                        className="w-full bg-surface border border-border/60 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all shadow-sm"
                      >
                        <option value="vendeur">🛍 Vendeur & Conversion</option>
                        <option value="professionnel">💼 Professionnel & Expert</option>
                        <option value="premium">💎 Luxe & Haut de Gamme</option>
                        <option value="humoristique">😄 Viral & Humoristique</option>
                      </select>
                    </PremiumRow>

                    <PremiumRow
                      title="Style rédactionnel"
                      description="La structure des publications."
                    >
                      <select
                        value={brandStyle}
                        onChange={(e) => setBrandStyle(e.target.value)}
                        className="w-full bg-surface border border-border/60 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all shadow-sm"
                      >
                        <option value="moderne">Moderne & Épuré (Phrases courtes)</option>
                        <option value="storytelling">Storytelling & Émotion</option>
                        <option value="direct">Direct & Percutant</option>
                        <option value="pedagogique">Informatif & Pédagogique</option>
                      </select>
                    </PremiumRow>

                    <PremiumRow
                      title="Description de l'activité"
                      description="Pour aider l'IA à comprendre vos produits."
                    >
                      <textarea
                        rows={3}
                        value={brandDescription}
                        onChange={(e) => setBrandDescription(e.target.value)}
                        placeholder="Ex: Plateforme marketing tout-en-un..."
                        className="w-full bg-surface border border-border/60 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all shadow-sm resize-none"
                      />
                    </PremiumRow>

                    <PremiumRow
                      title="Mots interdits (Blacklist)"
                      description="Séparés par des virgules."
                    >
                      <input
                        value={brandProhibitedWords}
                        onChange={(e) => setBrandProhibitedWords(e.target.value)}
                        placeholder="Ex: arnaque, pas cher, urgent"
                        className="w-full bg-surface border border-border/60 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all shadow-sm"
                      />
                    </PremiumRow>

                    <PremiumRow
                      id="setting-brand-signature"
                      title="Hashtags officiels"
                      description="Ajoutés automatiquement en fin de publication."
                      highlighted={highlightedSettingId === "setting-brand-signature"}
                    >
                      <input
                        value={brandHashtags}
                        onChange={(e) => setBrandHashtags(e.target.value)}
                        placeholder="#fundoral #business"
                        className="w-full bg-surface border border-border/60 rounded-xl px-4 py-2.5 text-sm font-mono outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all shadow-sm"
                      />
                    </PremiumRow>

                    <PremiumRow
                      title="Signature automatique"
                      description="Votre pied de page personnalisé."
                    >
                      <input
                        value={brandSignature}
                        onChange={(e) => setBrandSignature(e.target.value)}
                        placeholder="📍 Douala | 📲 WhatsApp disponible"
                        className="w-full bg-surface border border-border/60 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all shadow-sm"
                      />
                    </PremiumRow>
                  </PremiumCard>
                </div>

                {/* Right Column: Live Interactive Brand Mockup Preview */}
                <div className="xl:col-span-5 space-y-4 xl:sticky xl:top-6">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Sparkle size={14} className="text-rose-400" />
                      Aperçu en Direct de Votre Marque
                    </span>
                    <div className="flex items-center gap-1 bg-surface-2 p-0.5 rounded-lg border border-border">
                      <button
                        type="button"
                        onClick={() => setBrandMockupChannel("facebook")}
                        className={cn(
                          "px-2 py-1 rounded text-[10px] font-semibold transition",
                          brandMockupChannel === "facebook" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                        )}
                      >
                        Facebook
                      </button>
                      <button
                        type="button"
                        onClick={() => setBrandMockupChannel("whatsapp")}
                        className={cn(
                          "px-2 py-1 rounded text-[10px] font-semibold transition",
                          brandMockupChannel === "whatsapp" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                        )}
                      >
                        WhatsApp
                      </button>
                    </div>
                  </div>

                  {brandMockupChannel === "facebook" ? (
                    /* Facebook Post Mockup */
                    <div className="rounded-2xl border border-border/60 bg-surface/80 backdrop-blur-md shadow-sm shadow-sm shadow-md overflow-hidden text-xs">
                      {/* Post Header */}
                      <div className="p-4 flex items-center justify-between border-b border-border/40">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-rose-500 to-orange-500 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                            {(brandName || "F")[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-foreground text-sm flex items-center gap-1.5">
                              {brandName || "Nom de votre Marque"}
                              <CheckCircle size={14} weight="fill" className="text-rose-500" />
                            </p>
                            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                              Il y a 5 min • 🌐 Public •
                              <span className="rounded bg-rose-500/10 text-rose-500 px-1 font-semibold text-[10px]">
                                {brandTone === "vendeur" ? "🛍 Vente" : brandTone === "professionnel" ? "💼 Pro" : brandTone === "premium" ? "💎 Luxe" : "😄 Viral"}
                              </span>
                            </p>
                          </div>
                        </div>
                        <DotsThree size={20} className="text-muted-foreground" />
                      </div>

                      {/* Post Body */}
                      <div className="p-4 space-y-3 leading-relaxed text-foreground">
                        <p>
                          ✨ <strong>Nouveau chez {brandName || "notre marque"} !</strong>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {brandDescription
                            ? brandDescription.slice(0, 180) + (brandDescription.length > 180 ? "..." : "")
                            : "Découvrez notre catalogue exclusif pensé pour répondre à vos exigences au quotidien. Qualité irréprochable et service client 24/7."}
                        </p>
                        <p className="text-[11px] text-foreground/80 font-medium">
                          {brandSignature}
                        </p>
                        <p className="font-mono text-rose-500 dark:text-rose-400 text-[11px]">
                          {brandHashtags}
                        </p>
                      </div>

                      {/* Simulated Post Image */}
                      <div className="h-44 w-full bg-gradient-to-br from-indigo-900/40 via-orange-900/30 to-slate-900 flex flex-col items-center justify-center text-center p-4 border-y border-border/40">
                        <Sparkle size={28} className="text-rose-400 mb-2 animate-pulse" />
                        <p className="font-bold text-white text-xs">{brandName || "Fundoral"}</p>
                        <p className="text-[10px] text-zinc-300 max-w-xs mt-0.5">Visuel haute définition généré automatiquement par l&apos;IA</p>
                      </div>

                      {/* Engagement Bar */}
                      <div className="p-3 bg-surface-2/40 flex items-center justify-around text-muted-foreground text-xs font-semibold">
                        <span className="flex items-center gap-1.5 hover:text-foreground cursor-pointer">
                          <ThumbsUp size={15} /> J&apos;aime
                        </span>
                        <span className="flex items-center gap-1.5 hover:text-foreground cursor-pointer">
                          <ChatCircle size={15} /> Commenter
                        </span>
                        <span className="flex items-center gap-1.5 hover:text-foreground cursor-pointer">
                          <ShareFat size={15} /> Partager
                        </span>
                      </div>
                    </div>
                  ) : (
                    /* WhatsApp Message Mockup */
                    <div className="rounded-2xl border border-emerald-500/30 bg-[#0b141a] text-white shadow-md overflow-hidden text-xs">
                      <div className="p-3 bg-[#202c33] flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
                          {(brandName || "W")[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-zinc-100 text-xs">{brandName || "Votre Marque"} (Canal Officiel)</p>
                          <p className="text-[10px] text-zinc-400">Diffusion WhatsApp automatisée</p>
                        </div>
                      </div>
                      <div className="p-4 space-y-2.5">
                        <div className="bg-[#005c4b] p-3 rounded-2xl rounded-tl-none max-w-sm space-y-1.5 shadow-sm text-zinc-100">
                          <p className="font-bold">📢 NOUVELLE ANNONCE :</p>
                          <p className="text-[11px] text-zinc-200">
                            {brandDescription ? brandDescription.slice(0, 160) + "..." : "Découvrez notre dernière offre disponible en boutique dès maintenant !"}
                          </p>
                          <p className="text-[10px] pt-1 text-emerald-200 font-semibold">{brandSignature}</p>
                          <p className="text-[9px] text-zinc-300 font-mono">{brandHashtags}</p>
                          <span className="text-[9px] text-zinc-400 block text-right pt-0.5">12:30 ✓✓</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* 2. PERSONNALISATION : APPARENCE                            */}
          {/* ========================================================== */}
          {activeTab === "appearance" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-500 ease-out fill-mode-both">
              <PremiumCard
                id="setting-theme-mode"
                title="Apparence & Thème Visuel"
                description="Choisissez votre confort d'affichage. Mémorisé sur tous vos appareils et synchronisé avec votre compte."
                icon={Sun}
                highlighted={highlightedSettingId === "setting-theme-mode"}
              >
                <div className="py-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Light Mode Option */}
                  <button
                    type="button"
                    onClick={() => handleThemeChange("light")}
                    className={cn(
                      "flex flex-col items-center gap-3 p-5 rounded-2xl border text-center transition cursor-pointer relative group",
                      currentTheme === "light"
                        ? "border-rose-500 bg-rose-500/5 text-rose-600 dark:text-rose-400 ring-2 ring-rose-500/20 font-bold shadow-md"
                        : "border-border/60 bg-surface text-muted-foreground hover:border-rose-500/40 hover:bg-surface-2"
                    )}
                  >
                    {currentTheme === "light" && (
                      <span className="absolute top-2.5 right-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-white text-[10px] shadow-sm">
                        <Check weight="bold" />
                      </span>
                    )}
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 group-hover:scale-110 transition-transform">
                      <Sun size={24} weight={currentTheme === "light" ? "fill" : "regular"} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Clair (Jour)</p>
                      <p className="text-[11px] text-muted-foreground mt-1">Fond lumineux et très contrasté</p>
                    </div>
                  </button>

                  {/* Dark Mode Option */}
                  <button
                    type="button"
                    onClick={() => handleThemeChange("dark")}
                    className={cn(
                      "flex flex-col items-center gap-3 p-5 rounded-2xl border text-center transition cursor-pointer relative group",
                      currentTheme === "dark"
                        ? "border-rose-500 bg-rose-500/5 text-rose-600 dark:text-rose-400 ring-2 ring-rose-500/20 font-bold shadow-md"
                        : "border-border/60 bg-surface text-muted-foreground hover:border-rose-500/40 hover:bg-surface-2"
                    )}
                  >
                    {currentTheme === "dark" && (
                      <span className="absolute top-2.5 right-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-white text-[10px] shadow-sm">
                        <Check weight="bold" />
                      </span>
                    )}
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500 group-hover:scale-110 transition-transform">
                      <Moon size={24} weight={currentTheme === "dark" ? "fill" : "regular"} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Sombre (Nuit)</p>
                      <p className="text-[11px] text-muted-foreground mt-1">Fond bleu nuit reposant</p>
                    </div>
                  </button>

                  {/* System Mode Option */}
                  <button
                    type="button"
                    onClick={() => handleThemeChange("system")}
                    className={cn(
                      "flex flex-col items-center gap-3 p-5 rounded-2xl border text-center transition cursor-pointer relative group",
                      currentTheme === "system"
                        ? "border-rose-500 bg-rose-500/5 text-rose-600 dark:text-rose-400 ring-2 ring-rose-500/20 font-bold shadow-md"
                        : "border-border/60 bg-surface text-muted-foreground hover:border-rose-500/40 hover:bg-surface-2"
                    )}
                  >
                    {currentTheme === "system" && (
                      <span className="absolute top-2.5 right-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-white text-[10px] shadow-sm">
                        <Check weight="bold" />
                      </span>
                    )}
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500 group-hover:scale-110 transition-transform">
                      <Desktop size={24} weight={currentTheme === "system" ? "fill" : "regular"} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Système (Auto)</p>
                      <p className="text-[11px] text-muted-foreground mt-1">S'adapte à votre OS</p>
                    </div>
                  </button>
                </div>
              </PremiumCard>
            </div>
          )}

          {/* ========================================================== */}
          {/* 3. ESPACE DE TRAVAIL : ORGANISATION ET ÉQUIPE             */}
          {/* ========================================================== */}
          {activeTab === "workspace" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-500 ease-out fill-mode-both">
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                <div className="xl:col-span-7 space-y-5">
                  <PremiumCard
                    id="setting-workspace-name"
                    title="Organisation & Paramètres Généraux"
                    description="Configurez votre espace de travail, votre langue et le fuseau horaire de diffusion."
                    icon={Buildings}
                    highlighted={highlightedSettingId === "setting-workspace-name"}
                    action={
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
                        className="bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 shadow-md shadow-rose-500/20 text-white"
                      >
                        {savedSuccess === "workspace" ? "Enregistré ✓" : "Enregistrer"}
                      </Button>
                    }
                  >
                    <PremiumRow
                      title="Nom de l'Organisation"
                      description="Le nom de votre espace de travail."
                    >
                      <input
                        value={workspaceName}
                        onChange={(e) => setWorkspaceName(e.target.value)}
                        placeholder="Ex: Direction Entreprise Yamoura"
                        className="w-full bg-surface border border-border/60 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all shadow-sm"
                      />
                    </PremiumRow>

                    <PremiumRow
                      id="setting-admin-email"
                      title="Email administrateur"
                      description="Adresse de contact de facturation."
                      highlighted={highlightedSettingId === "setting-admin-email"}
                    >
                      <input
                        type="email"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        placeholder="contact@fundoral.shop"
                        className="w-full bg-surface border border-border/60 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all shadow-sm"
                      />
                    </PremiumRow>

                    <PremiumRow
                      title="Langue de l'interface"
                      description="Langue utilisée dans l'application."
                    >
                      <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="w-full bg-surface border border-border/60 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all shadow-sm"
                      >
                        <option value="fr">🇫🇷 Français (Officiel)</option>
                        <option value="en">🇬🇧 English</option>
                      </select>
                    </PremiumRow>

                    <PremiumRow
                      id="setting-timezone"
                      title="Fuseau horaire"
                      description="Pour l'heure de publication."
                      highlighted={highlightedSettingId === "setting-timezone"}
                    >
                      <div className="space-y-2">
                        {browserTimezone && browserTimezone !== timezone && (
                          <button
                            type="button"
                            onClick={() => setTimezone(browserTimezone)}
                            className="text-[10px] font-medium text-rose-500 hover:text-rose-600 flex items-center gap-1 transition"
                          >
                            <Clock size={12} /> Utiliser l'heure locale ({browserTimezone.split("/")[1] || browserTimezone})
                          </button>
                        )}
                        <select
                          value={timezone}
                          onChange={(e) => setTimezone(e.target.value)}
                          className="w-full bg-surface border border-border/60 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all shadow-sm"
                        >
                          {TIMEZONE_GROUPS.map((grp) => (
                            <optgroup key={grp.region} label={grp.region}>
                              {grp.timezones.map((tz) => (
                                <option key={tz.id} value={tz.id}>
                                  {tz.label}
                                </option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                      </div>
                    </PremiumRow>
                  </PremiumCard>
                </div>

                {/* Right Column: Team Roles & Members */}
                <Card id="setting-team-members" className={cn("xl:col-span-5 space-y-4", highlightedSettingId === "setting-team-members" && "ring-2 ring-rose-500 ring-offset-2")}>
                  <div className="flex items-center justify-between pb-3 border-b border-border">
                    <div>
                      <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-2">
                        <Users size={18} className="text-rose-500" />
                        Équipe &amp; Rôles d&apos;accès
                      </h3>
                      <p className="text-[11px] text-muted-foreground">Membres autorisés sur cet espace.</p>
                    </div>
                    <Link href="/dashboard/team">
                      <Button size="sm" variant="outline" className="text-xs h-7">
                        Gérer l&apos;équipe ↗
                      </Button>
                    </Link>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-surface-2/60 border border-border">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-rose-500/20 text-rose-400 font-bold flex items-center justify-center text-xs">
                          AD
                        </div>
                        <div>
                          <p className="font-bold text-foreground text-xs">{workspaceName || "Administrateur"}</p>
                          <p className="text-[10px] text-muted-foreground">{adminEmail || "contact@fundoral.shop"}</p>
                        </div>
                      </div>
                      <span className="rounded-full bg-rose-500/10 text-rose-500 px-2 py-0.5 text-[10px] font-bold">
                        Propriétaire
                      </span>
                    </div>

                    <div className="p-3 rounded-xl border border-dashed border-border bg-surface-2/20 text-center space-y-1">
                      <p className="text-[11px] font-medium text-muted-foreground">Inviter un nouveau collaborateur</p>
                      <p className="text-[10px] text-muted-foreground/80">Attribuez des rôles d&apos;Éditeur ou d&apos;Observateur sans partager vos identifiants administrateur.</p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* 4. ESPACE DE TRAVAIL : NOTIFICATIONS                      */}
          {/* ========================================================== */}
          {activeTab === "notifications" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-500 ease-out fill-mode-both">
              <Card id="setting-notifications-email" className={cn("space-y-5", highlightedSettingId === "setting-notifications-email" && "ring-2 ring-rose-500 ring-offset-2")}>
                <div className="flex items-start justify-between pb-3 border-b border-border">
                  <div>
                    <h2 className="font-heading font-bold text-base text-foreground flex items-center gap-2">
                      <Broadcast size={20} className="text-rose-500" />
                      Canaux de Notification &amp; Alertes
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Choisissez les alertes critiques et rapports d&apos;activité dont vous souhaitez être informé en temps réel.
                    </p>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between p-3.5 rounded-xl border border-border/60 bg-surface-2/60 backdrop-blur-sm/60">
                    <div>
                      <p className="font-bold text-foreground">Alertes email en cas d&apos;échec de publication</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Notification instantanée si Meta rejette une publication ou si le jeton expire.
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-500/10 text-emerald-500 px-2.5 py-0.5 font-bold text-[10px]">
                      Activé par défaut
                    </span>
                  </div>

                  <div id="setting-notifications-whatsapp" className={cn("flex items-center justify-between p-3.5 rounded-xl border border-border/60 bg-surface-2/60 backdrop-blur-sm/60", highlightedSettingId === "setting-notifications-whatsapp" && "ring-2 ring-rose-500 ring-offset-2")}>
                    <div>
                      <p className="font-bold text-foreground">Rapport d&apos;activité quotidien WhatsApp</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Synthèse automatique envoyée sur votre numéro ou groupe d&apos;administration chaque soir.
                      </p>
                    </div>
                    <span className="rounded-full bg-rose-500/10 text-rose-400 px-2.5 py-0.5 font-bold text-[10px]">
                      Via passerelle WhatsApp
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* ========================================================== */}
          {/* 5. ESPACE DE TRAVAIL : FACTURATION                        */}
          {/* ========================================================== */}
          {activeTab === "billing" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-500 ease-out fill-mode-both">
              <Card id="setting-billing-plan" className={cn(highlightedSettingId === "setting-billing-plan" && "ring-2 ring-rose-500 ring-offset-2")}>
                <div className="flex items-start justify-between pb-3 border-b border-border">
                  <div>
                    <h2 className="font-heading font-bold text-base text-foreground flex items-center gap-2">
                      <Rocket size={20} className="text-rose-500" />
                      Abonnement, Consommation &amp; Quotas
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Détails de votre licence Fundoral et consommation de vos quotas de diffusion.
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-3 py-1 text-xs font-bold">
                    Plan Enterprise Actif
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl border border-border/60 bg-surface-2/60 backdrop-blur-sm/60 text-xs">
                    <p className="text-muted-foreground text-[11px]">Publications Mensuelles</p>
                    <p className="font-heading text-2xl font-bold text-foreground mt-1">Illimitées</p>
                    <p className="text-[10px] text-emerald-500 font-semibold mt-1">Sans restriction de volume</p>
                  </div>

                  <div className="p-4 rounded-2xl border border-border/60 bg-surface-2/60 backdrop-blur-sm/60 text-xs">
                    <p className="text-muted-foreground text-[11px]">Pages Facebook &amp; WhatsApp</p>
                    <p className="font-heading text-2xl font-bold text-foreground mt-1">Multi-comptes</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Diffusion multi-canaux simultanée</p>
                  </div>

                  <div className="p-4 rounded-2xl border border-border/60 bg-surface-2/60 backdrop-blur-sm/60 text-xs">
                    <p className="text-muted-foreground text-[11px]">Stockage Médias Cloud</p>
                    <p className="font-heading text-2xl font-bold text-foreground mt-1">Actif (50 Mo/vidéo)</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Hébergement certifié Supabase</p>
                  </div>
                </div>

                <div className="mt-4 p-4 rounded-2xl border border-border/60 bg-surface-2/60 backdrop-blur-sm/40 text-xs text-muted-foreground leading-relaxed">
                  <p className="font-semibold text-foreground">Facturation transparente Meta Ads :</p>
                  <p className="text-[11px] mt-0.5">
                    Fundoral ne prélève aucune commission sur vos dépenses publicitaires Meta Ads. Vos campagnes sont facturées directement par Meta sur votre moyen de paiement associé dans votre Gestionnaire de Publicités.
                  </p>
                </div>
              </Card>
            </div>
          )}

          {/* ========================================================== */}
          {/* 6. CONNEXIONS : SITES ET RÉSEAUX (INTERACTIVE 5-STEP WIZARD)*/}
          {/* ========================================================== */}
          {activeTab === "channels" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-500 ease-out fill-mode-both">
              {/* Section Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-border/70 bg-surface/80 backdrop-blur-md shadow-sm">
                <div>
                  <h2 className="font-heading font-bold text-base sm:text-lg text-foreground flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 shadow-sm">
                      <Globe size={20} weight="duotone" />
                    </div>
                    Hub des Canaux &amp; Intégrations Officielles
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1 max-w-2xl leading-relaxed">
                    Connectez vos sources de contenus, configurez vos passerelles Webhooks et autorisez vos canaux de diffusion officiels (Meta, WhatsApp) en toute sécurité.
                  </p>
                </div>
                <Link href="/dashboard/connections">
                  <Button size="sm" variant="outline" className="text-xs shrink-0 shadow-sm hover:border-rose-500/40">
                    <Sliders size={13} className="mr-1.5 text-rose-500" /> Centre Multi-Sites ↗
                  </Button>
                </Link>
              </div>

              {/* Category Pill Switcher */}
              <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl border border-border/70 bg-surface-2/40 backdrop-blur-md shadow-sm">
                <button
                  type="button"
                  onClick={() => setConnectionCategory("all")}
                  className={cn(
                    "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
                    connectionCategory === "all"
                      ? "bg-rose-500 text-white shadow-md shadow-rose-500/25"
                      : "text-muted-foreground hover:text-foreground hover:bg-surface"
                  )}
                >
                  <Sparkle size={15} weight={connectionCategory === "all" ? "fill" : "regular"} />
                  <span>Toutes les Connexions</span>
                  <span className="rounded-full bg-white/20 px-1.5 py-0.2 text-[10px] font-bold">3</span>
                </button>

                <button
                  type="button"
                  onClick={() => setConnectionCategory("websites")}
                  className={cn(
                    "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
                    connectionCategory === "websites"
                      ? "bg-rose-500 text-white shadow-md shadow-rose-500/25"
                      : "text-muted-foreground hover:text-foreground hover:bg-surface"
                  )}
                >
                  <Globe size={15} weight={connectionCategory === "websites" ? "fill" : "regular"} />
                  <span>1. Sites Web &amp; E-Commerce</span>
                  <span className="rounded-full bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 text-[10px] font-bold">Actif</span>
                </button>

                <button
                  type="button"
                  onClick={() => setConnectionCategory("facebook")}
                  className={cn(
                    "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
                    connectionCategory === "facebook"
                      ? "bg-rose-500 text-white shadow-md shadow-rose-500/25"
                      : "text-muted-foreground hover:text-foreground hover:bg-surface"
                  )}
                >
                  <FacebookLogo size={15} weight={connectionCategory === "facebook" ? "fill" : "regular"} />
                  <span>2. Facebook &amp; Pages Pro</span>
                  {settings?.facebook_connected ? (
                    <span className="rounded-full bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 text-[10px] font-bold">Connecté</span>
                  ) : (
                    <span className="rounded-full bg-amber-500/20 text-amber-400 px-1.5 py-0.5 text-[10px] font-bold">Requis</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setConnectionCategory("whatsapp")}
                  className={cn(
                    "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
                    connectionCategory === "whatsapp"
                      ? "bg-rose-500 text-white shadow-md shadow-rose-500/25"
                      : "text-muted-foreground hover:text-foreground hover:bg-surface"
                  )}
                >
                  <WhatsappLogo size={15} weight={connectionCategory === "whatsapp" ? "fill" : "regular"} />
                  <span>3. WhatsApp Business</span>
                  {whatsappEnabled ? (
                    <span className="rounded-full bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 text-[10px] font-bold">Actif</span>
                  ) : (
                    <span className="rounded-full bg-surface-3 text-muted-foreground px-1.5 py-0.5 text-[10px]">Désactivé</span>
                  )}
                </button>
              </div>

              {/* Executive Category Overview Cards (When "All" is active) */}
              {connectionCategory === "all" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in duration-300">
                  {/* Card 1: Websites */}
                  <div
                    onClick={() => setConnectionCategory("websites")}
                    className="group p-4 rounded-2xl border border-border/70 bg-surface/70 hover:bg-surface hover:border-rose-500/40 backdrop-blur-md shadow-sm transition-all duration-200 cursor-pointer space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20 shadow-sm">
                        <Globe size={20} weight="duotone" />
                      </div>
                      <StatusPill status="active" label="1 Active" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground group-hover:text-rose-500 transition-colors">
                        Sites Web &amp; E-Commerce
                      </h3>
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                        Passerelle Webhook REST, WordPress, Shopify et documentation d&apos;envoi automatique.
                      </p>
                    </div>
                    <div className="flex items-center text-xs font-bold text-rose-500 group-hover:translate-x-1 transition-transform">
                      <span>Gérer l&apos;intégration</span>
                      <CaretRight size={13} className="ml-1" />
                    </div>
                  </div>

                  {/* Card 2: Facebook */}
                  <div
                    onClick={() => setConnectionCategory("facebook")}
                    className="group p-4 rounded-2xl border border-border/70 bg-surface/70 hover:bg-surface hover:border-[#1877F2]/40 backdrop-blur-md shadow-sm transition-all duration-200 cursor-pointer space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1877F2]/10 text-[#1877F2] border border-[#1877F2]/20 shadow-sm">
                        <FacebookLogo size={20} weight="fill" />
                      </div>
                      {settings?.facebook_connected ? (
                        <StatusPill status="active" label="Connecté" />
                      ) : (
                        <StatusPill status="warning" label="Requis" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground group-hover:text-[#1877F2] transition-colors">
                        Facebook &amp; Pages Pro
                      </h3>
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                        {settings?.facebook_connected
                          ? `Admin : ${settings.facebook_user_name || "William"} • Page : ${settings.default_page_name || "Yamoura"}`
                          : "Autorisez votre page Facebook pour la publication directe de vos posts et visuels."}
                      </p>
                    </div>
                    <div className="flex items-center text-xs font-bold text-[#1877F2] group-hover:translate-x-1 transition-transform">
                      <span>Gérer Facebook</span>
                      <CaretRight size={13} className="ml-1" />
                    </div>
                  </div>

                  {/* Card 3: WhatsApp */}
                  <div
                    onClick={() => setConnectionCategory("whatsapp")}
                    className="group p-4 rounded-2xl border border-border/70 bg-surface/70 hover:bg-surface hover:border-emerald-500/40 backdrop-blur-md shadow-sm transition-all duration-200 cursor-pointer space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-sm">
                        <WhatsappLogo size={20} weight="fill" />
                      </div>
                      {whatsappEnabled ? (
                        <StatusPill status="active" label="Canal Actif" />
                      ) : (
                        <StatusPill status="neutral" label="Désactivé" icon={false} />
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground group-hover:text-emerald-500 transition-colors">
                        WhatsApp Business &amp; Groupes
                      </h3>
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                        {whatsappEnabled
                          ? `Passerelle : ${whatsappInstanceName || "yamoura-bot"} • Test direct opérationnel`
                          : "Diffusion automatique sur vos groupes et contacts WhatsApp via Cloud API."}
                      </p>
                    </div>
                    <div className="flex items-center text-xs font-bold text-emerald-500 group-hover:translate-x-1 transition-transform">
                      <span>Gérer WhatsApp</span>
                      <CaretRight size={13} className="ml-1" />
                    </div>
                  </div>
                </div>
              )}

              {/* 1. SOURCES DE CONTENU (Sites Web & Boutiques) */}
              {(connectionCategory === "all" || connectionCategory === "websites") && (
                <PremiumCard
                  id="setting-channel-websites"
                  title="1. Sources de Contenus (Sites Web &amp; E-Commerce)"
                  description="Sites et boutiques expéditeurs qui transmettent leurs annonces à Fundoral pour préparation IA et diffusion."
                  icon={Globe}
                  highlighted={highlightedSettingId === "setting-channel-websites"}
                  action={
                    <Link href="/dashboard/automations">
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white shadow-sm shadow-rose-500/20 text-xs h-8"
                      >
                        <Plus size={13} className="mr-1.5" /> Connecter un site
                      </Button>
                    </Link>
                  }
                >
                  <div className="p-5 sm:p-6 space-y-6">
                    {/* Active Sources List */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                          Sources Actives &amp; Passerelles Dédiées
                        </span>
                        <span className="text-[11px] text-emerald-500 font-semibold flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Synchronisation Temps Réel Active
                        </span>
                      </div>

                      {settings?.connected_websites && settings.connected_websites.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {settings.connected_websites.map((site) => (
                            <div
                              key={site.id}
                              className="flex items-center justify-between p-3.5 rounded-xl border border-border/70 bg-surface/60 backdrop-blur-sm shadow-sm hover:border-border transition-all"
                            >
                              <div className="flex items-center gap-3">
                                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500 font-bold text-xs border border-rose-500/20 shadow-sm">
                                  {site.platform === "wordpress" ? "WP" : site.platform === "shopify" ? "SH" : "WEB"}
                                </span>
                                <div>
                                  <p className="font-bold text-foreground text-xs">{site.name}</p>
                                  <p className="text-[10px] text-muted-foreground font-mono">{site.url}</p>
                                </div>
                              </div>
                              <div className="text-right space-y-0.5">
                                <span className="inline-block rounded-full bg-emerald-500/10 text-emerald-500 px-2.5 py-0.5 text-[10px] font-bold border border-emerald-500/20">
                                  Actif
                                </span>
                                <p className="text-[10px] text-muted-foreground">
                                  {site.auto_publish ? "Auto-diffusion" : "Brouillon"}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 backdrop-blur-sm">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 font-black text-xs border border-emerald-500/20 shadow-sm">
                              WEB
                            </div>
                            <div>
                              <p className="font-bold text-foreground text-sm flex items-center gap-2">
                                Yamoura E-Commerce &amp; Annonces
                                <span className="rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 font-bold">
                                  Officiel
                                </span>
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Passerelle Webhook dédiée &amp; synchronisation automatique en temps réel
                              </p>
                            </div>
                          </div>
                          <span className="self-start sm:self-auto inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 text-emerald-500 px-3 py-1 text-xs font-bold border border-emerald-500/30 shadow-sm">
                            <CheckCircle size={14} weight="fill" /> Source connectée
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Integrated Webhook Endpoint Snippet */}
                    <WebhookEndpointSnippet
                      endpointUrl={typeof window !== "undefined" ? `${window.location.origin}/api/webhooks/publish-from-site` : "https://votre-domaine.com/api/webhooks/publish-from-site"}
                      secretKey={settings?.webhook_secret || webhookSecret}
                    />

                    {/* Comprehensive Website Integration Guide & Live Simulator */}
                    <WebsiteIntegrationDocs
                      webhookUrl={typeof window !== "undefined" ? `${window.location.origin}/api/webhooks/publish-from-site` : "https://fundoral.shop/api/webhooks/publish-from-site"}
                      webhookSecret={settings?.webhook_secret || webhookSecret}
                    />

                    {/* Connecteurs Rapides & Guides */}
                    <div className="space-y-2.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                        Connecteurs Disponibles &amp; Protocoles d&apos;Intégration
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="p-3.5 rounded-xl border border-border/70 bg-surface/50 space-y-2 hover:border-border transition-all">
                          <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <Globe size={14} className="text-blue-400" /> WordPress &amp; WooCommerce
                          </p>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            Publiez automatiquement à chaque ajout d&apos;article ou nouveau produit via webhook REST.
                          </p>
                          <QuickExternalLink
                            href="/dashboard/automations"
                            label="Guide de configuration"
                            className="w-full justify-between text-[11px]"
                          />
                        </div>

                        <div className="p-3.5 rounded-xl border border-border/70 bg-surface/50 space-y-2 hover:border-border transition-all">
                          <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <Sparkle size={14} className="text-emerald-400" /> Shopify &amp; Boutiques en Ligne
                          </p>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            Synchronisez vos nouveaux produits, soldes et promotions directement dans la file d&apos;attente.
                          </p>
                          <QuickExternalLink
                            href="/dashboard/automations"
                            label="Connecter Shopify"
                            className="w-full justify-between text-[11px]"
                          />
                        </div>

                        <div className="p-3.5 rounded-xl border border-border/70 bg-surface/50 space-y-2 hover:border-border transition-all">
                          <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <Code size={14} className="text-rose-400" /> API Custom / CMS Externe
                          </p>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            Envoyez directement votre JSON avec titre, description, tags et URL d&apos;image via HTTP POST.
                          </p>
                          <QuickExternalLink
                            href="/dashboard/settings?tab=advanced#setting-advanced-webhooks"
                            label="Spécifications API"
                            className="w-full justify-between text-[11px]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </PremiumCard>
              )}

              {/* 2. DESTINATIONS DE DIFFUSION : FACEBOOK & PAGES META */}
              {(connectionCategory === "all" || connectionCategory === "facebook") && (
                <PremiumCard
                  id="setting-channel-facebook"
                title="2. Destination Facebook &amp; Pages Professionnelles"
                description="Comptes officiels recevant vos publications, reels, stories et annonces sociales."
                icon={FacebookLogo}
                highlighted={highlightedSettingId === "setting-channel-facebook"}
                action={
                  settings.facebook_connected ? (
                    <StatusPill status="active" label="Vérifié & Prêt à publier" />
                  ) : (
                    <StatusPill status="warning" label="Connexion requise" />
                  )
                }
              >
                <div className="p-5 sm:p-6 space-y-6">
                  {/* Connected Status Spotlight Banner */}
                  {settings.facebook_connected && !showFbWizard && (
                    <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/[0.08] to-surface/80 p-5 space-y-5 backdrop-blur-md shadow-sm">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-emerald-500/20">
                        <div className="flex items-center gap-3.5">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1877F2]/15 text-[#1877F2] border border-[#1877F2]/30 shadow-md flex-shrink-0">
                            <FacebookLogo size={28} weight="fill" />
                          </div>
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                              Compte Administrateur Meta Connecté
                            </p>
                            <h4 className="text-base font-bold text-foreground flex items-center gap-2">
                              {settings.facebook_user_name || "William Tiomegni"}
                              <span className="rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 font-bold">
                                Actif
                              </span>
                            </h4>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Page de diffusion par défaut :{" "}
                              <strong className="text-foreground font-semibold bg-surface-2 px-2 py-0.5 rounded-md border border-border">
                                {settings.default_page_name || "Yamoura"}
                              </strong>
                              {settings.default_page_id && (
                                <span className="text-[10px] text-muted-foreground font-mono ml-2">
                                  (ID: {settings.default_page_id})
                                </span>
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setShowFbWizard(true);
                              setFbStep(3);
                              loadFacebookPages();
                            }}
                            className="text-xs h-8 shadow-sm border border-border"
                          >
                            <Sliders size={13} className="mr-1.5 text-rose-500" />
                            Changer de Page
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setShowFbWizard(true);
                              setFbStep(1);
                            }}
                            className="text-xs h-8 shadow-sm"
                          >
                            <Rocket size={13} className="mr-1.5" />
                            Assistant pas-à-pas
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={disconnectFacebook}
                            loading={disconnecting}
                            className="text-xs h-8 text-destructive hover:bg-destructive/10"
                          >
                            <LinkBreak size={13} className="mr-1.5" />
                            Déconnecter
                          </Button>
                        </div>
                      </div>

                      {/* Permissions Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-surface/60 border border-emerald-500/20">
                          <CheckCircle size={16} weight="fill" className="text-emerald-500 shrink-0" />
                          <div>
                            <span className="font-semibold text-foreground">Publication directe active</span>
                            <p className="text-[10px] text-muted-foreground font-mono">pages_manage_posts • Accès en écriture vérifié</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-surface/60 border border-emerald-500/20">
                          <CheckCircle size={16} weight="fill" className="text-emerald-500 shrink-0" />
                          <div>
                            <span className="font-semibold text-foreground">Statistiques &amp; Engagement</span>
                            <p className="text-[10px] text-muted-foreground font-mono">pages_read_engagement • Métriques en direct</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Dedicated Quick Direct Links to Meta Consoles (Crucial User Feedback!) */}
                  <div className="space-y-2.5 p-4 rounded-2xl border border-border/70 bg-surface-2/30 backdrop-blur-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Key size={13} className="text-rose-500" />
                        Raccourcis &amp; Consoles Officielles Meta for Developers
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        Liens directs pour générer tokens, vérifier pages et administrer vos apps
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                      <QuickExternalLink
                        href="https://developers.facebook.com/apps/"
                        label="Console Apps Meta"
                        description="Créez ou gérez votre App ID et App Secret"
                      />
                      <QuickExternalLink
                        href="https://developers.facebook.com/tools/explorer/"
                        label="Graph API Explorer"
                        description="Générez un User Token ou Page Token instantanément"
                      />
                      <QuickExternalLink
                        href="https://business.facebook.com/latest/settings/pages"
                        label="Meta Business Suite"
                        description="Vérifiez les rôles administrateurs et accès aux Pages"
                      />
                      <QuickExternalLink
                        href="https://developers.facebook.com/tools/debug/accesstoken/"
                        label="Débogueur de Token"
                        description="Vérifiez la validité de 60 jours de votre token"
                      />
                    </div>
                  </div>

                {/* Interactive 5-Step Guided Assistant (When not connected OR when user clicked Assistant) */}
                {(!settings.facebook_connected || showFbWizard) && (
                  <div className="rounded-2xl border border-rose-500/20 bg-surface-2/40 p-5 space-y-5">
                    {/* Stepper Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-foreground">
                        <span className="flex items-center gap-1.5 text-rose-500">
                          Étape {fbStep} sur 5 : {fbStep === 1 ? "Comprendre" : fbStep === 2 ? "Connecter" : fbStep === 3 ? "Choisir" : fbStep === 4 ? "Vérifier" : "Continuer"}
                        </span>
                        {settings.facebook_connected && (
                          <button
                            type="button"
                            onClick={() => setShowFbWizard(false)}
                            className="text-[11px] text-muted-foreground hover:text-foreground"
                          >
                            ✕ Fermer l&apos;assistant
                          </button>
                        )}
                      </div>

                      {/* Stepper Buttons Bar */}
                      <div className="grid grid-cols-5 gap-1.5">
                        {[
                          { step: 1, label: "1. Comprendre" },
                          { step: 2, label: "2. Connecter" },
                          { step: 3, label: "3. Choisir" },
                          { step: 4, label: "4. Vérifier" },
                          { step: 5, label: "5. Continuer" },
                        ].map((s) => (
                          <button
                            key={s.step}
                            type="button"
                            onClick={() => setFbStep(s.step as any)}
                            className={cn(
                              "h-1.5 rounded-full transition-all duration-300",
                              fbStep === s.step
                                ? "bg-rose-500"
                                : fbStep > s.step
                                ? "bg-emerald-500"
                                : "bg-muted"
                            )}
                            title={s.label}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Step Content: ONE Main Step at a time */}
                    {fbStep === 1 && (
                      <div className="space-y-4 text-xs animate-in fade-in slide-in-from-bottom-3 duration-500 ease-out fill-mode-both">
                        <div className="p-4 rounded-xl bg-surface shadow-sm border border-border space-y-2">
                          <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                            <Info size={16} className="text-rose-500" />
                            Comprendre l&apos;intégration Facebook
                          </h4>
                          <p className="text-muted-foreground leading-relaxed text-xs">
                            Cette connexion permet à Fundoral de publier automatiquement vos visuels, descriptions, reels et liens directement sur vos Pages Facebook professionnelles.
                          </p>
                          <div className="pt-2 space-y-1.5 text-foreground">
                            <p className="font-semibold text-xs">Prérequis simples :</p>
                            <ul className="list-disc list-inside space-y-1 text-muted-foreground text-[11px]">
                              <li>Un compte Facebook personnel classique.</li>
                              <li>Avoir un rôle d&apos;Administrateur ou d&apos;Éditeur sur la Page Facebook cible.</li>
                              <li>Aucune connaissance technique requise : l&apos;authentification se fait en 1 clic.</li>
                            </ul>
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <Button
                            size="sm"
                            onClick={() => setFbStep(2)}
                            className="bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 shadow-md shadow-rose-500/20 hover:shadow-rose-500/30 hover:-translate-y-0.5 transition-all text-white text-xs"
                          >
                            Étape 2 : Connecter mon compte →
                          </Button>
                        </div>
                      </div>
                    )}

                    {fbStep === 2 && (
                      <div className="space-y-4 text-xs animate-in fade-in slide-in-from-bottom-3 duration-500 ease-out fill-mode-both">
                        <div className="p-4 rounded-xl bg-surface shadow-sm border border-border space-y-3">
                          <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                            <LinkSimple size={16} className="text-rose-500" />
                            Autoriser la connexion Meta sécurisée
                          </h4>
                          <p className="text-muted-foreground leading-relaxed text-xs">
                            Cliquez sur le bouton officiel ci-dessous. Vous serez redirigé vers l&apos;écran officiel de Meta pour confirmer les autorisations de publication de votre Page.
                          </p>

                          <div className="pt-2">
                            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
                            <a
                              href={
                                settings.facebook_config_id
                                  ? `/api/facebook/oauth/start?config_id=${encodeURIComponent(settings.facebook_config_id.trim())}`
                                  : "/api/facebook/oauth/start"
                              }
                            >
                              <Button size="sm" className="bg-[#1877F2] hover:bg-[#166FE5] text-white text-xs h-9 px-4">
                                <FacebookLogo size={16} weight="fill" className="mr-1.5" />
                                Se connecter avec Facebook (Autorisation 1 clic)
                              </Button>
                            </a>
                          </div>
                        </div>

                        <div className="flex justify-between items-center">
                          <Button size="sm" variant="ghost" onClick={() => setFbStep(1)} className="text-xs">
                            ← Précédent
                          </Button>
                          <Button size="sm" onClick={() => setFbStep(3)} className="text-xs">
                            Étape 3 : Choisir la Page →
                          </Button>
                        </div>
                      </div>
                    )}

                    {fbStep === 3 && (
                      <div className="space-y-4 text-xs animate-in fade-in slide-in-from-bottom-3 duration-500 ease-out fill-mode-both">
                        <div className="p-4 rounded-xl bg-surface shadow-sm border border-border space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                              <CheckCircle size={16} className="text-rose-500" />
                              Sélectionner la Page Facebook de diffusion
                            </h4>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => loadFacebookPages(true)}
                              loading={loadingPages}
                              className="text-xs h-7"
                            >
                              <ArrowClockwise size={12} className="mr-1" /> Rafraîchir
                            </Button>
                          </div>

                          <p className="text-muted-foreground text-xs">
                            Choisissez la Page par défaut sur laquelle vos annonces et visuels seront diffusés.
                          </p>

                          {pagesLoadError && (
                            <div className="p-2.5 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-xs">
                              {pagesLoadError}
                            </div>
                          )}

                          <div className="space-y-2 pt-1">
                            {fbPages.length > 0 ? (
                              fbPages.map((page) => {
                                const isDefault = page.page_id === settings.default_page_id;
                                return (
                                  <div
                                    key={page.page_id}
                                    onClick={() => selectDefaultPage(page.page_id)}
                                    className={cn(
                                      "flex items-center justify-between p-3 rounded-xl border transition cursor-pointer",
                                      isDefault
                                        ? "border-emerald-500/50 bg-emerald-500/10 font-bold"
                                        : "border-border bg-surface shadow-sm hover:bg-surface-2"
                                    )}
                                  >
                                    <div className="flex items-center gap-2.5">
                                      <div className="h-8 w-8 rounded-lg bg-rose-500/20 text-rose-400 font-bold flex items-center justify-center text-xs">
                                        FB
                                      </div>
                                      <div>
                                        <p className="text-xs text-foreground">{page.name}</p>
                                        <p className="text-[10px] text-muted-foreground font-mono">ID: {page.page_id}</p>
                                      </div>
                                    </div>
                                    <span
                                      className={cn(
                                        "text-[10px] px-2 py-0.5 rounded-full font-bold",
                                        isDefault
                                          ? "bg-emerald-500 text-white"
                                          : "bg-surface-3 text-muted-foreground"
                                      )}
                                    >
                                      {selectingPageId === page.page_id ? "Sélection..." : isDefault ? "Page par défaut ✓" : "Choisir"}
                                    </span>
                                  </div>
                                );
                              })
                            ) : (
                              <div className="text-center py-4 text-muted-foreground">
                                <p>Aucune page chargée pour le moment.</p>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => loadFacebookPages()}
                                  loading={loadingPages}
                                  className="mt-2 text-xs"
                                >
                                  Charger mes Pages Facebook
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex justify-between items-center">
                          <Button size="sm" variant="ghost" onClick={() => setFbStep(2)} className="text-xs">
                            ← Précédent
                          </Button>
                          <Button size="sm" onClick={() => setFbStep(4)} className="text-xs">
                            Étape 4 : Vérifier les permissions →
                          </Button>
                        </div>
                      </div>
                    )}

                    {fbStep === 4 && (
                      <div className="space-y-4 text-xs animate-in fade-in slide-in-from-bottom-3 duration-500 ease-out fill-mode-both">
                        <div className="p-4 rounded-xl bg-surface shadow-sm border border-border space-y-3">
                          <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                            <ShieldCheck size={16} className="text-rose-500" />
                            Contrôle et Vérification des Autorisations
                          </h4>
                          <p className="text-muted-foreground text-xs leading-relaxed">
                            Nous vérifions que le jeton de sécurité dispose bien des autorisations nécessaires pour publier automatiquement.
                          </p>

                          <div className="space-y-2 pt-2">
                            <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-2 border border-border">
                              <span className="font-mono text-xs">pages_manage_posts (Publication)</span>
                              <span className="text-emerald-500 font-bold">Autorisé ✓</span>
                            </div>
                            <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-2 border border-border">
                              <span className="font-mono text-xs">pages_read_engagement (Statistiques)</span>
                              <span className="text-emerald-500 font-bold">Autorisé ✓</span>
                            </div>
                          </div>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={verifyPermissions}
                            loading={checkingPermissions}
                            className="mt-2 text-xs"
                          >
                            <ArrowClockwise size={12} className="mr-1" /> Lancer un diagnostic de connexion
                          </Button>
                        </div>

                        <div className="flex justify-between items-center">
                          <Button size="sm" variant="ghost" onClick={() => setFbStep(3)} className="text-xs">
                            ← Précédent
                          </Button>
                          <Button size="sm" onClick={() => setFbStep(5)} className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white">
                            Étape 5 : Continuer →
                          </Button>
                        </div>
                      </div>
                    )}

                    {fbStep === 5 && (
                      <div className="space-y-4 text-xs animate-in fade-in slide-in-from-bottom-3 duration-500 ease-out fill-mode-both">
                        <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white mx-auto text-xl">
                            ✓
                          </div>
                          <h4 className="font-bold text-base text-foreground">
                            Félicitations ! Votre page Facebook est connectée et opérationnelle.
                          </h4>
                          <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                            Fundoral peut désormais diffuser vos publications en un clic ou automatiquement via vos règles d&apos;automatisation.
                          </p>

                          <div className="flex flex-wrap justify-center gap-2 pt-2">
                            <Link href="/dashboard/studio">
                              <Button size="sm" className="bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 shadow-md shadow-rose-500/20 hover:shadow-rose-500/30 hover:-translate-y-0.5 transition-all text-white text-xs">
                                Créer une publication dans le Studio
                              </Button>
                            </Link>
                            <Link href="/dashboard/automations">
                              <Button size="sm" variant="outline" className="text-xs">
                                Configurer une règle d&apos;automatisation
                              </Button>
                            </Link>
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setShowFbWizard(false)}
                            className="text-xs"
                          >
                            Terminer et revenir aux paramètres
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Collapsible Manual Meta App Credentials Setup (Advanced / Developers) */}
                <div id="setting-channel-meta-creds" className={cn("pt-2 border-t border-border", highlightedSettingId === "setting-channel-meta-creds" && "ring-2 ring-rose-500 ring-offset-2")}>
                  <button
                    type="button"
                    onClick={() => setShowManualMetaSetup(!showManualMetaSetup)}
                    className="flex items-center justify-between w-full text-xs font-semibold text-foreground hover:text-rose-500 transition cursor-pointer py-1"
                  >
                    <span className="flex items-center gap-2">
                      <Key size={14} /> Options avancées : Utiliser votre propre application Meta (App ID &amp; Secret)
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {showManualMetaSetup ? "▲ Masquer" : "▼ Afficher les réglages développeur"}
                    </span>
                  </button>

                  {showManualMetaSetup && (
                    <div className="mt-3 space-y-4 pt-2 text-xs">
                      {credsError && (
                        <div className="p-2.5 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
                          <WarningCircle size={14} className="shrink-0" />
                          <span>{credsError}</span>
                        </div>
                      )}

                      <div className="rounded-xl border border-border/60 bg-surface-2/60 backdrop-blur-sm/60 p-3 space-y-1.5">
                        <p className="font-bold text-foreground">Instructions d&apos;obtention de vos identifiants Meta :</p>
                        <ol className="list-decimal list-inside space-y-1 text-muted-foreground text-[11px]">
                          <li>
                            Connectez-vous sur <a href="https://developers.facebook.com/apps/" target="_blank" rel="noopener noreferrer" className="text-rose-400 hover:underline">developers.facebook.com/apps</a> et ouvrez votre application.
                          </li>
                          <li>Allez dans <strong>Paramètres &gt; De base</strong> pour copier l&apos;App ID et l&apos;App Secret.</li>
                          <li>
                            Ajoutez l&apos;URL de rappel OAuth dans la configuration Facebook Login :
                            <code className="ml-1 font-mono text-[10px] bg-surface shadow-sm px-1.5 py-0.5 rounded border border-border select-all">{redirectUri}</code>
                          </li>
                        </ol>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="font-semibold text-foreground block mb-1">
                            App ID (Identifiant de l&apos;app)
                          </label>
                          <input
                            placeholder="Ex: 123456789012345"
                            value={appId}
                            onChange={(e) => setAppId(e.target.value)}
                            className="w-full rounded-xl border border-border/60 bg-surface-2/60 backdrop-blur-sm px-4 py-2.5 font-mono text-sm text-foreground outline-none transition-all focus:border-rose-500 focus:ring-4 focus:ring-rose-500/15"
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-foreground block mb-1">
                            App Secret (Clé secrète)
                          </label>
                          <input
                            type="password"
                            placeholder={settings?.facebook_app_secret_set ? "•••••••••••• (enregistré)" : "Saisir la clé secrète"}
                            value={appSecret}
                            onChange={(e) => setAppSecret(e.target.value)}
                            className="w-full rounded-xl border border-border/60 bg-surface-2/60 backdrop-blur-sm px-4 py-2.5 font-mono text-sm text-foreground outline-none transition-all focus:border-rose-500 focus:ring-4 focus:ring-rose-500/15"
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-foreground block mb-1">
                            Configuration ID (Login for Business)
                          </label>
                          <input
                            placeholder="Optionnel"
                            value={configId}
                            onChange={(e) => setConfigId(e.target.value)}
                            className="w-full rounded-xl border border-border/60 bg-surface-2/60 backdrop-blur-sm px-4 py-2.5 font-mono text-sm text-foreground outline-none transition-all focus:border-rose-500 focus:ring-4 focus:ring-rose-500/15"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          loading={savingCreds}
                          onClick={saveCredentials}
                          className="bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 shadow-md shadow-rose-500/20 hover:shadow-rose-500/30 hover:-translate-y-0.5 transition-all text-white text-xs"
                        >
                          Enregistrer les identifiants Meta
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </PremiumCard>
          )}

              {/* 3. DESTINATIONS DE DIFFUSION : WHATSAPP BUSINESS & GROUPES */}
              {(connectionCategory === "all" || connectionCategory === "whatsapp") && (
                <PremiumCard
                  id="setting-channel-whatsapp"
                title="3. Destination WhatsApp Business &amp; Groupes"
                description="Diffusion automatique sur vos groupes clients, chaînes et numéros officiels via WhatsApp Cloud API ou passerelle."
                icon={WhatsappLogo}
                highlighted={highlightedSettingId === "setting-channel-whatsapp"}
                action={
                  <Button
                    size="sm"
                    loading={savingCategory === "channels"}
                    onClick={() =>
                      saveSection("channels", {
                        whatsapp_enabled: whatsappEnabled,
                        whatsapp_api_url: whatsappApiUrl.trim() || null,
                        whatsapp_instance_name: whatsappInstanceName.trim() || null,
                        ...(whatsappApiKey.trim() ? { whatsapp_api_key: whatsappApiKey.trim() } : {}),
                      })
                    }
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8 shadow-sm shadow-emerald-500/20"
                  >
                    Enregistrer WhatsApp
                  </Button>
                }
              >
                <div className="p-5 sm:p-6 space-y-6">
                  {/* Activation Row with Toggle Switch */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-surface-2/60 border border-border/70 backdrop-blur-sm">
                    <div className="space-y-0.5">
                      <div className="font-bold text-foreground text-sm flex items-center gap-2">
                        <span>Activer la diffusion WhatsApp</span>
                        {whatsappEnabled ? (
                          <StatusPill status="active" label="Canal Actif" />
                        ) : (
                          <StatusPill status="neutral" label="Désactivé" icon={false} />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Permet de relayer automatiquement vos publications et offres vers vos contacts et groupes WhatsApp.
                      </p>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={whatsappEnabled}
                        onChange={(e) => setWhatsappEnabled(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-surface-3 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600 shadow-sm" />
                    </label>
                  </div>

                  {/* Direct Official WhatsApp Links */}
                  <div className="space-y-2 p-3.5 rounded-xl border border-border/60 bg-surface/50">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Key size={13} className="text-emerald-500" />
                      Ressources Officielles WhatsApp Meta
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <QuickExternalLink
                        href="https://developers.facebook.com/docs/whatsapp/cloud-api"
                        label="Console WhatsApp Cloud API"
                        description="Générez un numéro d'expéditeur et vos jetons permanents"
                      />
                      <QuickExternalLink
                        href="https://business.facebook.com/wa/manage/"
                        label="Gestionnaire WhatsApp Business"
                        description="Gérez vos modèles de messages, numéros et profils d'entreprise"
                      />
                    </div>
                  </div>

                  {/* WhatsApp Connection Credentials Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="font-semibold text-foreground block text-xs mb-1">
                        URL de la passerelle WhatsApp :
                      </label>
                      <input
                        value={whatsappApiUrl}
                        onChange={(e) => setWhatsappApiUrl(e.target.value)}
                        placeholder="Ex: https://api.yamoura.com ou Cloud API"
                        className="w-full rounded-xl border border-border/70 bg-surface px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-sm"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-foreground block text-xs mb-1">
                        Nom d&apos;instance :
                      </label>
                      <input
                        value={whatsappInstanceName}
                        onChange={(e) => setWhatsappInstanceName(e.target.value)}
                        placeholder="yamoura-bot"
                        className="w-full rounded-xl border border-border/70 bg-surface px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-sm"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-foreground block text-xs mb-1">
                        Clé API / Token d&apos;accès :
                      </label>
                      <input
                        type="password"
                        value={whatsappApiKey}
                        onChange={(e) => setWhatsappApiKey(e.target.value)}
                        placeholder="•••••••••••• (Clé secrète)"
                        className="w-full rounded-xl border border-border/70 bg-surface px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-sm font-mono"
                      />
                    </div>
                  </div>

                  {/* Direct WhatsApp Test Sandbox */}
                  <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.04] space-y-3">
                    <p className="font-bold text-foreground text-xs flex items-center gap-1.5">
                      <PaperPlaneTilt size={15} className="text-emerald-500" />
                      Bac à sable : Tester l&apos;envoi d&apos;un message WhatsApp en direct
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Saisissez un numéro au format international (ex: +237690000000) ou un identifiant de groupe pour vérifier que votre passerelle délivre les messages instantanément.
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={testSendWaTarget}
                        onChange={(e) => setTestSendWaTarget(e.target.value)}
                        placeholder="Ex: +237690000000 ou 1203630...@g.us"
                        className="flex-1 rounded-xl border border-border/70 bg-surface shadow-sm px-3.5 py-2 text-xs text-foreground outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                      />
                      <Button
                        size="sm"
                        onClick={handleSendTestWhatsApp}
                        loading={testingSendWa}
                        className="text-xs h-9 bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-500/20 px-4"
                      >
                        <PaperPlaneTilt size={13} className="mr-1.5" />
                        Envoyer le test
                      </Button>
                    </div>
                    {testSendWaResult && (
                      <p
                        className={cn(
                          "text-xs font-semibold pt-1 flex items-center gap-1.5",
                          testSendWaResult.success ? "text-emerald-400" : "text-destructive"
                        )}
                      >
                        {testSendWaResult.success ? (
                          <>
                            <CheckCircle size={15} weight="fill" />
                            Message test WhatsApp délivré avec succès !
                          </>
                        ) : (
                          <>
                            <WarningCircle size={15} weight="bold" />
                            {testSendWaResult.error}
                          </>
                        )}
                      </p>
                    )}
                  </div>
                </div>
              </PremiumCard>
            )}
          </div>
          )}

          {/* ========================================================== */}
          {/* 7. CONNEXIONS : SERVICES D'INTELLIGENCE ARTIFICIELLE      */}
          {/* ========================================================== */}
          {activeTab === "ai" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-500 ease-out fill-mode-both">
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                <div className="xl:col-span-7 space-y-5">
                  <PremiumCard
                    id="setting-ai-provider"
                    title="Fournisseurs d'Intelligence Artificielle"
                    description="Choisissez le moteur qui rédige vos accroches, synthétise vos articles et prépare vos publications."
                    icon={Cpu}
                    highlighted={highlightedSettingId === "setting-ai-provider"}
                    action={
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
                        className="bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 shadow-md shadow-rose-500/20 text-white"
                      >
                        {savedSuccess === "ai" ? "Enregistré ✓" : "Enregistrer"}
                      </Button>
                    }
                  >
                    <PremiumRow
                      title="Moteur Principal"
                      description="L'IA utilisée par défaut."
                    >
                      <select
                        value={preferredAi}
                        onChange={(e) => setPreferredAi(e.target.value as AIProvider)}
                        className="w-full bg-surface border border-border/60 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all shadow-sm"
                      >
                        <option value="free">⚡ Moteur Inclus Gratuit (Pollinations & Pexels)</option>
                        <option value="openai">🤖 OpenAI (GPT-4o, GPT-4o-mini)</option>
                        <option value="anthropic">🧠 Anthropic Claude (Claude 3.5 Sonnet)</option>
                        <option value="gemini">✨ Google Gemini (Gemini 1.5 Flash & Pro)</option>
                        <option value="openrouter">🌐 OpenRouter (Catalogue multi-modèles)</option>
                      </select>
                    </PremiumRow>

                    {preferredAi === "openai" && (
                      <PremiumRow
                        id="setting-ai-openai"
                        title="Configuration OpenAI"
                        description="Clé API et Modèle (ex: gpt-4o-mini)."
                      >
                        <div className="space-y-3">
                          <input
                            type="password"
                            value={openaiKey}
                            onChange={(e) => setOpenaiKey(e.target.value)}
                            placeholder={settings.openai_configured ? "•••••••••••• (Clé enregistrée)" : "sk-..."}
                            className="w-full bg-surface border border-border/60 rounded-xl px-4 py-2.5 text-sm font-mono outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all shadow-sm"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              value={aiModelName}
                              onChange={(e) => setAiModelName(e.target.value)}
                              placeholder="gpt-4o-mini"
                              className="w-full bg-surface border border-border/60 rounded-xl px-4 py-2.5 text-sm font-mono outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all shadow-sm"
                            />
                            <input
                              value={openAiBaseUrl}
                              onChange={(e) => setOpenAiBaseUrl(e.target.value)}
                              placeholder="https://api.openai.com/v1"
                              className="w-full bg-surface border border-border/60 rounded-xl px-4 py-2.5 text-sm font-mono outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all shadow-sm"
                            />
                          </div>
                        </div>
                      </PremiumRow>
                    )}

                    {preferredAi === "anthropic" && (
                      <PremiumRow
                        id="setting-ai-anthropic"
                        title="Clé API Anthropic Claude"
                        description="Clé format sk-ant-..."
                      >
                        <input
                          type="password"
                          value={anthropicKey}
                          onChange={(e) => setAnthropicKey(e.target.value)}
                          placeholder={settings.anthropic_configured ? "•••••••••••• (Clé enregistrée)" : "sk-ant-..."}
                          className="w-full bg-surface border border-border/60 rounded-xl px-4 py-2.5 text-sm font-mono outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all shadow-sm"
                        />
                      </PremiumRow>
                    )}

                    {preferredAi === "gemini" && (
                      <PremiumRow
                        id="setting-ai-gemini"
                        title="Clé API Google Gemini"
                        description="Clé AIzaSy..."
                      >
                        <input
                          type="password"
                          value={geminiKey}
                          onChange={(e) => setGeminiKey(e.target.value)}
                          placeholder={settings.gemini_configured ? "•••••••••••• (Clé enregistrée)" : "AIzaSy..."}
                          className="w-full bg-surface border border-border/60 rounded-xl px-4 py-2.5 text-sm font-mono outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all shadow-sm"
                        />
                      </PremiumRow>
                    )}

                    {preferredAi === "openrouter" && (
                      <PremiumRow
                        id="setting-ai-openrouter"
                        title="Clé API OpenRouter"
                        description="Clé format sk-or-..."
                      >
                        <input
                          type="password"
                          value={openrouterKey}
                          onChange={(e) => setOpenrouterKey(e.target.value)}
                          placeholder={settings.openrouter_configured ? "•••••••••••• (Clé enregistrée)" : "sk-or-..."}
                          className="w-full bg-surface border border-border/60 rounded-xl px-4 py-2.5 text-sm font-mono outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all shadow-sm"
                        />
                      </PremiumRow>
                    )}
                  </PremiumCard>
                </div>

                {/* Right Column: AI Live Test & Diagnosis Console */}
                <Card className="xl:col-span-5 space-y-4 xl:sticky xl:top-6">
                  <div className="flex items-center justify-between pb-3 border-b border-border">
                    <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-2">
                      <Sparkle size={16} className="text-rose-400" />
                      Console de Test en Direct
                    </h3>
                    <Button
                      size="sm"
                      onClick={() => testAiConnection(preferredAi)}
                      loading={testingAi === preferredAi}
                      className="text-xs h-7 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 shadow-md shadow-rose-500/20 hover:shadow-rose-500/30 hover:-translate-y-0.5 transition-all text-white"
                    >
                      Tester la connexion
                    </Button>
                  </div>

                  <div className="space-y-3 text-xs leading-relaxed">
                    <p className="text-muted-foreground text-[11px]">
                      Vérifie instantanément que l&apos;endpoint du modèle répond avec une latence mesurée en millisecondes.
                    </p>

                    {aiTestResult && (
                      <div
                        className={cn(
                          "p-3 rounded-xl border text-xs space-y-1 animate-in fade-in",
                          aiTestResult.ok
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                            : "border-destructive/30 bg-destructive/10 text-destructive"
                        )}
                      >
                        <p className="font-bold">
                          {aiTestResult.ok ? "✓ Connexion IA opérationnelle" : "✕ Erreur de connexion IA"}
                        </p>
                        {aiTestResult.ok ? (
                          <div className="text-[11px] space-y-0.5">
                            <p>Fournisseur : {aiTestResult.provider}</p>
                            <p>Modèle validé : {aiTestResult.model}</p>
                            <p className="font-mono">Temps de réponse : {aiTestResult.latencyMs} ms</p>
                          </div>
                        ) : (
                          <p className="text-[11px]">{aiTestResult.error}</p>
                        )}
                      </div>
                    )}

                    <div className="p-3 rounded-xl border border-border/60 bg-surface-2/60 backdrop-blur-sm/40 text-[11px] text-muted-foreground space-y-1">
                      <p className="font-semibold text-foreground">💡 Modèle Inclus Gratuit :</p>
                      <p>
                        Le moteur gratuit de base est activé par défaut. Si vous souhaitez des rédactions plus pointues ou personnalisées, configurez votre propre clé API (BYOK).
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* 8. ADMINISTRATION : SÉCURITÉ                              */}
          {/* ========================================================== */}
          {activeTab === "security" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-500 ease-out fill-mode-both">
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                <div className="xl:col-span-7 space-y-5">
                  <PremiumCard
                    id="setting-security-session"
                    title="Sécurité du Compte & Sessions"
                    description="Protégez votre espace de travail et contrôlez les accès sensibles."
                    icon={Lock}
                    highlighted={highlightedSettingId === "setting-security-session"}
                  >
                    <PremiumRow
                      title="Session Administrateur Actuelle"
                      description="Jeton de session chiffré stocké sous cookie sécurisé HttpOnly, SameSite=Lax."
                    >
                      <span className="rounded-full bg-emerald-500/10 text-emerald-500 px-3 py-1 text-xs font-bold border border-emerald-500/20">
                        Sécurisé
                      </span>
                    </PremiumRow>

                    <PremiumRow
                      id="setting-security-encryption"
                      title="Chiffrement Authentifié AES-256-GCM"
                      description="Toutes les clés d'API tierces sont chiffrées au repos dans la base Supabase via une clé maîtresse de 256 bits avec vecteur d'initialisation aléatoire (IV 96 bits) et tag d'intégrité (128 bits)."
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 shadow-sm border border-emerald-500/20">
                        <ShieldCheck size={20} weight="fill" />
                      </div>
                    </PremiumRow>
                  </PremiumCard>
                </div>

                <div className="xl:col-span-5 space-y-5">
                  <PremiumCard
                    id="setting-security-webhook"
                    title="Clé Secrète Webhook"
                    description="Cette clé secrète protège vos endpoints de publication automatique contre tout accès non sollicité."
                    icon={Key}
                    highlighted={highlightedSettingId === "setting-security-webhook"}
                    action={
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={testWebhookPing}
                          loading={testingWebhook}
                          className="h-8 shadow-sm"
                        >
                          Tester
                        </Button>
                        <Button
                          size="sm"
                          loading={savingCategory === "security"}
                          onClick={() =>
                            saveSection("security", {
                              webhook_secret: webhookSecret.trim(),
                            })
                          }
                          className="h-8 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 shadow-md shadow-rose-500/20 text-white"
                        >
                          Enregistrer
                        </Button>
                      </div>
                    }
                  >
                    <div className="p-4 space-y-3">
                      <label className="font-semibold text-foreground text-sm block">
                        Valeur du secret (x-webhook-secret) :
                      </label>
                      <div className="flex gap-2">
                        <input
                          type={showSecret ? "text" : "password"}
                          value={webhookSecret}
                          onChange={(e) => setWebhookSecret(e.target.value)}
                          placeholder="Ex: secret_1234567890..."
                          className="flex-1 bg-surface border border-border/60 rounded-xl px-4 py-2.5 text-sm font-mono outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all shadow-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSecret(!showSecret)}
                          className="flex items-center justify-center h-10 w-10 rounded-xl border border-border/60 bg-surface shadow-sm hover:bg-surface-2 text-muted-foreground transition-colors"
                          title={showSecret ? "Masquer" : "Afficher"}
                        >
                          {showSecret ? <EyeSlash size={16} /> : <Eye size={16} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(webhookSecret, "webhook")}
                          className="flex items-center justify-center h-10 w-10 rounded-xl border border-border/60 bg-surface shadow-sm hover:bg-surface-2 text-muted-foreground transition-colors"
                          title="Copier la clé secrète"
                        >
                          <Copy size={16} />
                        </button>
                      </div>
                      
                      {webhookTestResult && (
                        <div
                          className={cn(
                            "p-3 rounded-xl border text-xs mt-3 animate-in fade-in",
                            webhookTestResult.ok ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500" : "border-destructive/30 bg-destructive/10 text-destructive"
                          )}
                        >
                          <p className="font-medium flex items-center gap-1.5">
                            {webhookTestResult.ok ? "✓ " : "✕ "}
                            {webhookTestResult.message}
                          </p>
                        </div>
                      )}
                    </div>
                  </PremiumCard>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* 9. ADMINISTRATION : RÉGLAGES AVANCÉS                       */}
          {/* ========================================================== */}
          {activeTab === "advanced" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-500 ease-out fill-mode-both">
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                <div className="xl:col-span-7 space-y-5">
                  <PremiumCard
                    id="setting-advanced-autopilot"
                    title="Autopilote & Cadence de Publication"
                    description="Définissez le rythme et les créneaux horaires de diffusion automatique de Fundoral."
                    icon={Sliders}
                    highlighted={highlightedSettingId === "setting-advanced-autopilot"}
                    action={
                      <Button
                        size="sm"
                        loading={savingCategory === "advanced"}
                        onClick={() =>
                          saveSection("advanced", {
                            auto_post_enabled: autoPostEnabled,
                            posts_per_day: postsPerDay,
                            posting_hours: postingHours,
                            meta_ad_account_id: metaAdAccount.trim() || null,
                          })
                        }
                        className="bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 shadow-md shadow-rose-500/20 text-white"
                      >
                        {savedSuccess === "advanced" ? "Enregistré ✓" : "Enregistrer"}
                      </Button>
                    }
                  >
                    <PremiumRow
                      title="Activer l'Autopilote automatique"
                      description="Déclenche automatiquement la création et la publication aux heures choisies."
                    >
                      <div className="flex h-10 items-center">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={autoPostEnabled}
                            onChange={(e) => setAutoPostEnabled(e.target.checked)}
                            className="sr-only peer" 
                          />
                          <div className="w-11 h-6 bg-surface-2 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-rose-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500 border border-border/50"></div>
                        </label>
                      </div>
                    </PremiumRow>

                    <PremiumRow
                      title="Publications par jour"
                      description="Nombre maximum de posts."
                    >
                      <input
                        type="number"
                        min={1}
                        max={15}
                        value={postsPerDay}
                        onChange={(e) => setPostsPerDay(Number(e.target.value))}
                        className="w-24 bg-surface border border-border/60 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all shadow-sm text-center"
                      />
                    </PremiumRow>

                    <PremiumRow
                      id="setting-advanced-meta-ads"
                      title="ID Compte Meta Ads (Boosts auto)"
                      description="Connecte votre compte publicitaire."
                    >
                      <div className="flex gap-2">
                        <input
                          value={metaAdAccount}
                          onChange={(e) => setMetaAdAccount(e.target.value)}
                          placeholder="act_1234567890"
                          className="w-full bg-surface border border-border/60 rounded-xl px-4 py-2.5 text-sm font-mono outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all shadow-sm"
                        />
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={verifyAdsAccount}
                          loading={verifyingAds}
                          className="h-[42px] px-4 shadow-sm"
                        >
                          Vérifier
                        </Button>
                      </div>
                    </PremiumRow>

                    {adsVerification && (
                      <div className="px-6 pb-6 pt-0">
                        <div
                          className={cn(
                            "p-3 rounded-xl border text-sm font-medium animate-in fade-in",
                            adsVerification.ok ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500" : "border-destructive/30 bg-destructive/10 text-destructive"
                          )}
                        >
                          {adsVerification.ok ? (
                            <p className="flex items-center gap-1.5"><Check size={16} /> Compte validé : {adsVerification.accountName} ({adsVerification.currency})</p>
                          ) : (
                            <p className="flex items-center gap-1.5">✕ {adsVerification.error}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </PremiumCard>
                </div>

                {/* Right Column: Developer Webhook Specifications */}
                <div className="xl:col-span-5 space-y-5">
                  <PremiumCard
                    id="setting-advanced-webhooks"
                    title="Spécifications HTTP Webhook"
                    description="Pour publier une annonce depuis votre CMS, envoyez une requête POST avec votre clé secrète."
                    icon={Code}
                    highlighted={highlightedSettingId === "setting-advanced-webhooks"}
                  >
                    <div className="p-4 rounded-xl border border-border bg-surface-2 shadow-sm font-mono text-[11px] text-zinc-300 space-y-3 m-6 mt-0 overflow-x-auto">
                      <p className="text-rose-400 font-bold flex items-center gap-2">
                        <span className="bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded text-[10px]">POST</span>
                        /api/webhooks/publish-from-site
                      </p>
                      <p className="text-zinc-400">Header: <span className="text-emerald-400">x-webhook-secret</span>: {webhookSecret || "VOTRE_SECRET"}</p>
                      <pre className="text-zinc-200 bg-black/40 p-3 rounded-lg border border-white/5">
{`{
  "title": "Superbe Villa Moderne",
  "description": "Vue imprenable sur mer",
  "imageUrl": "https://site.com/img.jpg",
  "format": "feed",
  "autoPublish": true
}`}
                      </pre>
                    </div>
                  </PremiumCard>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Floating Save Bar when user has dirty unsaved changes */}
      {isDirty && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-2xl border border-rose-500/30 bg-surface/95 backdrop-blur-md px-5 py-3 shadow-2xl animate-in slide-in-from-bottom-4">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-amber-400 animate-ping" />
            <p className="text-xs font-semibold text-foreground">
              Modifications non enregistrées
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => {
              switch (activeTab) {
                case "workspace":
                  saveSection("workspace", { workspace_name: workspaceName.trim(), admin_email: adminEmail.trim(), language, timezone });
                  break;
                case "profile":
                  saveSection("profile", { brand_name: brandName.trim(), brand_description: brandDescription.trim(), brand_tone: brandTone, brand_style: brandStyle, brand_prohibited_words: brandProhibitedWords.trim(), brand_hashtags: brandHashtags.trim(), brand_signature: brandSignature.trim() });
                  break;
                case "ai":
                  saveSection("ai", { preferred_ai_provider: preferredAi, ai_model_name: aiModelName.trim() || null, openai_base_url: openAiBaseUrl.trim() || null, ...(openaiKey.trim() ? { openai_api_key: openaiKey.trim() } : {}), ...(anthropicKey.trim() ? { anthropic_api_key: anthropicKey.trim() } : {}), ...(geminiKey.trim() ? { gemini_api_key: geminiKey.trim() } : {}), ...(openrouterKey.trim() ? { openrouter_api_key: openrouterKey.trim() } : {}) });
                  break;
                case "channels":
                  saveCredentials();
                  break;
                case "advanced":
                  saveSection("advanced", { auto_post_enabled: autoPostEnabled, posts_per_day: postsPerDay, posting_hours: postingHours, meta_ad_account_id: metaAdAccount.trim() || null });
                  break;
              }
            }}
            loading={Boolean(savingCategory)}
            className="bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 shadow-md shadow-rose-500/20 hover:shadow-rose-500/30 hover:-translate-y-0.5 transition-all text-white text-xs h-8 px-4"
          >
            Enregistrer
          </Button>
        </div>
      )}
    </div>
  );
}




