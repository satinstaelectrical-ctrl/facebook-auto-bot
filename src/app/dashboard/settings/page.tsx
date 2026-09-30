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
  PaperPlaneTilt,
  CaretRight,
  CaretDown,
  CheckFat,
  Clock,
  Broadcast,
  DeviceMobile,
} from "@phosphor-icons/react/dist/ssr";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTheme, type ThemeMode } from "@/components/theme-toggle";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import type { ImageSourcePref, AIProvider } from "@/lib/types";

// ============================================================================
// Types & Grouped Category Hierarchy
// ============================================================================

export type SettingsTabId =
  | "profile"
  | "appearance"
  | "workspace"
  | "notifications"
  | "billing"
  | "channels"
  | "ai"
  | "security"
  | "advanced";

export interface SettingsTabItem {
  id: SettingsTabId;
  label: string;
  shortLabel: string;
  description: string;
  icon: React.ComponentType<{ size?: number; weight?: "regular" | "bold" | "fill"; className?: string }>;
  badge?: string;
  keywords: string[];
}

export interface SettingsGroup {
  id: "personalization" | "workspace" | "connections" | "administration";
  label: string;
  description: string;
  tabs: SettingsTabItem[];
}

export const SETTINGS_GROUPS: SettingsGroup[] = [
  {
    id: "personalization",
    label: "Personnalisation",
    description: "Identité de marque et préférences visuelles",
    tabs: [
      {
        id: "profile",
        label: "Profil et marque",
        shortLabel: "Profil & Marque",
        description: "Nom de marque, ton éditorial, style rédactionnel, signature et hashtags",
        icon: Sparkle,
        keywords: ["profil", "marque", "brand", "ton", "style", "signature", "hashtags", "mots interdits", "voix"],
      },
      {
        id: "appearance",
        label: "Apparence",
        shortLabel: "Apparence",
        description: "Thème d'affichage clair, sombre ou système et contrastes visuels",
        icon: Sun,
        keywords: ["apparence", "thème", "mode", "clair", "sombre", "system", "dark", "light", "interface", "visuel"],
      },
    ],
  },
  {
    id: "workspace",
    label: "Espace de travail",
    description: "Organisation, équipe, alertes et facturation",
    tabs: [
      {
        id: "workspace",
        label: "Organisation et équipe",
        shortLabel: "Organisation & Équipe",
        description: "Nom de l'espace, administrateur, fuseau horaire et accès collaborateurs",
        icon: Buildings,
        keywords: ["workspace", "organisation", "équipe", "entreprise", "nom", "email", "langue", "fuseau", "timezone", "karachi", "paris", "douala"],
      },
      {
        id: "notifications",
        label: "Notifications",
        shortLabel: "Notifications",
        description: "Alertes de publication, rapports WhatsApp et notifications d'erreur",
        icon: Info,
        keywords: ["notifications", "alertes", "emails", "rapports", "whatsapp", "inbox", "erreurs"],
      },
      {
        id: "billing",
        label: "Facturation",
        shortLabel: "Facturation",
        description: "Formule d'abonnement, quotas de diffusion et dépenses publicitaires",
        icon: Rocket,
        keywords: ["facturation", "plan", "abonnement", "quotas", "crédits", "forfait", "paiement", "licence"],
      },
    ],
  },
  {
    id: "connections",
    label: "Connexions",
    description: "Canaux de diffusion et modèles d'intelligence artificielle",
    tabs: [
      {
        id: "channels",
        label: "Sites et réseaux",
        shortLabel: "Sites & Réseaux",
        description: "Pages Facebook, WhatsApp Business, sites connectés et destinations",
        icon: Globe,
        badge: "Meta & Web",
        keywords: ["réseaux", "canaux", "facebook", "whatsapp", "pages", "groupes", "instagram", "meta", "oauth", "sites", "wordpress", "shopify", "waba"],
      },
      {
        id: "ai",
        label: "Services d’intelligence artificielle",
        shortLabel: "Services IA",
        description: "Modèles inclus gratuits ou utilisation de vos propres clés d'API (OpenAI, Claude, Gemini)",
        icon: Cpu,
        keywords: ["ia", "ai", "intelligence artificielle", "fournisseurs", "openai", "claude", "anthropic", "gemini", "openrouter", "clé api", "byok", "gpt-4o"],
      },
    ],
  },
  {
    id: "administration",
    label: "Administration",
    description: "Sécurité des accès, chiffrement et réglages techniques",
    tabs: [
      {
        id: "security",
        label: "Sécurité",
        shortLabel: "Sécurité",
        description: "Sessions actives, chiffrement AES-256-GCM, clé secrète webhook et audit",
        icon: Lock,
        keywords: ["sécurité", "security", "chiffrement", "aes-256", "sessions", "secret", "webhook secret", "logs", "audit", "protection"],
      },
      {
        id: "advanced",
        label: "Réglages avancés",
        shortLabel: "Réglages avancés",
        description: "Planification autopilote, compte Meta Ads, webhooks et développeurs",
        icon: Sliders,
        keywords: ["avancé", "advanced", "webhooks", "autopilot", "meta ads", "api", "curl", "json", "développeurs", "cron"],
      },
    ],
  },
];

// Flat list of all tabs for quick lookups
export const ALL_TABS: SettingsTabItem[] = SETTINGS_GROUPS.flatMap((g) => g.tabs);

// Searchable Settings Index
interface SearchableSetting {
  id: string;
  tabId: SettingsTabId;
  title: string;
  description: string;
  groupLabel: string;
  categoryLabel: string;
  keywords: string[];
}

