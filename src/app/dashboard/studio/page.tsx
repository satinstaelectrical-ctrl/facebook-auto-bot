"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkle,
  MagicWand,
  Newspaper,
  ShoppingBag,
  FilmStrip,
  Copy,
  Check,
  ShareNetwork,
  WhatsappLogo,
  FacebookLogo,
  InstagramLogo,
  ArrowRight,
  ArrowsClockwise,
  UploadSimple,
  Play,
  Article,
  Megaphone,
  ChatCircleDots,
  Info,
} from "@phosphor-icons/react/dist/ssr";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VideoUploader } from "@/components/dashboard/video-uploader";
import { cn } from "@/lib/cn";

type StudioMode = "direct" | "article" | "shopify" | "reel_script";

interface SectorOption {
  id: string;
  label: string;
  icon: string;
}

const SECTORS: SectorOption[] = [
  { id: "ecommerce", label: "E-Commerce & Vente", icon: "🛍" },
  { id: "immobilier", label: "Immobilier & Logement", icon: "🏠" },
  { id: "services", label: "Services B2B & Pro", icon: "💼" },
  { id: "restaurant", label: "Restaurant & Gastronomie", icon: "🍽" },
  { id: "evenement", label: "Événements & Soirées", icon: "🎟" },
  { id: "rencontres", label: "Rencontres & Communauté", icon: "❤️" },
];

const TONES = [
  { id: "professionnel", label: "Professionnel & Sérieux", desc: "Crédible, rassurant et expert" },
  { id: "vendeur", label: "Vendeur & Conversion", desc: "Urgence, promotion et appel à l'action direct" },
  { id: "premium", label: "Luxe & Haut de Gamme", desc: "Élégant, prestigieux et exclusif" },
  { id: "humoristique", label: "Humoristique & Viral", desc: "Décontracté, amusant avec émojis percutants" },
];

