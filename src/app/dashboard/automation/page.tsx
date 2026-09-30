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
} from "@phosphor-icons/react/dist/ssr";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { PageCache, RSSFeedConfig } from "@/lib/types";

export default function AutomationPage() {
  const [webhookSecret, setWebhookSecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [generatingSecret, setGeneratingSecret] = useState(false);

  // Pages
  const [pages, setPages] = useState<PageCache[]>([]);
  const [defaultPageId, setDefaultPageId] = useState("");

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
  const [testTitle, setTestTitle] = useState("Lancement de la nouvelle collection Yamoura");
  const [testDesc, setTestDesc] = useState("Découvrez nos nouveautés exclusives disponibles dès maintenant en boutique.");
  const [testImage, setTestImage] = useState("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1080&auto=format&fit=crop&q=80");
  const [testUrl, setTestUrl] = useState("https://fundoral.shop");
  const [testPageId, setTestPageId] = useState("");
  const [testAutoPublish, setTestAutoPublish] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<Record<string, unknown> | null>(null);

  // Active code snippet tab
  const [codeLang, setCodeLang] = useState<"curl" | "js" | "php" | "python">("curl");

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
        setDefaultPageId(d.default_page_id || "");
      })
      .catch(() => {});

    fetch("/api/facebook/pages")
      .then((r) => r.json())
      .then((d) => {
        setPages(d.pages || []);
        if (d.defaultPageId) setDefaultPageId(d.defaultPageId);
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
      }
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
    } catch (err) {
      setTestResult({ error: err instanceof Error ? err.message : "Erreur de requête." });
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
        // Refresh feeds
        const setRes = await fetch("/api/settings");
        const setData = await setRes.json();
        setRssFeeds(setData.rss_feeds || []);
      } else {
        setSyncStatus(`Erreur : ${data.error ?? "Échec de synchronisation."}`);
      }
    } catch (err) {
      setSyncStatus(`Erreur de connexion : ${String(err)}`);
    } finally {
      setSyncingRss(false);
    }
  }

  async function addRssFeed(e: React.FormEvent) {
    e.preventDefault();
    if (!newFeedUrl.trim() || !newFeedName.trim()) return;

    const newFeed: RSSFeedConfig = {
      id: crypto.randomUUID(),
      name: newFeedName.trim(),
      url: newFeedUrl.trim(),
      pageId: newFeedPageId || defaultPageId,
      enabled: true,
      autoPublish: newFeedAutoPublish,
      lastCheckedAt: new Date().toISOString(),
    };

    const updated = [...rssFeeds, newFeed];
    setRssFeeds(updated);
    setShowNewFeed(false);
    setNewFeedName("");
    setNewFeedUrl("");

    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rss_feeds: updated }),
    });
  }

  async function removeRssFeed(id: string) {
    const updated = rssFeeds.filter((f) => f.id !== id);
    setRssFeeds(updated);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rss_feeds: updated }),
    });
  }

  async function toggleRssFeed(id: string) {
    const updated = rssFeeds.map((f) => (f.id === id ? { ...f, enabled: !f.enabled } : f));
    setRssFeeds(updated);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rss_feeds: updated }),
    });
  }

  // Snippets
  const curlCode = `curl -X POST "${webhookEndpoint}" \\
  -H "Content-Type: application/json" \\
  -H "X-Webhook-Secret: ${webhookSecret || "VOTRE_CLE_SECRETE"}" \\
  -d '{
    "title": "Nouvel article publié",
    "description": "Résumé ou détails de votre publication...",
    "imageUrl": "https://monsite.com/image.jpg",
    "url": "https://monsite.com/article",
    "autoPublish": true
  }'`;

  const jsCode = `// Exemple Node.js / Next.js / Express
await fetch("${webhookEndpoint}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Webhook-Secret": "${webhookSecret || "VOTRE_CLE_SECRETE"}"
  },
  body: JSON.stringify({
    title: product.name,
    description: product.summary,
    imageUrl: product.image_url,
    url: "https://monsite.com/produit/" + product.slug,
    autoPublish: true
  })
});`;

  const phpCode = `// Exemple WordPress / WooCommerce / PHP
$response = wp_remote_post('${webhookEndpoint}', array(
    'headers' => array(
        'Content-Type' => 'application/json',
        'X-Webhook-Secret' => '${webhookSecret || "VOTRE_CLE_SECRETE"}'
    ),
    'body' => json_encode(array(
        'title' => get_the_title($post_id),
        'description' => get_the_excerpt($post_id),
        'imageUrl' => get_the_post_thumbnail_url($post_id, 'full'),
        'url' => get_permalink($post_id),
        'autoPublish' => true
    ))
));`;

  const pythonCode = `import requests

payload = {
    "title": "Nouvelle annonce disponible",
    "description": "Découvrez notre dernière opportunité en ligne.",
    "imageUrl": "https://monsite.com/photo.jpg",
    "url": "https://monsite.com/annonce/123",
    "autoPublish": True
}

headers = {
    "Content-Type": "application/json",
    "X-Webhook-Secret": "${webhookSecret || "VOTRE_CLE_SECRETE"}"
}

response = requests.post("${webhookEndpoint}", json=payload, headers=headers)`;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Intro Hero */}
      <div className="flex flex-col gap-2 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-xl font-bold text-foreground flex items-center gap-2">
            <Lightning size={22} weight="fill" className="text-amber-400" />
            Passerelle d&apos;automatisation Site Web ➔ Facebook
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Connectez votre site web (WordPress, Yamoura, boutique, blog) pour publier automatiquement
            vos nouveaux articles, annonces et produits sur Facebook avec mise en forme IA.
          </p>
        </div>
      </div>

      {/* Grid 2 Columns: Webhook Credentials + Interactive Test */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column (7 cols): Webhook Endpoint & Documentation */}
        <div className="space-y-6 lg:col-span-7">
          <Card>
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h2 className="font-heading text-base font-bold text-foreground flex items-center gap-2">
                <Globe size={18} className="text-indigo-400" />
                Webhook Entrant sécurisé (API)
              </h2>
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400 border border-emerald-500/20">
                Prêt à recevoir
              </span>
            </div>

            <div className="mt-4 space-y-4 text-sm">
              {/* Endpoint URL */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground">URL du Webhook</label>
                <div className="mt-1.5 flex items-center gap-2">
                  <input
                    readOnly
                    value={webhookEndpoint}
                    className="flex-1 rounded-xl border border-white/[0.08] bg-surface-2 px-3.5 py-2.5 font-mono text-xs text-foreground outline-none"
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
                    className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:underline cursor-pointer"
                  >
                    <ArrowClockwise size={12} className={generatingSecret ? "animate-spin" : ""} />
                    {generatingSecret ? "Génération…" : "Régénérer une clé"}
                  </button>
                </div>

                <div className="mt-1.5 flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      readOnly
                      type={showSecret ? "text" : "password"}
                      value={webhookSecret || "Aucune clé configurée"}
                      className="w-full rounded-xl border border-white/[0.08] bg-surface-2 px-3.5 py-2.5 font-mono text-xs text-foreground outline-none pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecret(!showSecret)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      {showSecret ? <EyeSlash size={14} /> : <Eye size={14} />}
                    </button>
                  </div>

                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => copyToClipboard(webhookSecret, "secret")}
                    disabled={!webhookSecret}
                  >
                    {copiedSecret ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    {copiedSecret ? "Copié !" : "Copier"}
                  </Button>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Transmettez cette clé dans le header HTTP{" "}
                  <code className="text-indigo-300">X-Webhook-Secret: {webhookSecret ? "..." : "none"}</code>{" "}
                  ou en query param <code className="text-indigo-300">?secret=...</code>
                </p>
              </div>
            </div>

            {/* Code Samples Tabs */}
            <div className="mt-6 border-t border-border pt-4">
              <div className="flex items-center justify-between pb-2">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Code size={14} /> Exemples d&apos;intégration
                </span>
                <div className="flex items-center gap-1 rounded-lg border border-white/[0.08] bg-surface-2 p-0.5">
                  {(["curl", "js", "php", "python"] as const).map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setCodeLang(lang)}
                      className={`px-2 py-0.5 text-xs font-mono font-medium rounded cursor-pointer transition ${
                        codeLang === lang
                          ? "bg-indigo-600 text-white"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {lang.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <pre className="mt-2 overflow-x-auto rounded-xl border border-white/[0.08] bg-black/60 p-4 font-mono text-[11px] leading-relaxed text-zinc-300">
                <code>
                  {codeLang === "curl" && curlCode}
                  {codeLang === "js" && jsCode}
                  {codeLang === "php" && phpCode}
                  {codeLang === "python" && pythonCode}
                </code>
              </pre>
            </div>
          </Card>
        </div>

        {/* Right Column (5 cols): Live Webhook Interactive Simulator */}
        <div className="space-y-6 lg:col-span-5">
          <Card>
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h2 className="font-heading text-base font-bold text-foreground flex items-center gap-2">
                <PaperPlaneTilt size={18} className="text-amber-400" />
                Testeur de Webhook en direct
              </h2>
              <span className="text-xs text-muted-foreground">Simulation réelle</span>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div>
                <label className="font-semibold text-muted-foreground">Titre de l&apos;article / produit</label>
                <input
                  value={testTitle}
                  onChange={(e) => setTestTitle(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/[0.08] bg-background px-3 py-2 text-sm outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="font-semibold text-muted-foreground">Description courte</label>
                <textarea
                  rows={2}
                  value={testDesc}
                  onChange={(e) => setTestDesc(e.target.value)}
                  className="mt-1 w-full resize-none rounded-xl border border-white/[0.08] bg-background px-3 py-2 text-sm outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="font-semibold text-muted-foreground">URL de l&apos;image</label>
                <input
                  value={testImage}
                  onChange={(e) => setTestImage(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/[0.08] bg-background px-3 py-2 text-xs font-mono outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="font-semibold text-muted-foreground">Lien vers le site</label>
                <input
                  value={testUrl}
                  onChange={(e) => setTestUrl(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/[0.08] bg-background px-3 py-2 text-xs font-mono outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="font-semibold text-muted-foreground">Page Facebook cible</label>
                <select
                  value={testPageId}
                  onChange={(e) => setTestPageId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/[0.08] bg-background px-3 py-2 text-sm outline-none focus:border-indigo-500"
                >
                  <option value="">Page par défaut</option>
                  {pages.map((p) => (
                    <option key={p.page_id} value={p.page_id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  id="autoPub"
                  type="checkbox"
                  checked={testAutoPublish}
                  onChange={(e) => setTestAutoPublish(e.target.checked)}
                  className="h-4 w-4 rounded accent-indigo-600"
                />
                <label htmlFor="autoPub" className="cursor-pointer text-xs text-foreground">
                  Publier immédiatement sur Facebook (sinon enregistré en brouillon)
                </label>
              </div>

              <Button onClick={handleTestWebhook} disabled={testing} className="mt-3 w-full">
                <Sparkle size={15} weight="fill" />
                {testing ? "Traitement IA & Envoi…" : "⚡ Déclencher le webhook de test"}
              </Button>

              {testResult && (
                <div className="mt-4 rounded-xl border border-white/[0.08] bg-black/60 p-3 font-mono text-[11px] text-zinc-300">
                  <p className="font-bold text-indigo-400 mb-1">Résultat de l&apos;API :</p>
                  <pre className="overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(testResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Section 2: RSS / Atom Feed Automation (Alternative sans code) */}
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-border">
          <div>
            <h2 className="font-heading text-base font-bold text-foreground flex items-center gap-2">
              <RssSimple size={20} weight="fill" className="text-orange-400" />
              Lecteur de flux RSS / Atom (Alternative Sans-Code)
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Renseignez l&apos;URL du flux RSS de votre site. Le robot détecte les nouveaux articles et
              génère automatiquement vos publications Facebook.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="secondary"
              onClick={syncRss}
              disabled={syncingRss || rssFeeds.length === 0}
            >
              <ArrowClockwise size={14} className={syncingRss ? "animate-spin" : ""} />
              {syncingRss ? "Synchronisation…" : "Synchroniser maintenant"}
            </Button>
            <Button size="sm" onClick={() => setShowNewFeed(true)}>
              <Plus size={14} /> Ajouter un flux RSS
            </Button>
          </div>
        </div>

        {syncStatus && (
          <div className="mt-4 rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-3 text-xs text-indigo-300">
            {syncStatus}
          </div>
        )}

        {/* New Feed Modal / Inline form */}
        {showNewFeed && (
          <form
            onSubmit={addRssFeed}
            className="mt-4 rounded-2xl border border-indigo-500/40 bg-indigo-950/20 p-4 space-y-3"
          >
            <div className="flex items-center justify-between pb-2 border-b border-border/50">
              <h3 className="font-heading text-sm font-bold text-foreground">
                Ajouter un nouveau flux RSS
              </h3>
              <button
                type="button"
                onClick={() => setShowNewFeed(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Annuler
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Nom du flux</label>
                <input
                  required
                  placeholder="Ex : Blog Yamoura"
                  value={newFeedName}
                  onChange={(e) => setNewFeedName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/[0.08] bg-background px-3 py-2 text-sm outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground">URL du flux RSS / Atom</label>
                <input
                  required
                  type="url"
                  placeholder="https://monsite.com/feed"
                  value={newFeedUrl}
                  onChange={(e) => setNewFeedUrl(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/[0.08] bg-background px-3 py-2 text-sm outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 items-center">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Page Facebook cible</label>
                <select
                  value={newFeedPageId}
                  onChange={(e) => setNewFeedPageId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/[0.08] bg-background px-3 py-2 text-sm outline-none focus:border-indigo-500"
                >
                  <option value="">Page par défaut</option>
                  {pages.map((p) => (
                    <option key={p.page_id} value={p.page_id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-4">
                <input
                  id="feedAutoPub"
                  type="checkbox"
                  checked={newFeedAutoPublish}
                  onChange={(e) => setNewFeedAutoPublish(e.target.checked)}
                  className="h-4 w-4 rounded accent-indigo-600"
                />
                <label htmlFor="feedAutoPub" className="cursor-pointer text-xs text-foreground">
                  Publier automatiquement dès détection d&apos;un article
                </label>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button size="sm" type="submit">
                Enregistrer ce flux RSS
              </Button>
            </div>
          </form>
        )}

        {/* List of Feeds */}
        <div className="mt-4">
          {rssFeeds.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Aucun flux RSS configuré. Cliquez sur « Ajouter un flux RSS » pour connecter votre blog ou
              site web sans code.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {rssFeeds.map((feed) => (
                <div key={feed.id} className="flex items-center justify-between py-3.5">
                  <div className="min-w-0 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-foreground">{feed.name}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          feed.enabled
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-zinc-500/10 text-zinc-400"
                        }`}
                      >
                        {feed.enabled ? "Actif" : "En pause"}
                      </span>
                      {feed.autoPublish && (
                        <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-bold text-indigo-400">
                          Auto-publication
                        </span>
                      )}
                    </div>
                    <p className="truncate font-mono text-xs text-muted-foreground mt-0.5">
                      {feed.url}
                    </p>
                    {feed.lastCheckedAt && (
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Dernière vérification :{" "}
                        {new Date(feed.lastCheckedAt).toLocaleString("fr-FR", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button size="sm" variant="secondary" onClick={() => toggleRssFeed(feed.id)}>
                      {feed.enabled ? "Mettre en pause" : "Activer"}
                    </Button>
                    <button
                      type="button"
                      onClick={() => removeRssFeed(feed.id)}
                      className="p-2 text-muted-foreground hover:text-destructive cursor-pointer transition"
                      title="Supprimer"
                    >
                      <Trash size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
