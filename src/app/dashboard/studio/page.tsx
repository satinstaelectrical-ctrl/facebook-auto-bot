"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkle,
  Lightbulb,
  Newspaper,
  ShoppingBag,
  FilmStrip,
  Copy,
  Check,
  FloppyDisk,
  ArrowRight,
  ArrowsClockwise,
  ShareNetwork,
  WhatsappLogo,
  FacebookLogo,
  CaretDown,
  CaretUp,
  Warning,
  Info,
  SlidersHorizontal,
  CheckSquare,
  Square,
  ArrowSquareOut,
  Tag,
  ChatCircleDots,
} from "@phosphor-icons/react/dist/ssr";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VideoUploader } from "@/components/dashboard/video-uploader";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";

type StudioMode = "idea" | "article" | "product" | "reel";
type SectorId = "ecommerce" | "immobilier" | "services" | "restaurant" | "evenement" | "beaute";
type ToneId = "vendeur" | "professionnel" | "premium" | "humoristique";
type ReelGoal = "conversion" | "viral" | "educational";
type ReelDuration = "15s" | "30s" | "60s";

interface ReelScene {
  time: string;
  visual: string;
  voiceover: string;
  onScreenText?: string;
}

interface ReelScriptOutput {
  hook: string;
  scenes: ReelScene[];
  musicSuggestion: string;
  caption: string;
}

const SECTORS: { id: SectorId; label: string; icon: string }[] = [
  { id: "ecommerce", label: "E-Commerce & Vente", icon: "🛍" },
  { id: "immobilier", label: "Immobilier & Logement", icon: "🏠" },
  { id: "services", label: "Services B2B & Pro", icon: "💼" },
  { id: "restaurant", label: "Restaurant & Gastronomie", icon: "🍽" },
  { id: "evenement", label: "Événements & Soirées", icon: "🎟" },
  { id: "beaute", label: "Beauté & Bien-être", icon: "✨" },
];

const TONES: { id: ToneId; label: string; desc: string }[] = [
  { id: "vendeur", label: "Vendeur & Conversion", desc: "Urgence, promotion et appel à l'action direct" },
  { id: "professionnel", label: "Professionnel & Sérieux", desc: "Crédible, rassurant et expert" },
  { id: "premium", label: "Luxe & Haut de Gamme", desc: "Élégant, prestigieux et exclusif" },
  { id: "humoristique", label: "Humoristique & Viral", desc: "Décontracté, complice avec émojis percutants" },
];

const SECTOR_EXAMPLES: Record<SectorId, { idea: string; product: string; reel: string }> = {
  ecommerce: {
    idea: "Offre flash de rentrée : -25% sur notre sac à dos urbain étanche avec le code RENTREE25, livraison offerte dès 50 €.",
    product: "Sac à dos imperméable urbain 20L avec compartiment PC 15 pouces et poches antivol cachées.",
    reel: "3 astuces pour organiser son sac de travail sans l'alourdir.",
  },
  immobilier: {
    idea: "Exclusivité Bastos : Villa contemporaine 5 pièces avec piscine, jardin paysager et vue dégagée.",
    product: "Appartement standing 3 chambres, cuisine équipée, terrasse 20m², parking sécurisé sous-sol.",
    reel: "Visite express en 30 secondes d'un penthouse coup de cœur.",
  },
  services: {
    idea: "Comment automatiser vos devis et relances clients pour gagner 5 heures par semaine avec l'IA.",
    product: "Audit de productivité digitale pour PME : diagnostic complet de vos processus en 48h.",
    reel: "L'erreur fatale commise par 80% des prestataires dans leur tarification.",
  },
  restaurant: {
    idea: "Nouveau menu de saison : venez déguster notre risotto crémeux aux morilles et notre tiramisu artisanal.",
    product: "Formule Brunch dominical à volonté avec viennoiseries maison et jus détox pressés à froid.",
    reel: "Dans les coulisses de notre cuisine : dressage de notre dessert signature.",
  },
  evenement: {
    idea: "Grande soirée networking jeudi prochain : 50 entrepreneurs et investisseurs réunis pour échanger.",
    product: "Pass VIP Early Bird : accès coupe-file prioritaire + cocktail dînatoire privé.",
    reel: "Ce qui vous attend lors de l'édition Fundoral Networking 2026.",
  },
  beaute: {
    idea: "Routine éclat du matin : 3 gestes essentiels pour réveiller et protéger votre peau en 5 minutes.",
    product: "Sérum régénérant bio à l'acide hyaluronique pur et aux extraits de rose musquée.",
    reel: "Avant / Après : comment appliquer votre sérum pour un résultat optimal.",
  },
};

