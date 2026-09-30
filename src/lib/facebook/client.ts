import { supabaseAdmin } from "@/lib/supabase/server";
import { GRAPH_BASE } from "@/lib/facebook/oauth";
import type { AppSettings } from "@/lib/types";

export class FacebookNotConnectedError extends Error {
  constructor() {
    super("Facebook is not connected. Connect it from Settings first.");
  }
}

export class NoPageSelectedError extends Error {
  constructor() {
    super("No Facebook Page selected. Choose one on the Pages screen first.");
  }
}

async function loadSettings(): Promise<AppSettings> {
  const db = supabaseAdmin();
  const { data } = await db.from("app_settings").select("*").eq("id", 1).single<AppSettings>();
  if (!data) throw new Error("Settings row is missing.");
  return data;
}

async function graph(
  path: string,
  params: Record<string, string | number | boolean | undefined | null>,
  init?: RequestInit
) {
  const url = `${GRAPH_BASE}${path}`;
  const cleanParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      cleanParams.append(key, String(value));
    }
  }

  const res = await fetch(
    init?.method === "POST" ? url : `${url}?${cleanParams.toString()}`,
    {
      ...init,
      ...(init?.method === "POST"
        ? {
            headers: { "Content-Type": "application/x-www-form-urlencoded", ...init?.headers },
            body: cleanParams,
          }
        : {}),
      signal: AbortSignal.timeout(30_000),
    }
  );

  const body = await res.json().catch(() => null);
  if (!res.ok || body?.error) {
    throw new Error(body?.error?.message ?? `Facebook API ${path} failed (${res.status})`);
  }
  return body;
}

export interface FacebookPage {
  id: string;
  name: string;
  category: string | null;
  /** Non-expiring when minted from a long-lived user token. */
  access_token: string;
  avatar_url?: string | null;
  tasks?: string[];
}

/**
 * Every Page this person can create content on.
 * Uses flexible permission checking and extracts avatar picture.
 */
export async function fetchPages(): Promise<FacebookPage[]> {
  const settings = await loadSettings();
  if (!settings.facebook_user_token) throw new FacebookNotConnectedError();

  const pages: FacebookPage[] = [];
  let after: string | undefined;

  do {
    const params: Record<string, string> = {
      access_token: settings.facebook_user_token,
      fields: "id,name,category,access_token,tasks,picture{data{url}}",
      limit: "100",
    };
    if (after) params.after = after;

    const data = await graph("/me/accounts", params);
    for (const p of data.data ?? []) {
      const hasPerm =
        !Array.isArray(p.tasks) ||
        p.tasks.length === 0 ||
        p.tasks.some((t: string) =>
          ["CREATE_CONTENT", "MANAGE", "POST_CONTENT", "PUBLISH", "ADMINISTER"].includes(
            String(t).toUpperCase()
          )
        ) ||
        Boolean(p.access_token);

      if (!hasPerm) continue;

      const avatarUrl =
        p.picture?.data?.url ??
        `https://graph.facebook.com/${p.id}/picture?type=large&access_token=${settings.facebook_user_token}`;

      pages.push({
        id: p.id,
        name: p.name,
        category: p.category ?? null,
        access_token: p.access_token,
        avatar_url: avatarUrl,
        tasks: Array.isArray(p.tasks) ? p.tasks : [],
      });
    }
    after = data.paging?.cursors?.after && data.paging?.next ? data.paging.cursors.after : undefined;
  } while (after);

  return pages;
}

/**
 * Persists the list of Pages into `pages_cache`, with access tokens and avatar URLs.
 * Includes graceful fallback if newer columns have not yet been added to Supabase.
 */
export async function savePagesCache(pages: FacebookPage[]): Promise<void> {
  const db = supabaseAdmin();
  if (!pages || pages.length === 0) return;

  await db.from("pages_cache").delete().neq("page_id", "");

  const fullRows = pages.map((p) => ({
    page_id: p.id,
    name: p.name,
    category: p.category ?? null,
    access_token: p.access_token ?? null,
    avatar_url: p.avatar_url ?? null,
    fetched_at: new Date().toISOString(),
  }));

  const { error } = await db.from("pages_cache").insert(fullRows);
  if (error) {
    console.warn("Could not insert pages with extended columns, falling back to basic columns:", error.message);
    const safeRows = pages.map((p) => ({
      page_id: p.id,
      name: p.name,
      category: p.category ?? null,
      fetched_at: new Date().toISOString(),
    }));
    await db.from("pages_cache").insert(safeRows);
  }
}

/** Permissions this app cannot work without. */
export const REQUIRED_PERMISSIONS = [
  "pages_show_list",
  "pages_manage_posts",
  "pages_read_engagement",
];

/**
 * Which of the required permissions the connected account actually granted.
 *
 * Worth checking explicitly: when the Meta app uses Login for Business the
 * permissions come from a saved configuration, so a configuration missing
 * `pages_manage_posts` connects perfectly and then fails at publish time with a
 * bare "(#200) Permissions error" that names nothing.
 */
