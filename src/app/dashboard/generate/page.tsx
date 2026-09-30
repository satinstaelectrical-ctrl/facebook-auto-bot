"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Sparkle,
  ArrowClockwise,
  FloppyDisk,
  Rocket,
  CalendarPlus,
  X,
  WarningCircle,
  CheckCircle,
  ArrowSquareOut,
  UploadSimple,
  CaretLeft,
  CaretRight,
  DeviceMobile,
  Desktop,
  ThumbsUp,
  ChatCircle,
  ShareFat,
  GlobeHemisphereWest,
  DotsThree,
  Lightning,
} from "@phosphor-icons/react/dist/ssr";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { facebookPostUrl } from "@/lib/types";
import type { GeneratedContent, ImageSource, ImageSourcePref, PageCache } from "@/lib/types";

type Step = "idle" | "generating" | "ready";

const EMOJI_PALETTE = ["🔥", "✨", "🚀", "💡", "🎯", "📢", "👇", "💬", "❤️", "🌟", "📌", "⚡"];

const BRAND_TEMPLATES = [
  {
    name: "🚀 Nouveauté & Lancement",
    hook: "🚀 C'est enfin disponible ! Découvrez notre nouveauté",
    desc: "Nous sommes ravis de vous présenter notre toute dernière création conçue spécialement pour vous simplifier la vie. Dites-nous ce que vous en pensez en commentaire !",
    tags: ["nouveaute", "lancement", "exclusif", "tendance"],
  },
  {
    name: "💡 Conseil & Astuce experte",
    hook: "💡 L'astuce simple qui change tout au quotidien",
    desc: "Beaucoup font encore cette erreur courante. Voici comment obtenir des résultats concrets en appliquant cette méthode pas à pas. Partagez à un ami qui en a besoin !",
    tags: ["astuce", "conseils", "bienetre", "productivite"],
  },
  {
    name: "🌟 Témoignage & Avis client",
    hook: "⭐ « Une expérience incroyable » — Retour client",
    desc: "Rien ne nous fait plus plaisir que vos retours bienveillants ! Merci pour votre confiance renouvelée chaque jour. Avez-vous déjà testé ?",
    tags: ["avisclient", "satisfaction", "temoignage", "confiance"],
  },
  {
    name: "❓ Question & Débat viral",
    hook: "❓ Question du jour : Plutôt Option A ou Option B ?",
    desc: "Le débat est ouvert au sein de l'équipe et nous voulons votre avis tranché ! Votez en commentaire avec votre choix 👇",
    tags: ["debat", "questiondujour", "communaute", "engagement"],
  },
  {
    name: "🏷️ Offre limitée & Promo",
    hook: "⚡ Offre spéciale exclusive : Profitez-en vite !",
    desc: "Offre à durée limitée pour nos membres les plus fidèles. Ne manquez pas cette opportunité avant la fin du compte à rebours !",
    tags: ["promo", "bonplan", "offrelimitee", "opportunite"],
  },
];

