"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  FacebookLogo,
  CheckCircle,
  WarningCircle,
  LinkSimple,
  LinkBreak,
  Key,
  Copy,
  Check,
  Cpu,
  ShieldCheck,
  Eye,
  EyeSlash,
  Rocket,
  Sparkle,
  WhatsappLogo,
  QrCode,
  Users,
  Plus,
  Trash,
  ArrowClockwise,
  PaperPlaneTilt,
  ChatCircleDots,
  Broadcast,
} from "@phosphor-icons/react/dist/ssr";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { ImageSourcePref, AIProvider } from "@/lib/types";

const TIMEZONES = [
  "Asia/Karachi",
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Dhaka",
  "Europe/Paris",
  "Europe/London",
  "Europe/Berlin",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
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
  whatsapp_enabled?: boolean;
  whatsapp_api_url?: string;
  whatsapp_instance_name?: string;
  whatsapp_target_groups?: Array<{ id: string; name: string; enabled: boolean }>;
  whatsapp_configured?: boolean;
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Chargement…</p>}>
      <SettingsForm />
    </Suspense>
  );
}

function SettingsForm() {
  const params = useSearchParams();
  const [settings, setSettings] = useState<SettingsState | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Meta App Credentials
  const [appId, setAppId] = useState("");
  const [appSecret, setAppSecret] = useState("");
  const [configId, setConfigId] = useState("");
  const [savingCreds, setSavingCreds] = useState(false);
  const [credsError, setCredsError] = useState<string | null>(null);
  const [copied, setCopied] = useState<"uri" | "domain" | null>(null);
  const [redirectUri, setRedirectUri] = useState("");

  // BYOK AI Credentials & Custom Base URL (B.AI compatible)
  const [preferredAi, setPreferredAi] = useState<AIProvider>("free");
  const [aiModelName, setAiModelName] = useState("");
  const [openAiBaseUrl, setOpenAiBaseUrl] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [anthropicKey, setAnthropicKey] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [openrouterKey, setOpenrouterKey] = useState("");
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [savingAi, setSavingAi] = useState(false);
  const [savedAi, setSavedAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [testingAi, setTestingAi] = useState(false);
  const [aiTestResult, setAiTestResult] = useState<{ ok: boolean; model?: string; responseSample?: string; error?: string } | null>(null);

  // WhatsApp Gateway Credentials & State
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [whatsappApiUrl, setWhatsappApiUrl] = useState("");
  const [whatsappApiKey, setWhatsappApiKey] = useState("");
  const [whatsappInstanceName, setWhatsappInstanceName] = useState("yamoura-bot");
  const [whatsappTargetGroups, setWhatsappTargetGroups] = useState<Array<{ id: string; name: string; enabled: boolean }>>([]);
  const [savingWhatsApp, setSavingWhatsApp] = useState(false);
  const [savedWhatsApp, setSavedWhatsApp] = useState(false);
  const [whatsAppError, setWhatsAppError] = useState<string | null>(null);
  const [testingWhatsApp, setTestingWhatsApp] = useState(false);
  const [whatsAppTestResult, setWhatsAppTestResult] = useState<{ connected: boolean; state: string; qrCode?: string | null; pairingCode?: string | null; error?: string | null } | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [fetchingGroups, setFetchingGroups] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupJid, setNewGroupJid] = useState("");
  const [testingSendWa, setTestingSendWa] = useState(false);
  const [testSendWaTarget, setTestSendWaTarget] = useState("");
  const [testSendWaResult, setTestSendWaResult] = useState<{ success: boolean; error?: string } | null>(null);

  // Meta Ads Account
  const [metaAdAccount, setMetaAdAccount] = useState("");
  const [savingAds, setSavingAds] = useState(false);
  const [savedAds, setSavedAds] = useState(false);
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

  // Brand Voice & Identity
  const [brandName, setBrandName] = useState("Fundoral");
  const [brandTone, setBrandTone] = useState("vendeur");
  const [brandSignature, setBrandSignature] = useState("📍 Livraison rapide | 📲 WhatsApp disponible 24/7");
  const [brandHashtags, setBrandHashtags] = useState("#business #exclusif #tendance");
  const [savingBrand, setSavingBrand] = useState(false);
  const [savedBrand, setSavedBrand] = useState(false);

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

  const oauthStatus = params.get("facebook");
  const oauthMessage = params.get("message");

  useEffect(() => {
    fetch("/api/settings")
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error ?? "Failed to load settings.");
        setSettings(data);
        setAppId(data.facebook_app_id ?? "");
        setConfigId(data.facebook_config_id ?? "");
        setPreferredAi(data.preferred_ai_provider ?? "free");
        setAiModelName(data.ai_model_name ?? "");
        setOpenAiBaseUrl(data.openai_base_url ?? "");
        setMetaAdAccount(data.meta_ad_account_id ?? "");
        setWhatsappEnabled(Boolean(data.whatsapp_enabled));
        setWhatsappApiUrl(data.whatsapp_api_url ?? "");
        setWhatsappInstanceName(data.whatsapp_instance_name ?? "yamoura-bot");
        setWhatsappTargetGroups(data.whatsapp_target_groups ?? []);
      })
      .catch((err) => setLoadError(err instanceof Error ? err.message : "Failed to load settings."));
  }, []);

  async function saveCredentials() {
    setCredsError(null);
    if (!appId.trim()) {
      setCredsError("Indiquez l'App ID de votre application Meta.");
      return;
    }
    if (!appSecret.trim() && !settings?.facebook_app_secret_set) {
      setCredsError("Indiquez l'App Secret.");
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
      if (!res.ok) throw new Error(data.error ?? "Impossible d'enregistrer ces identifiants.");

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
    } catch (err) {
      setCredsError(err instanceof Error ? err.message : "Erreur d'enregistrement.");
    } finally {
      setSavingCreds(false);
    }
  }

  async function saveAiProviders() {
    setSavingAi(true);
    setAiError(null);
    setSavedAi(false);

    try {
      const payload: Record<string, unknown> = {
        preferred_ai_provider: preferredAi,
        ai_model_name: aiModelName.trim() || null,
        openai_base_url: openAiBaseUrl.trim() || null,
      };

      if (openaiKey.trim()) payload.openai_api_key = openaiKey.trim();
      if (anthropicKey.trim()) payload.anthropic_api_key = anthropicKey.trim();
      if (geminiKey.trim()) payload.gemini_api_key = geminiKey.trim();
      if (openrouterKey.trim()) payload.openrouter_api_key = openrouterKey.trim();

      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Échec d'enregistrement des clés IA.");

      setSettings(data);
      setOpenaiKey("");
      setAnthropicKey("");
      setGeminiKey("");
      setOpenrouterKey("");
      setSavedAi(true);
      setTimeout(() => setSavedAi(false), 3000);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Erreur de sauvegarde.");
    } finally {
      setSavingAi(false);
    }
  }

  async function testAiConnection() {
    setTestingAi(true);
    setAiTestResult(null);
    try {
      const res = await fetch("/api/ai/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseUrl: openAiBaseUrl.trim() || undefined,
          apiKey: openaiKey.trim() || undefined,
          model: aiModelName.trim() || undefined,
        }),
      });
      const data = await res.json();
      setAiTestResult(data);
    } catch (e) {
      setAiTestResult({ ok: false, error: e instanceof Error ? e.message : "Erreur de test" });
    } finally {
      setTestingAi(false);
    }
  }

  async function saveWhatsAppSettings(customGroups?: Array<{ id: string; name: string; enabled: boolean }>) {
    setSavingWhatsApp(true);
    setWhatsAppError(null);
    setSavedWhatsApp(false);
    try {
      const payload: Record<string, unknown> = {
        whatsapp_enabled: whatsappEnabled,
        whatsapp_api_url: whatsappApiUrl.trim() || null,
        whatsapp_instance_name: whatsappInstanceName.trim() || "yamoura-bot",
        whatsapp_target_groups: customGroups ?? whatsappTargetGroups,
      };
      if (whatsappApiKey.trim()) {
        payload.whatsapp_api_key = whatsappApiKey.trim();
      }

      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Échec de sauvegarde des réglages WhatsApp.");

      setSettings(data);
      setWhatsappApiKey("");
      setSavedWhatsApp(true);
      setTimeout(() => setSavedWhatsApp(false), 3000);
    } catch (err) {
      setWhatsAppError(err instanceof Error ? err.message : "Erreur d'enregistrement.");
    } finally {
      setSavingWhatsApp(false);
    }
  }

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
        error: e instanceof Error ? e.message : "Erreur de connexion",
      });
    } finally {
      setTestingWhatsApp(false);
    }
  }

  async function fetchGroupsFromGateway() {
    setFetchingGroups(true);
    try {
      const res = await fetch("/api/whatsapp/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiUrl: whatsappApiUrl.trim() || undefined,
          apiKey: whatsappApiKey.trim() || undefined,
          instanceName: whatsappInstanceName.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Impossible de récupérer les groupes.");
      if (Array.isArray(data.groups) && data.groups.length > 0) {
        const merged = [...whatsappTargetGroups];
        for (const g of data.groups) {
          if (!merged.some((item) => item.id === g.id)) {
            merged.push({ id: g.id, name: g.name || g.id, enabled: true });
          }
        }
        setWhatsappTargetGroups(merged);
        await saveWhatsAppSettings(merged);
      } else {
        alert("Aucun groupe trouvé sur cette session WhatsApp.");
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur lors de la récupération des groupes.");
    } finally {
      setFetchingGroups(false);
    }
  }

  function addTargetGroup() {
    if (!newGroupJid.trim()) return;
    const name = newGroupName.trim() || newGroupJid.trim();
    if (whatsappTargetGroups.some((g) => g.id === newGroupJid.trim())) return;
    const updated = [...whatsappTargetGroups, { id: newGroupJid.trim(), name, enabled: true }];
    setWhatsappTargetGroups(updated);
    setNewGroupName("");
    setNewGroupJid("");
    saveWhatsAppSettings(updated);
  }

  function toggleTargetGroup(id: string) {
    const updated = whatsappTargetGroups.map((g) =>
      g.id === id ? { ...g, enabled: !g.enabled } : g
    );
    setWhatsappTargetGroups(updated);
    saveWhatsAppSettings(updated);
  }

  function removeTargetGroup(id: string) {
    const updated = whatsappTargetGroups.filter((g) => g.id !== id);
    setWhatsappTargetGroups(updated);
    saveWhatsAppSettings(updated);
  }

  async function sendTestWhatsAppMessage() {
    if (!testSendWaTarget.trim()) return;
    setTestingSendWa(true);
    setTestSendWaResult(null);
    try {
      const res = await fetch("/api/whatsapp/send-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetJid: testSendWaTarget.trim(),
          message: "🧪 *Test de connexion WhatsApp — Facebook Auto Bot*\nCe message confirme que votre passerelle WhatsApp fonctionne et peut diffuser des annonces !",
        }),
      });
      const data = await res.json();
      setTestSendWaResult(data);
    } catch (e) {
      setTestSendWaResult({
        success: false,
        error: e instanceof Error ? e.message : "Erreur lors de l'envoi de test",
      });
    } finally {
      setTestingSendWa(false);
    }
  }

  async function saveAdsAccount() {
    setSavingAds(true);
    setSavedAds(false);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meta_ad_account_id: metaAdAccount.trim() || null }),
      });
      const data = await res.json();
      if (res.ok) {
        setSettings(data);
        setSavedAds(true);
        setTimeout(() => setSavedAds(false), 3000);
      }
    } finally {
      setSavingAds(false);
    }
  }

  async function verifyAdsAccount() {
    if (!metaAdAccount.trim()) {
      alert("Veuillez d'abord renseigner un ID de compte publicitaire (ex: act_123456789).");
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
        error: e instanceof Error ? e.message : "Erreur lors de la vérification du compte publicitaire.",
      });
    } finally {
      setVerifyingAds(false);
    }
  }

  async function disconnect() {
    if (!confirm("Voulez-vous vraiment déconnecter ce compte Facebook ?")) return;
    setDisconnecting(true);
    try {
      await fetch("/api/facebook/disconnect", { method: "POST" });
      setSettings((s) => (s ? { ...s, facebook_connected: false, facebook_user_name: null } : s));
    } finally {
      setDisconnecting(false);
    }
  }

  async function save(patch: Partial<SettingsState>) {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } finally {
      setSaving(false);
    }
  }

  function toggleHour(hour: number) {
    if (!settings) return;
    const hours = settings.posting_hours.includes(hour)
      ? settings.posting_hours.filter((h) => h !== hour)
      : [...settings.posting_hours, hour].sort((a, b) => a - b);
    setSettings({ ...settings, posting_hours: hours });
    save({ posting_hours: hours });
  }

  function copyValue(val: string, key: "uri" | "domain") {
    navigator.clipboard.writeText(val);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  if (loadError) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-sm text-destructive">
        {loadError}
      </div>
    );
  }

  if (!settings) {
    return <p className="text-sm text-muted-foreground">Chargement des paramètres…</p>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {oauthStatus === "connected" && (
        <div className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 p-3.5 text-sm text-success">
          <CheckCircle size={18} /> Compte Facebook connecté avec succès.
        </div>
      )}
      {oauthStatus === "error" && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-sm text-destructive">
          <WarningCircle size={18} /> {oauthMessage ?? "Impossible de connecter Facebook."}
        </div>
      )}

      {/* Brand Voice & Identity */}
      <Card className="border-indigo-500/20 bg-gradient-to-br from-indigo-500/[0.03] to-transparent">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 shrink-0">
            <Sparkle size={22} weight="fill" />
          </div>
          <div className="min-w-0 flex-1 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-heading font-bold text-foreground">
                  Identité de Marque &amp; Brand Voice IA
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Configurez le ton, la signature et l&apos;ADN de communication que l&apos;IA adoptera pour toutes vos publications.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  setSavingBrand(true);
                  setTimeout(() => {
                    setSavingBrand(false);
                    setSavedBrand(true);
                    setTimeout(() => setSavedBrand(false), 2000);
                  }, 600);
                }}
                disabled={savingBrand}
              >
                {savingBrand ? "Enregistrement…" : savedBrand ? "Enregistré ✓" : "Enregistrer la marque"}
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-semibold text-muted-foreground block mb-1">
                  Nom de la Marque ou Entreprise :
                </label>
                <input
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="Ex: Fundoral E-Commerce"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="font-semibold text-muted-foreground block mb-1">
                  Ton éditorial par défaut :
                </label>
                <select
                  value={brandTone}
                  onChange={(e) => setBrandTone(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:border-indigo-500"
                >
                  <option value="vendeur">🛍 Vendeur &amp; Conversion (E-commerce / Offres)</option>
                  <option value="professionnel">💼 Professionnel &amp; Expert (B2B / Agence)</option>
                  <option value="premium">💎 Luxe &amp; Haut de Gamme (Immobilier / Prestigieux)</option>
                  <option value="humoristique">😄 Viral &amp; Humoristique (Communautaire / TikTok)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-muted-foreground block mb-1">
                  Hashtags officiels de la marque :
                </label>
                <input
                  value={brandHashtags}
                  onChange={(e) => setBrandHashtags(e.target.value)}
                  placeholder="#mamarque #promo #business"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-mono outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="font-semibold text-muted-foreground block mb-1">
                  Signature automatique de fin de post :
                </label>
                <input
                  value={brandSignature}
                  onChange={(e) => setBrandSignature(e.target.value)}
                  placeholder="📍 Douala | 📲 WhatsApp : +237..."
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Facebook Connection Status */}
      <Card>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400">
              <FacebookLogo size={24} weight="fill" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-foreground">Compte Facebook</h2>
              {settings.facebook_connected ? (
                <p className="mt-0.5 text-sm text-emerald-400 font-medium">
                  Connecté en tant que {settings.facebook_user_name ?? "Administrateur"}
                </p>
              ) : settings.facebook_configured === false ? (
                <p className="mt-0.5 max-w-md text-sm text-muted-foreground">
                  Renseignez votre App ID et App Secret Meta ci-dessous pour activer la connexion.
                </p>
              ) : (
                <p className="mt-0.5 text-sm text-muted-foreground">Non connecté pour le moment</p>
              )}
            </div>
          </div>
          {settings.facebook_connected ? (
            <Button size="sm" variant="secondary" onClick={disconnect} disabled={disconnecting}>
              <LinkBreak size={14} /> Déconnecter
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
      </Card>

      {/* BYOK: Custom AI Providers */}
      <Card>
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400">
            <Cpu size={22} weight="fill" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-heading font-bold text-foreground">
                  Fournisseurs IA &amp; Clés API (BYOK)
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Utilisez vos propres clés API pour une qualité maximale (GPT-4o, Claude 3.5 Sonnet,
                  Gemini, OpenRouter). En l&apos;absence de clé, le bot utilise automatiquement les
                  modèles gratuits.
                </p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20 shrink-0">
                <ShieldCheck size={13} weight="bold" /> Chiffré AES-256
              </span>
            </div>

            {/* Provider selector */}
            <div className="mt-4">
              <label className="text-xs font-semibold text-muted-foreground">
                Fournisseur IA principal
              </label>
              <select
                value={preferredAi}
                onChange={(e) => setPreferredAi(e.target.value as AIProvider)}
                className="mt-1 w-full rounded-xl border border-white/[0.08] bg-surface-2 px-3.5 py-2 text-sm outline-none focus:border-indigo-500"
              >
                <option value="free">🤖 Modèles gratuits par défaut (Groq / Pollinations / Fallback)</option>
                <option value="openai">🧠 B.AI / Custom OpenAI Endpoint (Recommandé - ex: https://api.b.ai/v1)</option>
                <option value="anthropic">⚡ Anthropic Claude (Claude 3.5 Sonnet)</option>
                <option value="gemini">💎 Google Gemini (Gemini 1.5 Pro / Flash)</option>
                <option value="openrouter">🌐 OpenRouter (Tous modèles unifiés)</option>
              </select>
            </div>

            {/* Custom Base URL (B.AI / Custom OpenAI) */}
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-muted-foreground">
                  Custom Base URL OpenAI / B.AI
                </span>
                <a
                  href="https://docs.b.ai/llmservice/api/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-indigo-400 hover:underline inline-flex items-center gap-1"
                >
                  Documentation B.AI API ↗
                </a>
              </div>
              <input
                placeholder="https://api.b.ai/v1 ou https://api.openai.com/v1"
                value={openAiBaseUrl}
                onChange={(e) => setOpenAiBaseUrl(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/[0.08] bg-background px-3.5 py-2 text-xs font-mono outline-none focus:border-indigo-500"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Compatible B.AI, LocalAI, vLLM ou OpenAI officiel. Le bot appellera <code className="text-zinc-300">/chat/completions</code> avec votre clé.
              </p>
            </div>

            {/* Custom Model Override */}
            <div className="mt-3">
              <label className="text-xs font-semibold text-muted-foreground">
                Nom du modèle personnalisé (optionnel)
              </label>
              <input
                placeholder="Ex: b-ai-default, gpt-4o, claude-3-5-sonnet-20241022, gemini-1.5-pro"
                value={aiModelName}
                onChange={(e) => setAiModelName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/[0.08] bg-background px-3.5 py-2 text-xs font-mono outline-none focus:border-indigo-500"
              />
            </div>

            {/* API Keys Inputs Grid */}
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {/* OpenAI / B.AI */}
              <div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-muted-foreground">Clé B.AI / OpenAI</span>
                  {settings.openai_configured && (
                    <span className="text-[10px] font-bold text-emerald-400">✓ Enregistrée</span>
                  )}
                </div>
                <div className="relative mt-1">
                  <input
                    type={showKeys["openai"] ? "text" : "password"}
                    placeholder={settings.openai_configured ? "•••••••••••• (enregistrée)" : "sk-... ou clé issue de chat.b.ai/key"}
                    value={openaiKey}
                    onChange={(e) => setOpenaiKey(e.target.value)}
                    className="w-full rounded-xl border border-white/[0.08] bg-background px-3.5 py-2 text-xs font-mono outline-none focus:border-indigo-500 pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKeys({ ...showKeys, openai: !showKeys["openai"] })}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showKeys["openai"] ? <EyeSlash size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>

              {/* Anthropic */}
              <div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-muted-foreground">Clé Anthropic Claude</span>
                  {settings.anthropic_configured && (
                    <span className="text-[10px] font-bold text-emerald-400">✓ Enregistrée</span>
                  )}
                </div>
                <div className="relative mt-1">
                  <input
                    type={showKeys["anthropic"] ? "text" : "password"}
                    placeholder={settings.anthropic_configured ? "•••••••••••• (enregistrée)" : "sk-ant-..."}
                    value={anthropicKey}
                    onChange={(e) => setAnthropicKey(e.target.value)}
                    className="w-full rounded-xl border border-white/[0.08] bg-background px-3.5 py-2 text-xs font-mono outline-none focus:border-indigo-500 pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKeys({ ...showKeys, anthropic: !showKeys["anthropic"] })}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showKeys["anthropic"] ? <EyeSlash size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>

              {/* Google Gemini */}
              <div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-muted-foreground">Clé Google Gemini</span>
                  {settings.gemini_configured && (
                    <span className="text-[10px] font-bold text-emerald-400">✓ Enregistrée</span>
                  )}
                </div>
                <div className="relative mt-1">
                  <input
                    type={showKeys["gemini"] ? "text" : "password"}
                    placeholder={settings.gemini_configured ? "•••••••••••• (enregistrée)" : "AIzaSy..."}
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    className="w-full rounded-xl border border-white/[0.08] bg-background px-3.5 py-2 text-xs font-mono outline-none focus:border-indigo-500 pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKeys({ ...showKeys, gemini: !showKeys["gemini"] })}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showKeys["gemini"] ? <EyeSlash size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>

              {/* OpenRouter */}
              <div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-muted-foreground">Clé OpenRouter</span>
                  {settings.openrouter_configured && (
                    <span className="text-[10px] font-bold text-emerald-400">✓ Enregistrée</span>
                  )}
                </div>
                <div className="relative mt-1">
                  <input
                    type={showKeys["openrouter"] ? "text" : "password"}
                    placeholder={settings.openrouter_configured ? "•••••••••••• (enregistrée)" : "sk-or-..."}
                    value={openrouterKey}
                    onChange={(e) => setOpenrouterKey(e.target.value)}
                    className="w-full rounded-xl border border-white/[0.08] bg-background px-3.5 py-2 text-xs font-mono outline-none focus:border-indigo-500 pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKeys({ ...showKeys, openrouter: !showKeys["openrouter"] })}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showKeys["openrouter"] ? <EyeSlash size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>
            </div>

            {aiError && (
              <p className="mt-2 text-xs text-destructive">{aiError}</p>
            )}

            {aiTestResult && (
              <div className={cn(
                "mt-3 rounded-xl border p-2.5 text-xs",
                aiTestResult.ok
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                  : "border-destructive/30 bg-destructive/10 text-destructive"
              )}>
                {aiTestResult.ok ? (
                  <p className="flex items-center gap-1.5 font-medium">
                    <CheckCircle size={14} weight="bold" /> Connexion IA B.AI/OpenAI validée avec succès sur le modèle <span className="font-mono">{aiTestResult.model}</span> !
                  </p>
                ) : (
                  <p className="flex items-center gap-1.5 font-medium">
                    <WarningCircle size={14} weight="bold" /> Échec du test IA : {aiTestResult.error}
                  </p>
                )}
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-border">
              <div className="flex items-center gap-2">
                <Button size="sm" variant="secondary" onClick={testAiConnection} disabled={testingAi || (!openaiKey && !settings.openai_configured)}>
                  <Sparkle size={13} className={testingAi ? "animate-spin" : ""} />
                  {testingAi ? "Test en cours…" : "Tester l'API IA (B.AI / OpenAI)"}
                </Button>
                <span className="text-xs text-emerald-400 font-medium">
                  {savedAi ? "✓ Paramètres IA enregistrés et chiffrés !" : ""}
                </span>
              </div>
              <Button size="sm" onClick={saveAiProviders} disabled={savingAi}>
                <ShieldCheck size={14} weight="bold" />
                {savingAi ? "Chiffrement & Sauvegarde…" : "Enregistrer les clés IA"}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* WhatsApp Gateway Card */}
      <Card>
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 shrink-0">
            <WhatsappLogo size={24} weight="fill" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-heading font-bold text-foreground flex items-center gap-2">
                  Passerelle WhatsApp (Canaux, Groupes &amp; Communautés)
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Connectez votre bot à une passerelle WhatsApp (type Evolution API ou WhatsApp Web) pour diffuser
                  instantanément les annonces reçues par Webhook dans vos groupes et canaux cibles.
                </p>
              </div>

              {whatsAppTestResult?.connected || (settings.whatsapp_configured && settings.whatsapp_enabled) ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20 shrink-0">
                  <CheckCircle size={12} weight="bold" /> En ligne &amp; Connecté
                </span>
              ) : whatsAppTestResult?.state === "connecting" ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/20 shrink-0">
                  <QrCode size={12} weight="bold" /> Scan QR requis
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-zinc-800 px-2.5 py-0.5 text-[10px] font-bold text-zinc-400 border border-zinc-700 shrink-0">
                  Non connecté
                </span>
              )}
            </div>

            {/* Toggle auto-diffusion */}
            <div className="mt-4 flex items-center justify-between rounded-xl border border-white/[0.06] bg-surface-2 p-3">
              <div>
                <p className="text-xs font-semibold text-foreground">
                  Auto-diffusion WhatsApp sur réception d&apos;annonce
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Publie automatiquement l&apos;image, les détails (prix, lieu) et le lien direct dans les groupes activés.
                </p>
              </div>
              <input
                type="checkbox"
                checked={whatsappEnabled}
                onChange={(e) => {
                  setWhatsappEnabled(e.target.checked);
                  saveWhatsAppSettings();
                }}
                className="h-4 w-4 rounded accent-emerald-500 cursor-pointer"
              />
            </div>

            {/* Gateway inputs */}
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-muted-foreground">
                  URL de la Passerelle API (ex: Evolution API)
                </label>
                <input
                  placeholder="https://wa.yamoura.com ou http://localhost:8080"
                  value={whatsappApiUrl}
                  onChange={(e) => setWhatsappApiUrl(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/[0.08] bg-background px-3.5 py-2 text-xs font-mono outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground">
                  Nom d&apos;instance (Session)
                </label>
                <input
                  placeholder="yamoura-bot"
                  value={whatsappInstanceName}
                  onChange={(e) => setWhatsappInstanceName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/[0.08] bg-background px-3.5 py-2 text-xs font-mono outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="mt-3">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-muted-foreground">
                  Clé d&apos;API / Global Token de la Passerelle
                </label>
                {settings.whatsapp_configured && (
                  <span className="text-[10px] font-bold text-emerald-400">✓ Configurée</span>
                )}
              </div>
              <input
                type="password"
                placeholder={settings.whatsapp_configured ? "•••••••••••• (enregistrée — retapez pour modifier)" : "Clé API secrète de la passerelle"}
                value={whatsappApiKey}
                onChange={(e) => setWhatsappApiKey(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/[0.08] bg-background px-3.5 py-2 text-xs font-mono outline-none focus:border-emerald-500"
              />
            </div>

            {whatsAppError && (
              <p className="mt-2 text-xs text-destructive">{whatsAppError}</p>
            )}

            {/* Gateway actions & test */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button size="sm" variant="secondary" onClick={testWhatsApp} disabled={testingWhatsApp}>
                <ArrowClockwise size={13} className={testingWhatsApp ? "animate-spin" : ""} />
                {testingWhatsApp ? "Test en cours…" : "Tester la connexion"}
              </Button>

              {whatsAppTestResult?.qrCode && (
                <Button size="sm" variant="secondary" onClick={() => setShowQrModal(true)}>
                  <QrCode size={13} />
                  Afficher le QR Code
                </Button>
              )}

              <Button size="sm" variant="secondary" onClick={fetchGroupsFromGateway} disabled={fetchingGroups}>
                <Users size={13} className={fetchingGroups ? "animate-spin" : ""} />
                {fetchingGroups ? "Récupération…" : "Importer groupes depuis WhatsApp"}
              </Button>

              <Button size="sm" onClick={() => saveWhatsAppSettings()} disabled={savingWhatsApp} className="ml-auto">
                <Check size={14} />
                {savingWhatsApp ? "Enregistrement…" : savedWhatsApp ? "Enregistré ✓" : "Enregistrer la passerelle"}
              </Button>
            </div>

            {whatsAppTestResult && (
              <div className={cn(
                "mt-3 rounded-xl border p-3 text-xs",
                whatsAppTestResult.connected
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                  : whatsAppTestResult.state === "connecting"
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                  : "border-destructive/30 bg-destructive/10 text-destructive"
              )}>
                {whatsAppTestResult.connected ? (
                  <p className="flex items-center gap-2 font-medium">
                    <CheckCircle size={14} weight="bold" /> Passerelle WhatsApp connectée avec succès ! Session active prête pour la diffusion.
                  </p>
                ) : whatsAppTestResult.state === "connecting" ? (
                  <div className="flex items-center justify-between">
                    <p className="flex items-center gap-2 font-medium">
                      <QrCode size={14} weight="bold" /> Session en attente d&apos;appairage. Scannez le QR Code pour lier votre téléphone.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowQrModal(true)}
                      className="font-bold underline ml-2 hover:opacity-80"
                    >
                      Ouvrir QR Code ↗
                    </button>
                  </div>
                ) : (
                  <p className="flex items-center gap-2 font-medium">
                    <WarningCircle size={14} weight="bold" /> {whatsAppTestResult.error || "Impossible de joindre la passerelle WhatsApp."}
                  </p>
                )}
              </div>
            )}

            {/* Target Groups Management */}
            <div className="mt-5 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Users size={14} className="text-emerald-400" /> Groupes &amp; Canaux WhatsApp cibles ({whatsappTargetGroups.length})
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Sélectionnez les groupes où le bot diffusera chaque nouvelle annonce reçue.
                  </p>
                </div>
              </div>

              {/* Add target group form */}
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <input
                  placeholder="Nom du groupe (ex: Yamoura Immo)"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="rounded-xl border border-white/[0.08] bg-background px-3 py-1.5 text-xs outline-none focus:border-emerald-500"
                />
                <input
                  placeholder="JID ou Numéro (ex: 1203630123456789@g.us)"
                  value={newGroupJid}
                  onChange={(e) => setNewGroupJid(e.target.value)}
                  className="rounded-xl border border-white/[0.08] bg-background px-3 py-1.5 text-xs font-mono outline-none focus:border-emerald-500"
                />
                <Button size="sm" variant="secondary" onClick={addTargetGroup} disabled={!newGroupJid.trim()}>
                  <Plus size={13} /> Ajouter ce groupe
                </Button>
              </div>

              {/* Groups table */}
              <div className="mt-3 space-y-1.5">
                {whatsappTargetGroups.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-zinc-800 p-4 text-center text-xs text-muted-foreground">
                    Aucun groupe WhatsApp cible configuré. Ajoutez un groupe manuellement ou cliquez sur &quot;Importer groupes depuis WhatsApp&quot;.
                  </div>
                ) : (
                  whatsappTargetGroups.map((g) => (
                    <div
                      key={g.id}
                      className={cn(
                        "flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2 text-xs transition-colors",
                        g.enabled
                          ? "border-emerald-500/20 bg-emerald-500/[0.04]"
                          : "border-white/[0.04] bg-surface-2 opacity-60"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <input
                          type="checkbox"
                          checked={g.enabled}
                          onChange={() => toggleTargetGroup(g.id)}
                          className="h-3.5 w-3.5 rounded accent-emerald-500 cursor-pointer"
                        />
                        <div className="truncate">
                          <p className="font-semibold text-foreground">{g.name}</p>
                          <p className="text-[10px] font-mono text-muted-foreground truncate">{g.id}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setTestSendWaTarget(g.id);
                            sendTestWhatsAppMessage();
                          }}
                          className="rounded-lg bg-surface-3 px-2 py-1 text-[10px] font-medium text-zinc-300 hover:bg-surface-4"
                          title="Envoyer un message de test"
                        >
                          Tester
                        </button>
                        <button
                          type="button"
                          onClick={() => removeTargetGroup(g.id)}
                          className="text-muted-foreground hover:text-destructive"
                          title="Supprimer"
                        >
                          <Trash size={13} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {testSendWaResult && (
                <div className={cn(
                  "mt-3 rounded-xl border p-2.5 text-xs",
                  testSendWaResult.success
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                    : "border-destructive/30 bg-destructive/10 text-destructive"
                )}>
                  {testSendWaResult.success ? (
                    "✓ Message de test WhatsApp envoyé avec succès au groupe !"
                  ) : (
                    `✗ Échec du test : ${testSendWaResult.error || "Erreur inconnue"}`
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Meta Ads Account */}
      <Card>
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400">
            <Rocket size={22} weight="fill" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <h2 className="font-heading font-bold text-foreground">
                Compte Publicitaire Meta Ads (Marketing API)
              </h2>
              {adsVerification?.ok && (
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400 border border-emerald-500/20">
                  {adsVerification.accountStatus || "Connecté"}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Renseignez votre identifiant de compte publicitaire (ex: <code className="font-mono text-indigo-300">act_1234567890</code>) pour activer le sponsoring réel des publications via l&apos;API Graph Meta.
            </p>

            <div className="mt-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                placeholder="ex: act_1234567890"
                value={metaAdAccount}
                onChange={(e) => setMetaAdAccount(e.target.value)}
                className="flex-1 rounded-xl border border-white/[0.08] bg-background px-3.5 py-2 text-xs font-mono outline-none focus:border-indigo-500"
              />
              <Button size="sm" onClick={saveAdsAccount} disabled={savingAds}>
                {savingAds ? "Enregistrement…" : savedAds ? "Enregistré ✓" : "Enregistrer"}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={verifyAdsAccount}
                disabled={verifyingAds || !metaAdAccount.trim()}
              >
                <ArrowClockwise size={13} className={verifyingAds ? "animate-spin" : ""} />
                {verifyingAds ? "Vérification…" : "Vérifier le compte"}
              </Button>
            </div>

            {/* Diagnostic Results */}
            {adsVerification && (
              <div
                className={cn(
                  "mt-3.5 rounded-xl border p-3 text-xs space-y-2",
                  adsVerification.ok
                    ? "border-emerald-500/30 bg-emerald-500/[0.05]"
                    : "border-destructive/30 bg-destructive/10 text-destructive"
                )}
              >
                {adsVerification.ok ? (
                  <>
                    <div className="flex items-center justify-between font-semibold text-emerald-400">
                      <span>✓ Compte publicitaire validé sur Meta Graph API</span>
                      <span className="font-mono text-[11px]">{adsVerification.adAccountId}</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px] text-zinc-300">
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Nom :</span>
                        <span className="font-bold truncate block">{adsVerification.accountName}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Devise :</span>
                        <span className="font-bold">{adsVerification.currency}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Statut :</span>
                        <span className="font-bold text-emerald-400">{adsVerification.accountStatus}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Dépenses :</span>
                        <span className="font-mono">{adsVerification.amountSpent || "0"}</span>
                      </div>
                    </div>

                    {adsVerification.warning && (
                      <div className="mt-2 rounded-lg bg-amber-500/10 border border-amber-500/20 p-2.5 text-[11px] text-amber-300">
                        {adsVerification.warning}
                      </div>
                    )}
                  </>
                ) : (
                  <div>
                    <p className="font-bold">Échec de vérification du compte publicitaire :</p>
                    <p className="mt-1 text-[11px] leading-relaxed">{adsVerification.warning || adsVerification.error}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Meta App Configuration */}
      <Card>
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-2 text-muted-foreground">
            <Key size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-heading font-bold text-foreground">Application Meta (Graph API)</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Configurez vos identifiants Facebook Login for Business depuis{" "}
              <a
                href="https://developers.facebook.com/apps"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-indigo-400 hover:underline"
              >
                developers.facebook.com/apps
              </a>.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">App ID</label>
                <input
                  value={appId}
                  onChange={(e) => setAppId(e.target.value)}
                  placeholder="1234567890123456"
                  className="mt-1 w-full rounded-xl border border-white/[0.08] bg-background px-3.5 py-2 text-sm outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">App Secret</label>
                <input
                  type="password"
                  value={appSecret}
                  onChange={(e) => setAppSecret(e.target.value)}
                  placeholder={
                    settings.facebook_app_secret_set
                      ? "•••• enregistrée — tapez pour remplacer"
                      : "Paramètres de l'app > Général"
                  }
                  className="mt-1 w-full rounded-xl border border-white/[0.08] bg-background px-3.5 py-2 text-sm outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="mt-3">
              <label className="text-xs font-semibold text-muted-foreground">
                Login configuration ID (facultatif si Login standard)
              </label>
              <input
                value={configId}
                onChange={(e) => setConfigId(e.target.value)}
                placeholder="ID de configuration Facebook Login for Business"
                className="mt-1 w-full rounded-xl border border-white/[0.08] bg-background px-3.5 py-2 text-sm outline-none focus:border-indigo-500"
              />
            </div>

            <div className="mt-3">
              <label className="text-xs font-semibold text-muted-foreground">
                URI de redirection OAuth Meta
              </label>
              <div className="mt-1 flex gap-2">
                <input
                  readOnly
                  value={redirectUri}
                  onFocus={(e) => e.currentTarget.select()}
                  className="w-full rounded-xl border border-white/[0.08] bg-surface-2 px-3.5 py-2 font-mono text-xs text-muted-foreground outline-none"
                />
                <Button size="sm" variant="secondary" onClick={() => copyValue(redirectUri, "uri")}>
                  {copied === "uri" ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                </Button>
              </div>
            </div>

            {credsError && <p className="mt-2 text-xs text-destructive">{credsError}</p>}

            <div className="mt-4 pt-3 border-t border-border flex justify-end">
              <Button size="sm" onClick={saveCredentials} disabled={savingCreds}>
                {savingCreds ? "Enregistrement…" : "Enregistrer les identifiants Meta"}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Autopilot and Scheduling */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading font-bold text-foreground">Autopilote &amp; Planification</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Générez et publiez automatiquement sur vos créneaux préférentiels.
            </p>
          </div>
          <button
            onClick={() => {
              const next = !settings.auto_post_enabled;
              setSettings({ ...settings, auto_post_enabled: next });
              save({ auto_post_enabled: next });
            }}
            aria-label="Basculer l'autopilote"
            className={cn(
              "relative h-7 w-12 shrink-0 cursor-pointer rounded-full transition",
              settings.auto_post_enabled ? "bg-indigo-600" : "bg-surface-2"
            )}
          >
            <span
              className={cn(
                "absolute top-1 h-5 w-5 rounded-full bg-white shadow transition",
                settings.auto_post_enabled ? "left-6" : "left-1"
              )}
            />
          </button>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Posts par jour</label>
            <input
              type="number"
              min={1}
              max={20}
              value={settings.posts_per_day}
              onChange={(e) => setSettings({ ...settings, posts_per_day: Number(e.target.value) })}
              onBlur={(e) => save({ posts_per_day: Number(e.target.value) })}
              className="mt-1 w-full rounded-xl border border-white/[0.08] bg-background px-3.5 py-2 text-sm outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Fuseau horaire</label>
            <select
              value={settings.timezone}
              onChange={(e) => {
                setSettings({ ...settings, timezone: e.target.value });
                save({ timezone: e.target.value });
              }}
              className="mt-1 w-full rounded-xl border border-white/[0.08] bg-background px-3.5 py-2 text-sm outline-none focus:border-indigo-500"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Hour slots */}
        <div className="mt-4">
          <label className="text-xs font-semibold text-muted-foreground">
            Créneaux horaires de publication autorisés
          </label>
          <div className="mt-2 grid grid-cols-6 gap-1.5 sm:grid-cols-12">
            {Array.from({ length: 24 }, (_, h) => h).map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => toggleHour(h)}
                className={cn(
                  "cursor-pointer rounded-lg py-1.5 text-xs font-medium transition",
                  settings.posting_hours.includes(h)
                    ? "bg-indigo-600 text-white font-bold shadow"
                    : "bg-surface-2 text-muted-foreground hover:bg-surface-3"
                )}
              >
                {h}h
              </button>
            ))}
          </div>
        </div>
      </Card>

      <div className="h-4 text-right text-xs text-muted-foreground">
        {saving ? "Enregistrement…" : saved ? "Enregistré avec succès ✓" : ""}
      </div>

      {/* WhatsApp QR Code Pairing Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 mb-3">
              <WhatsappLogo size={28} weight="fill" />
            </div>
            <h3 className="font-heading font-bold text-foreground text-base">
              Lier votre compte WhatsApp
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Ouvrez WhatsApp sur votre téléphone &gt; <strong>Appareils connectés</strong> &gt; <strong>Connecter un appareil</strong>, puis scannez ce QR Code.
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
                  className="h-60 w-60 rounded-xl border border-zinc-700 bg-white p-2.5 shadow-inner"
                />
              ) : (
                <div className="flex h-60 w-60 items-center justify-center rounded-xl border border-dashed border-zinc-800 bg-zinc-900/50 text-xs text-muted-foreground p-4">
                  Génération du QR Code en cours ou session déjà active...
                </div>
              )}
            </div>

            {whatsAppTestResult?.pairingCode && (
              <p className="mb-4 text-xs font-mono text-emerald-400 bg-emerald-500/10 py-1.5 px-3 rounded-lg">
                Code d&apos;appairage : <strong>{whatsAppTestResult.pairingCode}</strong>
              </p>
            )}

            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="flex-1"
                onClick={() => {
                  testWhatsApp();
                }}
                disabled={testingWhatsApp}
              >
                <ArrowClockwise size={13} className={testingWhatsApp ? "animate-spin" : ""} />
                Actualiser
              </Button>
              <Button
                size="sm"
                className="flex-1"
                onClick={() => setShowQrModal(false)}
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
