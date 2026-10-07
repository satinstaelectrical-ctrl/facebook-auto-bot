import { randomUUID } from "crypto";
import { env } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { ImageSource, ImageSourcePref } from "@/lib/types";

const STORAGE_BUCKET = "post-images";

// Square reads well in the Facebook feed on both mobile and desktop, and
// avoids the centre-crop that wide images get in the timeline.
const WIDTH = 1200;
const HEIGHT = 1200;

export function resolveImageSource(pref: ImageSourcePref): ImageSource {
  if (pref === "mixed") return Math.random() < 0.5 ? "ai" : "stock";
  return pref;
}

/**
 * Topics phrased as listicles ("easy weeknight dinner ideas") make the model
 * return a grid of thumbnails, which reads as a stock collage in the feed.
 * Steering it toward one photographed subject fixes that.
 */
const PHOTO_STYLE =
  "single subject, professional photograph, natural light, shallow depth of field, high detail, no text, no watermark, no collage, no grid";

async function fetchAiImageBytes(prompt: string): Promise<Blob> {
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(
    `${prompt}, ${PHOTO_STYLE}`
  )}?width=${WIDTH}&height=${HEIGHT}&nologo=true&seed=${Math.floor(Math.random() * 1_000_000)}`;

  const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`Pollinations image API ${res.status}`);
  return res.blob();
}

async function fetchStockImageBytes(query: string): Promise<Blob> {
  if (!env.pexelsApiKey) throw new Error("PEXELS_API_KEY is not configured");

  const searchUrl = `https://api.pexels.com/v1/search?${new URLSearchParams({
    query,
    orientation: "square",
    per_page: "10",
  })}`;
  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: env.pexelsApiKey },
    signal: AbortSignal.timeout(15_000),
  });
  if (!searchRes.ok) throw new Error(`Pexels search failed (${searchRes.status})`);
  const data = await searchRes.json();
  const photos: Array<{ src: { large2x: string; large: string } }> = data.photos ?? [];
  if (photos.length === 0) throw new Error("No stock photos found for this topic");

  const chosen = photos[Math.floor(Math.random() * photos.length)];
  const imageRes = await fetch(chosen.src.large2x ?? chosen.src.large, {
    signal: AbortSignal.timeout(20_000),
  });
  if (!imageRes.ok) throw new Error("Failed to download chosen stock photo");
  return imageRes.blob();
}

/**
 * Generates or sources a post image, then re-hosts it in our own Supabase
 * Storage bucket rather than linking the free provider's URL directly. Both
 * free providers are best-effort community services with no uptime guarantee —
 * re-hosting means a post's image keeps working forever, and Facebook's own
 * fetcher (which downloads the image itself at publish time) always sees a
 * stable, fast, first-party URL.
 */
export async function generateImage(
  prompt: string,
  pref: ImageSourcePref
): Promise<{ url: string; source: ImageSource }> {
  const source = resolveImageSource(pref);

  let blob: Blob;
  try {
    blob = source === "ai" ? await fetchAiImageBytes(prompt) : await fetchStockImageBytes(prompt);
  } catch (err) {
    // Fall back to the other free source rather than failing the whole generation.
    const fallbackSource: ImageSource = source === "ai" ? "stock" : "ai";
    try {
      blob =
        fallbackSource === "ai"
          ? await fetchAiImageBytes(prompt)
          : await fetchStockImageBytes(prompt);
      return await upload(blob, fallbackSource);
    } catch {
      throw err instanceof Error ? err : new Error("Image generation failed");
    }
  }

  return upload(blob, source);
}

async function upload(blob: Blob, source: ImageSource): Promise<{ url: string; source: ImageSource }> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const url = await uploadImageBytes(bytes, blob.type || "image/jpeg");
  return { url, source };
}

/**
 * Uploads raw media (image or video) bytes into Supabase Storage bucket with resilient fallback
 * to local public server storage. Accepts any file size without restriction.
 */
export async function uploadMediaBytes(
  bytes: Uint8Array,
  contentType = "image/jpeg",
  baseUrl?: string
): Promise<string> {
  const db = supabaseAdmin();
  let ext = "jpg";
  if (contentType.includes("mp4")) ext = "mp4";
  else if (contentType.includes("quicktime")) ext = "mov";
  else if (contentType.includes("webm")) ext = "webm";
  else if (contentType.includes("png")) ext = "png";
  else if (contentType.includes("webp")) ext = "webp";
  else if (contentType.includes("gif")) ext = "gif";

  const datePrefix = new Date().toISOString().slice(0, 10);
  const fileName = `${randomUUID()}.${ext}`;
  const path = `${datePrefix}/${fileName}`;

  try {
    let { error } = await db.storage.from(STORAGE_BUCKET).upload(path, bytes, {
      contentType,
      upsert: false,
    });

    if (error && error.message?.toLowerCase().includes("bucket not found")) {
      await db.storage.createBucket(STORAGE_BUCKET, { public: true }).catch(() => {});
      const retry = await db.storage.from(STORAGE_BUCKET).upload(path, bytes, {
        contentType,
        upsert: false,
      });
      error = retry.error;
    }

    if (!error) {
      const { data } = db.storage.from(STORAGE_BUCKET).getPublicUrl(path);
      if (data?.publicUrl) {
        return data.publicUrl;
      }
    } else {
      console.warn("Supabase Storage upload warning, switching to direct public server storage fallback:", error.message);
    }
  } catch (supabaseErr) {
    console.warn("Supabase Storage unreachable or rejected upload, switching to direct storage fallback:", supabaseErr);
  }

  // Resilient fallback: write directly to public/uploads/
  try {
    const fs = await import("fs/promises");
    const nodePath = await import("path");
    const uploadDir = nodePath.join(process.cwd(), "public", "uploads", datePrefix);
    await fs.mkdir(uploadDir, { recursive: true });
    const localFilePath = nodePath.join(uploadDir, fileName);
    await fs.writeFile(localFilePath, Buffer.from(bytes));

    const origin = (baseUrl || env.siteUrl || "https://fundoral.shop").replace(/\/+$/, "");
    return `${origin}/uploads/${datePrefix}/${fileName}`;
  } catch (fsErr) {
    console.error("Local disk storage fallback failed:", fsErr);
    throw new Error("Échec du téléversement du média.");
  }
}

/**
 * Uploads raw image bytes into the Supabase Storage bucket and returns the public URL.
 */
export async function uploadImageBytes(
  bytes: Uint8Array,
  contentType = "image/jpeg",
  baseUrl?: string
): Promise<string> {
  return uploadMediaBytes(bytes, contentType, baseUrl);
}