function toLocalInputValue(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function GeneratePage() {
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("engaging");
  const [language, setLanguage] = useState("fr");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [ownTopics, setOwnTopics] = useState<string[]>([]);
  const [imagePref, setImagePref] = useState<ImageSourcePref>("ai");

  const [step, setStep] = useState<Step>("idle");
  const [error, setError] = useState<string | null>(null);

  const [content, setContent] = useState<GeneratedContent | null>(null);
  const [images, setImages] = useState<Array<{ url: string; source: ImageSource | "upload" }>>([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [hashtagInput, setHashtagInput] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  const [pages, setPages] = useState<PageCache[]>([]);
  const [pageId, setPageId] = useState("");
  const [refreshingPages, setRefreshingPages] = useState(false);

  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [saving, setSaving] = useState<"draft" | "schedule" | "post_now" | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);

  // Live preview settings
  const [previewDevice, setPreviewDevice] = useState<"mobile" | "desktop">("desktop");

  const loadPages = async (forceRefresh = false) => {
    setRefreshingPages(true);
    try {
      const res = await fetch(`/api/facebook/pages${forceRefresh ? "?refresh=1" : ""}`);
      const data = await res.json();
      const fetched: PageCache[] = data.pages ?? [];
      setPages(fetched);

      // Auto-selection:
      // 1. If defaultPageId returned and exists, use it
      // 2. If exactly 1 page, pre-select it
      // 3. If nothing selected and pages exist, pick the first
      if (data.defaultPageId && fetched.some((p) => p.page_id === data.defaultPageId)) {
        setPageId(data.defaultPageId);
      } else if (fetched.length === 1) {
        setPageId(fetched[0].page_id);
      } else if (fetched.length > 0 && !pageId) {
        setPageId(fetched[0].page_id);
      }
    } catch (err) {
      console.error("Failed to load pages:", err);
    } finally {
      setRefreshingPages(false);
    }
  };

  useEffect(() => {
    const fromLink = new URLSearchParams(window.location.search).get("topic");
    if (fromLink) setTopic(fromLink);

    fetch("/api/topics")
      .then((r) => r.json())
      .then((d) =>
        setOwnTopics(
          (d.topics ?? [])
            .filter((t: { enabled: boolean }) => t.enabled)
            .map((t: { text: string }) => t.text)
        )
      )
      .catch(() => {});

    fetch("/api/trends")
      .then((r) => r.json())
      .then((d) => setSuggestions(d.topics ?? []))
      .catch(() => {});

    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => setImagePref(d.image_source ?? "ai"))
      .catch(() => {});

    loadPages(false);
  }, []);

  const selectedPage = useMemo(() => pages.find((p) => p.page_id === pageId), [pages, pageId]);

  async function generate() {
    if (topic.trim().length < 2) {
      setError("Veuillez saisir un sujet (au moins quelques mots).");
      return;
    }
    setError(null);
    setSuccess(null);
    setPublishedUrl(null);
    setStep("generating");
    setContent(null);
    setImages([]);
    setActiveImageIndex(0);

    try {
      const [contentRes, imageRes] = await Promise.all([
        fetch("/api/generate/content", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic, tone, language }),
        }),
        fetch("/api/generate/image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: topic, source: imagePref }),
        }),
      ]);

      if (!contentRes.ok) throw new Error((await contentRes.json()).error ?? "Échec de génération du texte.");
      if (!imageRes.ok) throw new Error((await imageRes.json()).error ?? "Échec de génération de l'image.");

      const contentData: GeneratedContent = await contentRes.json();
      const imageData: { url: string; source: ImageSource } = await imageRes.json();

      setContent(contentData);
      setImages([imageData]);
      setActiveImageIndex(0);
      setStep("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue lors de la génération.");
      setStep("idle");
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append("files", files[i]);
      }
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Échec de l'upload.");

      const newUrls: string[] = data.urls ?? (data.url ? [data.url] : []);
      const newMedia = newUrls.map((url) => ({ url, source: "upload" as const }));
      setImages((prev) => [...prev, ...newMedia]);
      setSuccess(`${newUrls.length} image(s) ajoutée(s) avec succès.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'upload des images.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function removeImage(index: number) {
    setImages((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (activeImageIndex >= next.length) {
        setActiveImageIndex(Math.max(0, next.length - 1));
      }
      return next;
    });
  }

  function insertEmoji(emoji: string) {
    if (!content) return;
    setContent({
      ...content,
      description: content.description ? `${content.description} ${emoji}` : emoji,
    });
  }

  function applyBrandTemplate(tpl: (typeof BRAND_TEMPLATES)[0]) {
    setTopic(tpl.hook);
    setContent({
      title: tpl.hook,
      description: tpl.desc,
      hashtags: tpl.tags,
      provider: "template",
    });
    setStep("ready");
  }

  function removeHashtag(tag: string) {
    if (!content) return;
    setContent({ ...content, hashtags: content.hashtags.filter((h) => h !== tag) });
  }

  function addHashtag() {
    const tag = hashtagInput.trim().replace(/^#/, "").toLowerCase();
    if (!tag || !content || content.hashtags.includes(tag)) return;
    setContent({ ...content, hashtags: [...content.hashtags, tag] });
    setHashtagInput("");
  }

  async function scheduleAutoQueue() {
    if (!content || images.length === 0) return;
    if (!pageId) {
      setError("Veuillez choisir une Page avant de planifier.");
      return;
    }

    try {
      const res = await fetch("/api/settings");
      const settings = await res.json();
      const hours: number[] = settings.posting_hours || [9, 14, 20];
      const now = new Date();
      const currentHour = now.getHours();

      const nextToday = hours.find((h) => h > currentHour);
      const target = new Date();
      if (nextToday !== undefined) {
        target.setHours(nextToday, 0, 0, 0);
      } else {
        target.setDate(target.getDate() + 1);
        target.setHours(hours[0] || 9, 0, 0, 0);
      }

      setScheduledAt(toLocalInputValue(target.toISOString()));
      await save("schedule", target.toISOString());
    } catch {
      await save("schedule");
    }
  }

  async function save(action: "draft" | "schedule" | "post_now", explicitScheduleIso?: string) {
    if (!content || images.length === 0) return;
    if (action !== "draft" && !pageId) {
      setError("Veuillez choisir une Page avant de planifier ou publier.");
      return;
    }
    const scheduleIso = explicitScheduleIso || (scheduledAt ? new Date(scheduledAt).toISOString() : undefined);
    if (action === "schedule" && !scheduleIso) {
      setError("Sélectionnez une date et une heure de planification.");
      return;
    }

    setError(null);
    setSaving(action);
    try {
      const mediaUrls = images.map((img) => img.url);
      const primaryImage = images[0];

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          title: content.title,
          description: content.description,
          hashtags: content.hashtags,
          imageUrl: primaryImage.url,
          imageSource: primaryImage.source === "upload" ? "ai" : primaryImage.source,
          mediaUrls,
          linkUrl: linkUrl || undefined,
          pageId: pageId || selectedPage?.page_id || "unset",
          pageName: selectedPage?.name ?? "Page Facebook",
          action,
          scheduledAt: action === "schedule" ? scheduleIso : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Échec de l'enregistrement.");

      if (action === "post_now" && data.post?.status === "failed") {
        throw new Error(data.post.error_message ?? "Facebook a rejeté cette publication.");
      }

      setSuccess(
        action === "draft"
          ? "Enregistré comme brouillon avec succès."
          : action === "schedule"
          ? "Publication planifiée dans la file d'attente."
          : "Publié sur Facebook avec succès 🎉"
      );
      setPublishedUrl(
        action === "post_now" && data.post?.facebook_post_id
          ? facebookPostUrl(data.post.facebook_post_id)
          : null
      );
      setStep("idle");
      setContent(null);
      setImages([]);
      setTopic("");
      setScheduleOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement.");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Topic and Generation Controls */}
      <Card>
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <label className="text-sm font-semibold text-foreground">Sujet du post</label>
            <p className="text-xs text-muted-foreground">
              Décrivez ce dont vous souhaitez parler ou choisissez un modèle prédéfini.
            </p>
          </div>
          {/* Quick templates trigger */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-2 sm:pt-0">
            <span className="text-[11px] font-medium text-muted-foreground shrink-0">Modèles :</span>
            {BRAND_TEMPLATES.map((tpl) => (
              <button
                key={tpl.name}
                type="button"
                onClick={() => applyBrandTemplate(tpl)}
                className="cursor-pointer rounded-lg border border-border bg-surface-2 px-2.5 py-1 text-xs font-medium text-foreground hover:border-primary/50 hover:bg-primary/5 transition"
              >
                {tpl.name}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && generate()}
            placeholder="Ex : 5 conseils pour aménager son salon avec style"
            className="flex-1 rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
          />

          {/* Tone Selector */}
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
            aria-label="Ton de publication"
          >
            <option value="engaging">🎯 Ton : Engageant</option>
            <option value="professional">💼 Ton : Professionnel</option>
            <option value="mysterious">🔮 Ton : Mystérieux / Séduisant</option>
            <option value="educational">📚 Ton : Éducatif</option>
            <option value="promotional">🏷️ Ton : Promotionnel</option>
          </select>

          {/* Language Selector */}
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
            aria-label="Langue"
          >
            <option value="fr">🇫🇷 Français</option>
            <option value="en">🇬🇧 Anglais</option>
            <option value="es">🇪🇸 Espagnol</option>
            <option value="de">🇩🇪 Allemand</option>
          </select>

          {/* Image Preference */}
          <select
            value={imagePref}
            onChange={(e) => setImagePref(e.target.value as ImageSourcePref)}
            className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
            aria-label="Source d'image"
          >
            <option value="ai">Image IA</option>
            <option value="stock">Photo stock</option>
            <option value="mixed">Mixte</option>
          </select>

          <Button onClick={generate} disabled={step === "generating"}>
            <Sparkle size={16} weight="fill" />
            {step === "generating" ? "Génération…" : "Générer"}
          </Button>
        </div>

        {/* Topic suggestions */}
        {ownTopics.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Vos sujets :</span>
            {ownTopics.slice(0, 8).map((t) => (
              <button
                key={t}
                onClick={() => setTopic(t)}
                className="cursor-pointer rounded-full border border-primary/30 bg-primary/5 px-2.5 py-0.5 text-xs text-primary transition hover:border-primary"
              >
                {t}
              </button>
            ))}
            <Link
              href="/dashboard/topics"
              className="text-xs font-medium text-muted-foreground underline-offset-2 hover:text-primary hover:underline ml-1"
            >
              Gérer ↗
            </Link>
          </div>
        )}

        {suggestions.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Tendances :</span>
            {suggestions.slice(0, 6).map((s) => (
              <button
                key={s}
                onClick={() => setTopic(s)}
                className="cursor-pointer rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground transition hover:border-primary hover:text-primary"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </Card>

      {/* Messages feedback */}
      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-sm text-destructive">
          <WarningCircle size={18} className="mt-0.5 shrink-0" />
          <div className="flex-1">{error}</div>
          <button onClick={() => setError(null)} className="cursor-pointer">
            <X size={14} />
          </button>
        </div>
      )}

      {success && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-success/30 bg-success/10 p-3.5 text-sm text-success">
          <CheckCircle size={18} className="shrink-0" />
          <span>{success}</span>
          {publishedUrl && (
            <a
              href={publishedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold underline underline-offset-2"
            >
              Voir la publication <ArrowSquareOut size={13} />
            </a>
          )}
        </div>
      )}

      {/* Skeleton when generating */}
      {step === "generating" && (
        <Card className="animate-pulse">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="aspect-square rounded-xl bg-surface-2" />
            <div className="space-y-3">
              <div className="h-6 w-3/4 rounded bg-surface-2" />
              <div className="h-4 w-full rounded bg-surface-2" />
              <div className="h-4 w-5/6 rounded bg-surface-2" />
              <div className="h-4 w-2/3 rounded bg-surface-2" />
            </div>
          </div>
        </Card>
      )}

      {/* Generated & Ready State */}
      {step === "ready" && content && (
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Left / Center Column: Editor & Media Form (7 cols) */}
          <div className="space-y-6 lg:col-span-7">
            <Card>
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h3 className="font-heading font-bold text-foreground">Édition du contenu</h3>
                <span className="text-xs text-muted-foreground capitalize">
                  {content.provider ? `Rédigé par ${content.provider}` : ""}
                </span>
              </div>

              {/* Title / Hook */}
              <div className="mt-4">
                <label className="text-xs font-semibold text-muted-foreground">Accroche (Titre)</label>
                <input
                  value={content.title}
                  maxLength={120}
                  onChange={(e) => setContent({ ...content, title: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {/* Description */}
              <div className="mt-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-muted-foreground">Description du post</label>
                  <span className="text-[11px] text-muted-foreground">
                    {content.description.length}/500
                  </span>
                </div>
                <textarea
                  value={content.description}
                  maxLength={500}
                  rows={4}
                  onChange={(e) => setContent({ ...content, description: e.target.value })}
                  className="mt-1 w-full resize-none rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {/* Quick Emojis insertion bar */}
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-muted-foreground mr-1">Émojis rapides :</span>
                {EMOJI_PALETTE.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => insertEmoji(emoji)}
                    className="h-7 w-7 rounded-lg border border-border bg-surface-2 hover:bg-primary/10 hover:border-primary/50 text-sm flex items-center justify-center transition cursor-pointer"
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Hashtags */}
              <div className="mt-3">
                <label className="text-xs font-semibold text-muted-foreground">Hashtags</label>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {content.hashtags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                    >
                      #{tag}
                      <button onClick={() => removeHashtag(tag)} aria-label={`Supprimer ${tag}`} className="cursor-pointer">
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                  <input
                    value={hashtagInput}
                    onChange={(e) => setHashtagInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addHashtag())}
                    placeholder="+ ajouter tag…"
                    className="w-28 rounded-full border border-dashed border-border bg-transparent px-2.5 py-1 text-xs outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Link URL */}
              <div className="mt-3">
                <label className="text-xs font-semibold text-muted-foreground">Lien externe (optionnel)</label>
                <input
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://fundoral.shop/votre-page"
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {/* Media Management (Multi-Media & Carousels) */}
              <div className="mt-4 border-t border-border pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">
                      Images de la publication ({images.length})
                    </label>
                    <p className="text-[11px] text-muted-foreground">
                      Prend en charge les carrousels multi-images et vos photos personnelles.
                    </p>
                  </div>
                  <label className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-primary/5 hover:border-primary cursor-pointer transition">
                    <UploadSimple size={14} />
                    {uploading ? "Upload en cours…" : "Ajouter des images"}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Thumbnails list */}
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {images.map((img, idx) => (
                    <div
                      key={img.url}
                      className={`relative h-16 w-16 rounded-xl overflow-hidden border-2 cursor-pointer transition ${
                        activeImageIndex === idx ? "border-primary ring-2 ring-primary/20" : "border-border"
                      }`}
                      onClick={() => setActiveImageIndex(idx)}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt="" className="h-full w-full object-cover" />
                      {idx === 0 && (
                        <span className="absolute bottom-0 inset-x-0 bg-primary/80 text-[9px] text-white text-center py-0.5 font-bold">
                          Principale
                        </span>
                      )}
                      {images.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImage(idx);
                          }}
                          className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-0.5 hover:bg-destructive"
                          title="Supprimer"
                        >
                          <X size={10} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Page Selection with Refresh button */}
              <div className="mt-4 border-t border-border pt-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Page Facebook cible
                  </label>
                  <button
                    type="button"
                    onClick={() => loadPages(true)}
                    disabled={refreshingPages}
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline cursor-pointer"
                  >
                    <ArrowClockwise size={12} className={refreshingPages ? "animate-spin" : ""} />
                    {refreshingPages ? "Actualisation…" : "🔄 Actualiser les pages"}
                  </button>
                </div>

                <div className="mt-1 flex items-center gap-2">
                  {selectedPage?.avatar_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={selectedPage.avatar_url}
                      alt=""
                      className="h-9 w-9 rounded-full object-cover border border-border shrink-0"
                    />
                  )}
                  <select
                    value={pageId}
                    onChange={(e) => setPageId(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary"
                  >
                    <option value="">Sélectionner une Page…</option>
                    {pages.map((p) => (
                      <option key={p.page_id} value={p.page_id}>
                        {p.name} {p.category ? `(${p.category})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {pages.length === 0 && (
                  <p className="mt-1.5 text-xs text-amber-500">
                    Aucune Page trouvée. Cliquez sur « Actualiser les pages » ou connectez Facebook dans Paramètres.
                  </p>
                )}
              </div>

              {/* Scheduling Slot Option */}
              {scheduleOpen && (
                <div className="mt-4 rounded-xl border border-border bg-surface-2 p-3.5 space-y-2">
                  <label className="text-xs font-semibold text-foreground">Date et heure précises</label>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
              )}

              {/* Publishing Actions */}
              <div className="mt-5 flex flex-wrap items-center gap-2 pt-2 border-t border-border">
                <Button variant="secondary" onClick={() => save("draft")} disabled={saving !== null}>
                  <FloppyDisk size={16} /> Brouillon
                </Button>

                <Button
                  variant="secondary"
                  onClick={scheduleAutoQueue}
                  disabled={saving !== null || !pageId}
                  title="Planifie automatiquement sur le prochain créneau de pointe configuré"
                >
                  <Lightning size={16} className="text-amber-500" weight="fill" />
                  File auto
                </Button>

                {scheduleOpen ? (
                  <Button variant="secondary" onClick={() => save("schedule")} disabled={saving !== null}>
                    <CalendarPlus size={16} /> Confirmer date
                  </Button>
                ) : (
                  <Button variant="secondary" onClick={() => setScheduleOpen(true)} disabled={saving !== null}>
                    <CalendarPlus size={16} /> Choisir heure
                  </Button>
                )}

                <Button onClick={() => save("post_now")} disabled={saving !== null || !pageId}>
                  <Rocket size={16} weight="fill" />
                  {saving === "post_now" ? "Publication…" : "Publier maintenant"}
                </Button>
              </div>
            </Card>
          </div>

          {/* Right Column: Live Facebook Feed Preview (5 cols) */}
          <div className="space-y-3 lg:col-span-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Aperçu Facebook en direct
              </span>
              <div className="flex items-center rounded-lg border border-border bg-surface-2 p-0.5">
                <button
                  type="button"
                  onClick={() => setPreviewDevice("mobile")}
                  className={`p-1.5 rounded-md text-xs font-medium cursor-pointer transition ${
                    previewDevice === "mobile" ? "bg-background shadow text-foreground" : "text-muted-foreground"
                  }`}
                  title="Aperçu Mobile"
                >
                  <DeviceMobile size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice("desktop")}
                  className={`p-1.5 rounded-md text-xs font-medium cursor-pointer transition ${
                    previewDevice === "desktop" ? "bg-background shadow text-foreground" : "text-muted-foreground"
                  }`}
                  title="Aperçu Ordinateur"
                >
                  <Desktop size={14} />
                </button>
              </div>
            </div>

            {/* Simulated Facebook Post Card */}
            <div className={`mx-auto transition-all duration-300 ${previewDevice === "mobile" ? "max-w-[340px]" : "w-full"}`}>
              <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden text-card-foreground">
                {/* Facebook Post Header */}
                <div className="p-3.5 flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    {selectedPage?.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={selectedPage.avatar_url}
                        alt=""
                        className="h-10 w-10 rounded-full object-cover border border-border"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-inner">
                        {selectedPage?.name ? selectedPage.name.charAt(0).toUpperCase() : "F"}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-sm leading-tight text-foreground hover:underline cursor-pointer">
                          {selectedPage?.name || "Votre Page Facebook"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <span>À l&apos;instant</span>
                        <span>·</span>
                        <GlobeHemisphereWest size={11} className="inline text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                  <button type="button" className="text-muted-foreground hover:text-foreground p-1">
                    <DotsThree size={20} weight="bold" />
                  </button>
                </div>

                {/* Facebook Caption Body */}
                <div className="px-3.5 pb-3 space-y-2">
                  <p className="text-sm font-semibold text-foreground leading-snug">
                    {content.title}
                  </p>
                  <p className="text-sm text-foreground/90 whitespace-pre-line leading-relaxed">
                    {content.description}
                  </p>
                  {content.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {content.hashtags.map((h) => (
                        <span key={h} className="text-xs text-blue-500 font-medium hover:underline cursor-pointer">
                          #{h}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Facebook Media View (Single or Carousel) */}
                {images.length > 0 && (
                  <div className="relative bg-black/5 aspect-square w-full overflow-hidden border-y border-border/50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={images[activeImageIndex]?.url || images[0].url}
                      alt=""
                      className="w-full h-full object-cover transition-all"
                    />

                    {/* Carousel navigation controls if multiple images */}
                    {images.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={() => setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
                          className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition"
                        >
                          <CaretLeft size={16} weight="bold" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition"
                        >
                          <CaretRight size={16} weight="bold" />
                        </button>
                        <span className="absolute top-2 right-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {activeImageIndex + 1}/{images.length}
                        </span>
                      </>
                    )}
                  </div>
                )}

                {/* Link Preview Card */}
                {linkUrl && (
                  <div className="p-3 bg-surface-2/60 border-b border-border flex items-center justify-between">
                    <div className="min-w-0 pr-2">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase truncate">
                        {linkUrl.replace(/^https?:\/\//, "").split("/")[0]}
                      </p>
                      <p className="text-xs font-semibold text-foreground truncate">{content.title}</p>
                    </div>
                    <span className="shrink-0 text-xs font-medium px-2.5 py-1 rounded bg-secondary text-secondary-foreground">
                      En savoir plus
                    </span>
                  </div>
                )}

                {/* Engagement Bar Simulation */}
                <div className="px-3.5 py-2 flex items-center justify-between text-xs text-muted-foreground border-b border-border/60">
                  <div className="flex items-center gap-1">
                    <span className="flex items-center justify-center h-4 w-4 rounded-full bg-blue-500 text-white text-[9px]">
                      👍
                    </span>
                    <span className="flex items-center justify-center h-4 w-4 rounded-full bg-red-500 text-white text-[9px] -ml-1.5">
                      ❤️
                    </span>
                    <span className="ml-1 text-[11px]">42</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span>8 commentaires</span>
                    <span>·</span>
                    <span>3 partages</span>
                  </div>
                </div>

                {/* Facebook Action Buttons */}
                <div className="px-2 py-1 flex items-center justify-around text-muted-foreground">
                  <button type="button" className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg hover:bg-surface-2 text-xs font-medium transition cursor-pointer">
                    <ThumbsUp size={16} /> J&apos;aime
                  </button>
                  <button type="button" className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg hover:bg-surface-2 text-xs font-medium transition cursor-pointer">
                    <ChatCircle size={16} /> Commenter
                  </button>
                  <button type="button" className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg hover:bg-surface-2 text-xs font-medium transition cursor-pointer">
                    <ShareFat size={16} /> Partager
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
