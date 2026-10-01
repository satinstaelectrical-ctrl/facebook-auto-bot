"use client";

import React, { useState } from "react";
import {
  Code,
  Copy,
  Check,
  Globe,
  Storefront,
  Terminal,
  PaperPlaneTilt,
  CheckCircle,
  WarningCircle,
  Info,
  Sparkle,
  ArrowSquareOut,
  CaretDown,
  CaretUp,
} from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export interface WebsiteIntegrationDocsProps {
  webhookUrl: string;
  webhookSecret: string;
}

type PlatformTab = "wordpress" | "shopify" | "curl" | "javascript" | "python";

export function WebsiteIntegrationDocs({
  webhookUrl,
  webhookSecret,
}: WebsiteIntegrationDocsProps) {
  const [activePlatform, setActivePlatform] = useState<PlatformTab>("wordpress");
  const [copiedCode, setCopiedCode] = useState(false);
  const [showJsonSchema, setShowJsonSchema] = useState(false);

  // Live Test Sandbox State
  const [testTitle, setTestTitle] = useState("Offre Exceptionnelle : Nouvelle Collection Été 2026");
  const [testDescription, setTestDescription] = useState(
    "Profitez de -30% sur tous nos articles dès aujourd'hui en boutique et sur notre site web. Livraison rapide disponible !"
  );
  const [testUrl, setTestUrl] = useState("https://yamoura.com/produit/collection-ete");
  const [testImageUrl, setTestImageUrl] = useState(
    "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1080&auto=format&fit=crop&q=80"
  );
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    status?: number;
    message?: string;
    details?: any;
  } | null>(null);

  const displaySecret = webhookSecret || "VOTRE_CLE_SECRETE_ICI";

  // Code snippets generator
  const getCodeSnippet = (platform: PlatformTab) => {
    switch (platform) {
      case "wordpress":
        return `<?php
/**
 * Intégration Automatique WordPress / WooCommerce vers Fundoral
 * À coller dans le fichier functions.php de votre thème enfant ou via le plugin "Code Snippets".
 */

function fundoral_send_post_to_webhook($new_status, $old_status, $post) {
    // Déclencher uniquement lors de la première publication d'un article ou produit
    if ($new_status !== 'publish' || $old_status === 'publish') {
        return;
    }

    // Autoriser les articles ('post') et les produits WooCommerce ('product')
    if (!in_array($post->post_type, array('post', 'product'))) {
        return;
    }

    // Récupérer l'image à la une
    $thumbnail_id = get_post_thumbnail_id($post->ID);
    $image_url    = $thumbnail_id ? wp_get_attachment_image_url($thumbnail_id, 'full') : '';

    // Préparer le payload structuré
    $payload = array(
        'title'       => get_the_title($post->ID),
        'description' => wp_strip_all_tags(get_the_excerpt($post->ID)),
        'url'         => get_permalink($post->ID),
        'imageUrl'    => $image_url,
        'format'      => 'feed', // 'feed', 'reel' ou 'story'
        'autoPublish' => true,
    );

    // Envoi HTTP POST sécurisé vers votre passerelle Fundoral
    wp_remote_post('${webhookUrl}', array(
        'method'      => 'POST',
        'timeout'     => 15,
        'headers'     => array(
            'Content-Type'     => 'application/json',
            'x-webhook-secret' => '${displaySecret}',
        ),
        'body'        => wp_json_encode($payload),
        'data_format' => 'body',
    ));
}

add_action('transition_post_status', 'fundoral_send_post_to_webhook', 10, 3);
`;

      case "shopify":
        return `// ============================================================================
// GUIDE DE CONFIGURATION SHOPIFY WEBHOOK (Sans code requis)
// ============================================================================
//
// 1. Rendez-vous sur votre panneau administrateur Shopify.
// 2. Allez dans : Paramètres (en bas à gauche) > Notifications > Webhooks.
// 3. Cliquez sur le bouton "Créer un webhook".
// 4. Configurez les options comme suit :
//    - Événement : "Création de produit" (products/create)
//    - Format : JSON
//    - URL de l'URL cible : ${webhookUrl}
//    - Version de l'API webhook : Dernière version recommandée
// 5. Cliquez sur "Enregistrer".
//
// 6. Si vous utilisez une fonction Liquid ou script backend relais, transmettez :
//    Header : x-webhook-secret: ${displaySecret}
//    Payload : { "title": product.title, "description": product.body_html, "url": product.url }
`;

      case "curl":
        return `curl -X POST "${webhookUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${displaySecret}" \\
  -d '{
    "title": "Nouvelle Offre Spéciale Boutique",
    "description": "Découvrez notre sélection exclusive avec livraison rapide disponible.",
    "url": "https://votresite.com/article-ou-produit",
    "imageUrl": "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1080",
    "format": "feed",
    "autoPublish": true
  }'`;

      case "javascript":
        return `/**
 * Envoi d'une annonce vers Fundoral en JavaScript / TypeScript / Node.js
 */
async function sendToFundoral(listing) {
  const response = await fetch("${webhookUrl}", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-webhook-secret": "${displaySecret}",
    },
    body: JSON.stringify({
      title: listing.title,
      description: listing.description,
      url: listing.url,
      imageUrl: listing.imageUrl,
      format: "feed",       // Options: "feed" | "reel" | "story"
      autoPublish: true,     // true pour diffuser directement, false pour brouillon
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Erreur lors de l'envoi du webhook");
  }
  return data;
}

// Exemple d'utilisation :
// sendToFundoral({
//   title: "Chaussures Sport Pro 2026",
//   description: "Idéales pour running et entraînement intensif.",
//   url: "https://monsite.com/produits/shoes-pro",
//   imageUrl: "https://monsite.com/images/shoes.jpg"
// }).then(res => console.log("Publié avec succès:", res));
`;

      case "python":
        return `# -*- coding: utf-8 -*-
"""
Envoi automatique d'annonces vers Fundoral en Python (Django, FastAPI, Flask, script autonome)
"""
import requests

FUNDORAL_WEBHOOK_URL = "${webhookUrl}"
FUNDORAL_WEBHOOK_SECRET = "${displaySecret}"

def publish_to_fundoral(title: str, description: str, url: str, image_url: str, auto_publish: bool = True):
    payload = {
        "title": title,
        "description": description,
        "url": url,
        "imageUrl": image_url,
        "format": "feed",
        "autoPublish": auto_publish,
    }
    
    headers = {
        "Content-Type": "application/json",
        "x-webhook-secret": FUNDORAL_WEBHOOK_SECRET,
    }
    
    response = requests.post(
        FUNDORAL_WEBHOOK_URL,
        json=payload,
        headers=headers,
        timeout=15
    )
    
    response.raise_for_status()
    return response.json()

# Exemple d'appel :
# result = publish_to_fundoral(
#     title="Super Promotion Smartphone",
#     description="Remise de 20% valable jusqu'à dimanche.",
#     url="https://monsite.com/phones/galaxy",
#     image_url="https://monsite.com/images/phone.jpg"
# )
# print("Résultat :", result)
`;
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(getCodeSnippet(activePlatform));
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleRunLiveTest = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(webhookSecret ? { "x-webhook-secret": webhookSecret } : {}),
        },
        body: JSON.stringify({
          title: testTitle,
          description: testDescription,
          url: testUrl,
          imageUrl: testImageUrl,
          format: "feed",
          autoPublish: false, // Don't spam real facebook page during test
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        setTestResult({
          success: true,
          status: response.status,
          message: data.message || "Webhook reçu et traité avec succès ! L'annonce est prête dans votre file d'attente.",
          details: data,
        });
      } else {
        setTestResult({
          success: false,
          status: response.status,
          message: data.error || `Erreur HTTP ${response.status}`,
          details: data,
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || "Impossible de joindre le serveur. Vérifiez votre connexion.",
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6 pt-2">
      {/* Header section with badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-rose-500/20 bg-rose-500/[0.03]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Code size={18} className="text-rose-500" />
            <h4 className="text-sm font-bold text-foreground">
              Guide d&apos;Intégration &amp; Documentation de Votre Passerelle
            </h4>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Automatisez la diffusion de vos nouveaux articles, produits et annonces vers vos réseaux dès qu&apos;ils sont publiés sur votre site.
          </p>
        </div>
        <span className="self-start sm:self-auto inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-500 border border-emerald-500/20 shadow-sm shrink-0">
          <CheckCircle size={14} weight="fill" />
          Protocole REST / JSON Ouvert
        </span>
      </div>

      {/* Code Snippets Generator Tabs */}
      <div className="rounded-2xl border border-border/70 bg-surface overflow-hidden shadow-sm">
        {/* Tab Headers */}
        <div className="flex items-center justify-between border-b border-border/60 bg-surface-2/40 px-3 py-2 overflow-x-auto">
          <div className="flex items-center gap-1">
            {[
              { id: "wordpress", label: "WordPress & WooCommerce", icon: Globe },
              { id: "shopify", label: "Shopify (No-Code)", icon: Storefront },
              { id: "curl", label: "cURL / Terminal", icon: Terminal },
              { id: "javascript", label: "JavaScript / Node", icon: Code },
              { id: "python", label: "Python", icon: Code },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activePlatform === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActivePlatform(tab.id as PlatformTab)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap",
                    isActive
                      ? "bg-rose-500 text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-surface-2"
                  )}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={handleCopyCode}
            className="text-xs h-7 ml-2 shrink-0 bg-surface"
          >
            {copiedCode ? (
              <>
                <Check size={12} className="text-emerald-500 mr-1" />
                <span className="text-emerald-500 font-bold">Copié !</span>
              </>
            ) : (
              <>
                <Copy size={12} className="mr-1" />
                <span>Copier le code</span>
              </>
            )}
          </Button>
        </div>

        {/* Code Content Box */}
        <div className="relative p-4 bg-zinc-950 text-zinc-100 font-mono text-xs overflow-x-auto max-h-96">
          <pre className="leading-relaxed select-all">
            <code>{getCodeSnippet(activePlatform)}</code>
          </pre>
        </div>
      </div>

      {/* Interactive JSON Schema Accordion */}
      <div className="rounded-xl border border-border/70 bg-surface-2/30 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowJsonSchema(!showJsonSchema)}
          className="w-full flex items-center justify-between p-3.5 text-xs font-bold text-foreground hover:bg-surface-2 transition cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Info size={15} className="text-rose-500" />
            Spécification détaillée des champs JSON (Payload Reference)
          </span>
          <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
            {showJsonSchema ? "Masquer" : "Afficher les spécifications"}
            {showJsonSchema ? <CaretUp size={13} /> : <CaretDown size={13} />}
          </span>
        </button>

        {showJsonSchema && (
          <div className="p-4 pt-2 border-t border-border/50 space-y-3 animate-in fade-in duration-200">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border/60 text-[11px] uppercase tracking-wider text-muted-foreground">
                    <th className="py-2 pr-4 font-bold">Champ</th>
                    <th className="py-2 pr-4 font-bold">Type</th>
                    <th className="py-2 pr-4 font-bold">Statut</th>
                    <th className="py-2 pr-4 font-bold">Description</th>
                    <th className="py-2 font-bold">Exemple</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 text-[11px]">
                  <tr>
                    <td className="py-2.5 pr-4 font-mono font-bold text-rose-500">title</td>
                    <td className="py-2.5 pr-4 text-muted-foreground font-mono">string</td>
                    <td className="py-2.5 pr-4">
                      <span className="rounded bg-rose-500/10 text-rose-500 px-1.5 py-0.5 font-bold text-[10px]">
                        Obligatoire
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-foreground">
                      Titre de l&apos;annonce, de l&apos;article ou du produit
                    </td>
                    <td className="py-2.5 font-mono text-muted-foreground">
                      &quot;Appartement 3 pièces Bonapriso&quot;
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-4 font-mono font-bold text-foreground">description</td>
                    <td className="py-2.5 pr-4 text-muted-foreground font-mono">string</td>
                    <td className="py-2.5 pr-4">
                      <span className="rounded bg-surface-3 text-muted-foreground px-1.5 py-0.5 text-[10px]">
                        Optionnel
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-foreground">
                      Texte complet ou résumé (l&apos;IA synthétise automatiquement un post percutant)
                    </td>
                    <td className="py-2.5 font-mono text-muted-foreground">
                      &quot;Idéalement situé, sécurisé avec parking...&quot;
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-4 font-mono font-bold text-foreground">url</td>
                    <td className="py-2.5 pr-4 text-muted-foreground font-mono">string</td>
                    <td className="py-2.5 pr-4">
                      <span className="rounded bg-surface-3 text-muted-foreground px-1.5 py-0.5 text-[10px]">
                        Recommandé
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-foreground">
                      Lien direct vers la page de vente sur votre site
                    </td>
                    <td className="py-2.5 font-mono text-muted-foreground">
                      &quot;https://monsite.com/annonces/123&quot;
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-4 font-mono font-bold text-foreground">imageUrl</td>
                    <td className="py-2.5 pr-4 text-muted-foreground font-mono">string</td>
                    <td className="py-2.5 pr-4">
                      <span className="rounded bg-surface-3 text-muted-foreground px-1.5 py-0.5 text-[10px]">
                        Optionnel
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-foreground">
                      URL publique de l&apos;image principale à publier sur Facebook
                    </td>
                    <td className="py-2.5 font-mono text-muted-foreground">
                      &quot;https://monsite.com/uploads/photo.jpg&quot;
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-4 font-mono font-bold text-foreground">format</td>
                    <td className="py-2.5 pr-4 text-muted-foreground font-mono">&quot;feed&quot; | &quot;reel&quot; | &quot;story&quot;</td>
                    <td className="py-2.5 pr-4">
                      <span className="rounded bg-surface-3 text-muted-foreground px-1.5 py-0.5 text-[10px]">
                        Optionnel (défaut: &quot;feed&quot;)
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-foreground">Format de publication cible</td>
                    <td className="py-2.5 font-mono text-muted-foreground">&quot;feed&quot;</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-4 font-mono font-bold text-foreground">autoPublish</td>
                    <td className="py-2.5 pr-4 text-muted-foreground font-mono">boolean</td>
                    <td className="py-2.5 pr-4">
                      <span className="rounded bg-surface-3 text-muted-foreground px-1.5 py-0.5 text-[10px]">
                        Optionnel (défaut: true)
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-foreground">
                      Si true, publie instantanément sur Facebook. Si false, place en brouillon dans la file d&apos;attente.
                    </td>
                    <td className="py-2.5 font-mono text-muted-foreground">true</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-3 rounded-lg bg-surface border border-border/60 text-[11px] text-muted-foreground flex items-start gap-2">
              <Sparkle size={15} className="text-amber-500 shrink-0 mt-0.5" />
              <p>
                <strong>Magie IA intégrée :</strong> Même si votre site n&apos;envoie qu&apos;un titre et une courte description, le moteur d&apos;IA de Fundoral formate automatiquement le texte en style vendeur adapté à Facebook, avec accroche, émojis et hashtags calibrés selon votre identité de marque !
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Live Webhook Sandbox Simulator */}
      <div className="p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.03] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-500/20 pb-3">
          <div className="flex items-center gap-2">
            <PaperPlaneTilt size={18} className="text-emerald-500" />
            <div>
              <h4 className="text-xs font-bold text-foreground">
                Bac à Sable Interactif : Simuler un Envoi Webhook en Direct
              </h4>
              <p className="text-[11px] text-muted-foreground">
                Testez la réception sans attendre l&apos;intégration sur votre site. Une annonce fictive sera envoyée à votre passerelle.
              </p>
            </div>
          </div>
          <span className="rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-bold px-2.5 py-0.5 self-start sm:self-auto">
            Mode simulation sécurisé
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="font-semibold text-foreground block mb-1">Titre de l&apos;annonce / produit :</label>
            <input
              value={testTitle}
              onChange={(e) => setTestTitle(e.target.value)}
              className="w-full rounded-xl border border-border/70 bg-surface px-3 py-2 text-xs text-foreground outline-none focus:border-emerald-500"
              placeholder="Ex: Villa de standing 4 chambres"
            />
          </div>

          <div>
            <label className="font-semibold text-foreground block mb-1">Lien de la page :</label>
            <input
              value={testUrl}
              onChange={(e) => setTestUrl(e.target.value)}
              className="w-full rounded-xl border border-border/70 bg-surface px-3 py-2 text-xs text-foreground outline-none focus:border-emerald-500"
              placeholder="Ex: https://monsite.com/annonces/123"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="font-semibold text-foreground block mb-1">Description / Extrait :</label>
            <textarea
              rows={2}
              value={testDescription}
              onChange={(e) => setTestDescription(e.target.value)}
              className="w-full rounded-xl border border-border/70 bg-surface px-3 py-2 text-xs text-foreground outline-none focus:border-emerald-500 resize-none"
              placeholder="Ex: Superbe opportunité à saisir..."
            />
          </div>

          <div className="sm:col-span-2">
            <label className="font-semibold text-foreground block mb-1">URL de l&apos;image d&apos;illustration :</label>
            <input
              value={testImageUrl}
              onChange={(e) => setTestImageUrl(e.target.value)}
              className="w-full rounded-xl border border-border/70 bg-surface px-3 py-2 text-xs text-foreground outline-none focus:border-emerald-500 font-mono"
              placeholder="Ex: https://images.unsplash.com/..."
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <p className="text-[11px] text-muted-foreground">
            L&apos;annonce sera reçue et enregistrée en mode brouillon pour vérification sans publication sauvage.
          </p>
          <Button
            size="sm"
            onClick={handleRunLiveTest}
            loading={isTesting}
            className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-500/20 text-xs px-5 h-9 shrink-0"
          >
            <PaperPlaneTilt size={14} className="mr-1.5" />
            Simuler l&apos;envoi Webhook
          </Button>
        </div>

        {/* Test Result Message Box */}
        {testResult && (
          <div
            className={cn(
              "p-3.5 rounded-xl border text-xs space-y-1 animate-in fade-in duration-200",
              testResult.success
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-destructive/10 border-destructive/30 text-destructive"
            )}
          >
            <div className="flex items-center gap-1.5 font-bold">
              {testResult.success ? (
                <>
                  <CheckCircle size={16} weight="fill" className="text-emerald-500" />
                  <span>Succès 200 OK — Passerelle opérationnelle</span>
                </>
              ) : (
                <>
                  <WarningCircle size={16} weight="bold" />
                  <span>Échec de traitement</span>
                </>
              )}
            </div>
            <p className="text-[11px] leading-relaxed text-foreground">
              {testResult.message}
            </p>
            {testResult.details && (
              <pre className="mt-2 p-2 rounded-lg bg-black/40 text-[10px] font-mono text-zinc-300 overflow-x-auto">
                {JSON.stringify(testResult.details, null, 2)}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default WebsiteIntegrationDocs;
