"use client";

import { useEffect, useState } from "react";
import {
  Lightning,
  Copy,
  CheckCircle,
  ArrowClockwise,
  RssSimple,
  Globe,
  Code,
  PaperPlaneTilt,
  Plus,
  Trash,
  Check,
  Eye,
  EyeSlash,
  Sparkle,
  Browsers,
  Link as LinkIcon,
  ShieldCheck,
  Storefront,
  NewspaperClipping,
  ArrowSquareOut,
} from "@phosphor-icons/react/dist/ssr";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import type { PageCache, RSSFeedConfig, ConnectedWebsite } from "@/lib/types";

export default function AutomationPage() {
  const toast = useToast();
  const [webhookSecret, setWebhookSecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [generatingSecret, setGeneratingSecret] = useState(false);

  // Pages
  const [pages, setPages] = useState<PageCache[]>([]);
  const [defaultPageId, setDefaultPageId] = useState("");

  // Connected Websites
  const [connectedWebsites, setConnectedWebsites] = useState<ConnectedWebsite[]>([]);
  const [siteUrlInput, setSiteUrlInput] = useState("");
  const [analyzingSite, setAnalyzingSite] = useState(false);
  const [detectedSiteInfo, setDetectedSiteInfo] = useState<{
    platform: string;
    siteUrl: string;
    siteTitle: string;
    detectedFeeds: string[];
    samplePost?: { title: string; excerpt?: string; url?: string; image?: string } | null;
  } | null>(null);
  const [siteTargetPageId, setSiteTargetPageId] = useState("");
  const [siteAutoPublish, setSiteAutoPublish] = useState(true);
  const [savingSite, setSavingSite] = useState(false);

  // RSS Feeds
  const [rssFeeds, setRssFeeds] = useState<RSSFeedConfig[]>([]);
  const [syncingRss, setSyncingRss] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // New RSS Feed Form
  const [showNewFeed, setShowNewFeed] = useState(false);
  const [newFeedName, setNewFeedName] = useState("");
  const [newFeedUrl, setNewFeedUrl] = useState("");
  const [newFeedPageId, setNewFeedPageId] = useState("");
  const [newFeedAutoPublish, setNewFeedAutoPublish] = useState(true);

  // Webhook Tester state
  const [testTitle, setTestTitle] = useState("Lancement de la nouvelle collection");
  const [testDesc, setTestDesc] = useState("Découvrez nos nouveautés exclusives disponibles dès maintenant en boutique.");
  const [testImage, setTestImage] = useState("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1080&auto=format&fit=crop&q=80");
  const [testUrl, setTestUrl] = useState("https://example.com");
  const [testPageId, setTestPageId] = useState("");
  const [testAutoPublish, setTestAutoPublish] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<Record<string, unknown> | null>(null);

  // Active code snippet tab
  const [codeLang, setCodeLang] = useState<"wordpress" | "nextjs" | "shopify" | "php" | "curl">("wordpress");
  const [origin, setOrigin] = useState("https://fundoral.shop");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }

    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        setWebhookSecret(d.webhook_secret || "");
        setRssFeeds(d.rss_feeds || []);
        setConnectedWebsites(d.connected_websites || []);
        setDefaultPageId(d.default_page_id || "");
        setSiteTargetPageId(d.default_page_id || "");
      })
      .catch(() => {});

    fetch("/api/facebook/pages")
      .then((r) => r.json())
      .then((d) => {
        setPages(d.pages || []);
        if (d.defaultPageId) {
          setDefaultPageId(d.defaultPageId);
          setSiteTargetPageId(d.defaultPageId);
        }
      })
      .catch(() => {});
  }, []);

  const webhookEndpoint = `${origin}/api/webhooks/publish-from-site`;

  async function generateNewSecret() {
    setGeneratingSecret(true);
    try {
      const res = await fetch("/api/automation/webhook/secret", { method: "POST" });
      const data = await res.json();
      if (data.secret) {
        setWebhookSecret(data.secret);
        toast.success("Nouvelle clé secrète générée avec succès.");
      }
    } finally {
      setGeneratingSecret(false);
    }
  }

  function copyToClipboard(text: string, type: "url" | "secret" | "general") {
    navigator.clipboard.writeText(text);
    if (type === "url") {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } else if (type === "secret") {
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    }
    toast.success("Copié dans le presse-papier !");
  }

  // 1-Click Detect & Connect Website
  async function handleAnalyzeSite() {
    if (!siteUrlInput.trim()) {
      toast.error("Veuillez renseigner l'URL de votre site web.");
      return;
    }
    setAnalyzingSite(true);
    setDetectedSiteInfo(null);
    try {
      const res = await fetch("/api/automation/detect-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: siteUrlInput }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Impossible d'analyser ce site.");
      setDetectedSiteInfo(data);
      toast.success(
        "Détection réussie !",
        `Plateforme détectée : ${data.platform.toUpperCase()}`
      );
    } catch (err) {
      toast.error(
        "Échec de détection",
        err instanceof Error ? err.message : "Erreur lors de l'analyse du site."
      );
    } finally {
      setAnalyzingSite(false);
    }
  }

  async function handleSaveConnectedWebsite() {
    if (!detectedSiteInfo) return;
    setSavingSite(true);
    try {
      const res = await fetch("/api/automation/connected-websites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: detectedSiteInfo.siteTitle || detectedSiteInfo.siteUrl,
          url: detectedSiteInfo.siteUrl,
          platform: detectedSiteInfo.platform,
          rssUrl: detectedSiteInfo.detectedFeeds[0] || null,
          targetPageId: siteTargetPageId || defaultPageId,
          autoPublish: siteAutoPublish,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec de l'enregistrement du site.");
      setConnectedWebsites(data.websites);
      toast.success("Site connecté avec succès !", "Votre passerelle webhook est prête.");
      setDetectedSiteInfo(null);
      setSiteUrlInput("");
    } catch (err) {
      toast.error("Erreur", err instanceof Error ? err.message : "Erreur.");
    } finally {
      setSavingSite(false);
    }
  }

  async function handleDeleteWebsite(id: string) {
    if (!confirm("Voulez-vous supprimer ce site connecté ?")) return;
    try {
      const res = await fetch("/api/automation/connected-websites", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.ok) {
        setConnectedWebsites(data.websites);
        toast.info("Site supprimé de la liste des connexions.");
      }
    } catch (err) {
      toast.error("Erreur lors de la suppression.", String(err));
    }
  }

  async function handleTestWebhook() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/webhooks/publish-from-site", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Secret": webhookSecret,
        },
        body: JSON.stringify({
          title: testTitle,
          description: testDesc,
          imageUrl: testImage,
          url: testUrl,
          pageId: testPageId || defaultPageId,
          autoPublish: testAutoPublish,
        }),
      });

      const data = await res.json();
      setTestResult(data);
      if (data.success) {
        toast.success(
          data.published ? "Post publié sur Facebook !" : "Brouillon généré par le Webhook !"
        );
      } else {
        toast.error("Le Webhook a renvoyé une erreur", data.error);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur de requête.";
      setTestResult({ error: msg });
      toast.error("Erreur de test", msg);
    } finally {
      setTesting(false);
    }
  }

  async function syncRss() {
    setSyncingRss(true);
    setSyncStatus(null);
    try {
      const res = await fetch("/api/automation/rss/sync", { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        setSyncStatus(
          `Synchronisation terminée : ${data.newPostsGenerated} nouveau(x) post(s) généré(s) depuis ${data.syncedFeeds} flux actif(s).`
        );
        toast.success(
          "Synchronisation RSS réussie",
          `${data.newPostsGenerated} publication(s) générée(s).`
        );
        fetch("/api/settings")
          .then((r) => r.json())
          .then((d) => setRssFeeds(d.rss_feeds || []));
      } else {
        setSyncStatus(`Erreur : ${data.error || "Échec de synchronisation."}`);
        toast.error("Erreur", data.error);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur réseau.";
      setSyncStatus(`Erreur : ${msg}`);
      toast.error("Erreur de synchronisation", msg);
    } finally {
      setSyncingRss(false);
    }
  }

  async function handleAddFeed() {
    if (!newFeedName.trim() || !newFeedUrl.trim()) return;
    const newFeed: RSSFeedConfig = {
      id: crypto.randomUUID(),
      name: newFeedName.trim(),
      url: newFeedUrl.trim(),
      pageId: newFeedPageId || defaultPageId,
      enabled: true,
      autoPublish: newFeedAutoPublish,
    };

    const updated = [...rssFeeds, newFeed];
    setRssFeeds(updated);
    setNewFeedName("");
    setNewFeedUrl("");
    setShowNewFeed(false);

    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rss_feeds: updated }),
    });
    toast.success("Flux RSS ajouté avec succès.");
  }

  async function handleDeleteFeed(id: string) {
    const updated = rssFeeds.filter((f) => f.id !== id);
    setRssFeeds(updated);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rss_feeds: updated }),
    });
    toast.info("Flux RSS supprimé.");
  }

  // Snippets
  const wpSnippet = `/**
 * Intégration WordPress : Ajoutez ce code dans le functions.php de votre thème
 * ou via l'extension gratuite "Code Snippets".
 */
add_action('publish_post', function($post_id, $post) {
    // Éviter les révisions ou sauvegardes automatiques
    if (wp_is_post_revision($post_id) || wp_is_post_autosave($post_id)) return;
    
    $webhook_url = '${webhookEndpoint}';
    $secret_key  = '${webhookSecret || "VOTRE_CLE_SECRETE"}';
    
    $image_url = get_the_post_thumbnail_url($post_id, 'full');
    if (!$image_url) {
        $image_url = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1080&auto=format&fit=crop&q=80';
    }

    $body = json_encode([
        'title'       => get_the_title($post_id),
        'description' => wp_strip_all_tags(get_the_excerpt($post_id)),
        'imageUrl'    => $image_url,
        'url'         => get_permalink($post_id),
        'autoPublish' => true,
    ]);

    wp_remote_post($webhook_url, [
        'headers' => [
            'Content-Type'     => 'application/json',
            'X-Webhook-Secret' => $secret_key,
        ],
        'body'    => $body,
        'timeout' => 15,
    ]);
}, 10, 2);`;

  const nextjsSnippet = `// Next.js (App Router / Pages) ou Node.js
import axios from 'axios';

export async function onContentPublished(article) {
  await fetch('${webhookEndpoint}', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Webhook-Secret': '${webhookSecret || "VOTRE_CLE_SECRETE"}'
    },
    body: JSON.stringify({
      title: article.title,
      description: article.summary || article.excerpt,
      imageUrl: article.coverImage || 'https://images.unsplash.com/...',
      url: \`https://mon-site.com/articles/\${article.slug}\`,
      autoPublish: true
    })
  });
}`;

  const shopifySnippet = `// Shopify Webhook : Dans Paramètres > Notifications > Webhooks
// Événement : Création de produit (products/create) ou Blog
// URL cible : ${webhookEndpoint}?secret=${webhookSecret || "VOTRE_CLE_SECRETE"}
// Format : JSON

// Ou script Cloudflare Worker / Lambda pour mapper le payload Shopify :
export default {
  async fetch(request) {
    const product = await request.json();
    return fetch("${webhookEndpoint}", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Secret": "${webhookSecret || "VOTRE_CLE_SECRETE"}"
      },
      body: JSON.stringify({
        title: \`Nouveau produit : \${product.title}\`,
        description: product.body_html.replace(/<[^>]+>/g, "").slice(0, 200),
        imageUrl: product.image?.src,
        url: "https://mon-shop.myshopify.com/products/" + product.handle,
        autoPublish: true
      })
    });
  }
};`;

  const phpSnippet = `<?php
// PHP Standard / Custom CMS
$ch = curl_init('${webhookEndpoint}');
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'title'       => $article['title'],
    'description' => $article['excerpt'],
    'imageUrl'    => $article['image_url'],
    'url'         => $article['url'],
    'autoPublish' => true
]));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'X-Webhook-Secret: ${webhookSecret || "VOTRE_CLE_SECRETE"}'
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
curl_close($ch);`;

  const curlSnippet = `curl -X POST "${webhookEndpoint}" \\
  -H "Content-Type: application/json" \\
  -H "X-Webhook-Secret: ${webhookSecret || "VOTRE_CLE_SECRETE"}" \\
  -d '{
    "title": "Nouvel article en ligne",
    "description": "Découvrez notre dernière publication dès maintenant.",
    "imageUrl": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1080",
    "url": "https://mon-site.com/article/1",
    "autoPublish": true
  }'`;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Intro Header */}
      <div className="flex flex-col gap-2 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-xl font-bold text-foreground flex items-center gap-2">
            <Lightning size={24} weight="fill" className="text-amber-400" />
            Passerelle d&apos;automatisation Site Web ➔ Facebook
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Connectez votre site web en 2 clics (WordPress, Shopify, Next.js, blog ou boutique) pour
            formuler et publier automatiquement vos articles et annonces sur vos Pages Facebook.
          </p>
        </div>
      </div>

      {/* SECTION 1: Connect Your Website in 2 Clicks (HERO MODULE) */}
      <Card className="relative overflow-hidden border-indigo-500/30 bg-gradient-to-b from-[#13192e] to-[#0d111e]">
        <div className="absolute top-0 right-0 p-8 pointer-events-none opacity-10">
          <Globe size={180} weight="thin" className="text-indigo-400" />
        </div>

        <div className="relative z-10 space-y-5">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-md shadow-indigo-500/20">
                <Globe size={22} weight="bold" />
              </div>
              <div>
                <h2 className="font-heading text-lg font-bold text-white flex items-center gap-2">
                  Connect Your Website (Intégration en 2 clics)
                </h2>
                <p className="text-xs text-zinc-400">
                  Entrez l&apos;URL de votre site : notre moteur analyse et configure la passerelle automatiquement.
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-300 border border-indigo-500/30">
              <Sparkle size={13} weight="fill" /> Auto-détection intelligente
            </span>
          </div>

          {/* Input & Action Bar */}
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <div className="relative flex-1">
              <input
                type="url"
                value={siteUrlInput}
                onChange={(e) => setSiteUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAnalyzeSite()}
                placeholder="https://mon-site-web.com ou https://ma-boutique.myshopify.com"
                className="w-full rounded-xl border border-white/[0.12] bg-[#0c101c] px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>
            <Button
              onClick={handleAnalyzeSite}
              loading={analyzingSite}
              className="shrink-0"
              size="md"
            >
              <Sparkle size={16} weight="fill" />
              {analyzingSite ? "Analyse en cours…" : "Analyser & Détecter"}
            </Button>
          </div>

          {/* Detected Website Preview Box */}
          {detectedSiteInfo && (
            <div className="rounded-xl border border-emerald-500/30 bg-[#0c1f17]/60 p-4 backdrop-blur-md animate-in fade-in slide-in-from-top-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <h4 className="font-heading font-bold text-white text-base">
                      {detectedSiteInfo.siteTitle}
                    </h4>
                    <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-[11px] font-bold uppercase text-emerald-300 border border-emerald-500/30">
                      {detectedSiteInfo.platform === "wordpress"
                        ? "WordPress REST API détectée"
                        : detectedSiteInfo.platform === "shopify"
                        ? "Boutique Shopify détectée"
                        : detectedSiteInfo.platform === "rss"
                        ? "Flux RSS/Atom détecté"
                        : "Site web personnalisé"}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300 font-mono">{detectedSiteInfo.siteUrl}</p>

                  {detectedSiteInfo.samplePost && (
                    <div className="mt-2 rounded-lg bg-black/30 p-2.5 text-xs text-zinc-300 border border-white/[0.06]">
                      <span className="text-[10px] uppercase font-bold text-indigo-400">Exemple d&apos;article détecté :</span>
                      <p className="font-semibold text-white mt-0.5">{detectedSiteInfo.samplePost.title}</p>
                      {detectedSiteInfo.samplePost.excerpt && (
                        <p className="text-zinc-400 text-[11px] mt-0.5 line-clamp-1">
                          {detectedSiteInfo.samplePost.excerpt}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Configuration Options */}
                <div className="flex flex-col gap-2 shrink-0 sm:w-72">
                  <label className="text-xs font-semibold text-zinc-300">
                    Page Facebook de destination :
                  </label>
                  <select
                    value={siteTargetPageId}
                    onChange={(e) => setSiteTargetPageId(e.target.value)}
                    className="rounded-lg border border-white/[0.12] bg-[#0c101c] px-2.5 py-1.5 text-xs text-white outline-none focus:border-indigo-500"
                  >
                    {pages.map((p) => (
                      <option key={p.page_id} value={p.page_id}>
                        {p.name}
                      </option>
                    ))}
                  </select>

                  <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={siteAutoPublish}
                      onChange={(e) => setSiteAutoPublish(e.target.checked)}
                      className="rounded accent-indigo-500"
                    />
                    Publier automatiquement dès réception
                  </label>

                  <Button
                    variant="emerald"
                    size="sm"
                    loading={savingSite}
                    onClick={handleSaveConnectedWebsite}
                    className="mt-1"
                  >
                    <CheckCircle size={15} weight="fill" />
                    Valider & Connecter ce site
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* List of currently connected websites */}
          {connectedWebsites.length > 0 && (
            <div className="pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2.5">
                Sites web connectés ({connectedWebsites.length})
              </h4>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {connectedWebsites.map((site) => (
                  <div
                    key={site.id}
                    className="flex flex-col justify-between rounded-xl border border-white/[0.08] bg-[#0c101c]/80 p-3.5 backdrop-blur-md"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-heading font-semibold text-white text-sm truncate">
                          {site.name}
                        </span>
                        <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-[10px] font-bold text-indigo-300 uppercase">
                          {site.platform}
                        </span>
                      </div>
                      <a
                        href={site.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-zinc-400 hover:text-indigo-400 truncate flex items-center gap-1"
                      >
                        {site.url} <ArrowSquareOut size={11} />
                      </a>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-xs">
                      <span className="text-emerald-400 font-medium text-[11px] flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        {site.auto_publish ? "Auto-post actif" : "Mode brouillon"}
                      </span>
                      <button
                        onClick={() => handleDeleteWebsite(site.id)}
                        className="text-zinc-500 hover:text-red-400 transition"
                        title="Supprimer ce site"
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* SECTION 2: Webhook Credentials & Code Snippets Tabs */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left: Webhook Credentials & Instructions */}
        <div className="space-y-6 lg:col-span-7">
          <Card>
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h2 className="font-heading text-base font-bold text-foreground flex items-center gap-2">
                <ShieldCheck size={18} className="text-indigo-400" />
                Passerelle Webhook Sécurisée (API)
              </h2>
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400 border border-emerald-500/20">
                Prêt à recevoir
              </span>
            </div>

            <div className="mt-4 space-y-4 text-sm">
              {/* Endpoint URL */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground">URL du Webhook Universel</label>
                <div className="mt-1.5 flex items-center gap-2">
                  <input
                    readOnly
                    value={webhookEndpoint}
                    className="flex-1 rounded-xl border border-white/[0.08] bg-[#0c101c] px-3.5 py-2.5 font-mono text-xs text-foreground outline-none"
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => copyToClipboard(webhookEndpoint, "url")}
                  >
                    {copiedUrl ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    {copiedUrl ? "Copié !" : "Copier"}
                  </Button>
                </div>
              </div>

              {/* Secret Key */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Clé secrète d&apos;authentification (X-Webhook-Secret)
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
                <div className="mt-1.5 flex items-center gap-2">
                  <input
                    readOnly
                    type={showSecret ? "text" : "password"}
                    value={webhookSecret || "Non configurée"}
                    className="flex-1 rounded-xl border border-white/[0.08] bg-[#0c101c] px-3.5 py-2.5 font-mono text-xs text-foreground outline-none"
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
                  >
                    {copiedSecret ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    {copiedSecret ? "Copié !" : "Copier"}
                  </Button>
                </div>
              </div>
            </div>

            {/* Code Snippets Accordion / Tabs */}
            <div className="mt-6 border-t border-border pt-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Code size={14} /> Extrait de code à intégrer sur votre site
                </span>
                <div className="flex items-center gap-1 overflow-x-auto">
                  {(["wordpress", "nextjs", "shopify", "php", "curl"] as const).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setCodeLang(lang)}
                      className={`cursor-pointer rounded-lg px-2.5 py-1 text-xs font-semibold uppercase transition ${
                        codeLang === lang
                          ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/30"
                          : "bg-surface-2 text-muted-foreground hover:bg-surface-3 hover:text-foreground"
                      }`}
                    >
                      {lang === "wordpress"
                        ? "WordPress"
                        : lang === "nextjs"
                        ? "Next.js"
                        : lang === "shopify"
                        ? "Shopify"
                        : lang}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-3 relative rounded-xl border border-white/[0.08] bg-[#080b12] p-4">
                <pre className="font-mono text-xs leading-relaxed text-zinc-300 overflow-x-auto max-h-72">
                  {codeLang === "wordpress" && wpSnippet}
                  {codeLang === "nextjs" && nextjsSnippet}
                  {codeLang === "shopify" && shopifySnippet}
                  {codeLang === "php" && phpSnippet}
                  {codeLang === "curl" && curlSnippet}
                </pre>
                <div className="absolute top-3 right-3">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      copyToClipboard(
                        codeLang === "wordpress"
                          ? wpSnippet
                          : codeLang === "nextjs"
                          ? nextjsSnippet
                          : codeLang === "shopify"
                          ? shopifySnippet
                          : codeLang === "php"
                          ? phpSnippet
                          : curlSnippet,
                        "general"
                      )
                    }
                  >
                    <Copy size={13} /> Copier le code
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right: Interactive Webhook Tester */}
        <div className="space-y-6 lg:col-span-5">
          <Card>
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h2 className="font-heading text-base font-bold text-foreground flex items-center gap-2">
                <PaperPlaneTilt size={18} className="text-amber-400" />
                Simulateur de Webhook en direct
              </h2>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Testez l&apos;envoi d&apos;une publication depuis votre site pour vérifier la formulation IA
              et le déclenchement Facebook.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Titre de l&apos;article / annonce</label>
                <input
                  value={testTitle}
                  onChange={(e) => setTestTitle(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/[0.08] bg-[#0c101c] px-3 py-2 text-xs text-foreground outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground">Résumé / Description</label>
                <textarea
                  rows={2}
                  value={testDesc}
                  onChange={(e) => setTestDesc(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/[0.08] bg-[#0c101c] px-3 py-2 text-xs text-foreground outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground">URL de l&apos;image</label>
                <input
                  value={testImage}
                  onChange={(e) => setTestImage(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/[0.08] bg-[#0c101c] px-3 py-2 text-xs text-foreground outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground">Lien vers le site</label>
                <input
                  value={testUrl}
                  onChange={(e) => setTestUrl(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/[0.08] bg-[#0c101c] px-3 py-2 text-xs text-foreground outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground">Page Facebook cible</label>
                <select
                  value={testPageId}
                  onChange={(e) => setTestPageId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/[0.08] bg-[#0c101c] px-3 py-2 text-xs text-foreground outline-none focus:border-primary"
                >
                  <option value="">Sélectionner une page...</option>
                  {pages.map((p) => (
                    <option key={p.page_id} value={p.page_id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="autoPub"
                  checked={testAutoPublish}
                  onChange={(e) => setTestAutoPublish(e.target.checked)}
                  className="rounded accent-primary"
                />
                <label htmlFor="autoPub" className="text-xs text-muted-foreground cursor-pointer">
                  Publier immédiatement sur Facebook (sinon mode brouillon)
                </label>
              </div>

              <Button
                className="w-full mt-2"
                onClick={handleTestWebhook}
                loading={testing}
              >
                <PaperPlaneTilt size={15} weight="bold" />
                {testing ? "Traitement par l'IA…" : "Envoyer le test Webhook"}
              </Button>

              {testResult && (
                <div className="mt-4 rounded-xl border border-white/[0.08] bg-[#080b12] p-3 text-xs">
                  <span className="font-semibold text-muted-foreground">Réponse du serveur :</span>
                  <pre className="mt-1.5 font-mono text-[11px] text-zinc-300 overflow-x-auto max-h-40">
                    {JSON.stringify(testResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* SECTION 3: RSS / Atom Feeds Automation */}
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-border">
          <div>
            <h2 className="font-heading text-base font-bold text-foreground flex items-center gap-2">
              <RssSimple size={20} className="text-orange-400" />
              Synchronisation automatique par Flux RSS / Atom
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Le bot surveille vos flux RSS toutes les 30 minutes, extrait les nouveaux articles et génère
              automatiquement des publications Facebook optimisées.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={syncRss}
              loading={syncingRss}
            >
              <ArrowClockwise size={14} className={syncingRss ? "animate-spin" : ""} />
              Synchroniser maintenant
            </Button>
            <Button size="sm" onClick={() => setShowNewFeed(!showNewFeed)}>
              <Plus size={14} /> Ajouter un flux
            </Button>
          </div>
        </div>

        {syncStatus && (
          <div className="mt-4 rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-3 text-xs text-indigo-300">
            {syncStatus}
          </div>
        )}

        {/* Add Feed Form */}
        {showNewFeed && (
          <div className="mt-4 rounded-xl border border-white/[0.08] bg-surface-2 p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Nouveau flux RSS
            </h4>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs text-muted-foreground">Nom du flux</label>
                <input
                  placeholder="Ex : Blog Yamoura Actu"
                  value={newFeedName}
                  onChange={(e) => setNewFeedName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/[0.08] bg-background px-3 py-2 text-xs outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">URL du flux RSS ou Atom</label>
                <input
                  placeholder="https://example.com/feed"
                  value={newFeedUrl}
                  onChange={(e) => setNewFeedUrl(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/[0.08] bg-background px-3 py-2 text-xs outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={newFeedAutoPublish}
                  onChange={(e) => setNewFeedAutoPublish(e.target.checked)}
                  className="rounded accent-primary"
                />
                Publier automatiquement sans validation préalable
              </label>

              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" onClick={() => setShowNewFeed(false)}>
                  Annuler
                </Button>
                <Button size="sm" onClick={handleAddFeed}>
                  Enregistrer le flux
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* List of Feeds */}
        <div className="mt-4 divide-y divide-border">
          {rssFeeds.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">
              Aucun flux RSS configuré pour le moment.
            </p>
          ) : (
            rssFeeds.map((feed) => (
              <div key={feed.id} className="flex items-center justify-between py-3.5">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground">{feed.name}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        feed.enabled ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      {feed.enabled ? "Actif" : "En pause"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono truncate max-w-md">{feed.url}</p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleDeleteFeed(feed.id)}
                    className="text-muted-foreground hover:text-destructive transition"
                    title="Supprimer ce flux"
                  >
                    <Trash size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
