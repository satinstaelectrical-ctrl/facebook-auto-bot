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
  openai_configured?: boolean;
  anthropic_configured?: boolean;
  gemini_configured?: boolean;
  openrouter_configured?: boolean;
  meta_ad_account_id?: string;
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

  // BYOK AI Credentials
  const [preferredAi, setPreferredAi] = useState<AIProvider>("free");
  const [aiModelName, setAiModelName] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [anthropicKey, setAnthropicKey] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [openrouterKey, setOpenrouterKey] = useState("");
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [savingAi, setSavingAi] = useState(false);
  const [savedAi, setSavedAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Meta Ads Account
  const [metaAdAccount, setMetaAdAccount] = useState("");
  const [savingAds, setSavingAds] = useState(false);
  const [savedAds, setSavedAds] = useState(false);

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
        setMetaAdAccount(data.meta_ad_account_id ?? "");
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
                <option value="openai">🧠 OpenAI (GPT-4o / GPT-4o-mini)</option>
                <option value="anthropic">⚡ Anthropic Claude (Claude 3.5 Sonnet)</option>
                <option value="gemini">💎 Google Gemini (Gemini 1.5 Pro / Flash)</option>
                <option value="openrouter">🌐 OpenRouter (Tous modèles unifiés)</option>
              </select>
            </div>

            {/* Custom Model Override */}
            <div className="mt-3">
              <label className="text-xs font-semibold text-muted-foreground">
                Nom du modèle personnalisé (optionnel)
              </label>
              <input
                placeholder="Ex: gpt-4o, claude-3-5-sonnet-20241022, gemini-1.5-pro"
                value={aiModelName}
                onChange={(e) => setAiModelName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/[0.08] bg-background px-3.5 py-2 text-xs font-mono outline-none focus:border-indigo-500"
              />
            </div>

            {/* API Keys Inputs Grid */}
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {/* OpenAI */}
              <div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-muted-foreground">Clé OpenAI</span>
                  {settings.openai_configured && (
                    <span className="text-[10px] font-bold text-emerald-400">✓ Enregistrée</span>
                  )}
                </div>
                <div className="relative mt-1">
                  <input
                    type={showKeys["openai"] ? "text" : "password"}
                    placeholder={settings.openai_configured ? "•••••••••••• (enregistrée)" : "sk-..."}
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

            <div className="mt-4 flex items-center justify-between pt-3 border-t border-border">
              <span className="text-xs text-emerald-400 font-medium">
                {savedAi ? "✓ Paramètres IA enregistrés et chiffrés !" : ""}
              </span>
              <Button size="sm" onClick={saveAiProviders} disabled={savingAi}>
                <Sparkle size={14} weight="fill" />
                {savingAi ? "Chiffrement & Sauvegarde…" : "Enregistrer les clés IA"}
              </Button>
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
            <h2 className="font-heading font-bold text-foreground">
              Compte Publicitaire Meta Ads
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Renseignez l&apos;identifiant de votre compte publicitaire Meta pour activer le sponsoring
              direct et les boosts de posts.
            </p>

            <div className="mt-3 flex items-center gap-2">
              <input
                placeholder="ex: act_1234567890"
                value={metaAdAccount}
                onChange={(e) => setMetaAdAccount(e.target.value)}
                className="flex-1 rounded-xl border border-white/[0.08] bg-background px-3.5 py-2 text-xs font-mono outline-none focus:border-indigo-500"
              />
              <Button size="sm" onClick={saveAdsAccount} disabled={savingAds}>
                {savingAds ? "Enregistrement…" : savedAds ? "Enregistré ✓" : "Enregistrer"}
              </Button>
            </div>
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
    </div>
  );
}