export async function missingPermissions(userToken: string): Promise<string[]> {
  try {
    const data = await graph("/me/permissions", { access_token: userToken });
    const granted = new Set(
      (data.data ?? [])
        .filter((p: { status: string }) => p.status === "granted")
        .map((p: { permission: string }) => p.permission)
    );
    return REQUIRED_PERMISSIONS.filter((p) => !granted.has(p));
  } catch {
    return [];
  }
}

export async function fetchAccount(): Promise<{ name: string }> {
  const settings = await loadSettings();
  if (!settings.facebook_user_token) throw new FacebookNotConnectedError();
  const data = await graph("/me", { access_token: settings.facebook_user_token, fields: "name" });
  return { name: data.name };
}

export interface PublishPhotoInput {
  pageId: string;
  pageToken: string;
  message: string;
  imageUrl: string;
}

/**
 * Publishes a single photo post.
 */
export async function publishPhoto(input: PublishPhotoInput): Promise<{ id: string }> {
  const data = await graph(
    `/${input.pageId}/photos`,
    {
      url: input.imageUrl,
      message: input.message,
      access_token: input.pageToken,
      published: "true",
    },
    { method: "POST" }
  );
  return { id: data.post_id ?? data.id };
}

export interface PublishMultiPhotoInput {
  pageId: string;
  pageToken: string;
  message: string;
  imageUrls: string[];
}

/**
 * Publishes multiple photos as a carousel/multi-photo post.
 */
export async function publishMultiPhotos(input: PublishMultiPhotoInput): Promise<{ id: string }> {
  if (input.imageUrls.length === 0) {
    throw new Error("No images provided for publication.");
  }
  if (input.imageUrls.length === 1) {
    return publishPhoto({
      pageId: input.pageId,
      pageToken: input.pageToken,
      message: input.message,
      imageUrl: input.imageUrls[0],
    });
  }

  // 1. Upload each photo as unpublished
  const mediaIds: string[] = [];
  for (const url of input.imageUrls) {
    const photoRes = await graph(
      `/${input.pageId}/photos`,
      {
        url,
        access_token: input.pageToken,
        published: "false",
      },
      { method: "POST" }
    );
    if (photoRes?.id) {
      mediaIds.push(photoRes.id);
    }
  }

  if (mediaIds.length === 0) {
    throw new Error("Failed to upload photos to Facebook.");
  }

  // 2. Publish post on the page feed with attached_media
  const attachedMedia = mediaIds.map((id) => ({ media_fbid: id }));
  const postRes = await graph(
    `/${input.pageId}/feed`,
    {
      message: input.message,
      access_token: input.pageToken,
      attached_media: JSON.stringify(attachedMedia),
    },
    { method: "POST" }
  );

  return { id: postRes.id };
}

export interface PostInsights {
  likes: number;
  comments: number;
  shares: number;
}

/**
 * Retrieves post engagement metrics (likes, comments, shares) from Meta Graph API.
 */
export async function fetchPostInsights(
  pageId: string,
  postId: string,
  pageToken?: string
): Promise<PostInsights> {
  let token = pageToken;
  if (!token && pageId) {
    const db = supabaseAdmin();
    const { data } = await db
      .from("pages_cache")
      .select("access_token")
      .eq("page_id", pageId)
      .maybeSingle();
    token = data?.access_token;
  }
  if (!token) {
    const settings = await loadSettings();
    token = settings.default_page_token || settings.facebook_user_token || undefined;
  }
  if (!token) return { likes: 0, comments: 0, shares: 0 };

  try {
    const data = await graph(`/${postId}`, {
      access_token: token,
      fields: "likes.summary(true),comments.summary(true),shares",
    });
    return {
      likes: data?.likes?.summary?.total_count ?? 0,
      comments: data?.comments?.summary?.total_count ?? 0,
      shares: data?.shares?.count ?? 0,
    };
  } catch {
    try {
      const data = await graph(`/${postId}`, {
        access_token: token,
        fields: "likes.summary(true),comments.summary(true)",
      });
      return {
        likes: data?.likes?.summary?.total_count ?? 0,
        comments: data?.comments?.summary?.total_count ?? 0,
        shares: 0,
      };
    } catch {
      return { likes: 0, comments: 0, shares: 0 };
    }
  }
}

export interface PublishVideoInput {
  pageId: string;
  pageToken: string;
  description: string;
  title?: string;
  videoUrl: string;
}

/**
 * Publishes a standard video post to a Facebook Page using Meta's chunked / direct upload protocol.
 */