const SEARCHABLE_SETTINGS: SearchableSetting[] = [
  {
    id: "setting-brand-name",
    tabId: "profile",
    title: "Nom officiel de marque",
    description: "Nom de votre enseigne utilisé dans les rédactions IA",
    groupLabel: "Personnalisation",
    categoryLabel: "Profil et marque",
    keywords: ["marque", "brand", "nom", "enseigne"],
  },
  {
    id: "setting-brand-voice",
    tabId: "profile",
    title: "Ton & Style de communication",
    description: "Ton vendeur, professionnel, premium ou humoristique",
    groupLabel: "Personnalisation",
    categoryLabel: "Profil et marque",
    keywords: ["ton", "voix", "style", "rédaction", "storytelling"],
  },
  {
    id: "setting-brand-signature",
    tabId: "profile",
    title: "Signature & Hashtags officiels",
    description: "Signature automatique en fin de post et liste de hashtags",
    groupLabel: "Personnalisation",
    categoryLabel: "Profil et marque",
    keywords: ["signature", "hashtags", "mots interdits", "blacklist"],
  },
  {
    id: "setting-theme-mode",
    tabId: "appearance",
    title: "Thème Visuel (Clair, Sombre, Système)",
    description: "Mode d'affichage ergonomique et contrastes visuels",
    groupLabel: "Personnalisation",
    categoryLabel: "Apparence",
    keywords: ["thème", "mode", "clair", "sombre", "system", "dark", "light"],
  },
  {
    id: "setting-workspace-name",
    tabId: "workspace",
    title: "Nom de l'organisation",
    description: "Nom de l'espace de travail et en-tête des rapports",
    groupLabel: "Espace de travail",
    categoryLabel: "Organisation et équipe",
    keywords: ["workspace", "organisation", "nom", "espace"],
  },
  {
    id: "setting-admin-email",
    tabId: "workspace",
    title: "Email de l'administrateur",
    description: "Destinataire des alertes d'autopilote et de synchronisation",
    groupLabel: "Espace de travail",
    categoryLabel: "Organisation et équipe",
    keywords: ["email", "administrateur", "contact", "alertes"],
  },
  {
    id: "setting-language",
    tabId: "workspace",
    title: "Langue de l'interface",
    description: "Français ou Anglais",
    groupLabel: "Espace de travail",
    categoryLabel: "Organisation et équipe",
    keywords: ["langue", "français", "anglais", "language"],
  },
  {
    id: "setting-timezone",
    tabId: "workspace",
    title: "Fuseau horaire de publication",
    description: "Horodatage de diffusion automatique et rapports",
    groupLabel: "Espace de travail",
    categoryLabel: "Organisation et équipe",
    keywords: ["fuseau", "timezone", "horaire", "heure", "karachi", "paris", "douala", "dakar", "casablanca"],
  },
  {
    id: "setting-team-members",
    tabId: "workspace",
    title: "Gestion de l'équipe et rôles",
    description: "Accès collaborateurs (Administrateur, Éditeur, Observateur)",
    groupLabel: "Espace de travail",
    categoryLabel: "Organisation et équipe",
    keywords: ["équipe", "membres", "collaborateurs", "rôles", "permissions"],
  },
  {
    id: "setting-notifications-email",
    tabId: "notifications",
    title: "Alertes email d'échec",
    description: "Notification immédiate en cas d'erreur de diffusion Meta",
    groupLabel: "Espace de travail",
    categoryLabel: "Notifications",
    keywords: ["notifications", "email", "alertes", "erreurs"],
  },
  {
    id: "setting-notifications-whatsapp",
    tabId: "notifications",
    title: "Rapport quotidien WhatsApp",
    description: "Synthèse automatique quotidienne des publications",
    groupLabel: "Espace de travail",
    categoryLabel: "Notifications",
    keywords: ["whatsapp", "rapport", "synthèse", "quotidien"],
  },
  {
    id: "setting-billing-plan",
    tabId: "billing",
    title: "Formule d'abonnement & Quotas",
    description: "Détails de la licence Fundoral et quotas de diffusion",
    groupLabel: "Espace de travail",
    categoryLabel: "Facturation",
    keywords: ["facturation", "plan", "abonnement", "quotas", "licence"],
  },
  {
    id: "setting-channel-facebook",
    tabId: "channels",
    title: "Connexion Facebook & Pages Meta",
    description: "Diffusion automatique sur vos Pages Facebook professionnelles",
    groupLabel: "Connexions",
    categoryLabel: "Sites et réseaux",
    keywords: ["facebook", "meta", "pages", "oauth", "token", "graph"],
  },
  {
    id: "setting-channel-meta-creds",
    tabId: "channels",
    title: "Identifiants application Meta (App ID & Secret)",
    description: "Configuration personnalisée de votre propre application Meta",
    groupLabel: "Connexions",
    categoryLabel: "Sites et réseaux",
    keywords: ["app id", "app secret", "config id", "meta", "developers"],
  },
  {
    id: "setting-channel-whatsapp",
    tabId: "channels",
    title: "Passerelle WhatsApp Business & Groupes",
    description: "Connexion Cloud API ou scan QR Code pour groupes et chaînes",
    groupLabel: "Connexions",
    categoryLabel: "Sites et réseaux",
    keywords: ["whatsapp", "waba", "qr code", "groupes", "chaînes", "numéro"],
  },
  {
    id: "setting-channel-websites",
    tabId: "channels",
    title: "Sites web connectés (Shopify, WordPress, Webhooks)",
    description: "Sources d'annonces synchronisées automatiquement",
    groupLabel: "Connexions",
    categoryLabel: "Sites et réseaux",
    keywords: ["sites", "wordpress", "shopify", "rss", "webhook", "site web"],
  },
  {
    id: "setting-ai-provider",
    tabId: "ai",
    title: "Fournisseur d'IA principal",
    description: "Modèle gratuit inclus ou utilisation de votre propre clé API",
    groupLabel: "Connexions",
    categoryLabel: "Services d’intelligence artificielle",
    keywords: ["ia", "ai", "fournisseur", "byok", "gratuit", "openai", "claude", "gemini", "propre clé"],
  },
  {
    id: "setting-ai-openai",
    tabId: "ai",
    title: "Clé API OpenAI / B.AI",
    description: "Modèles GPT-4o, GPT-4o-mini ou endpoint compatible",
    groupLabel: "Connexions",
    categoryLabel: "Services d’intelligence artificielle",
    keywords: ["openai", "gpt-4o", "chatgpt", "clé", "api"],
  },
  {
    id: "setting-ai-anthropic",
    tabId: "ai",
    title: "Clé API Anthropic Claude",
    description: "Modèle Claude 3.5 Sonnet",
    groupLabel: "Connexions",
    categoryLabel: "Services d’intelligence artificielle",
    keywords: ["anthropic", "claude", "sonnet"],
  },
  {
    id: "setting-ai-gemini",
    tabId: "ai",
    title: "Clé API Google Gemini",
    description: "Modèles Gemini 1.5 Pro et Gemini 1.5 Flash",
    groupLabel: "Connexions",
    categoryLabel: "Services d’intelligence artificielle",
    keywords: ["gemini", "google", "flash", "pro"],
  },
  {
    id: "setting-ai-openrouter",
    tabId: "ai",
    title: "Clé API OpenRouter",
    description: "Catalogue unifié de plus de 100 modèles d'IA",
    groupLabel: "Connexions",
    categoryLabel: "Services d’intelligence artificielle",
    keywords: ["openrouter", "catalogue"],
  },
  {
    id: "setting-security-session",
    tabId: "security",
    title: "Session Administrateur active",
    description: "Protection de session HttpOnly SameSite=Lax",
    groupLabel: "Administration",
    categoryLabel: "Sécurité",
    keywords: ["session", "sécurité", "cookie", "httponly"],
  },
  {
    id: "setting-security-encryption",
    tabId: "security",
    title: "Chiffrement AES-256-GCM Authentifié",
    description: "Protection des secrets au repos (IV 96 bits, tag 128 bits)",
    groupLabel: "Administration",
    categoryLabel: "Sécurité",
    keywords: ["chiffrement", "aes-256", "gcm", "secrets", "sécurité"],
  },
  {
    id: "setting-security-webhook",
    tabId: "security",
    title: "Clé secrète Webhook (x-webhook-secret)",
    description: "Authentification des requêtes entrantes pour la publication automatique",
    groupLabel: "Administration",
    categoryLabel: "Sécurité",
    keywords: ["webhook", "secret", "clé secrète", "x-webhook-secret"],
  },
  {
    id: "setting-advanced-autopilot",
    tabId: "advanced",
    title: "Planification de l'autopilote",
    description: "Cadence quotidienne et créneaux horaires autorisés",
    groupLabel: "Administration",
    categoryLabel: "Réglages avancés",
    keywords: ["autopilote", "planification", "heures", "créneaux", "cadence"],
  },
  {
    id: "setting-advanced-meta-ads",
    tabId: "advanced",
    title: "Compte Publicitaire Meta Ads",
    description: "Boost automatique des publications via Marketing API",
    groupLabel: "Administration",
    categoryLabel: "Réglages avancés",
    keywords: ["meta ads", "publicité", "boost", "marketing api", "compte publicitaire"],
  },
  {
    id: "setting-advanced-webhooks",
    tabId: "advanced",
    title: "Passerelle Webhook & Cron Développeurs",
    description: "Documentation technique HTTP, format JSON et déclencheur cron",
    groupLabel: "Administration",
    categoryLabel: "Réglages avancés",
    keywords: ["webhook", "curl", "api", "développeurs", "cron"],
  },
];

