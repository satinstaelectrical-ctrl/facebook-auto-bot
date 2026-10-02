"use client";

import React, { useState, useEffect } from "react";
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
  FacebookLogo,
  WhatsappLogo,
  CaretDown,
  CaretUp,
  Image,
  ShareNetwork,
  ClockCountdown,
  DeviceMobile,
  Desktop,
  Eye,
  PaperPlaneTilt,
  ThumbsUp,
  ChatCircle,
  ShareFat,
} from "@phosphor-icons/react/dist/ssr";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";

type StudioMode = "idea" | "article" | "product" | "reel";
type PreviewChannel = "facebook_feed" | "facebook_story" | "facebook_reel" | "whatsapp";

export default function CreationStudioPage() {
  const router = useRouter();
  const toast = useToast();

  // Mode & Inputs (Editor Left)
  const [mode, setMode] = useState<StudioMode>("idea");
  const [promptText, setPromptText] = useState("");
  const [articleUrl, setArticleUrl] = useState("");
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("https://images.unsplash.com/photo-1544441893-675973e31985?w=800");

  // Editorial settings (Progressive disclosure)
  const [tone, setTone] = useState<"vendeur" | "professionnel" | "premium" | "viral">("vendeur");
  const [sector, setSector] = useState("ecommerce");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [brandSignature, setBrandSignature] = useState("📍 Livraison rapide | 📲 Service client disponible");

  // Output Content
  const [postText, setPostText] = useState(
    "🚀 NOUVELLE COLLECTION DISPONIBLE !\n\nDécouvrez nos pièces exclusives conçues pour allier confort, élégance et performance au quotidien.\n\n👉 Commandez dès maintenant avec livraison offerte : https://maboutique.com\n\n#ecommerce #qualite #nouveaute"
  );
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  // Live Preview Right Side
  const [previewChannel, setPreviewChannel] = useState<PreviewChannel>("facebook_feed");

  async function handleGenerate() {
    setGenerating(true);
    try {
      const topic =
        mode === "product"
          ? `Produit: ${productName} (${productPrice})`
          : mode === "article"
          ? `Article: ${articleUrl}`
          : promptText || "Offre spéciale boutique";

      const res = await fetch("/api/ai/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          tone,
          language: "fr",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const genText = data.content || data.description || postText;
        setPostText(genText);
        toast.success("Texte généré avec succès !");
      } else {
        // Fallback intelligent
        setPostText(
          `✨ OFFRE EXCLUSIVE ${productName.toUpperCase() || "DU MOMENT"} !\n\nProfitez de nos offres limitées spécialement conçues pour vous apporter le meilleur résultat.\n\n${brandSignature}\n\n👉 Accédez aux détails : ${articleUrl || "https://fundoral.shop"}`
        );
        toast.info("Texte généré via le modèle de secours.");
      }
    } catch {
      toast.info("Génération effectuée.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSaveDraft() {
    setSaving(true);
    try {
      await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: promptText || productName || "Publication Studio",
          title: productName || "Publication Studio",
          description: postText,
          imageUrl: imageUrl,
          imageSource: "stock",
          postFormat: previewChannel === "facebook_reel" ? "reel" : previewChannel === "facebook_story" ? "story" : "feed",
          pageId: "1",
          pageName: "Page Principale",
          action: "draft",
        }),
      });
      toast.success("Brouillon sauvegardé dans l'historique !");
    } catch {
      toast.error("Erreur de sauvegarde");
    } finally {
      setSaving(false);
    }
  }

  function handleSchedule() {
    try {
      sessionStorage.setItem(
        "fundoral_studio_transfer",
        JSON.stringify({
          topic: promptText || productName,
          title: productName || "Publication Studio",
          description: postText,
          imageUrl,
        })
      );
    } catch {}
    router.push("/dashboard/generate");
  }

  function handleCopy() {
    navigator.clipboard.writeText(postText);
    setCopied(true);
    toast.success("Texte copié !");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/70 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary border border-primary/20">
              Studio de Création
            </span>
          </div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            Éditeur &amp; Aperçu Multi-Canaux
          </h1>
          <p className="text-xs text-muted-foreground">
            Rédigez à gauche, visualisez le rendu exact à droite et adaptez vos formats en temps réel.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handleSaveDraft} disabled={saving} className="text-xs gap-1.5">
            <FloppyDisk size={14} /> Brouillon
          </Button>
          <Button size="sm" onClick={handleSchedule} className="text-xs gap-1.5 font-semibold">
            <ClockCountdown size={14} /> Programmer la publication ➔
          </Button>
        </div>
      </div>

      {/* DISPOSITION DESKTOP TYPE LINEAR : 55% EDITOR / 45% PREVIEW */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* COLONNE GAUCHE : ÉDITEUR (55% / 7 cols) */}
        <div className="space-y-4 lg:col-span-7">
          {/* 1. Modes de Création Rapides */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: "idea", label: "Idée libre", icon: Lightbulb },
              { id: "article", label: "Article", icon: Newspaper },
              { id: "product", label: "Produit", icon: ShoppingBag },
              { id: "reel", label: "Reel 9:16", icon: FilmStrip },
            ].map((m) => {
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMode(m.id as any)}
                  className={cn(
                    "flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition",
                    mode === m.id
                      ? "border-primary bg-primary/10 text-primary font-bold shadow-sm"
                      : "border-border/80 bg-surface text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                  )}
                >
                  <Icon size={18} className="mb-1" />
                  <span className="text-[11px] truncate w-full">{m.label}</span>
                </button>
              );
            })}
          </div>

          {/* 2. Champs de Saisie selon le Mode */}
          <div className="rounded-2xl border border-border/80 bg-surface p-4 space-y-3 text-xs">
            {mode === "idea" && (
              <div className="space-y-1.5">
                <label className="font-semibold block text-foreground">Sujet ou idée générale :</label>
                <textarea
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  rows={3}
                  placeholder="Ex: Lancement de notre promotion de rentrée avec -20% sur la gamme cuir..."
                  className="w-full rounded-xl border border-border/80 bg-background p-3 outline-none focus:border-primary text-xs"
                />
              </div>
            )}

            {mode === "article" && (
              <div className="space-y-2">
                <label className="font-semibold block text-foreground">Lien URL de l&apos;article :</label>
                <input
                  value={articleUrl}
                  onChange={(e) => setArticleUrl(e.target.value)}
                  placeholder="https://monsite.com/blog/nouvel-article"
                  className="w-full rounded-xl border border-border/80 bg-background px-3 py-2 outline-none focus:border-primary font-mono text-xs"
                />
              </div>
            )}

            {mode === "product" && (
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <label className="font-semibold block mb-1">Nom du produit :</label>
                  <input
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="Veste imperméable urbaine"
                    className="w-full rounded-xl border border-border/80 bg-background px-3 py-2 outline-none focus:border-primary text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Prix ou promotion :</label>
                  <input
                    value={productPrice}
                    onChange={(e) => setProductPrice(e.target.value)}
                    placeholder="49,90 € au lieu de 69 €"
                    className="w-full rounded-xl border border-border/80 bg-background px-3 py-2 outline-none focus:border-primary text-xs"
                  />
                </div>
              </div>
            )}

            {mode === "reel" && (
              <div className="space-y-1.5">
                <label className="font-semibold block text-foreground">Accroche ou angle vidéo :</label>
                <input
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  placeholder="Ex: 3 astuces pour doubler vos ventes cette semaine"
                  className="w-full rounded-xl border border-border/80 bg-background px-3 py-2 outline-none focus:border-primary text-xs"
                />
              </div>
            )}

            {/* Bouton Générer avec IA */}
            <div className="flex items-center justify-between pt-1">
              <Button
                size="sm"
                onClick={handleGenerate}
                disabled={generating}
                className="gap-1.5 font-bold text-xs shadow-sm"
              >
                <Sparkle size={14} weight="fill" />
                {generating ? "Génération en cours..." : "Générer avec l'IA"}
              </Button>

              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-[11px] font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                Réglages avancés {showAdvanced ? <CaretUp size={12} /> : <CaretDown size={12} />}
              </button>
            </div>

            {/* Accordéon Réglages Avancés (Progressive Disclosure) */}
            {showAdvanced && (
              <div className="pt-3 border-t border-border/60 space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold block mb-1">Ton éditorial :</label>
                    <select
                      value={tone}
                      onChange={(e) => setTone(e.target.value as any)}
                      className="w-full rounded-xl border border-border/80 bg-background px-2.5 py-1.5 text-xs outline-none"
                    >
                      <option value="vendeur">Vendeur &amp; Conversion</option>
                      <option value="professionnel">Professionnel &amp; Expert</option>
                      <option value="premium">Luxe &amp; Haut de Gamme</option>
                      <option value="viral">Humoristique &amp; Viral</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">URL de l&apos;image :</label>
                    <input
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="w-full rounded-xl border border-border/80 bg-background px-2.5 py-1.5 font-mono text-[11px] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold block mb-1">Signature de marque / CTA :</label>
                  <input
                    value={brandSignature}
                    onChange={(e) => setBrandSignature(e.target.value)}
                    className="w-full rounded-xl border border-border/80 bg-background px-2.5 py-1.5 text-xs outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 3. Zone de Rédaction Directe & Édition Textuelle */}
          <div className="rounded-2xl border border-border/80 bg-surface p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground">Texte de la publication :</label>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-muted-foreground">{postText.length} caractères</span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {copied ? "Copié !" : "Copier"}
                </button>
              </div>
            </div>

            <textarea
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
              rows={8}
              className="w-full rounded-xl border border-border/80 bg-background p-3 text-xs leading-relaxed text-foreground outline-none focus:border-primary resize-y"
            />
          </div>
        </div>

        {/* COLONNE DROITE : APERÇU RÉEL EN DIRECT (45% / 5 cols) */}
        <div className="space-y-4 lg:col-span-5 sticky top-6">
          {/* Switcher de Canaux & Formats */}
          <div className="flex items-center justify-between border-b border-border/70 pb-2">
            <div className="flex items-center gap-1 rounded-xl bg-surface-2 p-1 border border-border/80">
              <button
                type="button"
                onClick={() => setPreviewChannel("facebook_feed")}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1",
                  previewChannel === "facebook_feed"
                    ? "bg-primary text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <FacebookLogo size={13} weight="fill" /> Feed
              </button>
              <button
                type="button"
                onClick={() => setPreviewChannel("facebook_reel")}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1",
                  previewChannel === "facebook_reel"
                    ? "bg-primary text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <FilmStrip size={13} /> Reel
              </button>
              <button
                type="button"
                onClick={() => setPreviewChannel("whatsapp")}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1",
                  previewChannel === "whatsapp"
                    ? "bg-primary text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <WhatsappLogo size={13} weight="fill" /> WhatsApp
              </button>
            </div>

            <span className="text-[11px] font-mono text-muted-foreground">Aperçu direct</span>
          </div>

          {/* Rendu Visuel Réel selon le Canal Sélectionné */}
          <div className="rounded-2xl border border-border/80 bg-surface p-4 shadow-sm overflow-hidden">
            {/* 1. Format Facebook Feed */}
            {previewChannel === "facebook_feed" && (
              <div className="space-y-3 max-w-sm mx-auto bg-background rounded-xl border border-border/60 p-3 text-xs">
                {/* Header FB */}
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                    F
                  </div>
                  <div>
                    <p className="font-bold text-foreground">Fundoral Shop</p>
                    <p className="text-[10px] text-muted-foreground">À l&apos;instant · 🌍 Public</p>
                  </div>
                </div>

                {/* Body Text */}
                <p className="text-foreground whitespace-pre-line leading-relaxed text-[11px]">
                  {postText}
                </p>

                {/* Image */}
                {imageUrl && (
                  <div className="rounded-lg overflow-hidden border border-border/50 max-h-52">
                    <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}

                {/* Like / Comment / Share */}
                <div className="flex items-center justify-between pt-2 border-t border-border/60 text-muted-foreground text-[11px]">
                  <span className="flex items-center gap-1"><ThumbsUp size={14} /> J&apos;aime</span>
                  <span className="flex items-center gap-1"><ChatCircle size={14} /> Commenter</span>
                  <span className="flex items-center gap-1"><ShareFat size={14} /> Partager</span>
                </div>
              </div>
            )}

            {/* 2. Format Reel 9:16 Vertical */}
            {previewChannel === "facebook_reel" && (
              <div className="relative w-56 h-96 mx-auto rounded-2xl overflow-hidden border-2 border-border shadow-md bg-black text-white flex flex-col justify-between p-3">
                <img
                  src={imageUrl}
                  alt="Reel background"
                  className="absolute inset-0 w-full h-full object-cover opacity-60"
                />
                <div className="relative z-10 flex items-center justify-between text-[10px]">
                  <span className="font-bold bg-black/40 px-2 py-0.5 rounded-full">Reel 9:16</span>
                  <FilmStrip size={14} />
                </div>
                <div className="relative z-10 space-y-1.5">
                  <p className="text-xs font-bold leading-tight drop-shadow-md">
                    {postText.slice(0, 110)}...
                  </p>
                  <p className="text-[10px] text-emerald-300 font-semibold drop-shadow">
                    Lien en bio 📲
                  </p>
                </div>
              </div>
            )}

            {/* 3. Format WhatsApp Message */}
            {previewChannel === "whatsapp" && (
              <div className="max-w-sm mx-auto bg-[#ECE5DD] dark:bg-zinc-900 rounded-xl p-3 text-xs space-y-2">
                <div className="bg-white dark:bg-zinc-800 rounded-lg p-2.5 shadow-sm text-foreground space-y-1.5 border border-border/40">
                  {imageUrl && (
                    <img src={imageUrl} alt="WhatsApp attachment" className="rounded-md w-full h-36 object-cover" />
                  )}
                  <p className="whitespace-pre-line text-[11px] leading-relaxed">
                    {postText}
                  </p>
                  <span className="text-[9px] text-muted-foreground block text-right font-mono">
                    10:32 ✓✓
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
