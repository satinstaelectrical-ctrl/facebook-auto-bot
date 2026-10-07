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
  FilmStrip,
  VideoCamera,
  Newspaper,
  Broadcast,
} from "@phosphor-icons/react/dist/ssr";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { MultiPagePicker } from "@/components/dashboard/multi-page-picker";
import { GroupDestinationPicker } from "@/components/dashboard/group-destination-picker";
import { MusicPickerModal } from "@/components/dashboard/music-picker-modal";
import { PostPreviewSwitcher } from "@/components/dashboard/post-preview-switcher";
import { VideoUploader } from "@/components/dashboard/video-uploader";
import { facebookPostUrl } from "@/lib/types";
import { MusicNotes } from "@phosphor-icons/react/dist/ssr";
import type {
  GeneratedContent,
  ImageSource,
  ImageSourcePref,
  PageCache,
  PostFormat,
  PageGroup,
  FacebookGroup,
  ReelMusicTrack,
} from "@/lib/types";

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
  const toast = useToast();
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("engaging");
  const [language, setLanguage] = useState("fr");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [ownTopics, setOwnTopics] = useState<string[]>([]);
  const [imagePref, setImagePref] = useState<ImageSourcePref>("ai");

  // Multiformat
  const [postFormat, setPostFormat] = useState<PostFormat>("feed");
  const [videoUrl, setVideoUrl] = useState("");

  const [step, setStep] = useState<Step>("idle");
  const [error, setError] = useState<string | null>(null);

  const [content, setContent] = useState<GeneratedContent | null>(null);
  const [images, setImages] = useState<Array<{ url: string; source: ImageSource }>>([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [hashtagInput, setHashtagInput] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  // Pages & Multi-Page Selection
  const [pages, setPages] = useState<PageCache[]>([]);
  const [selectedPageIds, setSelectedPageIds] = useState<string[]>([]);
  const [pageGroups, setPageGroups] = useState<PageGroup[]>([]);
  const [refreshingPages, setRefreshingPages] = useState(false);

  // Facebook Groups & Communities Cross-Posting
  const [groups, setGroups] = useState<FacebookGroup[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);

  // Reel Music Selection
  const [selectedMusic, setSelectedMusic] = useState<ReelMusicTrack | null>(null);
  const [musicModalOpen, setMusicModalOpen] = useState(false);

  const fetchGroups = async (pageId?: string) => {
    setLoadingGroups(true);
    try {
      const targetId = pageId || selectedPageIds[0] || "";
      const q = targetId ? `?pageId=${encodeURIComponent(targetId)}` : "";
      const res = await fetch(`/api/facebook/groups${q}`);
      if (res.ok) {
        const data = await res.json();
        setGroups(data.groups ?? []);
      }
    } catch (err) {
      console.warn("Failed to fetch groups:", err);
    } finally {
      setLoadingGroups(false);
    }
  };

  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [saving, setSaving] = useState<"draft" | "schedule" | "post_now" | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);

  const loadPages = async (forceRefresh = false) => {
    setRefreshingPages(true);
    try {
      const res = await fetch(`/api/facebook/pages${forceRefresh ? "?refresh=1" : ""}`);
      const data = await res.json();
      const fetched: PageCache[] = data.pages ?? [];
      setPages(fetched);

      let primaryId = "";
      if (data.defaultPageId && fetched.some((p) => p.page_id === data.defaultPageId)) {
        primaryId = data.defaultPageId;
        setSelectedPageIds([data.defaultPageId]);
      } else if (fetched.length === 1) {
        primaryId = fetched[0].page_id;
        setSelectedPageIds([fetched[0].page_id]);
      } else if (fetched.length > 0 && selectedPageIds.length === 0) {
        primaryId = fetched[0].page_id;
        setSelectedPageIds([fetched[0].page_id]);
      }

      if (primaryId) {
        fetchGroups(primaryId);
      }
    } catch (err) {
      console.error("Failed to load pages:", err);
    } finally {
      setRefreshingPages(false);
    }
  };

  useEffect(() => {
    if (selectedPageIds[0]) {
      fetchGroups(selectedPageIds[0]);
    }
  }, [selectedPageIds[0]]);

  const loadPageGroups = async () => {
    try {
      const res = await fetch("/api/automation/page-groups");
      const data = await res.json();
      if (data.groups) setPageGroups(data.groups);
    } catch {}
  };

  useEffect(() => {
    const fromLink = new URLSearchParams(window.location.search).get("topic");
    if (fromLink) setTopic(fromLink);

    try {
      const transferRaw = sessionStorage.getItem("fundoral_studio_transfer");
      if (transferRaw) {
        const transfer = JSON.parse(transferRaw);
        if (transfer && (transfer.description || transfer.title)) {
          if (transfer.topic) setTopic(transfer.topic);
          setContent({
            title: transfer.title || "Publication Studio",
            description: transfer.description || "",
            hashtags: Array.isArray(transfer.hashtags) ? transfer.hashtags : [],
          });
          setStep("ready");
          sessionStorage.removeItem("fundoral_studio_transfer");
        }
      }
    } catch {}

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
      .then((d) => {
        setImagePref(d.image_source ?? "ai");
        if (d.page_groups) setPageGroups(d.page_groups);
      })
      .catch(() => {});

    loadPages(false);
    loadPageGroups();
  }, []);

  const selectedPrimaryPage = useMemo(
    () => pages.find((p) => p.page_id === selectedPageIds[0]),
    [pages, selectedPageIds]
  );

  async function handleSaveGroup(name: string, pageIds: string[]) {
    try {
      const res = await fetch("/api/automation/page-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, pageIds }),
      });
      const data = await res.json();
      if (data.groups) {
        setPageGroups(data.groups);
        toast.success("Groupe de Pages créé !", `Groupe "${name}" enregistré avec succès.`);
      }
    } catch (err) {
      toast.error("Erreur lors de la création du groupe.", String(err));
    }
  }

  async function handleDeleteGroup(id: string) {
    try {
      const res = await fetch("/api/automation/page-groups", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.groups) {
        setPageGroups(data.groups);
        toast.info("Groupe de Pages supprimé.");
      }
    } catch (err) {
      toast.error("Erreur", String(err));
    }
  }

  async function generate() {
    if (topic.trim().length < 2) {
      toast.error("Veuillez saisir un sujet (au moins quelques mots).");
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
      toast.success("Publication générée par l'IA !");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Une erreur est survenue lors de la génération.";
      setError(msg);
      toast.error("Erreur de génération", msg);
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
      toast.success(`${newUrls.length} image(s) ajoutée(s) avec succès.`);
    } catch (err) {
      toast.error("Erreur lors de l'upload des images.", String(err));
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
    toast.info(`Modèle appliqué : ${tpl.name}`);
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
    if (!content || (images.length === 0 && !videoUrl)) return;
    if (selectedPageIds.length === 0) {
      toast.error("Veuillez choisir au moins une Page avant de planifier.");
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
    if (!content && !videoUrl && images.length === 0) return;
    if (action !== "draft" && selectedPageIds.length === 0) {
      toast.error("Veuillez choisir au moins une Page avant de publier.");
      return;
    }
    const scheduleIso = explicitScheduleIso || (scheduledAt ? new Date(scheduledAt).toISOString() : undefined);
    if (action === "schedule" && !scheduleIso) {
      toast.error("Sélectionnez une date et une heure de planification.");
      return;
    }

    const activeContent = content || {
      title: topic.trim() || "Nouvelle vidéo",
      description: topic.trim() || "",
      hashtags: [],
    };

    setError(null);
    setSaving(action);
    try {
      const mediaUrls = images.map((img) => img.url);
      const primaryImage = images[0] || {
        url: videoUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1080&auto=format&fit=crop&q=80",
        source: "upload" as const,
      };

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic || activeContent.title,
          title: activeContent.title,
          description: activeContent.description,
          hashtags: activeContent.hashtags,
          imageUrl: primaryImage.url,
          imageSource: primaryImage.source,
          mediaUrls,
          videoUrl: videoUrl || undefined,
          postFormat,
          linkUrl: linkUrl || undefined,
          pageId: selectedPageIds[0] || "unset",
          pageName: selectedPrimaryPage?.name ?? "Page Facebook",
          targetPageIds: selectedPageIds,
          targetGroupIds: selectedGroupIds,
          audioName: selectedMusic?.title || undefined,
          audioUrl: selectedMusic?.previewUrl || undefined,
          audioTrackId: selectedMusic?.id || undefined,
          action,
          scheduledAt: action === "schedule" ? scheduleIso : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Échec de l'enregistrement.");

      if (action === "post_now" && data.post?.status === "failed") {
        throw new Error(data.post.error_message ?? "Facebook a rejeté cette publication.");
      }

      let msg = "";
      if (action === "draft") {
        msg = "Enregistré comme brouillon avec succès.";
      } else if (action === "schedule") {
        msg =
          selectedGroupIds.length > 0
            ? `Publication planifiée pour la Page et ${selectedGroupIds.length} groupe(s) ! 📅`
            : "Publication planifiée dans la file d'attente.";
      } else {
        if (selectedGroupIds.length > 0) {
          msg = `Publié sur la Page officielle et partagé en direct dans ${selectedGroupIds.length} groupe(s) Facebook ! 🎉`;
        } else if (selectedPageIds.length > 1) {
          msg = `Publié avec succès sur ${selectedPageIds.length} pages Facebook 🎉`;
        } else {
          msg = "Publié sur Facebook avec succès 🎉";
        }
      }

      toast.success(msg);
      setSuccess(msg);
      setPublishedUrl(
        action === "post_now" && data.post?.facebook_post_id
          ? facebookPostUrl(data.post.facebook_post_id)
          : null
      );
      setStep("idle");
      setContent(null);
      setImages([]);
      setVideoUrl("");
      setSelectedMusic(null);
      setSelectedGroupIds([]);
      setTopic("");
      setScheduleOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur lors de l'enregistrement.";
      setError(msg);
      toast.error("Erreur", msg);
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* 1. Multiformat Selector Header */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-border bg-surface p-2.5 shadow-sm">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-2 flex items-center gap-1.5">
          <FilmStrip size={16} className="text-indigo-400" /> Format de diffusion Meta :
        </span>
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: "feed", label: "📰 Post Feed Classique", desc: "Post feed avec photo ou carrousel" },
            { id: "reel", label: "🎬 Reel Mobile 9:16", desc: "Format vertical court viral" },
            { id: "story", label: "📱 Story Éphémère", desc: "Story 24h plein écran" },
            { id: "video", label: "📹 Vidéo Standard", desc: "Vidéo paysage ou carrée" },
          ].map((fmt) => (
            <button
              key={fmt.id}
              type="button"
              onClick={() => setPostFormat(fmt.id as PostFormat)}
              className={`cursor-pointer rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                postFormat === fmt.id
                  ? "bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/30"
                  : "text-muted-foreground hover:bg-white/[0.05] hover:text-foreground"
              }`}
            >
              {fmt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Topic and Generation Controls Card */}
      <Card>
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <label className="text-sm font-semibold text-foreground">
              {postFormat === "reel"
                ? "Sujet du Reel Facebook (Vidéo courte 9:16)"
                : postFormat === "story"
                ? "Sujet de la Story Facebook"
                : "Sujet de la publication"}
            </label>
            <p className="text-xs text-muted-foreground">
              Décrivez votre idée ou sélectionnez un modèle marketing prédéfini.
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
            placeholder={
              postFormat === "reel"
                ? "Ex : 3 erreurs fatales en e-commerce à éviter absolument"
                : "Ex : 5 conseils pour aménager son salon avec style"
            }
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

          <Button onClick={generate} loading={step === "generating"}>
            <Sparkle size={16} weight="fill" />
            {step === "generating" ? "Génération…" : "Générer"}
          </Button>
        </div>

        {/* Local Video Uploader (Reels 9:16, Stories & Videos with drag & drop, browser preview and chunked upload) */}
        {(postFormat === "reel" || postFormat === "video" || postFormat === "story") && (
          <div className="mt-4 space-y-3">
            <VideoUploader
              videoUrl={videoUrl}
              postFormat={postFormat}
              onVideoSelected={(previewUrl, file) => {
                setVideoUrl(previewUrl);
                setImages([{ url: previewUrl, source: "upload" }]);
                if (!content) {
                  const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
                  setContent({
                    title: cleanName.charAt(0).toUpperCase() + cleanName.slice(1),
                    description: topic || `Découvrez cette vidéo ${postFormat === "reel" ? "Reel" : ""}. Donnez votre avis en commentaire !`,
                    hashtags: ["video", postFormat, "viral"],
                  });
                  setStep("ready");
                }
              }}
              onVideoUploaded={(url, file) => {
                setVideoUrl(url);
                setImages([{ url, source: "upload" }]);
                if (!content) {
                  const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
                  setContent({
                    title: cleanName.charAt(0).toUpperCase() + cleanName.slice(1),
                    description: topic || `Découvrez cette vidéo ${postFormat === "reel" ? "Reel" : ""}. Donnez votre avis en commentaire !`,
                    hashtags: ["video", postFormat, "viral"],
                  });
                  setStep("ready");
                }
              }}
              onVideoRemoved={() => {
                setVideoUrl("");
              }}
            />

            {/* Reel Sound & Music Picker shortcut */}
            {postFormat === "reel" && (
              <div className="flex items-center justify-between rounded-xl border border-indigo-500/20 bg-indigo-500/5 px-3.5 py-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
                    <MusicNotes size={18} weight="fill" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-foreground truncate">
                      {selectedMusic ? selectedMusic.title : "Musique de fond pour le Reel"}
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {selectedMusic
                        ? `${selectedMusic.artist} • ${selectedMusic.duration}`
                        : "Meta Sound Collection ou tendance virale"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {selectedMusic && (
                    <button
                      type="button"
                      onClick={() => setSelectedMusic(null)}
                      className="rounded-lg p-1 text-muted-foreground hover:bg-surface-2 hover:text-rose-400"
                      title="Retirer la musique"
                    >
                      <X size={14} />
                    </button>
                  )}
                  <Button
                    size="sm"
                    variant={selectedMusic ? "secondary" : "primary"}
                    onClick={() => setMusicModalOpen(true)}
                    className="h-8 text-xs px-3"
                  >
                    <MusicNotes size={13} className="mr-1" />
                    {selectedMusic ? "Changer la musique" : "Ajouter une musique"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

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

        {/* Topic suggestions */}
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-muted-foreground">Idées de sujets :</span>
          {(suggestions.length > 0 && suggestions.some((s) => /[a-z]/i.test(s)) ? suggestions : [
            "Conseils pratiques et astuces d'experts",
            "Nouveauté et lancement de produit",
            "Offre promotionnelle exclusive",
            "Témoignage et retour client",
            "Coulisses de notre savoir-faire",
          ]).slice(0, 6).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setTopic(s)}
              className="cursor-pointer rounded-full border border-border bg-surface-2 px-2.5 py-0.5 text-xs text-foreground transition hover:border-[#6366F1] hover:text-[#4338CA] dark:hover:text-[#818CF8]"
            >
              {s}
            </button>
          ))}
        </div>
      </Card>

      {/* Success banner */}
      {success && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-sm text-emerald-400">
          <div className="flex items-center gap-2">
            <CheckCircle size={18} weight="fill" />
            <span>{success}</span>
          </div>
          {publishedUrl && (
            <a
              href={publishedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs font-semibold underline hover:text-emerald-300"
            >
              Voir sur Facebook <ArrowSquareOut size={13} />
            </a>
          )}
        </div>
      )}

      {/* Editor & Live Preview Grid */}
      {content && (
        <div className="grid gap-6 lg:grid-cols-12 items-start">
          {/* Left Column: Post Editor & Multi-Page Configuration (7 cols) */}
          <div className="space-y-6 lg:col-span-7">
            <Card className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Accroche / Titre</label>
                <input
                  value={content.title}
                  onChange={(e) => setContent({ ...content, title: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm font-semibold text-foreground outline-none focus:border-primary"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-muted-foreground">Corps du texte</label>
                  <div className="flex items-center gap-1">
                    {EMOJI_PALETTE.map((em) => (
                      <button
                        key={em}
                        type="button"
                        onClick={() => insertEmoji(em)}
                        className="cursor-pointer text-xs hover:scale-125 transition"
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  rows={5}
                  value={content.description}
                  onChange={(e) => setContent({ ...content, description: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm leading-relaxed text-foreground outline-none focus:border-primary"
                />
              </div>

              {/* Hashtags */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Hashtags viraux</label>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  {content.hashtags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                    >
                      #{tag}
                      <button onClick={() => removeHashtag(tag)} className="cursor-pointer">
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
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Lien vers le site web (optionnel)</label>
                <input
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://monsite.com/article-ou-produit"
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {/* Media Management (Multi-Media & Carousels) */}
              <div className="border-t border-border pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">
                      Visuels de la publication ({images.length})
                    </label>
                    <p className="text-[11px] text-muted-foreground">
                      Carrousels multi-images et photos personnalisées.
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

                {images.length > 0 && (
                  <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-2">
                    {images.map((img, i) => (
                      <div
                        key={img.url}
                        onClick={() => setActiveImageIndex(i)}
                        className={`relative h-16 w-16 shrink-0 cursor-pointer overflow-hidden rounded-xl border-2 transition ${
                          activeImageIndex === i ? "border-primary ring-2 ring-primary/30" : "border-border"
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.url} alt="" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImage(i);
                          }}
                          className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-black/70 text-white"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Multi-Pages Facebook Destination Picker */}
              <div className="border-t border-border pt-4">
                <MultiPagePicker
                  pages={pages}
                  selectedPageIds={selectedPageIds}
                  onChange={setSelectedPageIds}
                  pageGroups={pageGroups}
                  onSaveGroup={handleSaveGroup}
                  onDeleteGroup={handleDeleteGroup}
                />
              </div>

              {/* Facebook Groups & Communities Cross-Posting Picker */}
              <div className="border-t border-border pt-4">
                <GroupDestinationPicker
                  groups={groups}
                  selectedGroupIds={selectedGroupIds}
                  onChange={setSelectedGroupIds}
                  loading={loadingGroups}
                  onRefresh={() => fetchGroups(selectedPageIds[0])}
                  pageName={selectedPrimaryPage?.name}
                  pageId={selectedPageIds[0]}
                />
              </div>

              {/* Scheduling Slot Option */}
              {scheduleOpen && (
                <div className="rounded-xl border border-border bg-surface-2 p-3.5 space-y-2">
                  <label className="text-xs font-semibold text-foreground">Date et heure de diffusion</label>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
              )}

              {/* Action Buttons Bar */}
              <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-border">
                <Button variant="secondary" onClick={() => save("draft")} disabled={saving !== null}>
                  <FloppyDisk size={16} /> Brouillon
                </Button>

                <Button
                  variant="secondary"
                  onClick={scheduleAutoQueue}
                  disabled={saving !== null || selectedPageIds.length === 0}
                  title="Planifie automatiquement sur le prochain créneau de pointe configuré"
                >
                  <Lightning size={16} className="text-amber-500" weight="fill" /> File auto
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

                <Button
                  variant="emerald"
                  onClick={() => save("post_now")}
                  loading={saving === "post_now"}
                  disabled={saving !== null || selectedPageIds.length === 0}
                >
                  <Rocket size={16} weight="fill" />
                  {saving === "post_now"
                    ? "Publication en cours…"
                    : selectedPageIds.length > 1
                    ? `Publier sur les ${selectedPageIds.length} pages`
                    : "Publier maintenant"}
                </Button>
              </div>
            </Card>
          </div>

          {/* Right Column: Dynamic Post Preview Switcher (5 cols) */}
          <div className="space-y-3 lg:col-span-5">
            <PostPreviewSwitcher
              format={postFormat}
              title={content.title}
              description={content.description}
              hashtags={content.hashtags}
              linkUrl={linkUrl}
              images={images}
              activeImageIndex={activeImageIndex}
              setActiveImageIndex={setActiveImageIndex}
              videoUrl={videoUrl}
              selectedPage={selectedPrimaryPage}
              selectedMusic={selectedMusic}
              onOpenMusicPicker={() => setMusicModalOpen(true)}
            />
          </div>
        </div>
      )}

      {/* Music Picker Modal for Facebook Reels */}
      <MusicPickerModal
        open={musicModalOpen}
        onClose={() => setMusicModalOpen(false)}
        selectedTrack={selectedMusic}
        onSelectTrack={(track) => setSelectedMusic(track)}
        pageId={selectedPageIds[0]}
      />
    </div>
  );
}