// Curated Timezones grouped by Region
export const TIMEZONE_GROUPS = [
  {
    region: "Afrique",
    timezones: [
      { id: "Africa/Douala", label: "🇨🇲 Douala, Yaoundé, Lagos (UTC+1)" },
      { id: "Africa/Casablanca", label: "🇲🇦 Casablanca, Rabat (UTC+1)" },
      { id: "Africa/Dakar", label: "🇸🇳 Dakar, Abidjan (UTC+0)" },
      { id: "Africa/Kinshasa", label: "🇨🇩 Kinshasa (UTC+1)" },
      { id: "Africa/Nairobi", label: "🇰🇪 Nairobi, Addis-Abeba (UTC+3)" },
    ],
  },
  {
    region: "Europe",
    timezones: [
      { id: "Europe/Paris", label: "🇫🇷 Paris, Bruxelles, Genève (UTC+1 / UTC+2)" },
      { id: "Europe/London", label: "🇬🇧 Londres, Dublin (UTC+0 / UTC+1)" },
      { id: "Europe/Berlin", label: "🇩🇪 Berlin, Rome, Madrid (UTC+1 / UTC+2)" },
    ],
  },
  {
    region: "Amériques",
    timezones: [
      { id: "America/Montreal", label: "🇨🇦 Montréal, Toronto (UTC-5 / UTC-4)" },
      { id: "America/New_York", label: "🇺🇸 New York, Miami (UTC-5 / UTC-4)" },
      { id: "America/Chicago", label: "🇺🇸 Chicago, Dallas (UTC-6 / UTC-5)" },
      { id: "America/Los_Angeles", label: "🇺🇸 Los Angeles, San Francisco (UTC-8 / UTC-7)" },
    ],
  },
  {
    region: "Asie & Moyen-Orient",
    timezones: [
      { id: "Asia/Dubai", label: "🇦🇪 Dubaï, Abou Dhabi (UTC+4)" },
      { id: "Asia/Karachi", label: "🇵🇰 Karachi, Islamabad (UTC+5)" },
      { id: "Asia/Kolkata", label: "🇮🇳 New Delhi, Mumbai (UTC+5:30)" },
    ],
  },
  {
    region: "Universel",
    timezones: [{ id: "UTC", label: "🌐 Temps Universel Coordonné (UTC)" }],
  },
];

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
  connected_websites?: Array<{ id: string; name: string; url: string; platform: string; auto_publish: boolean }>;
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
    <div className="mx-auto max-w-5xl space-y-6 animate-pulse p-4">
      <div className="h-10 w-72 rounded-2xl bg-surface-2" />
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-4 h-96 rounded-2xl bg-surface-2" />
        <div className="md:col-span-8 h-96 rounded-2xl bg-surface-2" />
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
  const { toast } = useToast();

  // Normalize legacy tab aliases
  const rawTab = (searchParams.get("tab") || "").toLowerCase();
  let resolvedTab: SettingsTabId = "workspace";
  if (ALL_TABS.some((t) => t.id === rawTab)) {
    resolvedTab = rawTab as SettingsTabId;
  } else if (rawTab === "general" || rawTab === "connections" || rawTab === "meta" || rawTab === "facebook") {
    resolvedTab = "channels";
  } else if (rawTab === "theme") {
    resolvedTab = "appearance";
  } else if (rawTab === "brand") {
    resolvedTab = "profile";
  }

  const [activeTab, setActiveTab] = useState<SettingsTabId>(resolvedTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [highlightedSettingId, setHighlightedSettingId] = useState<string | null>(null);

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
  const [browserTimezone, setBrowserTimezone] = useState<string | null>(null);

  // Brand Voice & Identity
  const [brandName, setBrandName] = useState("Fundoral");
  const [brandDescription, setBrandDescription] = useState("");
  const [brandTone, setBrandTone] = useState("vendeur");
  const [brandStyle, setBrandStyle] = useState("moderne");
  const [brandProhibitedWords, setBrandProhibitedWords] = useState("");
  const [brandHashtags, setBrandHashtags] = useState("#business #marketing #automation");
  const [brandSignature, setBrandSignature] = useState("📍 Douala | 📲 WhatsApp disponible 24/7");

  // Meta App Credentials
  const [appId, setAppId] = useState("");
  const [appSecret, setAppSecret] = useState("");
  const [configId, setConfigId] = useState("");
  const [savingCreds, setSavingCreds] = useState(false);
  const [credsError, setCredsError] = useState<string | null>(null);
  const [redirectUri, setRedirectUri] = useState("");
  const [disconnecting, setDisconnecting] = useState(false);
  const [showManualMetaSetup, setShowManualMetaSetup] = useState(false);

  // AI Credentials & Models
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
  const [showAdvancedDeveloper, setShowAdvancedDeveloper] = useState(false);

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
    } catch {
      // Local theme toggle works regardless of network
    }
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
    } catch (err) {
      toast({ type: "error", title: "Erreur lors de la déconnexion", message: err instanceof Error ? err.message : "" });
    } finally {
      setDisconnecting(false);
    }
  }

  // Live Test AI Provider
  async function testAi(providerName: string, apiKeyVal?: string) {
    setTestingAi(providerName.toLowerCase());
    setAiTestResult(null);
    try {
      const res = await fetch("/api/ai/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: providerName.toLowerCase(),
          apiKey: apiKeyVal ? apiKeyVal.trim() : undefined,
          baseUrl: openAiBaseUrl.trim() || undefined,
          modelName: aiModelName.trim() || undefined,
        }),
      });
      const data = await res.json();
      setAiTestResult(data);
      if (data.ok) {
        toast({ type: "success", title: `Connexion ${providerName} validée (${data.latencyMs}ms)` });
      } else {
        toast({ type: "error", title: `Échec du test ${providerName}`, message: data.error });
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

  // Test WhatsApp Gateway
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
      if (data.connected) {
        toast({ type: "success", title: "Passerelle WhatsApp connectée et opérationnelle" });
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

  // Revert changes in active tab
  const handleRevertChanges = () => {
    if (!settings) return;
    switch (activeTab) {
      case "workspace":
        setWorkspaceName(settings.workspace_name || "Fundoral Workspace");
        setAdminEmail(settings.admin_email || "contact@fundoral.shop");
        setLanguage(settings.language || "fr");
        setTimezone(settings.timezone || "Europe/Paris");
        break;
      case "profile":
        setBrandName(settings.brand_name || "Fundoral");
        setBrandDescription(settings.brand_description || "");
        setBrandTone(settings.brand_tone || "vendeur");
        setBrandStyle(settings.brand_style || "moderne");
        setBrandProhibitedWords(settings.brand_prohibited_words || "");
        setBrandHashtags(settings.brand_hashtags || "#business #marketing #automation");
        setBrandSignature(settings.brand_signature || "📍 Douala | 📲 WhatsApp disponible 24/7");
        break;
      case "ai":
        setPreferredAi(settings.preferred_ai_provider || "free");
        setAiModelName(settings.ai_model_name || "");
        setOpenAiBaseUrl(settings.openai_base_url || "");
        setOpenaiKey("");
        setAnthropicKey("");
        setGeminiKey("");
        setOpenrouterKey("");
        break;
      case "channels":
        setAppId(settings.facebook_app_id || "");
        setAppSecret("");
        break;
      case "advanced":
        setAutoPostEnabled(Boolean(settings.auto_post_enabled));
        setPostsPerDay(settings.posts_per_day || 3);
        setPostingHours(settings.posting_hours || [9, 13, 18]);
        setMetaAdAccount(settings.meta_ad_account_id || "");
        break;
    }
    toast({ type: "info", title: "Modifications annulées" });
  };

  // Trigger Save from sticky bar
  const handleStickySave = () => {
    switch (activeTab) {
      case "workspace":
        saveSection("workspace", {
          workspace_name: workspaceName.trim(),
          admin_email: adminEmail.trim(),
          language,
          timezone,
        });
        break;
      case "profile":
        saveSection("profile", {
          brand_name: brandName.trim(),
          brand_description: brandDescription.trim(),
          brand_tone: brandTone,
          brand_style: brandStyle,
          brand_prohibited_words: brandProhibitedWords.trim(),
          brand_hashtags: brandHashtags.trim(),
          brand_signature: brandSignature.trim(),
        });
        break;
      case "ai":
        saveSection("ai", {
          preferred_ai_provider: preferredAi,
          ai_model_name: aiModelName.trim() || null,
          openai_base_url: openAiBaseUrl.trim() || null,
          ...(openaiKey.trim() ? { openai_api_key: openaiKey.trim() } : {}),
          ...(anthropicKey.trim() ? { anthropic_api_key: anthropicKey.trim() } : {}),
          ...(geminiKey.trim() ? { gemini_api_key: geminiKey.trim() } : {}),
          ...(openrouterKey.trim() ? { openrouter_api_key: openrouterKey.trim() } : {}),
        });
        break;
      case "channels":
        saveCredentials();
        break;
      case "advanced":
        saveSection("advanced", {
          auto_post_enabled: autoPostEnabled,
          posts_per_day: postsPerDay,
          posting_hours: postingHours,
          meta_ad_account_id: metaAdAccount.trim() || null,
        });
        break;
    }
  };

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
    <div className="mx-auto max-w-5xl space-y-6 pb-20">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-border">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Paramètres &amp; Configuration
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gérez votre organisation, vos identifiants de marque, canaux connectés et intelligence artificielle.
          </p>
        </div>

        {/* Global Interactive Search */}
        <div className="relative w-full sm:w-80">
          <div className="relative">
            <MagnifyingGlass
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <input
              type="text"
              placeholder="Rechercher un réglage..."
              value={searchQuery}
              onFocus={() => setIsSearchOpen(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              className="w-full rounded-xl border border-border bg-surface pl-9 pr-8 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition shadow-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setIsSearchOpen(false);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Search Results Dropdown Popover */}
          {isSearchOpen && searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1.5 z-40 rounded-2xl border border-border bg-surface p-2 shadow-2xl space-y-1 animate-in fade-in slide-in-from-top-2">
              <p className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Réglages correspondants ({searchResults.length})
              </p>
              {searchResults.map((res) => (
                <button
                  key={res.id}
                  type="button"
                  onClick={() => handleSelectSearchResult(res)}
                  className="w-full rounded-xl px-2.5 py-2 text-left hover:bg-surface-2 transition flex items-center justify-between group cursor-pointer"
                >
                  <div className="min-w-0 pr-2">
                    <p className="text-xs font-bold text-foreground group-hover:text-primary transition truncate">
                      {res.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">{res.description}</p>
                  </div>
                  <span className="shrink-0 rounded-md bg-surface-3 px-1.5 py-0.5 text-[9px] font-semibold text-muted-foreground">
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
        <div className="flex items-center gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive animate-in fade-in">
          <WarningCircle size={16} className="shrink-0" />
          <span>{saveErrorMessage}</span>
        </div>
      )}

      {/* Main Layout: Grouped Navigation Sidebar + Content Work Area */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        {/* Navigation Sidebar */}
        <aside className="md:col-span-4 lg:col-span-3 space-y-4">
          {/* Mobile Grouped Dropdown */}
          <div className="md:hidden">
            <label className="text-xs font-semibold text-muted-foreground block mb-1">
              Rubrique des paramètres
            </label>
            <select
              value={activeTab}
              onChange={(e) => handleTabChange(e.target.value as SettingsTabId)}
              className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary shadow-sm"
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

          {/* Desktop Grouped Navigation */}
          <nav className="hidden md:block space-y-5">
            {SETTINGS_GROUPS.map((group) => (
              <div key={group.id} className="space-y-1">
                <h3 className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {group.label}
                </h3>
                <div className="space-y-0.5">
                  {group.tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => handleTabChange(tab.id)}
                        className={cn(
                          "flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-left transition group cursor-pointer",
                          isActive
                            ? "bg-primary/10 text-primary font-bold shadow-sm border border-primary/20"
                            : "text-muted-foreground hover:bg-surface hover:text-foreground border border-transparent"
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
                                ? "bg-primary/20 text-primary"
                                : "bg-surface-3 text-muted-foreground group-hover:bg-surface-2 group-hover:text-foreground"
                            )}
                          >
                            {tab.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Certified AES-256-GCM Encryption Architecture Notice */}
          <div className="rounded-2xl border border-border/80 bg-surface-2/70 p-3.5 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
              <ShieldCheck size={16} weight="fill" />
              <span>Chiffrement AES-256-GCM</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Vos clés d&apos;API et secrets sont chiffrés au repos via le protocole cryptographique AES-256-GCM (IV aléatoire 96 bits, tag d&apos;intégrité 128 bits). Aucun secret n&apos;est exposé en clair dans le navigateur ni dans les journaux.
            </p>
          </div>
        </aside>

        {/* Content Work Area */}
        <main className="md:col-span-8 lg:col-span-9 space-y-6 min-w-0">
          {/* ========================================================== */}
          {/* 1. PERSONNALISATION : PROFIL ET MARQUE                     */}
          {/* ========================================================== */}
          {activeTab === "profile" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <Card id="setting-brand-name" className={cn(highlightedSettingId === "setting-brand-name" && "ring-2 ring-primary ring-offset-2")}>
                <div className="flex items-start justify-between pb-4 border-b border-border">
                  <div>
                    <h2 className="font-heading font-bold text-base text-foreground flex items-center gap-2">
                      <Sparkle size={20} className="text-primary" weight="fill" />
                      Identité de Marque &amp; Voix Éditoriale
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Définissez l&apos;ADN de communication et le ton que l&apos;intelligence artificielle adoptera pour rédiger vos publications sociales.
                    </p>
                  </div>
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
                  >
                    {savedSuccess === "profile" ? "Enregistré ✓" : "Enregistrer la marque"}
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
                        className="w-full rounded-xl border border-border bg-surface-2 px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                      />
                    </div>

                    <div id="setting-brand-voice" className={cn(highlightedSettingId === "setting-brand-voice" && "ring-2 ring-primary ring-offset-2")}>
                      <label className="font-semibold text-foreground block mb-1">
                        Ton de communication IA :
                      </label>
                      <select
                        value={brandTone}
                        onChange={(e) => setBrandTone(e.target.value)}
                        className="w-full rounded-xl border border-border bg-surface-2 px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
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
                      className="w-full rounded-xl border border-border bg-surface-2 px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                    />
                    <p className="text-[11px] text-muted-foreground mt-1">
                      L&apos;IA s&apos;appuie sur cette description pour comprendre vos produits, votre clientèle cible et vos points forts.
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
                        className="w-full rounded-xl border border-border bg-surface-2 px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                      >
                        <option value="moderne">Moderne &amp; Épuré (Phrases courtes, émojis ciblés)</option>
                        <option value="storytelling">Storytelling &amp; Émotion (Accroche narrative forte)</option>
                        <option value="direct">Direct &amp; Percutant (Appel à l&apos;action immédiat)</option>
                        <option value="pedagogique">Informatif &amp; Pédagogique (Conseils à forte valeur ajoutée)</option>
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
                        className="w-full rounded-xl border border-border bg-surface-2 px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                      />
                    </div>
                  </div>

                  <div id="setting-brand-signature" className={cn("grid grid-cols-1 sm:grid-cols-2 gap-4", highlightedSettingId === "setting-brand-signature" && "ring-2 ring-primary ring-offset-2")}>
                    <div>
                      <label className="font-semibold text-foreground block mb-1">
                        Hashtags officiels de la marque :
                      </label>
                      <input
                        value={brandHashtags}
                        onChange={(e) => setBrandHashtags(e.target.value)}
                        placeholder="#fundoral #business #automation"
                        className="w-full rounded-xl border border-border bg-surface-2 px-3.5 py-2.5 text-xs font-mono text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
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
                        className="w-full rounded-xl border border-border bg-surface-2 px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                      />
                    </div>
                  </div>

                  {/* Live AI Sample Preview */}
                  <div className="mt-4 rounded-xl border border-border bg-surface-2/70 p-3.5 space-y-1.5">
                    <p className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                      <Sparkle size={13} className="text-primary" /> Exemple d&apos;accroche générée par l&apos;IA :
                    </p>
                    <p className="text-xs text-foreground/90 italic leading-relaxed">
                      &quot;🚀 Découvrez les nouveautés {brandName} ! Conçues pour accélérer votre croissance sans compromis. Contactez notre équipe dès aujourd&apos;hui.
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
          {/* 1. PERSONNALISATION : APPARENCE                            */}
          {/* ========================================================== */}
          {activeTab === "appearance" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <Card id="setting-theme-mode" className={cn(highlightedSettingId === "setting-theme-mode" && "ring-2 ring-primary ring-offset-2")}>
                <div className="flex items-start justify-between pb-3 border-b border-border">
                  <div>
                    <h2 className="font-heading font-bold text-base text-foreground flex items-center gap-2">
                      <Sun size={20} className="text-amber-500" />
                      Apparence &amp; Thème Visuel
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Choisissez votre mode d&apos;affichage préféré. Mémorisé sur tous vos appareils et synchronisé avec votre compte.
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Light Mode Option */}
                  <button
                    type="button"
                    onClick={() => handleThemeChange("light")}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-2xl border text-center transition cursor-pointer relative",
                      currentTheme === "light"
                        ? "border-primary bg-primary/5 text-primary ring-2 ring-primary/20 font-bold shadow-sm"
                        : "border-border bg-surface-2/60 text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                    )}
                  >
                    {currentTheme === "light" && (
                      <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px]">
                        ✓
                      </span>
                    )}
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                      <Sun size={24} weight="bold" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">Clair (Jour)</p>
                      <p className="text-[10px] text-muted-foreground">Fond clair et textes bien contrastés</p>
                    </div>
                  </button>

                  {/* Dark Mode Option */}
                  <button
                    type="button"
                    onClick={() => handleThemeChange("dark")}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-2xl border text-center transition cursor-pointer relative",
                      currentTheme === "dark"
                        ? "border-primary bg-primary/5 text-primary ring-2 ring-primary/20 font-bold shadow-sm"
                        : "border-border bg-surface-2/60 text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                    )}
                  >
                    {currentTheme === "dark" && (
                      <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px]">
                        ✓
                      </span>
                    )}
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                      <Moon size={24} weight="bold" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">Sombre (Nuit)</p>
                      <p className="text-[10px] text-muted-foreground">Fond #0B0F19 et repos visuel</p>
                    </div>
                  </button>

                  {/* System Mode Option */}
                  <button
                    type="button"
                    onClick={() => handleThemeChange("system")}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-2xl border text-center transition cursor-pointer relative",
                      currentTheme === "system"
                        ? "border-primary bg-primary/5 text-primary ring-2 ring-primary/20 font-bold shadow-sm"
                        : "border-border bg-surface-2/60 text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                    )}
                  >
                    {currentTheme === "system" && (
                      <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px]">
                        ✓
                      </span>
                    )}
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-3 text-foreground">
                      <Desktop size={24} weight="bold" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">Système (Automatique)</p>
                      <p className="text-[10px] text-muted-foreground">Suit le réglage de votre appareil</p>
                    </div>
                  </button>
                </div>
              </Card>
            </div>
          )}

          {/* ========================================================== */}
          {/* 2. ESPACE DE TRAVAIL : ORGANISATION ET ÉQUIPE              */}
          {/* ========================================================== */}
          {activeTab === "workspace" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Workspace General Details Card (NO DUPLICATE THEME CARD) */}
              <Card id="setting-workspace-name" className={cn(highlightedSettingId === "setting-workspace-name" && "ring-2 ring-primary ring-offset-2")}>
                <div className="flex items-start justify-between pb-3 border-b border-border">
                  <div>
                    <h2 className="font-heading font-bold text-base text-foreground flex items-center gap-2">
                      <Buildings size={20} className="text-primary" />
                      Espace de Travail &amp; Organisation
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Personnalisez les détails généraux de votre compte et les paramètres régionaux de publication.
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

                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="font-semibold text-foreground block mb-1">
                      Nom de l&apos;Organisation ou Espace
                    </label>
                    <input
                      type="text"
                      value={workspaceName}
                      onChange={(e) => setWorkspaceName(e.target.value)}
                      placeholder="Ex: Fundoral Workspace"
                      className="w-full rounded-xl border border-border bg-surface-2 px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                    />
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Apparaît dans vos rapports et en-têtes d&apos;emails.
                    </p>
                  </div>

                  <div id="setting-admin-email" className={cn(highlightedSettingId === "setting-admin-email" && "ring-2 ring-primary ring-offset-2")}>
                    <label className="font-semibold text-foreground block mb-1">
                      Email de l&apos;Administrateur
                    </label>
                    <input
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="contact@fundoral.shop"
                      className="w-full rounded-xl border border-border bg-surface-2 px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                    />
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Destinataire des alertes d&apos;autopilote et de synchronisation.
                    </p>
                  </div>

                  <div id="setting-language" className={cn(highlightedSettingId === "setting-language" && "ring-2 ring-primary ring-offset-2")}>
                    <label className="font-semibold text-foreground block mb-1">
                      Langue de l&apos;interface
                    </label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full rounded-xl border border-border bg-surface-2 px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                    >
                      <option value="fr">🇫🇷 Français (Standard)</option>
                      <option value="en">🇬🇧 English</option>
                    </select>
                  </div>

                  {/* Timezone with explicit Browser Auto-detection */}
                  <div id="setting-timezone" className={cn(highlightedSettingId === "setting-timezone" && "ring-2 ring-primary ring-offset-2")}>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-semibold text-foreground">
                        Fuseau Horaire de Publication
                      </label>
                      {browserTimezone && browserTimezone !== timezone && (
                        <button
                          type="button"
                          onClick={() => {
                            setTimezone(browserTimezone);
                            toast({ type: "info", title: `Fuseau aligné sur ${browserTimezone}` });
                          }}
                          className="text-[11px] text-primary hover:underline font-semibold cursor-pointer"
                        >
                          Appliquer mon fuseau ({browserTimezone.split("/")[1] || browserTimezone})
                        </button>
                      )}
                    </div>

                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="w-full rounded-xl border border-border bg-surface-2 px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 font-medium"
                    >
                      {TIMEZONE_GROUPS.map((group) => (
                        <optgroup key={group.region} label={group.region}>
                          {group.timezones.map((tz) => (
                            <option key={tz.id} value={tz.id}>
                              {tz.label}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Régit l&apos;heure exacte d&apos;exécution de vos publications planifiées et l&apos;horodatage de vos statistiques.
                    </p>
                  </div>
                </div>
              </Card>

              {/* Team Members & Collaborators Card */}
              <Card id="setting-team-members" className={cn(highlightedSettingId === "setting-team-members" && "ring-2 ring-primary ring-offset-2")}>
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div>
                    <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-2">
                      <Users size={18} className="text-primary" />
                      Équipe &amp; Collaborateurs de l&apos;espace
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Gérez les droits d&apos;accès, rôles (Administrateur, Éditeur) et invitations de votre équipe.
                    </p>
                  </div>
                  <Link href="/dashboard/team">
                    <Button size="sm" variant="outline">
                      <Users size={14} /> Gérer l&apos;équipe ↗
                    </Button>
                  </Link>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Administrateur principal : <strong>{adminEmail}</strong></span>
                  <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 text-[10px]">
                    Propriétaire du compte
                  </span>
                </div>
              </Card>
            </div>
          )}

          {/* ========================================================== */}
          {/* 2. ESPACE DE TRAVAIL : NOTIFICATIONS                       */}
          {/* ========================================================== */}
          {activeTab === "notifications" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <Card id="setting-notifications-email" className={cn(highlightedSettingId === "setting-notifications-email" && "ring-2 ring-primary ring-offset-2")}>
                <div className="flex items-start justify-between pb-4 border-b border-border">
                  <div>
                    <h2 className="font-heading font-bold text-base text-foreground flex items-center gap-2">
                      <Info size={20} className="text-primary" />
                      Canaux de Notification &amp; Alertes
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Définissez la fréquence et les alertes transactionnelles transmises à votre équipe en cas d&apos;incident.
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-4 text-xs">
                  <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-surface-2/60">
                    <div>
                      <p className="font-semibold text-foreground">Alertes d&apos;échec de publication par Email</p>
                      <p className="text-[11px] text-muted-foreground">
                        Recevez un email immédiat sur {adminEmail} si une API Meta renvoie une erreur de token ou de Page.
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 font-bold text-[10px]">
                      Activé par défaut
                    </span>
                  </div>

                  <div id="setting-notifications-whatsapp" className={cn("flex items-center justify-between p-3.5 rounded-xl border border-border bg-surface-2/60", highlightedSettingId === "setting-notifications-whatsapp" && "ring-2 ring-primary ring-offset-2")}>
                    <div>
                      <p className="font-semibold text-foreground">Rapport récapitulatif quotidien WhatsApp</p>
                      <p className="text-[11px] text-muted-foreground">
                        Synthèse automatique envoyée chaque soir à 20h00 avec le volume des posts et nouveaux leads.
                      </p>
                    </div>
                    <span className="rounded-full bg-surface-3 text-muted-foreground border border-border px-2.5 py-0.5 font-bold text-[10px]">
                      {settings.whatsapp_enabled ? "Prêt à envoyer" : "Nécessite WhatsApp"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-surface-2/60">
                    <div>
                      <p className="font-semibold text-foreground">Notifications de validation requise</p>
                      <p className="text-[11px] text-muted-foreground">
                        Alerte l&apos;administrateur dès qu&apos;une annonce en attente de relecture arrive dans le Studio.
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 font-bold text-[10px]">
                      Actif
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* ========================================================== */}
          {/* 2. ESPACE DE TRAVAIL : FACTURATION                         */}
          {/* ========================================================== */}
          {activeTab === "billing" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <Card id="setting-billing-plan" className={cn(highlightedSettingId === "setting-billing-plan" && "ring-2 ring-primary ring-offset-2")}>
                <div className="flex items-start justify-between pb-4 border-b border-border">
                  <div>
                    <h2 className="font-heading font-bold text-base text-foreground flex items-center gap-2">
                      <Rocket size={20} className="text-primary" />
                      Abonnement &amp; Facturation
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Détails de votre licence Fundoral et consommation de vos quotas de diffusion.
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-3 py-1 text-xs font-bold">
                    Plan Enterprise Actif
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-2xl border border-border bg-surface-2/60 text-xs">
                    <p className="text-muted-foreground text-[11px]">Publications Mensuelles</p>
                    <p className="font-heading text-xl font-bold text-foreground mt-1">Illimitées</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Sans restriction de quota</p>
                  </div>

                  <div className="p-3.5 rounded-2xl border border-border bg-surface-2/60 text-xs">
                    <p className="text-muted-foreground text-[11px]">Pages &amp; Réseaux Liés</p>
                    <p className="font-heading text-xl font-bold text-foreground mt-1">Multi-comptes</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Facebook, WhatsApp &amp; Instagram</p>
                  </div>

                  <div className="p-3.5 rounded-2xl border border-border bg-surface-2/60 text-xs">
                    <p className="text-muted-foreground text-[11px]">Modèles IA Inclus</p>
                    <p className="font-heading text-xl font-bold text-foreground mt-1">Gratuit + Clés perso</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">OpenAI, Claude, Gemini</p>
                  </div>
                </div>

                <div className="mt-4 p-4 rounded-2xl border border-border bg-surface-2/40 text-xs text-muted-foreground">
                  <p className="font-semibold text-foreground">Facturation transparente Meta Ads</p>
                  <p className="text-[11px] mt-0.5 leading-relaxed">
                    Fundoral ne prélève aucune commission sur vos dépenses publicitaires Meta Ads. Vos campagnes sont facturées directement par Meta sur votre moyen de paiement associé dans le Gestionnaire de Publicités.
                  </p>
                </div>
              </Card>
            </div>
          )}

          {/* ========================================================== */}
          {/* 3. CONNEXIONS : SITES ET RÉSEAUX (GUIDED 3-STEP ASSISTANT)  */}
          {/* ========================================================== */}
          {activeTab === "channels" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="font-heading font-bold text-base text-foreground flex items-center gap-2">
                    <Globe size={20} className="text-primary" />
                    Sites Web &amp; Canaux Connectés
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Source unique de synchronisation : chaque connexion est vérifiée de bout en bout avant publication.
                  </p>
                </div>
                <Link href="/dashboard/connections">
                  <Button size="sm" variant="outline">
                    <Sliders size={13} /> Gestion multi-sites ↗
                  </Button>
                </Link>
              </div>

              {/* 1. Facebook & Pages Meta Channel Card */}
              <Card id="setting-channel-facebook" className={cn("space-y-5", highlightedSettingId === "setting-channel-facebook" && "ring-2 ring-primary ring-offset-2")}>
                {/* Header with real state */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500 shrink-0">
                      <FacebookLogo size={28} weight="fill" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-heading font-bold text-sm text-foreground">Facebook &amp; Pages Professionnelles</h3>
                        {settings.facebook_connected ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <CheckCircle size={12} weight="bold" /> Vérifié &amp; Prêt à publier
                          </span>
                        ) : settings.facebook_configured ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400 border border-blue-500/20">
                            Enregistré — En attente d&apos;autorisation
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            Non configuré
                          </span>
                        )}
                      </div>

                      {settings.facebook_connected ? (
                        <p className="text-xs text-foreground font-medium mt-1">
                          Compte connecté : <strong>{settings.facebook_user_name ?? "Administrateur Meta"}</strong>
                          {settings.default_page_name && (
                            <span className="text-muted-foreground"> • Page de diffusion par défaut : <strong>{settings.default_page_name}</strong></span>
                          )}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground mt-1">
                          Permet la diffusion automatique de vos annonces et visuels sur vos Pages Facebook professionnelles.
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
                          <LinkSimple size={14} /> Connecter Facebook
                        </Button>
                      </a>
                    )}
                  </div>
                </div>

                {/* 3-Step Guided Assistant Walkthrough */}
                <div className="rounded-2xl border border-border bg-surface-2/40 p-4 space-y-3">
                  <p className="text-xs font-bold text-foreground uppercase tracking-wide">
                    Assistant d&apos;intégration Facebook en 3 étapes :
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    {/* Step 1: Préparer */}
                    <div className="p-3 rounded-xl border border-border bg-surface space-y-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-foreground">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[11px]">1</span>
                        <span>Préparer</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        <strong>De quoi ai-je besoin ?</strong> D&apos;un compte Meta for Developers et des droits administrateur sur la Page Facebook cible.
                      </p>
                      <a
                        href="https://developers.facebook.com/docs/pages-api/getting-started/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-primary hover:underline flex items-center gap-1 pt-1"
                      >
                        Documentation Pages API <ArrowUpRight size={11} />
                      </a>
                    </div>

                    {/* Step 2: Autoriser */}
                    <div className="p-3 rounded-xl border border-border bg-surface space-y-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-foreground">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[11px]">2</span>
                        <span>Autoriser</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        <strong>Quelle action ?</strong> Cliquez sur « Connecter Facebook » ou saisissez votre App ID ci-dessous pour ouvrir l&apos;écran d&apos;autorisation Meta.
                      </p>
                      <a
                        href="https://developers.facebook.com/apps/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-primary hover:underline flex items-center gap-1 pt-1"
                      >
                        Console Applications Meta <ArrowUpRight size={11} />
                      </a>
                    </div>

                    {/* Step 3: Vérifier */}
                    <div className="p-3 rounded-xl border border-border bg-surface space-y-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-foreground">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[11px]">3</span>
                        <span>Vérifier</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        <strong>Comment savoir si cela fonctionne ?</strong> Votre compte et le nom de votre Page s&apos;affichent avec le statut « Vérifié &amp; Prêt à publier ».
                      </p>
                      <a
                        href="https://developers.facebook.com/tools/debug/accesstoken/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-primary hover:underline flex items-center gap-1 pt-1"
                      >
                        Débogueur de jetons Meta <ArrowUpRight size={11} />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Collapsible Manual Meta App Credentials Setup */}
                <div id="setting-channel-meta-creds" className={cn("pt-2 border-t border-border", highlightedSettingId === "setting-channel-meta-creds" && "ring-2 ring-primary ring-offset-2")}>
                  <button
                    type="button"
                    onClick={() => setShowManualMetaSetup(!showManualMetaSetup)}
                    className="flex items-center justify-between w-full text-xs font-semibold text-foreground hover:text-primary transition cursor-pointer py-1"
                  >
                    <span className="flex items-center gap-2">
                      <Key size={14} /> Saisie manuelle de l&apos;application Meta (App ID &amp; App Secret)
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {showManualMetaSetup ? "▲ Masquer" : "▼ Configurer"}
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

                      <div className="rounded-xl border border-border bg-surface-2/60 p-3 space-y-1.5">
                        <p className="font-bold text-foreground">Instructions d&apos;obtention de vos identifiants Meta :</p>
                        <ol className="list-decimal list-inside space-y-1 text-muted-foreground text-[11px]">
                          <li>
                            Connectez-vous sur <a href="https://developers.facebook.com/apps/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">developers.facebook.com/apps</a> et ouvrez votre application.
                          </li>
                          <li>Allez dans <strong>Paramètres &gt; De base</strong> pour copier l&apos;App ID et l&apos;App Secret.</li>
                          <li>
                            Ajoutez l&apos;URL de rappel OAuth dans la configuration Facebook Login :
                            <code className="ml-1 font-mono text-[10px] bg-surface px-1.5 py-0.5 rounded border border-border select-all">{redirectUri}</code>
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
                            className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 font-mono text-xs text-foreground outline-none focus:border-primary"
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-foreground block mb-1">
                            App Secret (Clé secrète)
                          </label>
                          <input
                            type="password"
                            placeholder={settings.facebook_app_secret_set ? "•••••••••••• (enregistré)" : "Ex: a1b2c3d4e5f6..."}
                            value={appSecret}
                            onChange={(e) => setAppSecret(e.target.value)}
                            className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 font-mono text-xs text-foreground outline-none focus:border-primary"
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-foreground block mb-1">
                            Configuration ID (Login for Business)
                          </label>
                          <input
                            placeholder="Optionnel (ex: 9876543210)"
                            value={configId}
                            onChange={(e) => setConfigId(e.target.value)}
                            className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 font-mono text-xs text-foreground outline-none focus:border-primary"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button size="sm" onClick={saveCredentials} loading={savingCreds}>
                          Enregistrer les identifiants Meta
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {/* 2. WhatsApp Business Gateway Card */}
              <Card id="setting-channel-whatsapp" className={cn("space-y-5", highlightedSettingId === "setting-channel-whatsapp" && "ring-2 ring-primary ring-offset-2")}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 shrink-0">
                      <WhatsappLogo size={28} weight="fill" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-heading font-bold text-sm text-foreground">WhatsApp Business &amp; Groupes</h3>
                        {settings.whatsapp_enabled ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <CheckCircle size={12} weight="bold" /> Passerelle active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-surface-3 px-2.5 py-0.5 text-[10px] font-bold text-muted-foreground">
                            Non configuré
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Diffusion d&apos;annonces vers vos groupes clients, chaînes et numéros officiels via WhatsApp Cloud API ou Passerelle dédiée.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant={settings.whatsapp_enabled ? "secondary" : "default"}
                      onClick={testWhatsApp}
                      loading={testingWhatsApp}
                    >
                      <QrCode size={14} /> {settings.whatsapp_enabled ? "Vérifier la session" : "Connecter WhatsApp"}
                    </Button>
                  </div>
                </div>

                {/* 3-Step Guided Assistant Walkthrough for WhatsApp */}
                <div className="rounded-2xl border border-border bg-surface-2/40 p-4 space-y-3">
                  <p className="text-xs font-bold text-foreground uppercase tracking-wide">
                    Assistant d&apos;intégration WhatsApp en 3 étapes :
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 rounded-xl border border-border bg-surface space-y-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-foreground">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 text-[11px]">1</span>
                        <span>Préparer</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        <strong>De quoi ai-je besoin ?</strong> D&apos;un compte WhatsApp Business ou d&apos;une application WhatsApp Web active sur votre téléphone.
                      </p>
                      <a
                        href="https://business.facebook.com/wa/manage/home/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 pt-1"
                      >
                        WhatsApp Manager officiel <ArrowUpRight size={11} />
                      </a>
                    </div>

                    <div className="p-3 rounded-xl border border-border bg-surface space-y-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-foreground">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 text-[11px]">2</span>
                        <span>Autoriser</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        <strong>Quelle action ?</strong> Cliquez sur « Connecter WhatsApp » pour scanner le QR Code officiel ou renseignez votre jeton Cloud API.
                      </p>
                      <a
                        href="https://developers.facebook.com/docs/whatsapp/embedded-signup/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 pt-1"
                      >
                        Guide Embedded Signup <ArrowUpRight size={11} />
                      </a>
                    </div>

                    <div className="p-3 rounded-xl border border-border bg-surface space-y-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-foreground">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 text-[11px]">3</span>
                        <span>Vérifier</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        <strong>Comment savoir si cela fonctionne ?</strong> Utilisez le champ de test ci-dessous pour envoyer un message de validation en direct.
                      </p>
                      <a
                        href="https://developers.facebook.com/documentation/business-messaging/whatsapp/groups"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 pt-1"
                      >
                        Documentation Groupes WhatsApp <ArrowUpRight size={11} />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Live Test Message Sending */}
                <div className="rounded-xl border border-border bg-surface p-3.5 space-y-2">
                  <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <PaperPlaneTilt size={14} className="text-emerald-500" />
                    Tester l&apos;envoi d&apos;un message WhatsApp en direct
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      placeholder="Numéro international (ex: +237690000000) ou ID de groupe"
                      value={testSendWaTarget}
                      onChange={(e) => setTestSendWaTarget(e.target.value)}
                      className="flex-1 rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs font-mono text-foreground outline-none focus:border-primary"
                    />
                    <Button
                      size="sm"
                      onClick={handleSendTestWhatsApp}
                      loading={testingSendWa}
                      disabled={!testSendWaTarget.trim()}
                    >
                      Envoyer le test
                    </Button>
                  </div>
                  {testSendWaResult && (
                    <div
                      className={cn(
                        "rounded-xl border p-2.5 text-xs",
                        testSendWaResult.success
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "border-destructive/30 bg-destructive/10 text-destructive"
                      )}
                    >
                      {testSendWaResult.success ? (
                        <p className="flex items-center gap-1.5 font-bold">
                          <CheckCircle size={14} weight="bold" /> Message test transmis avec succès sur WhatsApp !
                        </p>
                      ) : (
                        <p className="flex items-center gap-1.5 font-bold">
                          <WarningCircle size={14} weight="bold" /> {testSendWaResult.error}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Collapsible Manual Gateway Configuration */}
                <div className="pt-2 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setShowManualWhatsApp(!showManualWhatsApp)}
                    className="flex items-center justify-between w-full text-xs font-semibold text-foreground hover:text-primary transition cursor-pointer py-1"
                  >
                    <span className="flex items-center gap-2">
                      <Sliders size={14} /> Paramètres avancés de la passerelle WhatsApp (URL &amp; Instance)
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {showManualWhatsApp ? "▲ Masquer" : "▼ Configurer"}
                    </span>
                  </button>

                  {showManualWhatsApp && (
                    <div className="mt-3 space-y-3 pt-2 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="font-semibold text-foreground block mb-1">
                            URL de la passerelle WhatsApp
                          </label>
                          <input
                            placeholder="https://votre-instance-whatsapp.com"
                            value={whatsappApiUrl}
                            onChange={(e) => setWhatsappApiUrl(e.target.value)}
                            className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 font-mono text-xs text-foreground outline-none focus:border-primary"
                          />
                        </div>
                        <div>
                          <label className="font-semibold text-foreground block mb-1">
                            Nom de l&apos;instance WhatsApp
                          </label>
                          <input
                            placeholder="Ex: fundoral-bot"
                            value={whatsappInstanceName}
                            onChange={(e) => setWhatsappInstanceName(e.target.value)}
                            className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 font-mono text-xs text-foreground outline-none focus:border-primary"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          onClick={() =>
                            saveSection("channels", {
                              whatsapp_enabled: whatsappEnabled,
                              whatsapp_api_url: whatsappApiUrl.trim() || null,
                              whatsapp_instance_name: whatsappInstanceName.trim() || null,
                              ...(whatsappApiKey.trim() ? { whatsapp_api_key: whatsappApiKey.trim() } : {}),
                            })
                          }
                          loading={savingCategory === "channels"}
                        >
                          Enregistrer la passerelle
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {/* 3. Connected Websites Overview Card */}
              <Card id="setting-channel-websites" className={cn("space-y-4", highlightedSettingId === "setting-channel-websites" && "ring-2 ring-primary ring-offset-2")}>
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div>
                    <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-2">
                      <Globe size={18} className="text-primary" />
                      Sites Web Connectés (Shopify, WordPress, Webhooks)
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Dès qu&apos;une annonce ou un produit est publié sur votre boutique, Fundoral le convertit en publication sociale.
                    </p>
                  </div>
                  <Link href="/dashboard/connections">
                    <Button size="sm" variant="outline">
                      <Plus size={14} /> Connecter un site web ↗
                    </Button>
                  </Link>
                </div>

                <div className="flex items-center justify-between text-xs p-3 rounded-xl border border-border bg-surface-2/60">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Broadcast size={18} />
                    </span>
                    <div>
                      <p className="font-bold text-foreground">Passerelle de réception automatique active</p>
                      <p className="text-[11px] text-muted-foreground">
                        Protégée par clé secrète d&apos;authentification <code className="font-mono text-[10px]">x-webhook-secret</code>.
                      </p>
                    </div>
                  </div>
                  <Link href="/dashboard/connections">
                    <Button size="sm" variant="secondary">
                      Voir les flux
                    </Button>
                  </Link>
                </div>
              </Card>
            </div>
          )}

          {/* ========================================================== */}
          {/* 3. CONNEXIONS : SERVICES D'INTELLIGENCE ARTIFICIELLE       */}
          {/* ========================================================== */}
          {activeTab === "ai" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <Card id="setting-ai-provider" className={cn("space-y-5", highlightedSettingId === "setting-ai-provider" && "ring-2 ring-primary ring-offset-2")}>
                <div className="flex items-start justify-between pb-4 border-b border-border">
                  <div>
                    <h2 className="font-heading font-bold text-base text-foreground flex items-center gap-2">
                      <Cpu size={20} className="text-primary" weight="fill" />
                      Services d’Intelligence Artificielle &amp; Clés Personnelles
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      Fundoral intègre un service d&apos;IA gratuit prêt à l&apos;emploi. Si vous disposez de vos propres clés chez OpenAI, Anthropic ou Google, activez l&apos;option « Utiliser ma propre clé API » pour exploiter vos quotas ou des modèles plus puissants (GPT-4o, Claude 3.5 Sonnet).
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

                {/* Primary Provider Selector */}
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    Fournisseur d&apos;intelligence artificielle actif :
                  </label>
                  <select
                    value={preferredAi}
                    onChange={(e) => setPreferredAi(e.target.value as AIProvider)}
                    className="w-full rounded-xl border border-border bg-surface-2 px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-primary shadow-sm font-medium"
                  >
                    <option value="free">🤖 Modèle gratuit fourni par Fundoral (Inclus sans configuration)</option>
                    <option value="openai">🧠 OpenAI / B.AI (Recommandé - Utiliser ma propre clé API GPT-4o)</option>
                    <option value="anthropic">⚡ Anthropic Claude (Utiliser ma propre clé API Claude 3.5 Sonnet)</option>
                    <option value="gemini">💎 Google Gemini (Utiliser ma propre clé API Gemini 1.5 Pro / Flash)</option>
                    <option value="openrouter">🌐 OpenRouter (Utiliser ma propre clé API Catalogue unifié)</option>
                  </select>
                </div>

                {/* Provider Cards with Official Links & Explanations */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {/* OpenAI Card */}
                  <div id="setting-ai-openai" className={cn("p-4 rounded-2xl border border-border bg-surface-2/60 space-y-2.5", highlightedSettingId === "setting-ai-openai" && "ring-2 ring-primary ring-offset-2")}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground">OpenAI / GPT-4o</span>
                      {settings.openai_configured ? (
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <Check size={11} weight="bold" /> Clé enregistrée
                        </span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">Clé optionnelle</span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Format attendu : <code className="font-mono text-[10px]">sk-proj-...</code>
                    </p>
                    <div className="relative">
                      <input
                        type={showKeys["openai"] ? "text" : "password"}
                        placeholder={settings.openai_configured ? "•••••••••••• (enregistrée)" : "sk-proj-..."}
                        value={openaiKey}
                        onChange={(e) => setOpenaiKey(e.target.value)}
                        className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-mono text-foreground outline-none focus:border-primary pr-8"
                      />
                      <button
                        type="button"
                        onClick={() => setShowKeys({ ...showKeys, openai: !showKeys["openai"] })}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        {showKeys["openai"] ? <EyeSlash size={13} /> : <Eye size={13} />}
                      </button>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <a
                        href="https://platform.openai.com/api-keys"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-primary hover:underline flex items-center gap-1"
                      >
                        Où trouver ma clé OpenAI ? <ArrowUpRight size={11} />
                      </a>
                      <Button
                        size="sm"
                        variant="secondary"
                        loading={testingAi === "openai"}
                        disabled={!openaiKey && !settings.openai_configured}
                        onClick={() => testAi("OpenAI", openaiKey)}
                      >
                        Tester
                      </Button>
                    </div>
                  </div>

                  {/* Anthropic Card */}
                  <div id="setting-ai-anthropic" className={cn("p-4 rounded-2xl border border-border bg-surface-2/60 space-y-2.5", highlightedSettingId === "setting-ai-anthropic" && "ring-2 ring-primary ring-offset-2")}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground">Anthropic / Claude 3.5</span>
                      {settings.anthropic_configured ? (
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <Check size={11} weight="bold" /> Clé enregistrée
                        </span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">Clé optionnelle</span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Format attendu : <code className="font-mono text-[10px]">sk-ant-api03-...</code>
                    </p>
                    <div className="relative">
                      <input
                        type={showKeys["anthropic"] ? "text" : "password"}
                        placeholder={settings.anthropic_configured ? "•••••••••••• (enregistrée)" : "sk-ant-..."}
                        value={anthropicKey}
                        onChange={(e) => setAnthropicKey(e.target.value)}
                        className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-mono text-foreground outline-none focus:border-primary pr-8"
                      />
                      <button
                        type="button"
                        onClick={() => setShowKeys({ ...showKeys, anthropic: !showKeys["anthropic"] })}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        {showKeys["anthropic"] ? <EyeSlash size={13} /> : <Eye size={13} />}
                      </button>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <a
                        href="https://console.anthropic.com/settings/keys"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-primary hover:underline flex items-center gap-1"
                      >
                        Où trouver ma clé Anthropic ? <ArrowUpRight size={11} />
                      </a>
                      <Button
                        size="sm"
                        variant="secondary"
                        loading={testingAi === "anthropic"}
                        disabled={!anthropicKey && !settings.anthropic_configured}
                        onClick={() => testAi("Anthropic", anthropicKey)}
                      >
                        Tester
                      </Button>
                    </div>
                  </div>

                  {/* Gemini Card */}
                  <div id="setting-ai-gemini" className={cn("p-4 rounded-2xl border border-border bg-surface-2/60 space-y-2.5", highlightedSettingId === "setting-ai-gemini" && "ring-2 ring-primary ring-offset-2")}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground">Google Gemini 1.5 Pro</span>
                      {settings.gemini_configured ? (
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <Check size={11} weight="bold" /> Clé enregistrée
                        </span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">Clé optionnelle</span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Format attendu : <code className="font-mono text-[10px]">AIzaSy...</code>
                    </p>
                    <div className="relative">
                      <input
                        type={showKeys["gemini"] ? "text" : "password"}
                        placeholder={settings.gemini_configured ? "•••••••••••• (enregistrée)" : "AIzaSy..."}
                        value={geminiKey}
                        onChange={(e) => setGeminiKey(e.target.value)}
                        className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-mono text-foreground outline-none focus:border-primary pr-8"
                      />
                      <button
                        type="button"
                        onClick={() => setShowKeys({ ...showKeys, gemini: !showKeys["gemini"] })}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        {showKeys["gemini"] ? <EyeSlash size={13} /> : <Eye size={13} />}
                      </button>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <a
                        href="https://aistudio.google.com/app/apikey"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-primary hover:underline flex items-center gap-1"
                      >
                        Où trouver ma clé Google AI ? <ArrowUpRight size={11} />
                      </a>
                      <Button
                        size="sm"
                        variant="secondary"
                        loading={testingAi === "gemini"}
                        disabled={!geminiKey && !settings.gemini_configured}
                        onClick={() => testAi("Google Gemini", geminiKey)}
                      >
                        Tester
                      </Button>
                    </div>
                  </div>

                  {/* OpenRouter Card */}
                  <div id="setting-ai-openrouter" className={cn("p-4 rounded-2xl border border-border bg-surface-2/60 space-y-2.5", highlightedSettingId === "setting-ai-openrouter" && "ring-2 ring-primary ring-offset-2")}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground">OpenRouter (Catalogue unifié)</span>
                      {settings.openrouter_configured ? (
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <Check size={11} weight="bold" /> Clé enregistrée
                        </span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">Clé optionnelle</span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Format attendu : <code className="font-mono text-[10px]">sk-or-v1-...</code>
                    </p>
                    <div className="relative">
                      <input
                        type={showKeys["openrouter"] ? "text" : "password"}
                        placeholder={settings.openrouter_configured ? "•••••••••••• (enregistrée)" : "sk-or-v1-..."}
                        value={openrouterKey}
                        onChange={(e) => setOpenrouterKey(e.target.value)}
                        className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-mono text-foreground outline-none focus:border-primary pr-8"
                      />
                      <button
                        type="button"
                        onClick={() => setShowKeys({ ...showKeys, openrouter: !showKeys["openrouter"] })}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        {showKeys["openrouter"] ? <EyeSlash size={13} /> : <Eye size={13} />}
                      </button>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <a
                        href="https://openrouter.ai/keys"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-primary hover:underline flex items-center gap-1"
                      >
                        Où trouver ma clé OpenRouter ? <ArrowUpRight size={11} />
                      </a>
                      <Button
                        size="sm"
                        variant="secondary"
                        loading={testingAi === "openrouter"}
                        disabled={!openrouterKey && !settings.openrouter_configured}
                        onClick={() => testAi("OpenRouter", openrouterKey)}
                      >
                        Tester
                      </Button>
                    </div>
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

                {/* Collapsible Advanced AI Settings (Folded by Default) */}
                <div className="pt-2 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setShowAdvancedAi(!showAdvancedAi)}
                    className="flex items-center justify-between w-full text-xs font-semibold text-foreground hover:text-primary transition cursor-pointer py-1"
                  >
                    <span className="flex items-center gap-2">
                      <Sliders size={14} /> Options Techniques de l&apos;IA (Base URL personnalisée &amp; Modèle spécifique)
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {showAdvancedAi ? "▲ Replier" : "▼ Déplier"}
                    </span>
                  </button>

                  {showAdvancedAi && (
                    <div className="mt-3 space-y-3 pt-2 text-xs">
                      <div>
                        <label className="font-semibold text-foreground block mb-1">
                          Base URL personnalisée (Proxy ou Endpoint d&apos;entreprise)
                        </label>
                        <input
                          placeholder="https://api.openai.com/v1 ou https://api.b.ai/v1"
                          value={openAiBaseUrl}
                          onChange={(e) => setOpenAiBaseUrl(e.target.value)}
                          className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 font-mono text-xs text-foreground outline-none focus:border-primary"
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-foreground block mb-1">
                          Nom du modèle spécifique (Override)
                        </label>
                        <input
                          placeholder="Ex: gpt-4o-2024-08-06, claude-3-5-sonnet-20241022"
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
          {/* 4. ADMINISTRATION : SÉCURITÉ                               */}
          {/* ========================================================== */}
          {activeTab === "security" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <Card id="setting-security-session" className={cn("space-y-5", highlightedSettingId === "setting-security-session" && "ring-2 ring-primary ring-offset-2")}>
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

                <div className="space-y-4 text-xs">
                  {/* Active Session Card */}
                  <div className="flex items-center justify-between p-3.5 rounded-2xl border border-border bg-surface-2/60">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                        <ShieldCheck size={20} weight="fill" />
                      </div>
                      <div>
                        <p className="font-bold text-foreground">Session Administrateur Active</p>
                        <p className="text-[11px] text-muted-foreground">
                          Authentifiée via cookie sécurisé HttpOnly SameSite=Lax (Chiffrement TLS en transit).
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      Actif
                    </span>
                  </div>

                  {/* Secret Webhook Token Management */}
                  <div id="setting-security-webhook" className={cn(highlightedSettingId === "setting-security-webhook" && "ring-2 ring-primary ring-offset-2")}>
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
                      Cette clé doit être fournie dans l&apos;en-tête HTTP <code className="font-mono text-[10px]">x-webhook-secret</code> lors de chaque requête entrante.
                    </p>
                  </div>

                  {/* Certified AES-256-GCM Explanation Block */}
                  <div id="setting-security-encryption" className={cn("p-4 rounded-2xl border border-border bg-surface-2/40 space-y-2", highlightedSettingId === "setting-security-encryption" && "ring-2 ring-primary ring-offset-2")}>
                    <div className="flex items-center gap-2 text-foreground font-bold">
                      <ShieldCheck size={18} className="text-emerald-500" weight="fill" />
                      <span>Architecture de Chiffrement AES-256-GCM Documentée</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      L&apos;ensemble des jetons d&apos;accès et clés privées enregistrés (OpenAI, Anthropic, Gemini, WhatsApp) sont protégés au repos via un chiffrement AES-256-GCM implémenté côté serveur. Chaque clé possède un vecteur d&apos;initialisation (IV) unique de 96 bits et un tag d&apos;intégrité de 128 bits. Les clés déchiffrées ne sont jamais transmises au navigateur ni écrites dans les logs.
                    </p>
                  </div>

                  {/* Team Permissions Link */}
                  <div className="flex items-center justify-between p-3.5 rounded-2xl border border-border bg-surface-2/60">
                    <div>
                      <p className="font-bold text-foreground">Gestion des Rôles &amp; Permissions d&apos;Équipe</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Gérez les privilèges de vos collaborateurs (Administrateur, Éditeur de contenu, Observateur).
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
          {/* 4. ADMINISTRATION : RÉGLAGES AVANCÉS                       */}
          {/* ========================================================== */}
          {activeTab === "advanced" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Autopilot Scheduling Card */}
              <Card id="setting-advanced-autopilot" className={cn("space-y-4", highlightedSettingId === "setting-advanced-autopilot" && "ring-2 ring-primary ring-offset-2")}>
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div>
                    <h2 className="font-heading font-bold text-base text-foreground flex items-center gap-2">
                      <Rocket size={20} className="text-primary" />
                      Autopilote &amp; Planification de Publication
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Configurez la cadence et les plages horaires autorisées pour la diffusion automatique.
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

                <div className="space-y-4 text-xs">
                  <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-surface-2/60">
                    <div>
                      <p className="font-bold text-foreground">Activer l&apos;autopilote Fundoral</p>
                      <p className="text-[11px] text-muted-foreground">
                        Permet au moteur de publier automatiquement selon les créneaux sélectionnés.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={autoPostEnabled}
                      onChange={(e) => setAutoPostEnabled(e.target.checked)}
                      className="h-5 w-5 rounded accent-primary cursor-pointer"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-semibold text-foreground block mb-1">
                        Nombre maximal de publications par jour :
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={postsPerDay}
                        onChange={(e) => setPostsPerDay(Number(e.target.value) || 1)}
                        className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs text-foreground outline-none focus:border-primary"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-foreground block mb-1">
                        Fuseau horaire d&apos;application :
                      </label>
                      <div className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs text-foreground font-mono">
                        {timezone} (défini dans Organisation)
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-foreground block mb-1.5">
                      Créneaux horaires autorisés (heures entières 0h à 23h) :
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {Array.from({ length: 24 }).map((_, h) => {
                        const isSelected = postingHours.includes(h);
                        return (
                          <button
                            key={h}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                if (postingHours.length > 1) {
                                  setPostingHours(postingHours.filter((hour) => hour !== h));
                                }
                              } else {
                                setPostingHours([...postingHours, h].sort((a, b) => a - b));
                              }
                            }}
                            className={cn(
                              "h-7 w-8 rounded-lg text-[11px] font-bold transition cursor-pointer border",
                              isSelected
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-surface-2 text-muted-foreground border-border hover:bg-surface-3 hover:text-foreground"
                            )}
                          >
                            {h}h
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Meta Ads Account Card */}
              <Card id="setting-advanced-meta-ads" className={cn("space-y-4", highlightedSettingId === "setting-advanced-meta-ads" && "ring-2 ring-primary ring-offset-2")}>
                <div className="flex items-start justify-between pb-3 border-b border-border">
                  <div>
                    <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-2">
                      <Rocket size={18} className="text-primary" />
                      Compte Publicitaire Meta Ads (Marketing API)
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Renseignez votre ID de compte publicitaire pour sponsoriser automatiquement vos annonces les plus performantes.
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

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 text-xs">
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
                      "rounded-xl border p-3 text-xs space-y-1",
                      adsVerification.ok
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "border-destructive/30 bg-destructive/10 text-destructive"
                    )}
                  >
                    {adsVerification.ok ? (
                      <p className="flex items-center gap-1.5 font-bold">
                        <CheckCircle size={14} weight="bold" /> Compte validé : {adsVerification.accountName} ({adsVerification.currency})
                      </p>
                    ) : (
                      <p className="flex items-center gap-1.5 font-bold">
                        <WarningCircle size={14} weight="bold" /> {adsVerification.error || "Compte publicitaire introuvable."}
                      </p>
                    )}
                  </div>
                )}
              </Card>

              {/* Developer Webhooks & Cron Documentation (Folded by Default) */}
              <Card id="setting-advanced-webhooks" className={cn("space-y-4", highlightedSettingId === "setting-advanced-webhooks" && "ring-2 ring-primary ring-offset-2")}>
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <div>
                    <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-2">
                      <Code size={18} className="text-primary" />
                      Documentation API &amp; Déclencheurs Développeurs
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Endpoints HTTP pour connecter vos systèmes externes et CRM.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAdvancedDeveloper(!showAdvancedDeveloper)}
                    className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                  >
                    {showAdvancedDeveloper ? "▲ Replier" : "▼ Déplier"}
                  </button>
                </div>

                {showAdvancedDeveloper && (
                  <div className="space-y-3 pt-2 text-xs">
                    <div>
                      <p className="font-semibold text-foreground mb-1">URL Webhook de publication entrante :</p>
                      <div className="flex gap-2">
                        <input
                          readOnly
                          value={typeof window !== "undefined" ? `${window.location.origin}/api/webhooks/publish-from-site` : ""}
                          className="flex-1 rounded-xl border border-border bg-surface-2 px-3 py-2 font-mono text-xs text-foreground outline-none"
                        />
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => copyToClipboard(typeof window !== "undefined" ? `${window.location.origin}/api/webhooks/publish-from-site` : "", "webhookUrl")}
                        >
                          Copier
                        </Button>
                      </div>
                    </div>

                    <div>
                      <p className="font-semibold text-foreground mb-1">Déclencheur Cron autonome :</p>
                      <div className="flex gap-2">
                        <input
                          readOnly
                          value={typeof window !== "undefined" ? `${window.location.origin}/api/cron/process-queue` : ""}
                          className="flex-1 rounded-xl border border-border bg-surface-2 px-3 py-2 font-mono text-xs text-foreground outline-none"
                        />
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => copyToClipboard(typeof window !== "undefined" ? `${window.location.origin}/api/cron/process-queue` : "", "cronUrl")}
                        >
                          Copier
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          )}
        </main>
      </div>

      {/* Sticky Unsaved Changes Floating Bar */}
      {isDirty && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 w-full max-w-2xl px-4 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-amber-500/30 bg-surface/95 backdrop-blur-xl p-3.5 shadow-2xl">
            <div className="flex items-center gap-2.5 text-xs text-foreground min-w-0">
              <span className="flex h-2.5 w-2.5 rounded-full bg-amber-500 shrink-0 animate-ping" />
              <p className="font-semibold truncate">
                Modifications non enregistrées dans cette rubrique
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button size="sm" variant="ghost" onClick={handleRevertChanges}>
                Annuler
              </Button>
              <Button size="sm" onClick={handleStickySave} loading={savingCategory === activeTab}>
                Enregistrer
              </Button>
            </div>
          </div>
        </div>
      )}

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