export default function AIStudioPage() {
  const [mode, setMode] = useState<StudioMode>("direct");
  const [sector, setSector] = useState("ecommerce");
  const [tone, setTone] = useState("vendeur");
  const [promptInput, setPromptInput] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [generating, setGenerating] = useState(false);
  const [copiedFb, setCopiedFb] = useState(false);
  const [copiedWa, setCopiedWa] = useState(false);
  const [copiedReel, setCopiedReel] = useState(false);

  // Generated outputs
  const [outputFb, setOutputFb] = useState<string | null>(null);
  const [outputWa, setOutputWa] = useState<string | null>(null);
  const [outputReel, setOutputReel] = useState<{
    hook: string;
    scenes: { time: string; visual: string; voiceover: string }[];
    musicSuggestion: string;
    caption: string;
  } | null>(null);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState<string>("");

  async function handleGenerate() {
    if (!promptInput.trim() && !sourceUrl.trim()) {
      alert("Veuillez saisir un sujet, coller un lien d'article ou décrire votre produit.");
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch("/api/generate/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: promptInput || sourceUrl,
          tone: tone === "vendeur" ? "promotional" : tone === "professionnel" ? "professional" : "engaging",
          language: "fr",
        }),
      });

      const data = await res.json();
      const title = data.title || promptInput || "Nouvelle offre exclusive";
      const desc = data.description || "Découvrez notre sélection spéciale. Contactez-nous dès maintenant pour en profiter !";
      const tags = (data.hashtags || ["viral", sector, "offre"]).map((t: string) => `#${t.replace("#", "")}`);
      setHashtags(tags);

      // Adaptation Facebook
      setOutputFb(
        `🔥 ${title.toUpperCase()}\n\n${desc}\n\n👉 Cliquez sur le lien pour commander ou en savoir plus !\n\n${tags.join(" ")}`
      );

      // Adaptation WhatsApp
      setOutputWa(
        `*${title}* 🚀\n\n${desc}\n\n✅ *Avantages :*\n• Qualité premium certifiée\n• Livraison rapide & suivi client\n• Offre valable dans la limite des stocks\n\n📲 *Pour commander immédiatement ou poser une question :*\nCliquez ici : ${sourceUrl || "https://wa.me/message"}\n\n${tags.slice(0, 3).join(" ")}`
      );

      // Adaptation Reel / TikTok Script
      setOutputReel({
        hook: `Attendez ! Ne faites pas cette erreur si vous cherchez ${promptInput || "le meilleur produit"} 🛑`,
        scenes: [
          {
            time: "0:00 - 0:03",
            visual: "Plan serré et dynamique présentant le produit ou l'annonce",
            voiceover: `Vous avez déjà remarqué à quel point c'est difficile de trouver un bon ${sector === "immobilier" ? "appartement" : "produit"} fiable ?`,
          },
          {
            time: "0:03 - 0:08",
            visual: "Démonstration rapide de l'utilisation ou visite 9:16",
            voiceover: `Voici exactement pourquoi notre solution change la donne. ${desc.slice(0, 70)}...`,
          },
          {
            time: "0:08 - 0:15",
            visual: "Appel à l'action avec texte animé au centre de l'écran",
            voiceover: "Envoyez-nous un message privé ou cliquez sur le lien en bio avant la rupture !",
          },
        ],
        musicSuggestion: "Trending Lo-Fi Beat / Upbeat Synthwave Tech (128 BPM)",
        caption: `${title} 🚀 Tous les détails en lien en bio ! ${tags.join(" ")}`,
      });
    } catch {
      // Fallback local smart simulation if API is busy
      const fallbackTitle = promptInput || "Offre Spéciale";
      setOutputFb(`🚀 ${fallbackTitle}\n\nDécouvrez notre sélection exclusive conçue pour vous apporter les meilleurs résultats.\n\n#${sector} #innovation #tendance`);
      setOutputWa(`*${fallbackTitle}* 📦\n\nDisponible immédiatement. Répondez à ce message pour réserver votre place !`);
      setHashtags([`#${sector}`, "#marketing", "#exclusif"]);
    } finally {
      setGenerating(false);
    }
  }

  function copyToClipboard(text: string, type: "fb" | "wa" | "reel") {
    navigator.clipboard.writeText(text);
    if (type === "fb") {
      setCopiedFb(true);
      setTimeout(() => setCopiedFb(false), 2000);
    } else if (type === "wa") {
      setCopiedWa(true);
      setTimeout(() => setCopiedWa(false), 2000);
    } else {
      setCopiedReel(true);
      setTimeout(() => setCopiedReel(false), 2000);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-bold text-indigo-400 border border-indigo-500/20">
              Agent de Rédaction IA
            </span>
          </div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight text-foreground mt-1">
            AI Content Studio
          </h1>
          <p className="text-xs text-muted-foreground">
            Transformez n&apos;importe quel sujet, article web ou produit Shopify en publications percutantes pour Facebook, WhatsApp et Reels.
          </p>
        </div>

        <Link href="/dashboard/generate">
          <Button variant="secondary" size="sm">
            <ShareNetwork size={14} /> Accéder à la Publication Directe
          </Button>
        </Link>
      </div>

      {/* Mode Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <button
          onClick={() => setMode("direct")}
          className={cn(
            "flex items-center gap-2.5 rounded-2xl border p-3.5 text-left transition",
            mode === "direct"
              ? "border-indigo-500 bg-indigo-500/10 text-white shadow-sm"
              : "border-border bg-surface-2/40 text-muted-foreground hover:bg-surface-2 hover:text-foreground"
          )}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 shrink-0">
            <MagicWand size={18} weight="fill" />
          </div>
          <div>
            <p className="text-xs font-bold">Générateur IA Libre</p>
            <p className="text-[10px] opacity-80">À partir d&apos;un sujet</p>
          </div>
        </button>

        <button
          onClick={() => setMode("article")}
          className={cn(
            "flex items-center gap-2.5 rounded-2xl border p-3.5 text-left transition",
            mode === "article"
              ? "border-indigo-500 bg-indigo-500/10 text-white shadow-sm"
              : "border-border bg-surface-2/40 text-muted-foreground hover:bg-surface-2 hover:text-foreground"
          )}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 shrink-0">
            <Article size={18} weight="fill" />
          </div>
          <div>
            <p className="text-xs font-bold">Article ➔ Réseaux</p>
            <p className="text-[10px] opacity-80">Blog, WordPress, RSS</p>
          </div>
        </button>

        <button
          onClick={() => setMode("shopify")}
          className={cn(
            "flex items-center gap-2.5 rounded-2xl border p-3.5 text-left transition",
            mode === "shopify"
              ? "border-indigo-500 bg-indigo-500/10 text-white shadow-sm"
              : "border-border bg-surface-2/40 text-muted-foreground hover:bg-surface-2 hover:text-foreground"
          )}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
            <ShoppingBag size={18} weight="fill" />
          </div>
          <div>
            <p className="text-xs font-bold">Produit ➔ Vente</p>
            <p className="text-[10px] opacity-80">Shopify &amp; Boutique</p>
          </div>
        </button>

        <button
          onClick={() => setMode("reel_script")}
          className={cn(
            "flex items-center gap-2.5 rounded-2xl border p-3.5 text-left transition",
            mode === "reel_script"
              ? "border-indigo-500 bg-indigo-500/10 text-white shadow-sm"
              : "border-border bg-surface-2/40 text-muted-foreground hover:bg-surface-2 hover:text-foreground"
          )}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400 shrink-0">
            <FilmStrip size={18} weight="fill" />
          </div>
          <div>
            <p className="text-xs font-bold">Script Reel / TikTok</p>
            <p className="text-[10px] opacity-80">Storyboard &amp; Scènes</p>
          </div>
        </button>
      </div>

      {/* Main Studio Grid: Input Configuration & Multi-format Results */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Input Form (5 cols) */}
        <div className="space-y-5 lg:col-span-5">
          <Card className="space-y-4">
            <h2 className="text-xs font-bold text-foreground uppercase tracking-wider">
              1. Choix du Secteur d&apos;Activité
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {SECTORS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSector(s.id)}
                  type="button"
                  className={cn(
                    "flex items-center gap-2 rounded-xl border p-2 text-xs font-medium transition text-left",
                    sector === s.id
                      ? "border-indigo-500 bg-indigo-500/10 text-white font-bold"
                      : "border-border bg-surface-2 text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span>{s.icon}</span>
                  <span className="truncate">{s.label}</span>
                </button>
              ))}
            </div>

            <h2 className="text-xs font-bold text-foreground uppercase tracking-wider pt-2 border-t border-border">
              2. Ton de la Marque
            </h2>
            <div className="space-y-1.5">
              {TONES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTone(t.id)}
                  type="button"
                  className={cn(
                    "w-full flex items-center justify-between rounded-xl border p-2.5 text-xs text-left transition",
                    tone === t.id
                      ? "border-indigo-500 bg-indigo-500/10 text-white font-bold ring-1 ring-indigo-500/30"
                      : "border-border bg-surface-2 text-muted-foreground hover:text-foreground"
                  )}
                >
                  <div>
                    <span className="font-semibold block">{t.label}</span>
                    <span className="text-[10px] opacity-75">{t.desc}</span>
                  </div>
                  {tone === t.id && <Check size={14} className="text-indigo-400" />}
                </button>
              ))}
            </div>

            <h2 className="text-xs font-bold text-foreground uppercase tracking-wider pt-2 border-t border-border">
              3. Contenu Source
            </h2>

            {mode === "article" || mode === "shopify" ? (
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground">
                  {mode === "article" ? "Lien de l'article de blog :" : "Lien de la fiche produit Shopify :"}
                </label>
                <input
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  placeholder={
                    mode === "article"
                      ? "https://monsite.com/blog/mon-article"
                      : "https://maboutique.com/products/mon-produit"
                  }
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:border-indigo-500"
                />
              </div>
            ) : null}

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground">
                {mode === "shopify"
                  ? "Points forts ou offre promotionnelle (ex: -30% ce week-end) :"
                  : "Description ou mot-clé de la publication :"}
              </label>
              <textarea
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                rows={3}
                placeholder="Ex: Villa contemporaine avec piscine à Yaoundé quartier Bastos, vue dégagée, prix exceptionnel..."
                className="w-full rounded-xl border border-border bg-background p-3 text-xs outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            {/* Optional Video Uploader integration for Reels */}
            {mode === "reel_script" && (
              <div className="pt-2 border-t border-border">
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                  Téléverser la vidéo locale du Reel (optionnel) :
                </label>
                <VideoUploader
                  videoUrl={videoUrl}
                  postFormat="reel"
                  onVideoUploaded={(url) => setVideoUrl(url)}
                  onVideoRemoved={() => setVideoUrl("")}
                />
              </div>
            )}

            <Button
              className="w-full font-bold shadow-md shadow-indigo-500/20"
              onClick={handleGenerate}
              disabled={generating}
            >
              {generating ? (
                <>
                  <ArrowsClockwise size={16} className="animate-spin mr-1.5" />
                  Génération par l&apos;IA en cours…
                </>
              ) : (
                <>
                  <Sparkle size={16} weight="fill" className="mr-1.5" />
                  Générer le Pack Multi-Canaux
                </>
              )}
            </Button>
          </Card>
        </div>

        {/* Right Column: Multi-Channel Output Previews (7 cols) */}
        <div className="space-y-5 lg:col-span-7">
          {outputFb || outputWa || outputReel ? (
            <div className="space-y-4">
              {/* Facebook Output Card */}
              <Card className="space-y-3 border-indigo-500/20">
                <div className="flex items-center justify-between border-b border-border pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                      <FacebookLogo size={16} weight="fill" />
                    </span>
                    <span className="text-xs font-bold text-foreground">Adaptation Facebook (Post &amp; Feed)</span>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => outputFb && copyToClipboard(outputFb, "fb")}
                    className="text-xs h-7"
                  >
                    {copiedFb ? <Check size={12} className="text-emerald-400 mr-1" /> : <Copy size={12} className="mr-1" />}
                    {copiedFb ? "Copié !" : "Copier"}
                  </Button>
                </div>
                <div className="rounded-xl bg-surface-2/60 p-3.5 text-xs text-foreground whitespace-pre-wrap leading-relaxed border border-border/40 font-sans">
                  {outputFb}
                </div>
              </Card>

              {/* WhatsApp Output Card */}
              <Card className="space-y-3 border-emerald-500/20">
                <div className="flex items-center justify-between border-b border-border pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                      <WhatsappLogo size={16} weight="fill" />
                    </span>
                    <span className="text-xs font-bold text-foreground">Adaptation WhatsApp (Direct &amp; Groupes)</span>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => outputWa && copyToClipboard(outputWa, "wa")}
                    className="text-xs h-7"
                  >
                    {copiedWa ? <Check size={12} className="text-emerald-400 mr-1" /> : <Copy size={12} className="mr-1" />}
                    {copiedWa ? "Copié !" : "Copier"}
                  </Button>
                </div>
                <div className="rounded-xl bg-surface-2/60 p-3.5 text-xs text-foreground whitespace-pre-wrap leading-relaxed border border-border/40 font-mono">
                  {outputWa}
                </div>
              </Card>

              {/* Reel Storyboard Output Card */}
              {outputReel && (
                <Card className="space-y-3 border-purple-500/20">
                  <div className="flex items-center justify-between border-b border-border pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
                        <FilmStrip size={16} weight="fill" />
                      </span>
                      <span className="text-xs font-bold text-foreground">Storyboard Reel 9:16 (Script &amp; Scènes)</span>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        outputReel &&
                        copyToClipboard(
                          `HOOK: ${outputReel.hook}\n\nSCÈNES:\n${outputReel.scenes
                            .map((s) => `[${s.time}] Visual: ${s.visual} | Audio: ${s.voiceover}`)
                            .join("\n")}`,
                          "reel"
                        )
                      }
                      className="text-xs h-7"
                    >
                      {copiedReel ? <Check size={12} className="text-emerald-400 mr-1" /> : <Copy size={12} className="mr-1" />}
                      {copiedReel ? "Copié !" : "Copier le script"}
                    </Button>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="rounded-xl bg-purple-500/10 border border-purple-500/20 p-2.5 text-purple-300">
                      <span className="font-bold block text-[11px]">Accroche Visuelle (Hook 3s) :</span>
                      <p className="mt-0.5">{outputReel.hook}</p>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      {outputReel.scenes.map((scene, i) => (
                        <div key={i} className="rounded-xl border border-border bg-surface-2/40 p-2.5 space-y-1">
                          <div className="flex items-center justify-between font-mono text-[10px] text-indigo-400">
                            <span>Scène {i + 1}</span>
                            <span>{scene.time}</span>
                          </div>
                          <p className="text-muted-foreground text-[11px]">
                            <strong className="text-foreground">Visuel :</strong> {scene.visual}
                          </p>
                          <p className="text-zinc-300 text-[11px]">
                            <strong className="text-foreground">Voix off :</strong> &ldquo;{scene.voiceover}&rdquo;
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-xl bg-surface-2 p-2 text-[11px] text-muted-foreground flex items-center justify-between">
                      <span>🎵 Musique suggérée :</span>
                      <span className="font-semibold text-foreground">{outputReel.musicSuggestion}</span>
                    </div>
                  </div>
                </Card>
              )}

              {/* Action: Send to Publisher */}
              <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-transparent p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs font-bold text-foreground">Prêt à diffuser sur vos Pages ?</h3>
                  <p className="text-[11px] text-muted-foreground">
                    Envoyez ce contenu vers le programmateur pour publication immédiate ou différée.
                  </p>
                </div>
                <Link href="/dashboard/generate">
                  <Button size="sm">
                    Ouvrir dans le Programmateur <ArrowRight size={14} className="ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed border-2">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 mb-4 border border-indigo-500/20">
                <Sparkle size={32} weight="duotone" />
              </div>
              <h3 className="font-heading text-base font-bold text-foreground">
                Votre assistant IA attend vos directives
              </h3>
              <p className="mt-1 text-xs text-muted-foreground max-w-sm">
                Choisissez votre secteur, définissez le ton de votre marque, saisissez un mot-clé ou collez un lien d&apos;article pour générer instantanément vos contenus.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                <span className="rounded-md bg-surface-2 px-2 py-1 text-[11px] font-mono text-muted-foreground">
                  Facebook Post
                </span>
                <span className="rounded-md bg-surface-2 px-2 py-1 text-[11px] font-mono text-muted-foreground">
                  WhatsApp Direct
                </span>
                <span className="rounded-md bg-surface-2 px-2 py-1 text-[11px] font-mono text-muted-foreground">
                  Reel 9:16 Script
                </span>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