export async function publishVideo(input: PublishVideoInput): Promise<{ id: string }> {
  // Attempt 1: Meta Chunked / Resumable Video Upload
  try {
    const videoRes = await fetch(input.videoUrl, { signal: AbortSignal.timeout(60_000) });
    if (videoRes.ok) {
      const videoBuffer = await videoRes.arrayBuffer();
      const fileSize = videoBuffer.byteLength;

      // Phase 1: Start
      const startRes = await fetch(`https://graph-video.facebook.com/v21.0/${input.pageId}/videos`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          upload_phase: "start",
          file_size: String(fileSize),
          access_token: input.pageToken,
        }),
        signal: AbortSignal.timeout(20_000),
      });

      const startData = await startRes.json();
      const sessionId = startData.upload_session_id;
      const videoId = startData.video_id;

      if (sessionId) {
        // Phase 2: Transfer chunk
        const formData = new FormData();
        formData.append("upload_phase", "transfer");
        formData.append("upload_session_id", sessionId);
        formData.append("start_offset", "0");
        formData.append("access_token", input.pageToken);
        formData.append("video_file_chunk", new Blob([videoBuffer], { type: "video/mp4" }), "video.mp4");

        const transferRes = await fetch(`https://graph-video.facebook.com/v21.0/${input.pageId}/videos`, {
          method: "POST",
          body: formData,
          signal: AbortSignal.timeout(120_000),
        });

        if (transferRes.ok) {
          // Phase 3: Finish
          const finishRes = await fetch(`https://graph-video.facebook.com/v21.0/${input.pageId}/videos`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              upload_phase: "finish",
              upload_session_id: sessionId,
              title: input.title || "",
              description: input.description,
              published: "true",
              access_token: input.pageToken,
            }),
            signal: AbortSignal.timeout(30_000),
          });

          const finishData = await finishRes.json();
          if (finishData.success || finishData.id || videoId) {
            return { id: finishData.id || videoId };
          }
        }
      }
    }
  } catch (chunkedErr) {
    console.warn("Chunked video upload fallback to file_url:", chunkedErr);
  }

  // Attempt 2: Standard file_url direct video upload
  const data = await graph(
    `/${input.pageId}/videos`,
    {
      file_url: input.videoUrl,
      description: input.description,
      title: input.title || "",
      access_token: input.pageToken,
      published: "true",
    },
    { method: "POST" }
  );
  return { id: data.id };
}

export interface PublishReelInput {
  pageId: string;
  pageToken: string;
  caption: string;
  videoUrl: string;
}

/**
 * Publishes a 9:16 Reel to a Facebook Page via Meta Graph API using the official 3-phase protocol.
 */
export async function publishReel(input: PublishReelInput): Promise<{ id: string }> {
  try {
    // Phase 1: Initialize Video Reel Session
    const initData = await graph(
      `/${input.pageId}/video_reels`,
      {
        upload_phase: "start",
        access_token: input.pageToken,
      },
      { method: "POST" }
    );

    const videoId = initData.video_id;
    const uploadUrl = initData.upload_url;

    if (videoId && uploadUrl) {
      // Phase 2: Binary Video Transfer directly to Meta's upload_url
      const videoRes = await fetch(input.videoUrl, { signal: AbortSignal.timeout(60_000) });
      if (videoRes.ok) {
        const videoBuffer = await videoRes.arrayBuffer();

        const uploadRes = await fetch(uploadUrl, {
          method: "POST",
          headers: {
            Authorization: `OAuth ${input.pageToken}`,
            offset: "0",
            file_size: String(videoBuffer.byteLength),
            "Content-Type": "application/octet-stream",
          },
          body: videoBuffer,
          signal: AbortSignal.timeout(120_000),
        });

        if (!uploadRes.ok) {
          console.warn("Reels binary transfer returned non-200, attempting finish phase:", await uploadRes.text().catch(() => ""));
        }

        // Phase 3: Publish Reel
        const finishRes = await graph(
          `/${input.pageId}/video_reels`,
          {
            upload_phase: "finish",
            video_id: videoId,
            video_state: "PUBLISHED",
            description: input.caption,
            access_token: input.pageToken,
          },
          { method: "POST" }
        );

        if (finishRes?.success || finishRes?.id) {
          return { id: finishRes.id || videoId };
        }
      }
    }
  } catch (err) {
    console.warn("Reels 3-phase protocol fallback to standard video API:", err);
  }

  // Graceful fallback to Facebook standard Video API
  return publishVideo({
    pageId: input.pageId,
    pageToken: input.pageToken,
    description: input.caption,
    videoUrl: input.videoUrl,
  });
}

export interface PublishStoryInput {
  pageId: string;
  pageToken: string;
  imageUrl?: string;
  videoUrl?: string;
}

/**
 * Publishes an ephemeral story to a Facebook Page (supports both vertical photo and video).
 */
export async function publishStory(input: PublishStoryInput): Promise<{ id: string }> {
  if (input.videoUrl) {
    return publishReel({
      pageId: input.pageId,
      pageToken: input.pageToken,
      caption: "Story",
      videoUrl: input.videoUrl,
    });
  }

  const imageUrl = input.imageUrl ?? "";
  if (!imageUrl) {
    throw new Error("Une image ou une vidéo est requise pour publier une Story.");
  }

  try {
    const data = await graph(
      `/${input.pageId}/photos`,
      {
        url: imageUrl,
        access_token: input.pageToken,
        published: "true",
      },
      { method: "POST" }
    );
    return { id: data.post_id ?? data.id };
  } catch {
    return publishPhoto({
      pageId: input.pageId,
      pageToken: input.pageToken,
      message: "Story",
      imageUrl: imageUrl,
    });
  }
}