export default function AIStudioPage() {
  const router = useRouter();
  const toast = useToast();
  const resultsRef = useRef<HTMLDivElement>(null);

  // Active Creation Mode
  const [mode, setMode] = useState<StudioMode>("idea");

  // Per-Mode Input Fields (preserved when switching modes)
  const [ideaPrompt, setIdeaPrompt] = useState("");

  const [articleUrl, setArticleUrl] = useState("");
  const [articleText, setArticleText] = useState("");
  const [articleLoading, setArticleLoading] = useState(false);
  const [articleDetectedTitle, setArticleDetectedTitle] = useState("");
  const [articleError, setArticleError] = useState<string | null>(null);

  const [productUrl, setProductUrl] = useState("");
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productFeatures, setProductFeatures] = useState("");

  const [reelTopic, setReelTopic] = useState("");
  const [reelGoal, setReelGoal] = useState<ReelGoal>("conversion");
  const [reelDuration, setReelDuration] = useState<ReelDuration>("30s");
  const [reelVideoUrl, setReelVideoUrl] = useState("");

  // Style and Brand Settings
  const [sector, setSector] = useState<SectorId>("ecommerce");
  const [tone, setTone] = useState<ToneId>("vendeur");
  const [brandName, setBrandName] = useState("");
  const [brandSignature, setBrandSignature] = useState("");
  const [brandHashtags, setBrandHashtags] = useState("");
  const [showAdvancedBrand, setShowAdvancedBrand] = useState(false);

  // Target Formats to Generate
  const [destinations, setDestinations] = useState({
    facebook: true,
    whatsapp: true,
    reel: true,
  });

  // Generation & Results State
  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [aiProviderUsed, setAiProviderUsed] = useState<string | null>(null);

  const [outputFb, setOutputFb] = useState<string | null>(null);
  const [outputWa, setOutputWa] = useState<string | null>(null);
  const [outputReel, setOutputReel] = useState<ReelScriptOutput | null>(null);
  const [outputHashtags, setOutputHashtags] = useState<string[]>([]);

  const [activeTab, setActiveTab] = useState<"facebook" | "whatsapp" | "reel">("facebook");
  const [isModified, setIsModified] = useState({ facebook: false, whatsapp: false, reel: false });
  const [copiedTab, setCopiedTab] = useState<string | null>(null);
  const [savingDraft, setSavingDraft] = useState(false);

  // Default Facebook page from settings
  const [defaultPageId, setDefaultPageId] = useState<string | null>(null);
  const [defaultPageName, setDefaultPageName] = useState<string | null>(null);

  // Prefill brand settings on mount
  useEffect(() => {
    fetch("/api/settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          if (data.brand_name) setBrandName(data.brand_name);
          if (data.brand_signature) setBrandSignature(data.brand_signature);
          if (data.brand_hashtags) setBrandHashtags(data.brand_hashtags);
          if (data.default_page_id) setDefaultPageId(data.default_page_id);
          if (data.default_page_name) setDefaultPageName(data.default_page_name);
          if (data.brand_tone && ["vendeur", "professionnel", "premium", "humoristique"].includes(data.brand_tone)) {
            setTone(data.brand_tone as ToneId);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Inspect / Extract Article URL
  async function handleAnalyzeArticle() {
    if (!articleUrl.trim()) {
      setArticleError("Veuillez d'abord saisir l'URL de l'article.");
      return;
    }
    setArticleLoading(true);
    setArticleError(null);
    try {
      const res = await fetch("/api/automation/analyze-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: articleUrl.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.reachable) {
        if (data.samplePost?.title) {
          setArticleDetectedTitle(data.samplePost.title);
          if (data.samplePost.excerpt) {
            setArticleText(data.samplePost.excerpt);
          }
        } else {
          setArticleDetectedTitle(data.siteTitle || "Article extrait");
        }
      } else {
        setArticleError(
          "Impossible d'extraire automatiquement le contenu de cette URL. Vous pouvez coller le texte ou le résumé directement ci-dessous."
        );
      }
    } catch {
      setArticleError(
        "Connexion au site impossible. Veuillez coller le texte de votre article ci-dessous."
      );
    } finally {
      setArticleLoading(false);
    }
  }

  // Unified Generation Handler
  async function handleGenerate() {
    setGenerationError(null);

    // Validation per mode
    let subjectTopic = "";
    if (mode === "idea") {
      if (!ideaPrompt.trim()) {
        setGenerationError("Veuillez décrire le sujet ou l'idée de votre publication.");
        return;
      }
      subjectTopic = ideaPrompt.trim();
    } else if (mode === "article") {
      if (!articleUrl.trim() && !articleText.trim()) {
        setGenerationError("Veuillez renseigner le lien de l'article ou coller son texte.");
        return;
      }
      subjectTopic = `${articleDetectedTitle || "Article"} : ${articleText ? articleText.slice(0, 250) : articleUrl}`;
    } else if (mode === "product") {
      if (!productName.trim()) {
        setGenerationError("Veuillez indiquer le nom ou titre du produit.");
        return;
      }
      subjectTopic = `Produit : ${productName.trim()}${
        productPrice ? ` | Prix : ${productPrice.trim()}` : ""
      }${productFeatures ? ` | Points clés : ${productFeatures.trim()}` : ""}`;
    } else if (mode === "reel") {
      if (!reelTopic.trim()) {
        setGenerationError("Veuillez renseigner le sujet ou l'angle de votre Reel.");
        return;
      }
      subjectTopic = `Script Reel (${reelDuration}, objectif ${reelGoal}) : ${reelTopic.trim()}`;
    }

    // Check if at least one format is selected
    if (!destinations.facebook && !destinations.whatsapp && !destinations.reel) {
      setGenerationError("Veuillez sélectionner au moins un format de destination (Facebook, WhatsApp ou Reel).");
      return;
    }

    setGenerating(true);

    try {
      // Call AI generation backend
      const res = await fetch("/api/generate/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: subjectTopic,
          tone: tone === "vendeur" ? "promotional" : tone === "professionnel" ? "professional" : "engaging",
          language: "fr",
        }),
      });

      const data = await res.json();
      setAiProviderUsed(data.provider || "ai");

      const title = data.title || (mode === "product" ? productName : "Publication exclusive");
      const desc = data.description || "Découvrez notre sélection conçue pour vous apporter entière satisfaction.";
      const rawTags = (data.hashtags || [sector, "business", "tendance"]).map(
        (t: string) => `#${t.replace(/^#/, "")}`
      );
      const customBrandTags = brandHashtags
        ? brandHashtags
            .split(/\s+/)
            .filter((t) => t.startsWith("#"))
        : [];
      const combinedTags = Array.from(new Set([...rawTags, ...customBrandTags]));
      setOutputHashtags(combinedTags);

      const signatureText = brandSignature.trim() ? `\n\n${brandSignature.trim()}` : "";

      // 1. Facebook Post Adaptation
      if (destinations.facebook) {
        let fbCopy = "";
        if (mode === "product") {
          fbCopy = `✨ ${title.toUpperCase()}\n\n${desc}\n\n`;
          if (productPrice) fbCopy += `🏷️ Tarif : ${productPrice}\n`;
          if (productFeatures) fbCopy += `🔍 Caractéristiques : ${productFeatures}\n`;
          fbCopy += `\n👉 Commandez dès maintenant ou contactez-nous en privé !${signatureText}\n\n${combinedTags.join(" ")}`;
        } else if (mode === "article") {
          fbCopy = `📰 ${title}\n\n${desc}\n\n📖 Retrouvez l'intégralité de l'article ici : ${articleUrl || "lien en bio"}${signatureText}\n\n${combinedTags.join(" ")}`;
        } else {
          fbCopy = `🚀 ${title}\n\n${desc}\n\n💬 Donnez-nous votre avis en commentaire ou écrivez-nous directement !${signatureText}\n\n${combinedTags.join(" ")}`;
        }
        setOutputFb(fbCopy);
      }

      // 2. WhatsApp Direct Message Adaptation
      if (destinations.whatsapp) {
        let waCopy = `*${title}* 📲\n\n${desc}\n\n`;
        if (mode === "product") {
          if (productPrice) waCopy += `💰 *Prix :* ${productPrice}\n`;
          if (productFeatures) waCopy += `⭐ *Détails :* ${productFeatures}\n`;
          waCopy += `\n📦 *Pour commander ou réserver immédiatement :*\nRépondez directement à ce message !`;
        } else if (mode === "article") {
          waCopy += `🔗 *Lien complet :* ${articleUrl || "Disponible sur demande"}\n\nBesoin d'en savoir plus ? Répondez à ce message !`;
        } else {
          waCopy += `✅ Disponible dès maintenant.\n📲 Répondez à ce message pour plus d'informations ou une commande directe.`;
        }
        if (brandSignature.trim()) {
          waCopy += `\n\n_${brandSignature.trim()}_`;
        }
        setOutputWa(waCopy);
      }

      // 3. Reel / TikTok Script Adaptation
      if (destinations.reel) {
        const hookText =
          mode === "product"
            ? `Stop ! Ne dépensez plus un centime avant de voir ceci pour votre ${sector === "immobilier" ? "logement" : "quotidien"} 🛑`
            : mode === "article"
            ? `Le secret que personne ne vous dit à propos de ${title.slice(0, 35)} 🤫`
            : `Pourquoi vous devez absolument connaître cette astuce aujourd'hui 💡`;

        const durationSeconds = reelDuration === "15s" ? "15s" : reelDuration === "60s" ? "60s" : "30s";

        setOutputReel({
          hook: hookText,
          scenes: [
            {
              time: "0:00 - 0:03",
              visual: "Plan serré et dynamique avec texte accrocheur en haut de l'écran",
              voiceover: hookText,
              onScreenText: "ATTENDEZ ! 🛑",
            },
            {
              time: reelDuration === "15s" ? "0:03 - 0:10" : "0:03 - 0:15",
              visual: mode === "product" ? "Présentation produit en gros plan avec manipulation active" : "Démonstration du problème et révélation de la solution",
              voiceover: `Voici ce qui change absolument tout : ${desc.slice(0, 100)}...`,
              onScreenText: mode === "product" && productPrice ? `Offre spéciale : ${productPrice}` : "Ce qui change tout ✨",
            },
            {
              time: reelDuration === "15s" ? "0:10 - 0:15" : "0:15 - 0:30",
              visual: "Appel à l'action percutant avec flèche pointant vers le lien ou bouton message",
              voiceover: "Cliquez sur le lien en bio ou envoyez-nous un message privé avant épuisement !",
              onScreenText: "Lien en bio / Écrivez-nous 📲",
            },
          ],
          musicSuggestion: "Rythme entraînant Lo-Fi / Synthwave moderne (120-128 BPM)",
          caption: `${title} 🚀 Tous les détails en lien en bio ! ${combinedTags.slice(0, 4).join(" ")}`,
        });
      }

      // Reset modification flags for new generation
      setIsModified({ facebook: false, whatsapp: false, reel: false });

      // Set active tab to first generated format
      if (destinations.facebook) setActiveTab("facebook");
      else if (destinations.whatsapp) setActiveTab("whatsapp");
      else if (destinations.reel) setActiveTab("reel");

      // Smooth scroll on mobile to results
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);

      toast.success("Contenus générés !", "Vos publications sont prêtes à être éditées ou partagées.");
    } catch {
      // Deterministic graceful fallback
      const fallbackTitle =
        mode === "product"
          ? productName
          : mode === "article"
          ? articleDetectedTitle || "Offre Spéciale"
          : ideaPrompt.slice(0, 40) || "Offre Spéciale";

      setOutputFb(
        `🚀 ${fallbackTitle.toUpperCase()}\n\nDécouvrez notre sélection exclusive conçue pour vous apporter les meilleurs résultats.\n\n👉 Contactez-nous dès aujourd'hui pour en savoir plus !\n\n#${sector} #innovation #exclusif`
      );
      setOutputWa(
        `*${fallbackTitle}* 📦\n\nDisponible immédiatement. Répondez directement à ce message pour profiter de notre offre !`
      );
      setOutputReel({
        hook: `Vous cherchez une solution fiable ? Ne ratez pas ceci 🛑`,
        scenes: [
          { time: "0:00 - 0:03", visual: "Plan serré accrocheur", voiceover: "Vous cherchez une solution fiable ?" },
          { time: "0:03 - 0:15", visual: "Démonstration concrète", voiceover: "Voici exactement comment obtenir le meilleur résultat." },
          { time: "0:15 - 0:30", visual: "Appel à l'action", voiceover: "Écrivez-nous ou cliquez sur le lien en bio !" },
        ],
        musicSuggestion: "Beat moderne et dynamique",
        caption: `${fallbackTitle} — Découvrez tous les détails ! #${sector}`,
      });
      setIsModified({ facebook: false, whatsapp: false, reel: false });
      setAiProviderUsed("template");
      toast.info("Génération effectuée", "Généré via le modèle de secours suite à un délai de l'API IA.");
    } finally {
      setGenerating(false);
    }
  }

  // Copy helper
  function handleCopy(text: string, tab: string) {
    navigator.clipboard.writeText(text);
    setCopiedTab(tab);
    toast.success("Copié !", "Le texte a été copié dans votre presse-papiers.");
    setTimeout(() => setCopiedTab(null), 2500);
  }

  // Save Draft to Database
  async function handleSaveDraft() {
    if (!outputFb && !outputWa && !outputReel) {
      toast.error("Aucun contenu à enregistrer", "Veuillez d'abord générer une publication.");
      return;
    }

    setSavingDraft(true);
    try {
      const topicText =
        mode === "product"
          ? `Produit: ${productName}`
          : mode === "article"
          ? `Article: ${articleDetectedTitle || articleUrl}`
          : ideaPrompt.slice(0, 80) || "Studio Draft";

      const titleText =
        mode === "product"
          ? productName
          : mode === "article"
          ? articleDetectedTitle || "Article de Blog"
          : ideaPrompt.slice(0, 60) || "Publication Studio";

      const descriptionText = outputFb || outputWa || (outputReel ? outputReel.caption : "");

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topicText,
          title: titleText,
          description: descriptionText,
          hashtags: outputHashtags.length > 0 ? outputHashtags.map((h) => h.replace(/^#/, "")) : [sector],
          imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200",
          imageSource: "stock",
          videoUrl: reelVideoUrl || undefined,
          postFormat: activeTab === "reel" ? "reel" : "feed",
          pageId: defaultPageId || "1",
          pageName: defaultPageName || "Page Principale",
          action: "draft",
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Échec de l'enregistrement.");
      }

      toast.success(
        "Brouillon sauvegardé !",
        "Votre publication a été ajoutée à vos brouillons dans l'historique."
      );
    } catch (err) {
      toast.error("Erreur de sauvegarde", err instanceof Error ? err.message : "Impossible de sauvegarder le brouillon.");
    } finally {
      setSavingDraft(false);
    }
  }

  // Transfer Content to Direct Publisher / Scheduler
  function handleTransferToPublisher() {
    if (!outputFb && !outputWa && !outputReel) return;

    const topicText =
      mode === "product"
        ? productName
        : mode === "article"
        ? articleDetectedTitle || articleUrl
        : ideaPrompt.slice(0, 80) || "Publication";

    const titleText =
      mode === "product"
        ? productName
        : mode === "article"
        ? articleDetectedTitle || "Article"
        : ideaPrompt.slice(0, 60) || "Publication Studio";

    const payload = {
      topic: topicText,
      title: titleText,
      description: activeTab === "whatsapp" && outputWa ? outputWa : outputFb || (outputReel ? outputReel.caption : ""),
      hashtags: outputHashtags.map((h) => h.replace(/^#/, "")),
    };

    try {
      sessionStorage.setItem("fundoral_studio_transfer", JSON.stringify(payload));
    } catch {}

    toast.success("Contenu transféré", "Ouverture du programmateur de publication...");
    router.push("/dashboard/generate");
  }

  // Regenerate only current active tab
  async function handleRegenerateCurrentTab() {
    if (isModified[activeTab]) {
      const confirmOverwrite = window.confirm(
        "Vous avez modifié manuellement ce texte. Voulez-vous vraiment le régénérer et écraser vos modifications ?"
      );
      if (!confirmOverwrite) return;
    }
    await handleGenerate();
  }

  // Current example text
  const currentExample = SECTOR_EXAMPLES[sector];

  return (
    <div className="space-y-6">
      {/* Studio Header: Sober, Clean, Non-redundant */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-[#E0E7FF] dark:bg-[#312E81] px-2.5 py-0.5 text-xs font-bold text-[#312E81] dark:text-[#E0E7FF]">
              <Sparkle size={13} weight="fill" />
              Studio de Rédaction Multi-Canaux
            </span>
            {aiProviderUsed && (
              <span className="text-[11px] font-mono text-muted-foreground">
                Moteur : {aiProviderUsed}
              </span>
            )}
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Créez et adaptez vos publications pour Facebook, WhatsApp et vos scripts de Reels à partir d&apos;une idée, d&apos;un article ou d&apos;un produit.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link href="/dashboard/generate">
            <Button variant="secondary" size="sm" className="gap-1.5 font-medium">
              <ShareNetwork size={15} />
              <span>Publication directe</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Creation Modes: High Contrast & Readability */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Mode 1: Idea */}
        <button
          type="button"
          onClick={() => setMode("idea")}
          className={cn(
            "flex items-start gap-3 rounded-xl border p-3.5 text-left transition-all",
            mode === "idea"
              ? "border-[#6366F1] bg-[#E0E7FF] text-[#312E81] dark:border-[#818CF8] dark:bg-[#312E81] dark:text-[#E0E7FF] font-semibold shadow-sm ring-1 ring-[#6366F1]/30 dark:ring-[#818CF8]/40"
              : "border-border bg-surface text-muted-foreground hover:bg-surface-2 hover:text-foreground"
          )}
        >
          <div
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg shrink-0 mt-0.5",
              mode === "idea"
                ? "bg-[#4338CA] text-white"
                : "bg-surface-2 text-foreground border border-border"
            )}
          >
            <Lightbulb size={20} weight={mode === "idea" ? "fill" : "regular"} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold truncate">À partir d&apos;une idée</p>
            <p
              className={cn(
                "text-[11px] mt-0.5",
                mode === "idea" ? "text-[#312E81]/80 dark:text-[#E0E7FF]/80" : "text-muted-foreground"
              )}
            >
              Sujet libre ou description
            </p>
          </div>
        </button>

        {/* Mode 2: Article */}
        <button
          type="button"
          onClick={() => setMode("article")}
          className={cn(
            "flex items-start gap-3 rounded-xl border p-3.5 text-left transition-all",
            mode === "article"
              ? "border-[#6366F1] bg-[#E0E7FF] text-[#312E81] dark:border-[#818CF8] dark:bg-[#312E81] dark:text-[#E0E7FF] font-semibold shadow-sm ring-1 ring-[#6366F1]/30 dark:ring-[#818CF8]/40"
              : "border-border bg-surface text-muted-foreground hover:bg-surface-2 hover:text-foreground"
          )}
        >
          <div
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg shrink-0 mt-0.5",
              mode === "article"
                ? "bg-[#4338CA] text-white"
                : "bg-surface-2 text-foreground border border-border"
            )}
          >
            <Newspaper size={20} weight={mode === "article" ? "fill" : "regular"} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold truncate">Depuis un article</p>
            <p
              className={cn(
                "text-[11px] mt-0.5",
                mode === "article" ? "text-[#312E81]/80 dark:text-[#E0E7FF]/80" : "text-muted-foreground"
              )}
            >
              URL web ou texte collé
            </p>
          </div>
        </button>

        {/* Mode 3: Product */}
        <button
          type="button"
          onClick={() => setMode("product")}
          className={cn(
            "flex items-start gap-3 rounded-xl border p-3.5 text-left transition-all",
            mode === "product"
              ? "border-[#6366F1] bg-[#E0E7FF] text-[#312E81] dark:border-[#818CF8] dark:bg-[#312E81] dark:text-[#E0E7FF] font-semibold shadow-sm ring-1 ring-[#6366F1]/30 dark:ring-[#818CF8]/40"
              : "border-border bg-surface text-muted-foreground hover:bg-surface-2 hover:text-foreground"
          )}
        >
          <div
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg shrink-0 mt-0.5",
              mode === "product"
                ? "bg-[#4338CA] text-white"
                : "bg-surface-2 text-foreground border border-border"
            )}
          >
            <ShoppingBag size={20} weight={mode === "product" ? "fill" : "regular"} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold truncate">Depuis un produit</p>
            <p
              className={cn(
                "text-[11px] mt-0.5",
                mode === "product" ? "text-[#312E81]/80 dark:text-[#E0E7FF]/80" : "text-muted-foreground"
              )}
            >
              Lien ou fiche produit réelle
            </p>
          </div>
        </button>

        {/* Mode 4: Reel Script */}
        <button
          type="button"
          onClick={() => setMode("reel")}
          className={cn(
            "flex items-start gap-3 rounded-xl border p-3.5 text-left transition-all",
            mode === "reel"
              ? "border-[#6366F1] bg-[#E0E7FF] text-[#312E81] dark:border-[#818CF8] dark:bg-[#312E81] dark:text-[#E0E7FF] font-semibold shadow-sm ring-1 ring-[#6366F1]/30 dark:ring-[#818CF8]/40"
              : "border-border bg-surface text-muted-foreground hover:bg-surface-2 hover:text-foreground"
          )}
        >
          <div
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg shrink-0 mt-0.5",
              mode === "reel"
                ? "bg-[#4338CA] text-white"
                : "bg-surface-2 text-foreground border border-border"
            )}
          >
            <FilmStrip size={20} weight={mode === "reel" ? "fill" : "regular"} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold truncate">Script de Reel</p>
            <p
              className={cn(
                "text-[11px] mt-0.5",
                mode === "reel" ? "text-[#312E81]/80 dark:text-[#E0E7FF]/80" : "text-muted-foreground"
              )}
            >
              Storyboard &amp; scènes 9:16
            </p>
          </div>
        </button>
      </div>

      {/* Main Studio Grid: Configuration (380px-440px) vs Workspace */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Left Column: Input Form (5 cols / ~420px) */}
        <div className="space-y-4 lg:col-span-5">
          <Card className="space-y-5">
            {/* Section 1: Source Content Fields (Adapted to Mode) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                  1. Source du contenu
                </label>
                <span className="text-[11px] text-muted-foreground font-medium">
                  {mode === "idea" && "Description libre"}
                  {mode === "article" && "Lien ou texte"}
                  {mode === "product" && "Données réelles"}
                  {mode === "reel" && "Angle & Scènes"}
                </span>
              </div>

              {/* Mode: Idea Form */}
              {mode === "idea" && (
                <div className="space-y-2">
                  <textarea
                    value={ideaPrompt}
                    onChange={(e) => {
                      setIdeaPrompt(e.target.value);
                      if (generationError) setGenerationError(null);
                    }}
                    rows={4}
                    placeholder={`Exemple pour ${SECTORS.find((s) => s.id === sector)?.label} :\n${currentExample.idea}`}
                    className="w-full rounded-xl border border-border bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none transition focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1]"
                  />
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Suggéré pour votre secteur :</span>
                    <button
                      type="button"
                      onClick={() => setIdeaPrompt(currentExample.idea)}
                      className="text-[#4338CA] dark:text-[#818CF8] hover:underline font-medium"
                    >
                      Utiliser l&apos;exemple
                    </button>
                  </div>
                </div>
              )}

              {/* Mode: Article Form */}
              {mode === "article" && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-muted-foreground">
                      URL de l&apos;article ou du billet de blog :
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={articleUrl}
                        onChange={(e) => {
                          setArticleUrl(e.target.value);
                          if (generationError) setGenerationError(null);
                        }}
                        placeholder="https://monsite.com/blog/titre-article"
                        className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none transition focus:border-[#6366F1]"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={handleAnalyzeArticle}
                        disabled={articleLoading || !articleUrl.trim()}
                        className="shrink-0 text-xs"
                      >
                        {articleLoading ? (
                          <ArrowsClockwise size={14} className="animate-spin" />
                        ) : (
                          "Extraire"
                        )}
                      </Button>
                    </div>
                  </div>

                  {articleDetectedTitle && (
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-2">
                      <Check size={16} className="mt-0.5 shrink-0" />
                      <div>
                        <strong className="block font-semibold">Titre extrait :</strong>
                        <span>{articleDetectedTitle}</span>
                      </div>
                    </div>
                  )}

                  {articleError && (
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
                      <Info size={16} className="mt-0.5 shrink-0" />
                      <span>{articleError}</span>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold text-muted-foreground">
                        Texte ou résumé de l&apos;article (collé ou extrait) :
                      </label>
                      <span className="text-[10px] text-muted-foreground">Optionnel</span>
                    </div>
                    <textarea
                      value={articleText}
                      onChange={(e) => setArticleText(e.target.value)}
                      rows={3}
                      placeholder="Collez ici les points clés ou les paragraphes essentiels de votre article..."
                      className="w-full rounded-xl border border-border bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none transition focus:border-[#6366F1]"
                    />
                  </div>
                </div>
              )}

              {/* Mode: Product Form */}
              {mode === "product" && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-muted-foreground">
                      Lien de la fiche produit (optionnel) :
                    </label>
                    <input
                      type="url"
                      value={productUrl}
                      onChange={(e) => setProductUrl(e.target.value)}
                      placeholder="https://maboutique.com/products/nom-produit"
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none transition focus:border-[#6366F1]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-muted-foreground">
                        Nom du produit <span className="text-red-500">*</span> :
                      </label>
                      <input
                        type="text"
                        value={productName}
                        onChange={(e) => {
                          setProductName(e.target.value);
                          if (generationError) setGenerationError(null);
                        }}
                        placeholder="Ex: Montre Chrono Automatique"
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none transition focus:border-[#6366F1]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-muted-foreground">
                        Prix / Offre réelle :
                      </label>
                      <input
                        type="text"
                        value={productPrice}
                        onChange={(e) => setProductPrice(e.target.value)}
                        placeholder="Ex: 89 € au lieu de 120 €"
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none transition focus:border-[#6366F1]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-muted-foreground">
                      Caractéristiques réelles &amp; Avantages majeurs :
                    </label>
                    <textarea
                      value={productFeatures}
                      onChange={(e) => setProductFeatures(e.target.value)}
                      rows={2}
                      placeholder={`Exemple :\n${currentExample.product}`}
                      className="w-full rounded-xl border border-border bg-background p-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none transition focus:border-[#6366F1]"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      L&apos;IA s&apos;appuiera strictement sur ces informations réelles pour éviter d&apos;inventer des caractéristiques.
                    </p>
                  </div>
                </div>
              )}

              {/* Mode: Reel Script Form */}
              {mode === "reel" && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-muted-foreground">
                      Sujet ou concept de la vidéo <span className="text-red-500">*</span> :
                    </label>
                    <textarea
                      value={reelTopic}
                      onChange={(e) => {
                        setReelTopic(e.target.value);
                        if (generationError) setGenerationError(null);
                      }}
                      rows={2}
                      placeholder={`Exemple :\n${currentExample.reel}`}
                      className="w-full rounded-xl border border-border bg-background p-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none transition focus:border-[#6366F1]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Reel Objective */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-muted-foreground">
                        Objectif du Reel :
                      </label>
                      <select
                        value={reelGoal}
                        onChange={(e) => setReelGoal(e.target.value as ReelGoal)}
                        className="w-full rounded-xl border border-border bg-background px-2.5 py-2 text-xs text-foreground outline-none focus:border-[#6366F1]"
                      >
                        <option value="conversion">Vente &amp; Conversion</option>
                        <option value="viral">Notoriété &amp; Viralité</option>
                        <option value="educational">Conseil &amp; Éducation</option>
                      </select>
                    </div>

                    {/* Reel Duration */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-muted-foreground">
                        Durée cible :
                      </label>
                      <div className="grid grid-cols-3 gap-1">
                        {(["15s", "30s", "60s"] as ReelDuration[]).map((dur) => (
                          <button
                            key={dur}
                            type="button"
                            onClick={() => setReelDuration(dur)}
                            className={cn(
                              "rounded-lg border py-1.5 text-xs font-medium text-center transition",
                              reelDuration === dur
                                ? "border-[#6366F1] bg-[#E0E7FF] text-[#312E81] dark:border-[#818CF8] dark:bg-[#312E81] dark:text-[#E0E7FF] font-bold"
                                : "border-border bg-surface text-muted-foreground hover:bg-surface-2"
                            )}
                          >
                            {dur}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Local Video Uploader */}
                  <div className="pt-2 border-t border-border space-y-1.5">
                    <label className="text-[11px] font-semibold text-muted-foreground block">
                      Téléverser une vidéo pour le Reel (optionnel) :
                    </label>
                    <VideoUploader
                      videoUrl={reelVideoUrl}
                      postFormat="reel"
                      onVideoUploaded={(url) => setReelVideoUrl(url)}
                      onVideoRemoved={() => setReelVideoUrl("")}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Section 2: Destinations & Formats */}
            <div className="space-y-2.5 pt-4 border-t border-border">
              <label className="text-xs font-bold uppercase tracking-wider text-foreground block">
                2. Formats &amp; Destinations
              </label>
              <div className="grid grid-cols-3 gap-2">
                {/* Facebook Checkbox */}
                <button
                  type="button"
                  onClick={() =>
                    setDestinations((prev) => ({ ...prev, facebook: !prev.facebook }))
                  }
                  className={cn(
                    "flex items-center gap-2 rounded-xl border p-2 text-xs font-medium transition text-left",
                    destinations.facebook
                      ? "border-[#6366F1] bg-[#E0E7FF] text-[#312E81] dark:border-[#818CF8] dark:bg-[#312E81] dark:text-[#E0E7FF] font-bold"
                      : "border-border bg-surface text-muted-foreground hover:bg-surface-2"
                  )}
                >
                  <FacebookLogo size={16} weight="fill" className="shrink-0 text-blue-500" />
                  <span className="truncate">Facebook</span>
                  {destinations.facebook && <Check size={13} className="ml-auto shrink-0" />}
                </button>

                {/* WhatsApp Checkbox */}
                <button
                  type="button"
                  onClick={() =>
                    setDestinations((prev) => ({ ...prev, whatsapp: !prev.whatsapp }))
                  }
                  className={cn(
                    "flex items-center gap-2 rounded-xl border p-2 text-xs font-medium transition text-left",
                    destinations.whatsapp
                      ? "border-[#6366F1] bg-[#E0E7FF] text-[#312E81] dark:border-[#818CF8] dark:bg-[#312E81] dark:text-[#E0E7FF] font-bold"
                      : "border-border bg-surface text-muted-foreground hover:bg-surface-2"
                  )}
                >
                  <WhatsappLogo size={16} weight="fill" className="shrink-0 text-emerald-500" />
                  <span className="truncate">WhatsApp</span>
                  {destinations.whatsapp && <Check size={13} className="ml-auto shrink-0" />}
                </button>

                {/* Reel Checkbox */}
                <button
                  type="button"
                  onClick={() =>
                    setDestinations((prev) => ({ ...prev, reel: !prev.reel }))
                  }
                  className={cn(
                    "flex items-center gap-2 rounded-xl border p-2 text-xs font-medium transition text-left",
                    destinations.reel
                      ? "border-[#6366F1] bg-[#E0E7FF] text-[#312E81] dark:border-[#818CF8] dark:bg-[#312E81] dark:text-[#E0E7FF] font-bold"
                      : "border-border bg-surface text-muted-foreground hover:bg-surface-2"
                  )}
                >
                  <FilmStrip size={16} weight="fill" className="shrink-0 text-purple-500" />
                  <span className="truncate">Script Reel</span>
                  {destinations.reel && <Check size={13} className="ml-auto shrink-0" />}
                </button>
              </div>
            </div>

            {/* Section 3: Style et Marque */}
            <div className="space-y-3 pt-4 border-t border-border">
              <label className="text-xs font-bold uppercase tracking-wider text-foreground block">
                3. Style &amp; Marque
              </label>

              {/* Sectors Selection (2 cols) */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-muted-foreground block">
                  Secteur d&apos;activité :
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {SECTORS.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSector(s.id)}
                      className={cn(
                        "flex items-center gap-2 rounded-xl border px-2.5 py-2 text-xs font-medium transition text-left",
                        sector === s.id
                          ? "border-[#6366F1] bg-[#E0E7FF] text-[#312E81] dark:border-[#818CF8] dark:bg-[#312E81] dark:text-[#E0E7FF] font-bold shadow-sm"
                          : "border-border bg-surface text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                      )}
                    >
                      <span>{s.icon}</span>
                      <span className="truncate">{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tones Selection */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-muted-foreground block">
                  Ton de communication :
                </span>
                <div className="space-y-1.5">
                  {TONES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTone(t.id)}
                      className={cn(
                        "w-full flex items-center justify-between rounded-xl border px-3 py-2 text-xs text-left transition",
                        tone === t.id
                          ? "border-[#6366F1] bg-[#E0E7FF] text-[#312E81] dark:border-[#818CF8] dark:bg-[#312E81] dark:text-[#E0E7FF] font-bold shadow-sm ring-1 ring-[#6366F1]/30 dark:ring-[#818CF8]/40"
                          : "border-border bg-surface text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                      )}
                    >
                      <div className="min-w-0 pr-2">
                        <span className="font-semibold block truncate">{t.label}</span>
                        <span
                          className={cn(
                            "text-[10px] block truncate",
                            tone === t.id ? "opacity-90" : "text-muted-foreground/75"
                          )}
                        >
                          {t.desc}
                        </span>
                      </div>
                      {tone === t.id && <Check size={14} className="shrink-0 text-[#4338CA] dark:text-[#818CF8]" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Collapsible Advanced Brand Settings */}
              <div className="pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAdvancedBrand((prev) => !prev)}
                  className="flex items-center justify-between w-full text-xs text-muted-foreground hover:text-foreground font-medium py-1"
                >
                  <span className="flex items-center gap-1.5">
                    <SlidersHorizontal size={14} />
                    Options de marque avancées
                  </span>
                  {showAdvancedBrand ? <CaretUp size={14} /> : <CaretDown size={14} />}
                </button>

                {showAdvancedBrand && (
                  <div className="mt-2.5 space-y-2 rounded-xl border border-border bg-surface-2/40 p-3 text-xs">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Nom de la marque :
                      </label>
                      <input
                        type="text"
                        value={brandName}
                        onChange={(e) => setBrandName(e.target.value)}
                        placeholder="Ex: Fundoral Boutique"
                        className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs outline-none focus:border-[#6366F1]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Signature ou coordonnées de fin :
                      </label>
                      <input
                        type="text"
                        value={brandSignature}
                        onChange={(e) => setBrandSignature(e.target.value)}
                        placeholder="Ex: 📍 Livraison express | 📲 WhatsApp : +33 6..."
                        className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs outline-none focus:border-[#6366F1]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Hashtags par défaut :
                      </label>
                      <input
                        type="text"
                        value={brandHashtags}
                        onChange={(e) => setBrandHashtags(e.target.value)}
                        placeholder="#moncommerce #qualite #promo"
                        className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs outline-none focus:border-[#6366F1]"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Error Message Inline (no alerts) */}
            {generationError && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
                <Warning size={16} className="mt-0.5 shrink-0" />
                <span>{generationError}</span>
              </div>
            )}

            {/* Primary Action Button: Solid #4338CA with white text */}
            <Button
              className="w-full py-2.5 font-bold shadow-sm"
              onClick={handleGenerate}
              disabled={generating}
            >
              {generating ? (
                <>
                  <ArrowsClockwise size={16} className="animate-spin mr-1.5" />
                  Génération en cours…
                </>
              ) : (
                <>
                  <Sparkle size={16} weight="fill" className="mr-1.5" />
                  Générer les publications
                </>
              )}
            </Button>
          </Card>
        </div>

        {/* Right Column: Results Workspace (7 cols) */}
        <div ref={resultsRef} className="space-y-4 lg:col-span-7">
          {outputFb || outputWa || outputReel ? (
            <div className="space-y-4">
              {/* Result Format Tabs */}
              <div className="flex items-center gap-1.5 border-b border-border pb-2 overflow-x-auto">
                {destinations.facebook && outputFb && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("facebook")}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition shrink-0",
                      activeTab === "facebook"
                        ? "bg-[#E0E7FF] text-[#312E81] dark:bg-[#312E81] dark:text-[#E0E7FF] border border-[#6366F1]"
                        : "text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                    )}
                  >
                    <FacebookLogo size={15} weight="fill" className="text-blue-500" />
                    <span>Facebook Post</span>
                    {isModified.facebook && (
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                    )}
                  </button>
                )}

                {destinations.whatsapp && outputWa && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("whatsapp")}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition shrink-0",
                      activeTab === "whatsapp"
                        ? "bg-[#E0E7FF] text-[#312E81] dark:bg-[#312E81] dark:text-[#E0E7FF] border border-[#6366F1]"
                        : "text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                    )}
                  >
                    <WhatsappLogo size={15} weight="fill" className="text-emerald-500" />
                    <span>WhatsApp Direct</span>
                    {isModified.whatsapp && (
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                    )}
                  </button>
                )}

                {destinations.reel && outputReel && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("reel")}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition shrink-0",
                      activeTab === "reel"
                        ? "bg-[#E0E7FF] text-[#312E81] dark:bg-[#312E81] dark:text-[#E0E7FF] border border-[#6366F1]"
                        : "text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                    )}
                  >
                    <FilmStrip size={15} weight="fill" className="text-purple-500" />
                    <span>Script Reel 9:16</span>
                    {isModified.reel && (
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                    )}
                  </button>
                )}
              </div>

              {/* Active Tab Workspace */}
              {activeTab === "facebook" && outputFb && (
                <Card className="space-y-4">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                        <FacebookLogo size={16} weight="fill" />
                      </span>
                      <div>
                        <h3 className="text-xs font-bold text-foreground">
                          Publication Facebook (Feed &amp; Page)
                        </h3>
                        <p className="text-[11px] text-muted-foreground">
                          Modifiable directement ci-dessous avant programmation ou envoi.
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-muted-foreground">
                      {outputFb.length} caractères
                    </span>
                  </div>

                  {/* Direct In-Place Editable Content Area */}
                  <textarea
                    value={outputFb}
                    onChange={(e) => {
                      setOutputFb(e.target.value);
                      setIsModified((prev) => ({ ...prev, facebook: true }));
                    }}
                    rows={9}
                    className="w-full rounded-xl border border-border bg-background p-3.5 text-xs text-foreground font-sans leading-relaxed outline-none transition focus:border-[#6366F1] resize-y"
                  />

                  {/* Action Bar for Facebook */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleCopy(outputFb, "facebook")}
                        className="text-xs"
                      >
                        {copiedTab === "facebook" ? (
                          <Check size={14} className="text-emerald-500 mr-1" />
                        ) : (
                          <Copy size={14} className="mr-1" />
                        )}
                        {copiedTab === "facebook" ? "Copié !" : "Copier"}
                      </Button>

                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={handleSaveDraft}
                        disabled={savingDraft}
                        className="text-xs"
                      >
                        {savingDraft ? (
                          <ArrowsClockwise size={14} className="animate-spin mr-1" />
                        ) : (
                          <FloppyDisk size={14} className="mr-1" />
                        )}
                        Enregistrer brouillon
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleRegenerateCurrentTab}
                        disabled={generating}
                        className="text-xs text-muted-foreground"
                      >
                        <ArrowsClockwise size={14} className="mr-1" />
                        Régénérer cette version
                      </Button>
                    </div>

                    <Button
                      size="sm"
                      onClick={handleTransferToPublisher}
                      className="text-xs"
                    >
                      Transmettre à la publication <ArrowRight size={14} className="ml-1" />
                    </Button>
                  </div>
                </Card>
              )}

              {activeTab === "whatsapp" && outputWa && (
                <Card className="space-y-4">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                        <WhatsappLogo size={16} weight="fill" />
                      </span>
                      <div>
                        <h3 className="text-xs font-bold text-foreground">
                          Message WhatsApp (Direct, Groupes &amp; Canaux)
                        </h3>
                        <p className="text-[11px] text-muted-foreground">
                          Formaté pour la lecture mobile avec typographie WhatsApp (*gras*, puces).
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-muted-foreground">
                      {outputWa.length} caractères
                    </span>
                  </div>

                  {/* Direct In-Place Editable Content Area */}
                  <textarea
                    value={outputWa}
                    onChange={(e) => {
                      setOutputWa(e.target.value);
                      setIsModified((prev) => ({ ...prev, whatsapp: true }));
                    }}
                    rows={9}
                    className="w-full rounded-xl border border-border bg-background p-3.5 text-xs text-foreground font-mono leading-relaxed outline-none transition focus:border-[#6366F1] resize-y"
                  />

                  {/* Action Bar for WhatsApp */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleCopy(outputWa, "whatsapp")}
                        className="text-xs"
                      >
                        {copiedTab === "whatsapp" ? (
                          <Check size={14} className="text-emerald-500 mr-1" />
                        ) : (
                          <Copy size={14} className="mr-1" />
                        )}
                        {copiedTab === "whatsapp" ? "Copié !" : "Copier pour WhatsApp"}
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleRegenerateCurrentTab}
                        disabled={generating}
                        className="text-xs text-muted-foreground"
                      >
                        <ArrowsClockwise size={14} className="mr-1" />
                        Régénérer
                      </Button>
                    </div>

                    <Link href="/dashboard/inbox">
                      <Button size="sm" variant="secondary" className="text-xs">
                        <ChatCircleDots size={14} className="mr-1" />
                        Ouvrir dans Inbox AI
                      </Button>
                    </Link>
                  </div>
                </Card>
              )}

              {activeTab === "reel" && outputReel && (
                <Card className="space-y-4">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500">
                        <FilmStrip size={16} weight="fill" />
                      </span>
                      <div>
                        <h3 className="text-xs font-bold text-foreground">
                          Script Vidéo &amp; Storyboard Reel 9:16
                        </h3>
                        <p className="text-[11px] text-muted-foreground">
                          Structure de tournage : accroche 3s, visuels, voix off et textes à l&apos;écran.
                        </p>
                      </div>
                    </div>
                    <span className="rounded-md bg-purple-500/10 px-2 py-0.5 text-[10px] font-bold text-purple-600 dark:text-purple-300">
                      Format vertical 9:16
                    </span>
                  </div>

                  {/* Accroche Visuelle (Hook) */}
                  <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-3 space-y-1">
                    <label className="text-[11px] font-bold text-purple-700 dark:text-purple-300 block">
                      Accroche Visuelle (Hook 3 secondes) :
                    </label>
                    <input
                      type="text"
                      value={outputReel.hook}
                      onChange={(e) => {
                        setOutputReel({ ...outputReel, hook: e.target.value });
                        setIsModified((prev) => ({ ...prev, reel: true }));
                      }}
                      className="w-full rounded-lg border border-purple-500/20 bg-background px-3 py-1.5 text-xs text-foreground font-medium outline-none focus:border-[#6366F1]"
                    />
                  </div>

                  {/* Scenes List */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Découpage par scènes chronométrées :
                    </label>
                    {outputReel.scenes.map((scene, i) => (
                      <div
                        key={i}
                        className="rounded-xl border border-border bg-surface-2/40 p-3 space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between font-mono text-[10px] text-[#4338CA] dark:text-[#818CF8]">
                          <span className="font-bold">Scène {i + 1}</span>
                          <span className="rounded bg-surface px-1.5 py-0.5 border border-border">
                            {scene.time}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-muted-foreground block">
                            Indications visuelles :
                          </label>
                          <input
                            type="text"
                            value={scene.visual}
                            onChange={(e) => {
                              const updated = [...outputReel.scenes];
                              updated[i].visual = e.target.value;
                              setOutputReel({ ...outputReel, scenes: updated });
                              setIsModified((prev) => ({ ...prev, reel: true }));
                            }}
                            className="w-full rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-foreground outline-none focus:border-[#6366F1]"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-muted-foreground block">
                            Voix off / Narration :
                          </label>
                          <textarea
                            value={scene.voiceover}
                            onChange={(e) => {
                              const updated = [...outputReel.scenes];
                              updated[i].voiceover = e.target.value;
                              setOutputReel({ ...outputReel, scenes: updated });
                              setIsModified((prev) => ({ ...prev, reel: true }));
                            }}
                            rows={2}
                            className="w-full rounded-lg border border-border bg-background p-2 text-xs text-foreground outline-none focus:border-[#6366F1]"
                          />
                        </div>
                        {scene.onScreenText && (
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                            <span className="font-semibold text-foreground">Texte à l&apos;écran :</span>
                            <span className="rounded bg-surface px-1.5 py-0.5 border border-border text-foreground">
                              {scene.onScreenText}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Music Suggestion */}
                  <div className="rounded-xl border border-border bg-surface-2/60 p-2.5 text-xs text-muted-foreground flex items-center justify-between">
                    <span>🎵 Musique recommandée :</span>
                    <span className="font-semibold text-foreground">
                      {outputReel.musicSuggestion}
                    </span>
                  </div>

                  {/* Caption & Hashtags */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-muted-foreground">
                      Légende du post &amp; hashtags :
                    </label>
                    <textarea
                      value={outputReel.caption}
                      onChange={(e) => {
                        setOutputReel({ ...outputReel, caption: e.target.value });
                        setIsModified((prev) => ({ ...prev, reel: true }));
                      }}
                      rows={2}
                      className="w-full rounded-xl border border-border bg-background p-2.5 text-xs text-foreground outline-none focus:border-[#6366F1]"
                    />
                  </div>

                  {/* Action Bar for Reel */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          const fullScript = `HOOK:\n${outputReel.hook}\n\nSCÈNES:\n${outputReel.scenes
                            .map((s) => `[${s.time}] Visual: ${s.visual}\nVoice: ${s.voiceover}`)
                            .join("\n\n")}\n\nMUSIQUE: ${outputReel.musicSuggestion}\n\nLÉGENDE:\n${outputReel.caption}`;
                          handleCopy(fullScript, "reel");
                        }}
                        className="text-xs"
                      >
                        {copiedTab === "reel" ? (
                          <Check size={14} className="text-emerald-500 mr-1" />
                        ) : (
                          <Copy size={14} className="mr-1" />
                        )}
                        {copiedTab === "reel" ? "Copié !" : "Copier le script complet"}
                      </Button>

                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={handleSaveDraft}
                        disabled={savingDraft}
                        className="text-xs"
                      >
                        {savingDraft ? (
                          <ArrowsClockwise size={14} className="animate-spin mr-1" />
                        ) : (
                          <FloppyDisk size={14} className="mr-1" />
                        )}
                        Enregistrer brouillon
                      </Button>
                    </div>

                    <Button
                      size="sm"
                      onClick={handleTransferToPublisher}
                      className="text-xs"
                    >
                      Transmettre au programmateur <ArrowRight size={14} className="ml-1" />
                    </Button>
                  </div>
                </Card>
              )}

              {/* Ready to Publish Info Callout */}
              <div className="rounded-xl border border-border bg-surface-2/40 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-foreground">
                    Prêt à diffuser sur vos réseaux sociaux ?
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Transmettez ce contenu vers le programmateur pour valider la page cible, planifier l&apos;heure ou publier immédiatement.
                  </p>
                </div>
                <Button size="sm" onClick={handleTransferToPublisher} className="shrink-0">
                  Ouvrir dans le Programmateur <ArrowRight size={14} className="ml-1" />
                </Button>
              </div>
            </div>
          ) : (
            /* Compact Initial State (Replaces the huge empty dotted box) */
            <Card className="p-8 text-center space-y-4 border border-border">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E0E7FF] dark:bg-[#312E81] text-[#312E81] dark:text-[#E0E7FF]">
                <Sparkle size={28} weight="fill" />
              </div>
              <div className="space-y-1.5 max-w-md mx-auto">
                <h3 className="font-heading text-base font-bold text-foreground">
                  Espace de travail &amp; Résultats
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Renseignez vos éléments dans le formulaire à gauche puis cliquez sur « Générer les publications ».
                  Vos textes apparaîtront ici par destination, éditables et prêts à publier.
                </p>
              </div>

              {/* Checklist of what will be produced */}
              <div className="pt-3 border-t border-border/60 max-w-sm mx-auto text-left space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-center">
                  Contenus prévus selon vos réglages :
                </p>
                <div className="rounded-xl border border-border bg-surface-2/50 p-3 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-foreground">
                    <Check size={14} className="text-emerald-500 shrink-0" />
                    <span>Post Facebook engageant (accroche, corps, hashtags)</span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground">
                    <Check size={14} className="text-emerald-500 shrink-0" />
                    <span>Message WhatsApp formaté pour la conversion</span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground">
                    <Check size={14} className="text-emerald-500 shrink-0" />
                    <span>Storyboard Reel 9:16 découpé en scènes chronométrées</span>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
