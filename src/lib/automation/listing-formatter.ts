import type { ListingWebhookPayload } from "@/lib/types";

function getCategoryEmoji(category?: string): string {
  if (!category) return "🏷️";
  const cat = category.toLowerCase();
  if (cat.includes("immo") || cat.includes("maison") || cat.includes("appart") || cat.includes("villa") || cat.includes("terrain")) {
    return "🏠";
  }
  if (cat.includes("véhicule") || cat.includes("auto") || cat.includes("voiture") || cat.includes("moto")) {
    return "🚗";
  }
  if (cat.includes("service") || cat.includes("emploi") || cat.includes("travail")) {
    return "💼";
  }
  if (cat.includes("phone") || cat.includes("téléphone") || cat.includes("électro") || cat.includes("ordi")) {
    return "📱";
  }
  if (cat.includes("mode") || cat.includes("vêtement") || cat.includes("chaussure")) {
    return "👗";
  }
  return "✨";
}

/**
 * Formats an incoming listing into an engaging, high-converting Facebook post message.
 */
export function formatListingForFacebook(
  listing: ListingWebhookPayload,
  utmSuffix = ""
): {
  title: string;
  description: string;
  fullMessage: string;
  hashtags: string[];
} {
  const catEmoji = getCategoryEmoji(listing.category);
  const headline = `🔥 NOUVELLE ANNONCE : ${listing.title.toUpperCase()}`;

  const details: string[] = [];
  if (listing.price?.trim()) {
    details.push(`💰 Prix : ${listing.price.trim()}`);
  }
  if (listing.location?.trim()) {
    details.push(`📍 Localisation : ${listing.location.trim()}`);
  }
  if (listing.category?.trim()) {
    details.push(`${catEmoji} Catégorie : ${listing.category.trim()}`);
  }

  const detailsSection = details.join("\n");
  const descSection = listing.description?.trim()
    ? `📝 Description :\n${listing.description.trim()}`
    : "";

  const link = listing.listingUrl?.trim()
    ? `${listing.listingUrl.trim()}${utmSuffix ? (listing.listingUrl.includes("?") ? `&${utmSuffix.replace(/^\?/, "")}` : `?${utmSuffix.replace(/^\?/, "")}`) : ""}`
    : "";

  const ctaSection = link
    ? `👉 Voir l'annonce complète et contacter le vendeur :\n🔗 ${link}`
    : "";

  const cleanCategoryTag = (listing.category || "Annonce")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 20);

  const hashtags = [
    "Yamoura",
    "PetitesAnnonces",
    cleanCategoryTag,
    "Opportunite",
    "AchatVente",
  ].filter(Boolean);

  const tagsLine = hashtags.map((h) => `#${h}`).join(" ");

  const fullMessage = [headline, detailsSection, descSection, ctaSection, tagsLine]
    .filter(Boolean)
    .join("\n\n");

  return {
    title: headline,
    description: listing.description || "",
    fullMessage,
    hashtags,
  };
}

/**
 * Formats an incoming listing for WhatsApp (with bold, emojis and clean links).
 */
export function formatListingForWhatsApp(listing: ListingWebhookPayload): string {
  const catEmoji = getCategoryEmoji(listing.category);

  const lines: string[] = [
    `*🔥 NOUVELLE ANNONCE SUR YAMOURA*`,
    `*${listing.title.trim()}*`,
    "",
  ];

  if (listing.price?.trim()) {
    lines.push(`💰 *Prix :* ${listing.price.trim()}`);
  }
  if (listing.location?.trim()) {
    lines.push(`📍 *Localisation :* ${listing.location.trim()}`);
  }
  if (listing.category?.trim()) {
    lines.push(`${catEmoji} *Catégorie :* ${listing.category.trim()}`);
  }

  if (listing.description?.trim()) {
    lines.push("");
    lines.push(`📝 *Détails :*`);
    lines.push(listing.description.trim());
  }

  if (listing.listingUrl?.trim()) {
    lines.push("");
    lines.push(`👉 *Consulter l'annonce et contacter le vendeur :*`);
    lines.push(`${listing.listingUrl.trim()}`);
  }

  return lines.join("\n");
}
