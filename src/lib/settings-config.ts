import React from "react";
import {
  Buildings,
  Sparkle,
  Globe,
  Cpu,
  Sliders,
  Sun,
  Rocket,
  Lock,
  Info,
} from "@phosphor-icons/react/dist/ssr";

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

export const ALL_TABS: SettingsTabItem[] = SETTINGS_GROUPS.flatMap((g) => g.tabs);

export interface SearchableSetting {
  id: string;
  tabId: SettingsTabId;
  title: string;
  description: string;
  groupLabel: string;
  categoryLabel: string;
  keywords: string[];
}

export const SEARCHABLE_SETTINGS: SearchableSetting[] = [
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
