import { NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/lib/env";
import {
  createSessionToken,
  SESSION_COOKIE,
  sessionCookieOptions,
  verifySessionToken,
} from "@/lib/auth/session";
import { generateContent } from "@/lib/ai/text";
import { generateImage, uploadImageBytes, uploadMediaBytes } from "@/lib/ai/image";
import { getTrendingTopics } from "@/lib/trends";
import {
  createPostRecord,
  deletePostRecord,
  getPost,
  listDuePosts,
  listPosts,
  updatePostRecord,
} from "@/lib/db/posts";
import { getSettings, updateSettings } from "@/lib/db/settings";
import {
  addTopics,
  deleteTopic,
  listTopics,
  MAX_TOPIC_LENGTH,
  nextTopic,
  TopicsTableMissingError,
  updateTopic,
} from "@/lib/db/topics";
import {
  fetchAccount,
  fetchPages,
  savePagesCache,
  fetchPostInsights,
  missingPermissions,
  FacebookNotConnectedError,
  fetchPageGroups,
  fetchUserGroups,
  fetchGroupInfo,
  fetchSoundCollectionTracks,
} from "@/lib/facebook/client";
import {
  buildAuthorizeUrl,
  exchangeCodeForToken,
  exchangeForLongLivedToken,
} from "@/lib/facebook/oauth";
import { getFacebookCredentials, isFacebookConfigured } from "@/lib/facebook/credentials";
import { OAUTH_STATE_COOKIE } from "@/lib/facebook/oauth-state";
import { publishPostNow } from "@/lib/facebook/publish";
import { maybeRunAutopilot } from "@/lib/autopilot";
import { supabaseAdmin } from "@/lib/supabase/server";
import {
  facebookPostUrl,
  type PostStatus,
  type PageGroup,
  type ConnectedWebsite,
  type PostFormat,
  type FacebookGroup,
} from "@/lib/types";

/**
 * Every API endpoint lives in this one catch-all handler on purpose.
 *
 * Next.js turns each `route.ts` into its own serverless function, and this
 * app's endpoints put the deployment over Vercel's per-deployment function
 * limit on the Hobby plan — the build succeeded every time and then died at
 * "Deploying outputs" with no log line explaining why. Collapsing them into one
 * dispatcher takes the deployment from ~16 functions to 2. The endpoint URLs
 * and behaviour are unchanged; only the file layout moved, and all real logic
 * still lives in `src/lib/*`.
 */

export const maxDuration = 60;

type Ctx = { params: Promise<{ path: string[] }> };

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status });
}

function notFound() {
  return json({ error: "Not found." }, 404);
}

function unauthorized() {
  return json({ error: "Unauthorized." }, 401);
}

/**
 * Routes reachable without the admin session.
 *
 * Everything else requires it. This app stores Meta app credentials and
 * non-expiring Page tokens, and the middleware deliberately does not cover
 * `/api/*`, so without this check the whole API — read settings, publish,
 * delete, disconnect — would be open to anyone who knew the deployment's URL.
 * The OAuth callback is exempt because it is a redirect back from Facebook and
 * is already protected by its single-use `state` cookie.
 */
import { encryptSecret, decryptSecret } from "@/lib/crypto";
import { createMetaAdBoost, listMetaCampaigns, verifyMetaAdAccount } from "@/lib/facebook/ads";
import { syncAllRssFeeds } from "@/lib/automation/rss";
import {
  formatListingForFacebook,
  formatListingForWhatsApp,
} from "@/lib/automation/listing-formatter";
import {
  testWhatsAppConnection,
  fetchWhatsAppGroups,
  sendWhatsAppListingToTarget,
  broadcastListingToWhatsApp,
} from "@/lib/whatsapp/client";
import { testOpenAIEndpoint } from "@/lib/ai/text";
import {
  logAutomationEvent,
  listAutomationLogs,
  getLastAutomationActivity,
} from "@/lib/automation/logger";
import type { ListingWebhookPayload } from "@/lib/types";

const OPEN_ROUTES = new Set([
  "auth/login",
  "auth/logout",
  "facebook/oauth/callback",
  "webhooks/publish-from-site",
  "webhooks/site-to-social",
  "webhooks/listings",
  "listings/webhook",
  "automation/test-webhook",
]);

async function hasSession(req: Request): Promise<boolean> {
  const token = req.headers
    .get("cookie")
    ?.split("; ")
    .find((c) => c.startsWith(`${SESSION_COOKIE}=`))
    ?.split("=")[1];
  return verifySessionToken(token);
}

/**
 * The cron route authenticates with CRON_SECRET when one is set. When it is
 * not, it falls back to requiring the admin session rather than being open —
 * an unset optional variable must not silently expose a publishing endpoint.
 */
async function cronAuthorized(req: Request, url: URL): Promise<boolean> {
  if (!env.cronSecret) return hasSession(req);
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${env.cronSecret}` || url.searchParams.get("secret") === env.cronSecret;
}

async function guard(route: string, req: Request, url: URL): Promise<Response | null> {
  if (OPEN_ROUTES.has(route)) return null;
  if (route === "cron/process-queue") {
    return (await cronAuthorized(req, url)) ? null : unauthorized();
  }
  return (await hasSession(req)) ? null : unauthorized();
}

async function safely(handler: () => Promise<Response>): Promise<Response> {
  try {
    return await handler();
  } catch (err) {
    console.error(err);
    return json({ error: err instanceof Error ? err.message : "Unexpected server error." }, 500);
  }
}

async function publicSettings(settings: Awaited<ReturnType<typeof getSettings>>) {
  const {
    facebook_user_token,
    default_page_token,
    facebook_app_secret,
    openai_api_key_encrypted,
    anthropic_api_key_encrypted,
    gemini_api_key_encrypted,
    openrouter_api_key_encrypted,
    whatsapp_api_key_encrypted,
    ...safe
  } = settings;
  return {
    ...safe,
    facebook_app_secret_set: Boolean(facebook_app_secret),
    facebook_connected: Boolean(facebook_user_token),
    facebook_page_ready: Boolean(default_page_token),
    facebook_configured: await isFacebookConfigured(),
    openai_configured: Boolean(openai_api_key_encrypted),
    anthropic_configured: Boolean(anthropic_api_key_encrypted),
    gemini_configured: Boolean(gemini_api_key_encrypted),
    openrouter_configured: Boolean(openrouter_api_key_encrypted),
    preferred_ai_provider: settings.preferred_ai_provider || "free",
    ai_model_name: settings.ai_model_name || "",
    openai_base_url: settings.openai_base_url || "https://api.openai.com/v1",
    webhook_secret: settings.webhook_secret || "",
    meta_ad_account_id: settings.meta_ad_account_id || "",
    rss_feeds: settings.rss_feeds || [],
    connected_websites: settings.connected_websites || [],
    page_groups: settings.page_groups || [],
    whatsapp_enabled: Boolean(settings.whatsapp_enabled),
    whatsapp_api_url: settings.whatsapp_api_url || "",
    whatsapp_instance_name: settings.whatsapp_instance_name || "yamoura-bot",
    whatsapp_target_groups: settings.whatsapp_target_groups || [],
    whatsapp_configured: Boolean(whatsapp_api_key_encrypted || settings.whatsapp_api_url),
    workspace_name: settings.workspace_name || "Fundoral Workspace",
    admin_email: settings.admin_email || "contact@fundoral.shop",
    brand_name: settings.brand_name || "Fundoral",
    brand_description: settings.brand_description || "",
    brand_tone: settings.brand_tone || "vendeur",
    brand_style: settings.brand_style || "moderne",
    brand_prohibited_words: settings.brand_prohibited_words || "",
    brand_hashtags: settings.brand_hashtags || "#business #marketing #automation",
    brand_signature: settings.brand_signature || "📍 Livraison rapide | 📲 WhatsApp disponible 24/7",
    language: settings.language || "fr",
    theme_preference: settings.theme_preference || "system",
  };
}

/**
 * Computes the canonical origin, taking into account reverse-proxy headers
 * (x-forwarded-proto, x-forwarded-host) and environment variables (APP_URL, NEXTAUTH_URL).
 * Guarantees https:// in production / non-localhost environments.
 */
function resolveCanonicalOrigin(req: Request, url: URL): string {
  if (
    env.siteUrl &&
    !env.siteUrl.includes("localhost") &&
    !env.siteUrl.includes("127.0.0.1") &&
    !env.siteUrl.includes("0.0.0.0")
  ) {
    return env.siteUrl;
  }

  const forwardedProto = req.headers.get("x-forwarded-proto");
  const forwardedHost = req.headers.get("x-forwarded-host") || req.headers.get("host");

  let proto = forwardedProto || url.protocol.replace(":", "") || "https";
  let host = forwardedHost || url.host;

  if (
    !host ||
    host.includes("localhost") ||
    host.includes("127.0.0.1") ||
    host.includes("0.0.0.0")
  ) {
    return "https://fundoral.shop";
  }

  proto = "https";
  return `${proto}://${host}`.replace(/\/+$/, "");
}

/* ------------------------------------------------------------------ GET */

export async function GET(req: Request, ctx: Ctx) {
  const { path } = await ctx.params;
  const route = path.join("/");
  const url = new URL(req.url);

  return safely(async () => {
    const denied = await guard(route, req, url);
    if (denied) return denied;

    if (route === "trends") {
      return json(await getTrendingTopics());
    }

    if (route === "settings") {
      return json(await publicSettings(await getSettings()));
    }

    if (route === "posts") {
      const status = url.searchParams.get("status");
      const posts = await listPosts({
        status: status ? (status.split(",") as PostStatus[]) : undefined,
      });
      return json({ posts });
    }

    if (route === "facebook/pages") {
      return getPages(url.searchParams.get("refresh") === "1");
    }

    if (route === "facebook/groups") {
      const pageId = url.searchParams.get("pageId");
      const settings = await getSettings();
      let pageToken = settings.default_page_token || "";

      if (pageId) {
        try {
          const db = supabaseAdmin();
          const { data: cached } = await db
            .from("pages_cache")
            .select("access_token")
            .eq("page_id", pageId)
            .maybeSingle();
          if (cached?.access_token) {
            pageToken = cached.access_token;
          }
        } catch {}
      }

      const groups: FacebookGroup[] = [];
      const seen = new Set<string>();

      // 1. Load persistently saved groups from Supabase
      try {
        const db = supabaseAdmin();
        const query = pageId
          ? db.from("facebook_groups").select("*").or(`page_id.eq.${pageId},page_id.is.null`)
          : db.from("facebook_groups").select("*");
        const { data: dbGroups } = await query;
        for (const g of dbGroups ?? []) {
          if (g.id && !seen.has(g.id)) {
            seen.add(g.id);
            groups.push({
              id: g.id,
              name: g.name,
              privacy: g.privacy || "PUBLIC",
              member_count: g.member_count ?? undefined,
              icon: g.icon ?? undefined,
              cover: g.cover ?? undefined,
              picture: g.cover || g.icon || undefined,
              link: g.link || `https://www.facebook.com/groups/${g.id}`,
              administrator: true,
              page_id: g.page_id ?? undefined,
            });
          }
        }
      } catch {}

      // Fallback: check pages_cache.linked_groups
      if (pageId) {
        try {
          const db = supabaseAdmin();
          const { data: pageRow } = await db
            .from("pages_cache")
            .select("linked_groups")
            .eq("page_id", pageId)
            .maybeSingle();
          if (Array.isArray(pageRow?.linked_groups)) {
            for (const g of pageRow.linked_groups) {
              if (g?.id && !seen.has(g.id)) {
                seen.add(g.id);
                groups.push(g);
              }
            }
          }
        } catch {}
      }

      // 2. Query live Meta Graph API for linked and community groups
      const newlyDiscovered: FacebookGroup[] = [];
      if (pageId && pageToken) {
        const pageGroups = await fetchPageGroups(pageId, pageToken).catch(() => []);
        for (const g of pageGroups) {
          if (!seen.has(g.id)) {
            seen.add(g.id);
            groups.push(g);
            newlyDiscovered.push(g);
          }
        }
      }

      // 3. Query user groups (administered or joined)
      if (settings.facebook_user_token) {
        const userGroups = await fetchUserGroups(settings.facebook_user_token).catch(() => []);
        for (const g of userGroups) {
          if (!seen.has(g.id)) {
            seen.add(g.id);
            groups.push(g);
            newlyDiscovered.push(g);
          }
        }
      }

      // 4. Background auto-save any newly detected groups to Supabase
      if (newlyDiscovered.length > 0) {
        try {
          const db = supabaseAdmin();
          for (const g of newlyDiscovered) {
            try {
              await db.from("facebook_groups").upsert({
                id: g.id,
                page_id: pageId || null,
                name: g.name,
                privacy: g.privacy || "PUBLIC",
                member_count: g.member_count || null,
                icon: g.icon || null,
                cover: g.cover || g.picture || null,
                link: g.link || `https://www.facebook.com/groups/${g.id}`,
              });
            } catch {}
          }
        } catch {}
      }

      return json({ groups });
    }

    if (route === "audio-proxy") {
      const audioUrl = url.searchParams.get("url");
      if (!audioUrl) return json({ error: "Paramètre url manquant." }, 400);

      try {
        const audioRes = await fetch(audioUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)",
            Accept: "*/*",
          },
        });

        if (!audioRes.ok) {
          return json({ error: `Audio stream failed with status ${audioRes.status}` }, audioRes.status);
        }

        const headers = new Headers();
        headers.set("Content-Type", audioRes.headers.get("content-type") || "audio/mpeg");
        headers.set("Access-Control-Allow-Origin", "*");
        headers.set("Cache-Control", "public, max-age=86400, s-maxage=86400");
        const cl = audioRes.headers.get("content-length");
        if (cl) headers.set("Content-Length", cl);
        headers.set("Accept-Ranges", "bytes");

        return new Response(audioRes.body, { status: 200, headers });
      } catch (streamErr) {
        return json({ error: "Échec du streaming du fichier audio." }, 502);
      }
    }

    if (route === "facebook/sound-collection") {
      const pageId = url.searchParams.get("pageId") || undefined;
      const query = url.searchParams.get("q") || undefined;
      const settings = await getSettings();
      let pageToken = settings.default_page_token || undefined;

      if (pageId) {
        try {
          const db = supabaseAdmin();
          const { data: cached } = await db
            .from("pages_cache")
            .select("access_token")
            .eq("page_id", pageId)
            .maybeSingle();
          if (cached?.access_token) {
            pageToken = cached.access_token;
          }
        } catch {}
      }

      const tracks = await fetchSoundCollectionTracks(pageId, pageToken, query).catch(() => []);
      return json({ tracks });
    }

    if (route === "topics") {
      const settings = await getSettings();
      const source = settings.topic_source ?? "mine";
      try {
        const [topics, next] = await Promise.all([listTopics(), nextTopic()]);
        return json({ ready: true, source, topics, nextId: next?.id ?? null });
      } catch (err) {
        // An install that predates topics: report it so the screen can say
        // how to upgrade, rather than failing the request.
        if (err instanceof TopicsTableMissingError) {
          return json({ ready: false, source, topics: [], nextId: null, message: err.message });
        }
        throw err;
      }
    }

    if (route === "facebook/oauth/start") {
      const origin = resolveCanonicalOrigin(req, url);
      const creds = await getFacebookCredentials(origin);
      if (!creds) {
        return redirectToSettings(
          origin,
          "error",
          "Add your Meta App ID and App Secret in Settings first, then try connecting again."
        );
      }

      // If a login configuration ID was passed via query params, apply it
      const queryConfigId =
        url.searchParams.get("config_id") ||
        url.searchParams.get("loginConfigId") ||
        url.searchParams.get("login_config_id");
      if (queryConfigId?.trim()) {
        creds.configId = queryConfigId.trim();
      }

      const state = crypto.randomUUID();
      const res = NextResponse.redirect(buildAuthorizeUrl(creds, state));
      res.cookies.set(OAUTH_STATE_COOKIE, state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production" || origin.startsWith("https://"),
        sameSite: "lax",
        path: "/",
        maxAge: 600,
      });
      return res;
    }

    if (route === "facebook/oauth/callback") {
      const origin = resolveCanonicalOrigin(req, url);
      return oauthCallback(req, url, origin);
    }

    if (route === "cron/process-queue") {
      return runCron(req, url);
    }

    // posts/<id>/insights
    if (path.length === 3 && path[0] === "posts" && path[2] === "insights") {
      const post = await getPost(path[1]);
      if (!post || !post.facebook_post_id) {
        return json({ insights: { likes: 0, comments: 0, shares: 0 } });
      }
      const insights = await fetchPostInsights(post.page_id ?? "", post.facebook_post_id);
      return json({ insights });
    }

    if (route === "facebook/ads/campaigns") {
      return json({ campaigns: await listMetaCampaigns() });
    }

    if (route === "automation/page-groups") {
      const settings = await getSettings();
      return json({ groups: settings.page_groups || [] });
    }

    if (route === "automation/connected-websites") {
      const settings = await getSettings();
      return json({ websites: settings.connected_websites || [] });
    }

    if (route === "team") {
      const settings = await getSettings();
      const owner = {
        id: "owner-1",
        name: settings.workspace_name || "Direction Entreprise",
        email: settings.admin_email || "contact@fundoral.shop",
        role: "owner" as const,
        status: "active" as const,
        joinedAt: "Espace Fondateur",
        isPrimaryOwner: true,
      };
      const members = [owner, ...(((settings as any).team_members as any[]) || [])];
      const logs = await listAutomationLogs(15);
      return json({ members, logs });
    }

    if (route === "whatsapp/logs") {
      const db = supabaseAdmin();
      const { data, error } = await db
        .from("whatsapp_broadcast_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      return json({ logs: data || [] });
    }

    if (route === "logs" || route === "automation/logs") {
      const logs = await listAutomationLogs(60);
      return json({ logs });
    }

    if (route === "automation/activity" || route === "automation/status") {
      const activity = await getLastAutomationActivity();
      return json(activity);
    }

    return notFound();
  });
}

/* ----------------------------------------------------------------- POST */

const LoginBody = z.object({ password: z.string() });

const ContentBody = z.object({
  topic: z.string().trim().min(2).max(200),
  tone: z.string().optional(),
  language: z.string().optional(),
});

const ImageBody = z.object({
  prompt: z.string().trim().min(2).max(300),
  source: z.enum(["ai", "stock", "mixed"]),
});

const CreatePostBody = z.object({
  topic: z.string().min(1).max(200),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  hashtags: z.array(z.string()).max(15).default([]),
  imageUrl: z.string().optional().default(""),
  imageSource: z.enum(["ai", "stock", "upload"]).default("ai"),
  mediaUrls: z.array(z.string()).optional(),
  videoUrl: z.string().optional().or(z.literal("")),
  postFormat: z.enum(["feed", "reel", "story", "video", "carousel"]).default("feed"),
  linkUrl: z.string().url().optional().or(z.literal("")),
  pageId: z.string().min(1),
  pageName: z.string().min(1),
  targetPageIds: z.array(z.string()).optional(),
  targetGroupIds: z.array(z.string()).optional(),
  audioName: z.string().optional().or(z.literal("")),
  audioUrl: z.string().optional().or(z.literal("")),
  audioTrackId: z.string().optional().or(z.literal("")),
  action: z.enum(["draft", "schedule", "post_now"]),
  scheduledAt: z.string().datetime().optional(),
});

const DefaultPageBody = z.object({ pageId: z.string().min(1) });

// A pasted list is split client-side into lines; 500 is far more than anyone
// types, and bounds a single request.
const AddTopicsBody = z.object({
  texts: z.array(z.string().max(MAX_TOPIC_LENGTH * 2)).min(1).max(500),
});

const CredentialsBody = z.object({
  appId: z.string().trim().min(5).max(64),
  // Optional so the UI can save an edited App ID without re-typing a secret it
  // never received in the first place.
  appSecret: z.string().trim().min(10).max(128).optional(),
  // Empty string clears it, for an app that uses classic Facebook Login.
  configId: z.string().trim().max(64).optional(),
});

export async function POST(req: Request, ctx: Ctx) {
  const { path } = await ctx.params;
  const route = path.join("/");
  const url = new URL(req.url);

  return safely(async () => {
    const denied = await guard(route, req, url);
    if (denied) return denied;

    if (route === "auth/login") {
      const parsed = LoginBody.safeParse(await req.json().catch(() => null));
      if (!parsed.success || parsed.data.password !== env.adminPassword) {
        return json({ error: "Incorrect password." }, 401);
      }
      const res = json({ ok: true });
      res.cookies.set(SESSION_COOKIE, await createSessionToken(), sessionCookieOptions);
      return res;
    }

    if (route === "auth/logout") {
      const res = json({ ok: true });
      res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
      return res;
    }

    if (route === "upload") {
      const formData = await req.formData().catch(() => null);
      if (!formData) return json({ error: "Données de formulaire invalides." }, 400);

      const files = formData.getAll("files") as File[];
      const singleFile = formData.get("file") as File | null;
      const allFiles = files.length > 0 ? files : singleFile ? [singleFile] : [];

      if (allFiles.length === 0) return json({ error: "Aucun fichier sélectionné." }, 400);

      const urls: string[] = [];
      let isVideo = false;

      for (const file of allFiles) {
        const type = file.type || "application/octet-stream";
        const isImg = type.startsWith("image/");
        const isVid =
          type.startsWith("video/") ||
          file.name.toLowerCase().endsWith(".mp4") ||
          file.name.toLowerCase().endsWith(".mov") ||
          file.name.toLowerCase().endsWith(".webm");

        if (!isImg && !isVid) continue;
        if (isVid) isVideo = true;

        const bytes = new Uint8Array(await file.arrayBuffer());
        const resolvedType = isVid
          ? (type.startsWith("video/") ? type : file.name.toLowerCase().endsWith(".mov") ? "video/quicktime" : "video/mp4")
          : type;

        const canonicalOrigin = resolveCanonicalOrigin(req, url);
        const uploadUrl = await uploadMediaBytes(bytes, resolvedType, canonicalOrigin);
        urls.push(uploadUrl);
      }

      if (urls.length === 0) {
        return json({ error: "Seuls les fichiers images ou vidéos (.mp4, .mov, .webm) sont acceptés." }, 400);
      }
      return json({ url: urls[0], urls, isVideo });
    }

    if (route === "generate/content") {
      const parsed = ContentBody.safeParse(await req.json().catch(() => null));
      if (!parsed.success) return json({ error: "A topic (2-200 characters) is required." }, 400);
      return json(
        await generateContent(parsed.data.topic, {
          tone: parsed.data.tone,
          language: parsed.data.language,
        })
      );
    }

    if (route === "generate/image") {
      const parsed = ImageBody.safeParse(await req.json().catch(() => null));
      if (!parsed.success) return json({ error: "A prompt and image source are required." }, 400);
      try {
        return json(await generateImage(parsed.data.prompt, parsed.data.source));
      } catch (err) {
        return json({ error: err instanceof Error ? err.message : "Image generation failed." }, 502);
      }
    }

    if (route === "posts") {
      const parsed = CreatePostBody.safeParse(await req.json().catch(() => null));
      if (!parsed.success) {
        return json({ error: parsed.error.issues[0]?.message ?? "Invalid post." }, 400);
      }
      const b = parsed.data;

      // Sanitize any loopback or unroutable host (0.0.0.0 / localhost) to canonical public host
      const sanitizeMedia = (u?: string | null): string => {
        if (!u) return "";
        let s = u.trim();
        if (s.startsWith("/")) s = `https://fundoral.shop${s}`;
        return s.replace(/https?:\/\/(0\.0\.0\.0|127\.0\.0\.1|localhost)(:\d+)?/g, "https://fundoral.shop");
      };
      if (b.imageUrl) b.imageUrl = sanitizeMedia(b.imageUrl);
      if (b.videoUrl) b.videoUrl = sanitizeMedia(b.videoUrl) || undefined;
      if (b.mediaUrls) b.mediaUrls = b.mediaUrls.map((m) => sanitizeMedia(m)).filter((m): m is string => Boolean(m));

      // Absolute block against temporary browser memory blob URLs
      if (
        (b.imageUrl && b.imageUrl.startsWith("blob:")) ||
        (b.videoUrl && b.videoUrl.startsWith("blob:")) ||
        (b.mediaUrls && b.mediaUrls.some((u) => u.startsWith("blob:")))
      ) {
        return json(
          {
            error:
              "Le média est encore en cours de téléversement (URL blob temporaire). Veuillez patienter quelques secondes jusqu'à la fin de l'upload.",
          },
          400
        );
      }

      if (b.action === "schedule" && !b.scheduledAt) {
        return json({ error: "scheduledAt is required to schedule a post." }, 400);
      }

      const targetPages =
        b.targetPageIds && b.targetPageIds.length > 0 ? b.targetPageIds : [b.pageId];

      // Automatic video detection and format resolution
      const isVideoMedia = Boolean(
        b.videoUrl ||
          (b.imageUrl && /\.(mp4|mov|webm|m4v)(\?.*)?$/i.test(b.imageUrl))
      );
      const effectiveVideoUrl = b.videoUrl || (isVideoMedia ? b.imageUrl : null);
      let effectiveFormat = b.postFormat;
      if (isVideoMedia && (effectiveFormat === "feed" || !effectiveFormat)) {
        effectiveFormat = "video";
      }

      // If imageUrl is a video, don't store it as imageUrl to avoid photo endpoint errors
      const effectiveImageUrl =
        b.imageUrl && !/\.(mp4|mov|webm|m4v)(\?.*)?$/i.test(b.imageUrl)
          ? b.imageUrl
          : effectiveVideoUrl || "";

      const post = await createPostRecord({
        topic: b.topic,
        title: b.title,
        description: b.description,
        hashtags: b.hashtags,
        image_url: effectiveImageUrl,
        image_source: b.imageSource,
        media_urls: b.mediaUrls && b.mediaUrls.length > 0 ? b.mediaUrls : effectiveImageUrl ? [effectiveImageUrl] : [],
        video_url: effectiveVideoUrl,
        post_format: effectiveFormat,
        link_url: b.linkUrl || null,
        page_id: b.pageId,
        page_name: b.pageName,
        target_page_ids: targetPages,
        target_group_ids: b.targetGroupIds && b.targetGroupIds.length > 0 ? b.targetGroupIds : undefined,
        audio_name: b.audioName || null,
        audio_url: b.audioUrl || null,
        audio_track_id: b.audioTrackId || null,
        scheduled_at: b.action === "schedule" ? b.scheduledAt! : null,
        status: b.action === "schedule" ? "scheduled" : "draft",
      });

      if (b.action === "post_now") {
        return json({ post: await publishPostNow(post.id) });
      }
      return json({ post });
    }

    if (route === "facebook/groups") {
      const body = await req.json().catch(() => null);
      if (!body) return json({ error: "Invalid payload." }, 400);

      const pageId = body.pageId ? String(body.pageId).trim() : undefined;
      const rawInputs: string[] = [];

      if (Array.isArray(body.groups)) {
        for (const item of body.groups) {
          if (typeof item === "string") rawInputs.push(item);
          else if (item && typeof item === "object" && "id" in item) rawInputs.push(String((item as any).id));
        }
      } else if (body.raw) {
        const parts = String(body.raw).split(/[\n,;\s]+/).map((s: string) => s.trim()).filter(Boolean);
        rawInputs.push(...parts);
      } else if (body.id || body.groupId || body.url) {
        rawInputs.push(String(body.id || body.groupId || body.url));
      }

      const settings = await getSettings();
      let pageToken = settings.default_page_token || "";
      if (pageId) {
        try {
          const db = supabaseAdmin();
          const { data: cached } = await db.from("pages_cache").select("access_token").eq("page_id", pageId).maybeSingle();
          if (cached?.access_token) pageToken = cached.access_token;
        } catch {}
      }
      const token = pageToken || settings.facebook_user_token || "";

      const savedGroups: FacebookGroup[] = [];
      const db = supabaseAdmin();

      for (const input of rawInputs) {
        let cleanId = input.trim();
        const match = cleanId.match(/facebook\.com\/groups\/([^/?]+)/i);
        if (match && match[1]) {
          cleanId = match[1];
        }

        if (!cleanId) continue;

        let info = await fetchGroupInfo(cleanId, token);
        if (!info) {
          info = {
            id: cleanId,
            name: body.name || `Groupe Facebook (${cleanId})`,
            privacy: body.privacy || "PUBLIC",
            link: `https://www.facebook.com/groups/${cleanId}`,
            page_id: pageId,
          };
        } else {
          info.page_id = pageId;
        }

        savedGroups.push(info);

        try {
          await db.from("facebook_groups").upsert({
            id: info.id,
            page_id: pageId || null,
            name: info.name,
            privacy: info.privacy || "PUBLIC",
            member_count: info.member_count || null,
            icon: info.icon || null,
            cover: info.cover || info.picture || null,
            link: info.link || `https://www.facebook.com/groups/${info.id}`,
          });
        } catch {
          if (pageId) {
            try {
              const { data: pageRow } = await db.from("pages_cache").select("linked_groups").eq("page_id", pageId).maybeSingle();
              const current = Array.isArray(pageRow?.linked_groups) ? pageRow.linked_groups : [];
              const updated = [...current.filter((g: any) => g.id !== info!.id), info];
              await db.from("pages_cache").update({ linked_groups: updated }).eq("page_id", pageId);
            } catch {}
          }
        }
      }

      return json({ ok: true, groups: savedGroups });
    }

    if (route === "topics") {
      const parsed = AddTopicsBody.safeParse(await req.json().catch(() => null));
      if (!parsed.success) return json({ error: "Send at least one topic." }, 400);
      try {
        return json(await addTopics(parsed.data.texts));
      } catch (err) {
        if (err instanceof TopicsTableMissingError) return json({ error: err.message }, 409);
        throw err;
      }
    }

    // posts/<id>/post-now
    if (path.length === 3 && path[0] === "posts" && path[2] === "post-now") {
      try {
        return json({ post: await publishPostNow(path[1]) });
      } catch (err) {
        return json({ error: err instanceof Error ? err.message : "Failed to publish." }, 502);
      }
    }

    if (route === "facebook/default-page") {
      const parsed = DefaultPageBody.safeParse(await req.json().catch(() => null));
      if (!parsed.success) return json({ error: "pageId is required." }, 400);

      try {
        const db = supabaseAdmin();
        const { data: cached } = await db.from("pages_cache").select("*").eq("page_id", parsed.data.pageId).maybeSingle();
        let page = cached ? { id: cached.page_id, name: cached.name, access_token: cached.access_token } : null;
        if (!page) {
          const livePages = await fetchPages().catch(() => []);
          page = livePages.find((p) => p.id === parsed.data.pageId) || null;
        }
        if (!page) return json({ error: "Cette Page n'est pas disponible sur ce compte." }, 404);

        await updateSettings({
          default_page_id: page.id,
          default_page_name: page.name,
          default_page_token: page.access_token,
        });
        return json({ ok: true, pageName: page.name });
      } catch (err) {
        if (err instanceof FacebookNotConnectedError) return json({ error: err.message }, 409);
        throw err;
      }
    }

    if (route === "facebook/credentials") {
      const parsed = CredentialsBody.safeParse(await req.json().catch(() => null));
      if (!parsed.success) {
        return json({ error: "Enter a valid App ID, and an App Secret of at least 10 characters." }, 400);
      }

      const existing = await getSettings();
      if (!parsed.data.appSecret && !existing.facebook_app_secret) {
        return json({ error: "An App Secret is required the first time." }, 400);
      }

      await updateSettings({
        facebook_app_id: parsed.data.appId,
        ...(parsed.data.appSecret ? { facebook_app_secret: parsed.data.appSecret } : {}),
        ...(parsed.data.configId !== undefined
          ? { facebook_config_id: parsed.data.configId || null }
          : {}),
      });
      const canonicalOrigin = resolveCanonicalOrigin(req, url);
      return json({ ok: true, redirectUri: `${canonicalOrigin}/api/facebook/oauth/callback` });
    }

    if (route === "facebook/credentials/clear") {
      await updateSettings({
        facebook_app_id: null,
        facebook_app_secret: null,
        facebook_config_id: null,
      });
      return json({ ok: true });
    }

    if (route === "facebook/disconnect") {
      await updateSettings({
        facebook_user_token: null,
        facebook_token_expires_at: null,
        facebook_user_name: null,
        default_page_id: null,
        default_page_name: null,
        default_page_token: null,
      });
      await supabaseAdmin().from("pages_cache").delete().neq("page_id", "");
      return json({ ok: true });
    }

    if (route === "webhooks/publish-from-site" || route === "webhooks/site-to-social") {
      const settings = await getSettings();
      const incomingSecret =
        req.headers.get("x-webhook-secret") ||
        req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
        url.searchParams.get("secret");

      const connectedWebsites = (settings.connected_websites || []) as ConnectedWebsite[];
      const validSecrets = new Set<string>();
      if (settings.webhook_secret?.trim()) validSecrets.add(settings.webhook_secret.trim());
      if (env.cronSecret?.trim()) validSecrets.add(env.cronSecret.trim());
      for (const site of connectedWebsites) {
        if (site.webhook_secret?.trim()) validSecrets.add(site.webhook_secret.trim());
      }

      if (validSecrets.size > 0 && (!incomingSecret || !validSecrets.has(incomingSecret.trim()))) {
        return json({ error: "Signature ou clé secrète de webhook invalide." }, 401);
      }

      const body = await req.json().catch(() => null);
      if (!body || !body.title) {
        return json({ error: "Le champ 'title' est obligatoire dans le payload du webhook." }, 400);
      }

      const title = String(body.title).trim();
      const description = body.description ? String(body.description).trim() : "";
      const pageId = body.pageId?.trim() || settings.default_page_id;
      const targetPageIds: string[] = Array.isArray(body.targetPageIds)
        ? body.targetPageIds.map(String)
        : pageId
        ? [pageId]
        : [];
      const pageName = settings.default_page_name || "Page Facebook";
      const articleUrl = body.url ? String(body.url).trim() : null;
      const tone = body.tone || "engaging";
      const language = body.language || "fr";
      const autoPublish = body.autoPublish !== false;
      const postFormat: PostFormat = body.format || body.postFormat || "feed";
      const videoUrl: string | null = body.videoUrl ? String(body.videoUrl).trim() : null;

      let mediaUrls: string[] = [];
      if (Array.isArray(body.images) && body.images.length > 0) {
        mediaUrls = body.images.map(String);
      } else if (body.imageUrl) {
        mediaUrls = [String(body.imageUrl)];
      } else {
        mediaUrls = ["https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1080&auto=format&fit=crop&q=80"];
      }

      // Automatically synthesize Facebook-optimized copy with AI
      const topicPrompt = `${title}. ${description}`;
      const generated = await generateContent(topicPrompt, { tone, language });

      const post = await createPostRecord({
        topic: title.slice(0, 100),
        title: generated.title,
        description: generated.description,
        hashtags: generated.hashtags,
        image_url: mediaUrls[0],
        image_source: "upload",
        media_urls: mediaUrls,
        video_url: videoUrl,
        post_format: postFormat,
        link_url: articleUrl,
        page_id: pageId || "unset",
        page_name: pageName,
        target_page_ids: targetPageIds,
        status: "draft",
        scheduled_at: null,
      });

      let publishedPost = post;
      if (autoPublish && targetPageIds.length > 0 && settings.facebook_user_token) {
        try {
          publishedPost = await publishPostNow(post.id);
        } catch (pubErr) {
          console.warn("[Webhook] Immediate publishing error:", pubErr);
        }
      }

      return json({
        success: true,
        post: publishedPost,
        published: publishedPost.status === "posted",
        facebookPostId: publishedPost.facebook_post_id,
        facebookUrl: publishedPost.facebook_post_id
          ? facebookPostUrl(publishedPost.facebook_post_id)
          : null,
      });
    }

    if (route === "webhooks/listings" || route === "listings/webhook") {
      const settings = await getSettings();
      const incomingSecret =
        req.headers.get("x-webhook-secret") ||
        req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
        url.searchParams.get("secret");

      const connectedWebsites = (settings.connected_websites || []) as ConnectedWebsite[];
      const validSecrets = new Set<string>();
      if (settings.webhook_secret?.trim()) validSecrets.add(settings.webhook_secret.trim());
      if (env.cronSecret?.trim()) validSecrets.add(env.cronSecret.trim());
      for (const site of connectedWebsites) {
        if (site.webhook_secret?.trim()) validSecrets.add(site.webhook_secret.trim());
      }

      if (validSecrets.size > 0 && (!incomingSecret || !validSecrets.has(incomingSecret.trim()))) {
        return json(
          { error: "Signature ou clé secrète invalide. Fournissez votre clé dans le header 'x-webhook-secret'." },
          401
        );
      }

      const body = await req.json().catch(() => null);
      if (!body || !body.title) {
        return json({ error: "Le champ 'title' est obligatoire dans le payload de l'annonce." }, 400);
      }

      const listingPayload: ListingWebhookPayload = {
        title: String(body.title).trim(),
        description: body.description ? String(body.description).trim() : "",
        price: body.price ? String(body.price).trim() : undefined,
        location: body.location ? String(body.location).trim() : undefined,
        category: body.category ? String(body.category).trim() : undefined,
        imageUrl: body.imageUrl
          ? String(body.imageUrl).trim()
          : body.image
          ? String(body.image).trim()
          : "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1080&auto=format&fit=crop&q=80",
        listingUrl: body.listingUrl
          ? String(body.listingUrl).trim()
          : body.url
          ? String(body.url).trim()
          : "",
        pageId: body.pageId?.trim() || settings.default_page_id || undefined,
        targetPageIds: Array.isArray(body.targetPageIds)
          ? body.targetPageIds.map(String)
          : body.pageId
          ? [String(body.pageId)]
          : settings.default_page_id
          ? [settings.default_page_id]
          : [],
        autoPublishFacebook: body.autoPublishFacebook !== false && body.autoPublish !== false,
        autoPublishWhatsApp: body.autoPublishWhatsApp !== false,
      };

      // 1. Format content for Facebook and WhatsApp
      const fbPost = formatListingForFacebook(listingPayload, settings.utm_suffix);
      const waMessage = formatListingForWhatsApp(listingPayload);

      // 2. Persist post record in Database
      const post = await createPostRecord({
        topic: `Annonce : ${listingPayload.title}`.slice(0, 100),
        title: fbPost.title,
        description: `${fbPost.description}\n\n${fbPost.fullMessage}`,
        hashtags: fbPost.hashtags,
        image_url: listingPayload.imageUrl,
        image_source: "upload",
        media_urls: [listingPayload.imageUrl],
        link_url: listingPayload.listingUrl || null,
        page_id: listingPayload.pageId || settings.default_page_id || "unset",
        page_name: settings.default_page_name || "Page Facebook",
        target_page_ids: listingPayload.targetPageIds,
        status: "draft",
        scheduled_at: null,
      });

      // 3. Auto-publish on Facebook
      let publishedPost = post;
      let fbError: string | null = null;
      if (
        listingPayload.autoPublishFacebook &&
        settings.facebook_user_token &&
        (listingPayload.targetPageIds?.length || settings.default_page_id)
      ) {
        try {
          publishedPost = await publishPostNow(post.id);
        } catch (pubErr) {
          console.error("Facebook publication error on listing webhook:", pubErr);
          fbError = pubErr instanceof Error ? pubErr.message : "Erreur de publication Facebook";
        }
      }

      // 4. Auto-broadcast to WhatsApp Channels & Groups
      let waResult: {
        enabled: boolean;
        totalTargets: number;
        successful: number;
        failed: number;
        details?: Array<unknown>;
        message?: string;
        error?: string;
      } = {
        enabled: false,
        totalTargets: 0,
        successful: 0,
        failed: 0,
        message: "WhatsApp non activé ou non configuré.",
      };

      if (listingPayload.autoPublishWhatsApp && settings.whatsapp_enabled) {
        try {
          waResult = await broadcastListingToWhatsApp(listingPayload, waMessage);
        } catch (waErr) {
          console.error("WhatsApp broadcast error on listing webhook:", waErr);
          waResult = {
            enabled: true,
            totalTargets: 0,
            successful: 0,
            failed: 1,
            error: waErr instanceof Error ? waErr.message : "Erreur d'envoi WhatsApp",
          };
        }
      }

      // Real Automation Logging
      await logAutomationEvent({
        event_type: "webhook_received",
        source: "webhook_listings",
        title: listingPayload.title,
        status: "success",
        details: `Importation annonce reçue (${listingPayload.category || "Général"})`,
        payload: listingPayload as unknown as Record<string, unknown>,
      });

      if (publishedPost.status === "posted") {
        await logAutomationEvent({
          event_type: "post_published",
          source: "facebook",
          title: `Publié sur Facebook : ${listingPayload.title}`,
          status: "success",
          details: `Post Facebook ID : ${publishedPost.facebook_post_id}`,
          payload: { postId: post.id, facebookPostId: publishedPost.facebook_post_id },
        });
      } else if (fbError) {
        await logAutomationEvent({
          event_type: "api_error",
          source: "facebook",
          title: `Échec publication Facebook : ${listingPayload.title}`,
          status: "failed",
          details: fbError,
          error_message: fbError,
          payload: { postId: post.id },
        });
      }

      if (waResult.successful > 0) {
        await logAutomationEvent({
          event_type: "whatsapp_sent",
          source: "whatsapp",
          title: `Diffusé sur WhatsApp : ${listingPayload.title}`,
          status: "success",
          details: `Envoyé avec succès à ${waResult.successful} cible(s)`,
        });
      } else if (waResult.failed > 0 && waResult.error) {
        await logAutomationEvent({
          event_type: "api_error",
          source: "whatsapp",
          title: `Erreur WhatsApp : ${listingPayload.title}`,
          status: "failed",
          details: waResult.error,
          error_message: waResult.error,
        });
      }

      // Update last_sync_at for matching connected website
      if (listingPayload.listingUrl && connectedWebsites.length > 0) {
        try {
          const lOrigin = new URL(listingPayload.listingUrl).origin.toLowerCase();
          const matchIdx = connectedWebsites.findIndex((s) => {
            try {
              return new URL(s.url).origin.toLowerCase() === lOrigin;
            } catch {
              return false;
            }
          });
          if (matchIdx !== -1) {
            connectedWebsites[matchIdx].last_sync_at = new Date().toISOString();
            await updateSettings({ connected_websites: connectedWebsites });
          }
        } catch {
          // ignore url parse error
        }
      }

      return json({
        success: true,
        message: "Annonce importée et diffusée avec succès.",
        listing: {
          title: listingPayload.title,
          price: listingPayload.price,
          location: listingPayload.location,
          category: listingPayload.category,
          imageUrl: listingPayload.imageUrl,
          listingUrl: listingPayload.listingUrl,
        },
        facebook: {
          published: publishedPost.status === "posted",
          status: publishedPost.status,
          postId: post.id,
          facebookPostId: publishedPost.facebook_post_id,
          facebookUrl: publishedPost.facebook_post_id
            ? facebookPostUrl(publishedPost.facebook_post_id)
            : null,
          targetPages: listingPayload.targetPageIds,
          error: fbError,
        },
        whatsapp: waResult,
      });
    }

    if (route === "automation/detect-site" || route === "automation/analyze-site") {
      const body = await req.json().catch(() => null);
      if (!body?.url) {
        return json({ error: "L'URL du site web est requise." }, 400);
      }

      let siteUrl = String(body.url).trim();
      if (!siteUrl.startsWith("http://") && !siteUrl.startsWith("https://")) {
        siteUrl = `https://${siteUrl}`;
      }

      let domain = siteUrl;
      try {
        domain = new URL(siteUrl).origin;
      } catch {
        return json({ error: "URL de site web invalide." }, 400);
      }

      let reachable = false;
      let platform: "wordpress" | "shopify" | "rss" | "custom" = "custom";
      const detectedFeeds: string[] = [];
      let siteTitle = domain.replace(/^https?:\/\//i, "");
      let samplePost: { title: string; excerpt?: string; url?: string; image?: string } | null = null;
      let hasProducts = false;

      // 1. Probe WordPress REST API
      try {
        const wpRes = await fetch(`${domain}/wp-json/wp/v2/posts?per_page=1&_embed=true`, {
          signal: AbortSignal.timeout(5000),
          headers: { "User-Agent": "Mozilla/5.0 (compatible; SocialAutoBot/1.0)" },
        });
        if (wpRes.ok) {
          reachable = true;
          const wpData = await wpRes.json();
          if (Array.isArray(wpData) && wpData.length > 0) {
            platform = "wordpress";
            const first = wpData[0];
            const title = first.title?.rendered ? first.title.rendered.replace(/<[^>]+>/g, "") : "Article récent";
            const excerpt = first.excerpt?.rendered ? first.excerpt.rendered.replace(/<[^>]+>/g, "").slice(0, 160) : "";
            const postUrl = first.link || domain;
            const featuredMedia = first._embedded?.["wp:featuredmedia"]?.[0]?.source_url;
            samplePost = { title, excerpt, url: postUrl, image: featuredMedia };
            detectedFeeds.push(`${domain}/feed`);
          }
        }
      } catch {
        // Not a standard open WP REST API
      }

      // 2. Probe Shopify products
      try {
        const shopifyRes = await fetch(`${domain}/products.json?limit=1`, {
          signal: AbortSignal.timeout(5000),
          headers: { "User-Agent": "Mozilla/5.0 (compatible; SocialAutoBot/1.0)" },
        });
        if (shopifyRes.ok) {
          reachable = true;
          const shopifyData = await shopifyRes.json();
          if (shopifyData?.products?.length > 0) {
            platform = "shopify";
            hasProducts = true;
            const p = shopifyData.products[0];
            const pImage = p.images?.[0]?.src || p.image?.src;
            samplePost = {
              title: p.title || "Produit boutique",
              excerpt: (p.body_html || "").replace(/<[^>]+>/g, "").slice(0, 160),
              url: `${domain}/products/${p.handle}`,
              image: pImage,
            };
            detectedFeeds.push(`${domain}/collections/all/products.atom`);
          }
        }
      } catch {
        // Not shopify
      }

      // 3. Probe RSS / Atom feeds
      const potentialFeeds = [
        `${domain}/feed`,
        `${domain}/rss`,
        `${domain}/rss.xml`,
        `${domain}/atom.xml`,
        `${domain}/feed.xml`,
      ];

      for (const feedUrl of potentialFeeds) {
        if (detectedFeeds.includes(feedUrl)) continue;
        try {
          const feedRes = await fetch(feedUrl, {
            signal: AbortSignal.timeout(4000),
            headers: { "User-Agent": "Mozilla/5.0 (compatible; SocialAutoBot/1.0)" },
          });
          if (feedRes.ok) {
            reachable = true;
            const text = await feedRes.text();
            if (text.includes("<rss") || text.includes("<feed") || text.includes("<channel")) {
              detectedFeeds.push(feedUrl);
              if (platform === "custom") platform = "rss";
              break;
            }
          }
        } catch {
          // continue
        }
      }

      // 4. Probe Homepage HTML (meta generator, title, open graph)
      try {
        const htmlRes = await fetch(domain, {
          signal: AbortSignal.timeout(5000),
          headers: { "User-Agent": "Mozilla/5.0 (compatible; SocialAutoBot/1.0)" },
        });
        if (htmlRes.ok) {
          reachable = true;
          const html = await htmlRes.text();
          const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
          if (titleMatch?.[1]) {
            siteTitle = titleMatch[1].trim();
          }
          if (html.includes("wp-content") || html.includes("wordpress")) {
            platform = "wordpress";
          }
          if (html.includes("cdn.shopify.com") || html.includes("Shopify.theme")) {
            platform = "shopify";
            hasProducts = true;
          }
          if (html.includes("woocommerce") || html.includes("product_cat") || html.includes("add-to-cart")) {
            hasProducts = true;
          }
          const ogImg = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
          if (!samplePost && ogImg?.[1]) {
            samplePost = {
              title: siteTitle,
              url: domain,
              image: ogImg[1],
            };
          }
        }
      } catch {
        // network issue
      }

      if (!reachable) {
        return json(
          {
            error:
              "Impossible de joindre ce site web. Vérifiez que l'adresse est accessible publiquement (nom de domaine valide et serveur en ligne).",
          },
          400
        );
      }

      const hasImages = Boolean(samplePost?.image);

      return json({
        ok: true,
        siteUrl: domain,
        siteTitle,
        platform,
        cms: platform === "wordpress" ? "WordPress" : platform === "shopify" ? "Shopify" : null,
        hasWordpress: platform === "wordpress",
        hasShopify: platform === "shopify",
        hasRss: detectedFeeds.length > 0,
        hasProducts,
        hasImages,
        detectedFeeds,
        samplePost,
      });
    }

    if (route === "automation/test-webhook") {
      const body = await req.json().catch(() => ({}));
      const testTitle = body?.title ? String(body.title).trim() : "Test de ping webhook";
      const testSource = body?.source ? String(body.source).trim() : "Boutique / Site Web";

      const createdLog = await logAutomationEvent({
        event_type: "test_ping",
        source: testSource,
        title: testTitle,
        status: "success",
        details: "Vérification manuelle de la passerelle webhook effectuée avec succès.",
        payload: {
          verified: true,
          timestamp: new Date().toISOString(),
          simulated: false,
        },
      });

      return json({
        ok: true,
        message: "Connexion Webhook testée et validée avec succès !",
        log: createdLog,
        timestamp: new Date().toISOString(),
      });
    }

    if (route === "automation/page-groups") {
      const settings = await getSettings();
      const body = await req.json().catch(() => null);
      if (!body?.name || !Array.isArray(body?.pageIds)) {
        return json({ error: "Nom du groupe et liste des pageIds requis." }, 400);
      }
      const existing = (settings.page_groups || []) as PageGroup[];
      const newGroup: PageGroup = {
        id: crypto.randomUUID(),
        name: String(body.name).trim(),
        page_ids: body.pageIds.map(String),
        created_at: new Date().toISOString(),
      };
      const updated = [...existing, newGroup];
      await updateSettings({ page_groups: updated });
      return json({ ok: true, group: newGroup, groups: updated });
    }

    if (route === "automation/connected-websites") {
      const settings = await getSettings();
      const body = await req.json().catch(() => null);
      if (!body?.name || !body?.url) {
        return json({ error: "Nom et URL du site web requis." }, 400);
      }
      const existing = (settings.connected_websites || []) as ConnectedWebsite[];
      const newSite: ConnectedWebsite = {
        id: crypto.randomUUID(),
        name: String(body.name).trim(),
        url: String(body.url).trim(),
        platform: body.platform || "custom",
        rss_url: body.rssUrl || null,
        webhook_secret: crypto.randomUUID().replace(/-/g, ""),
        auto_publish: Boolean(body.autoPublish),
        target_page_id: body.targetPageId || settings.default_page_id || null,
        last_sync_at: null,
        created_at: new Date().toISOString(),
      };
      const updated = [...existing, newSite];
      await updateSettings({ connected_websites: updated });
      return json({ ok: true, website: newSite, websites: updated });
    }

    if (route === "automation/webhook/secret") {
      const newSecret = crypto.randomUUID().replace(/-/g, "");
      await updateSettings({ webhook_secret: newSecret });
      return json({ secret: newSecret });
    }

    if (route === "automation/rss/sync") {
      const result = await syncAllRssFeeds();
      return json({ ok: true, ...result });
    }

    if (route === "team/invite") {
      const body = await req.json();
      const email = String(body.email || "").trim().toLowerCase();
      if (!email || !email.includes("@")) {
        return json({ error: "Adresse email invalide." }, 400);
      }
      const role = body.role || "editor";
      const name = String(body.name || "").trim() || email.split("@")[0];
      const settings = await getSettings();
      const existing = (((settings as any).team_members as any[]) || []);
      if (existing.some((m) => m.email.toLowerCase() === email)) {
        return json({ error: "Ce collaborateur fait déjà partie de l'équipe." }, 400);
      }
      const newMember = {
        id: `tm_${crypto.randomUUID()}`,
        name,
        email,
        role,
        status: "invited",
        joinedAt: new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }),
      };
      const updated = [...existing, newMember];
      try {
        await updateSettings({ team_members: updated } as any);
      } catch {
        // Fallback if column not yet migrated
      }
      await logAutomationEvent({
        event_type: "webhook_received",
        source: "Équipe",
        title: `Invitation collaborateur : ${name} (${email})`,
        status: "success",
        details: `Rôle assigné : ${role}. En attente d'acceptation.`,
      });
      return json({ ok: true, member: newMember, members: updated });
    }

    if (route === "facebook/ads/boost") {
      const BoostBody = z.object({
        postId: z.string().min(1),
        adAccountId: z.string().optional(),
        budgetDollars: z.number().positive(),
        budgetType: z.enum(["daily", "lifetime"]).default("daily"),
        durationDays: z.number().int().min(1).max(90),
        objective: z.enum(["POST_ENGAGEMENT", "LINK_CLICKS", "OUTCOME_TRAFFIC", "PAGE_LIKES"]),
        targetCountries: z.array(z.string()).min(1, "Veuillez sélectionner au moins un pays de diffusion."),
        targetCities: z.array(z.string()).optional(),
        ageMin: z.number().int().min(18).max(65).optional(),
        ageMax: z.number().int().min(18).max(65).optional(),
        gender: z.enum(["all", "men", "women"]).optional(),
      });

      const parsed = BoostBody.safeParse(await req.json().catch(() => null));
      if (!parsed.success) {
        return json({ error: parsed.error.issues[0]?.message ?? "Paramètres publicitaires invalides." }, 400);
      }

      try {
        const campaign = await createMetaAdBoost(parsed.data);
        return json({ ok: true, campaign });
      } catch (err) {
        return json({ error: err instanceof Error ? err.message : "Échec de création du boost Meta Ads." }, 502);
      }
    }

    if (route === "facebook/ads/verify") {
      const body = await req.json().catch(() => ({}));
      const verification = await verifyMetaAdAccount(body.adAccountId);
      return json(verification);
    }

    if (route === "whatsapp/test") {
      const body = await req.json().catch(() => ({}));
      const settings = await getSettings();
      const apiUrl = body.apiUrl?.trim() || settings.whatsapp_api_url;
      if (!apiUrl) return json({ error: "URL de la passerelle WhatsApp obligatoire." }, 400);

      const apiKey = body.apiKey?.trim() || (settings.whatsapp_api_key_encrypted ? decryptSecret(settings.whatsapp_api_key_encrypted) : undefined);
      const instanceName = body.instanceName?.trim() || settings.whatsapp_instance_name || "yamoura-bot";

      const result = await testWhatsAppConnection({ apiUrl, apiKey, instanceName });
      return json({ ok: result.connected, ...result });
    }

    if (route === "whatsapp/groups") {
      const body = await req.json().catch(() => ({}));
      const settings = await getSettings();
      const apiUrl = body.apiUrl?.trim() || settings.whatsapp_api_url;
      if (!apiUrl) return json({ error: "URL de la passerelle WhatsApp obligatoire." }, 400);

      const apiKey = body.apiKey?.trim() || (settings.whatsapp_api_key_encrypted ? decryptSecret(settings.whatsapp_api_key_encrypted) : undefined);
      const instanceName = body.instanceName?.trim() || settings.whatsapp_instance_name || "yamoura-bot";

      try {
        const groups = await fetchWhatsAppGroups({ apiUrl, apiKey, instanceName });
        return json({ ok: true, groups });
      } catch (err) {
        return json({ error: err instanceof Error ? err.message : "Erreur récupération groupes WhatsApp" }, 502);
      }
    }

    if (route === "whatsapp/send-test") {
      const body = await req.json().catch(() => null);
      if (!body?.targetJid || !body?.message) {
        return json({ error: "Champs targetJid et message requis." }, 400);
      }
      const settings = await getSettings();
      const apiUrl = settings.whatsapp_api_url;
      if (!apiUrl) return json({ error: "Passerelle WhatsApp non configurée." }, 400);

      const apiKey = settings.whatsapp_api_key_encrypted ? decryptSecret(settings.whatsapp_api_key_encrypted) : undefined;
      const instanceName = settings.whatsapp_instance_name || "yamoura-bot";

      const outcome = await sendWhatsAppListingToTarget(
        { apiUrl, apiKey, instanceName },
        body.targetJid.trim(),
        body.message.trim(),
        body.imageUrl?.trim()
      );
      return json(outcome);
    }

    if (route === "ai/test") {
      const body = await req.json().catch(() => ({}));
      const settings = await getSettings();
      const baseUrl = body.baseUrl?.trim() || settings.openai_base_url || "https://api.openai.com/v1";
      const apiKey = body.apiKey?.trim() || (settings.openai_api_key_encrypted ? decryptSecret(settings.openai_api_key_encrypted) : "");
      if (!apiKey) return json({ error: "Clé d'API obligatoire pour tester l'endpoint IA." }, 400);
      const model = body.model?.trim() || settings.ai_model_name?.trim();

      const res = await testOpenAIEndpoint({ baseUrl, apiKey, model });
      return json(res);
    }

    return notFound();
  });
}

/* ---------------------------------------------------------------- PATCH */

const SettingsBody = z.object({
  image_source: z.enum(["ai", "stock", "mixed"]).optional(),
  utm_suffix: z.string().max(200).optional(),
  auto_post_enabled: z.boolean().optional(),
  posts_per_day: z.number().int().min(1).max(20).optional(),
  posting_hours: z.array(z.number().int().min(0).max(23)).min(1).max(24).optional(),
  timezone: z.string().min(1).max(64).optional(),
  topic_source: z.enum(["mine", "trending", "mixed"]).optional(),
  preferred_ai_provider: z.enum(["free", "openai", "anthropic", "gemini", "openrouter"]).optional(),
  ai_model_name: z.string().max(100).nullable().optional(),
  openai_base_url: z.string().max(256).nullable().optional(),
  openai_api_key: z.string().optional(),
  anthropic_api_key: z.string().optional(),
  gemini_api_key: z.string().optional(),
  openrouter_api_key: z.string().optional(),
  webhook_secret: z.string().max(128).optional(),
  meta_ad_account_id: z.string().max(64).nullable().optional(),
  rss_feeds: z.array(z.any()).optional(),
  page_groups: z.array(z.any()).optional(),
  connected_websites: z.array(z.any()).optional(),
  whatsapp_enabled: z.boolean().optional(),
  whatsapp_api_url: z.string().max(256).nullable().optional(),
  whatsapp_api_key: z.string().optional(),
  whatsapp_instance_name: z.string().max(100).nullable().optional(),
  whatsapp_target_groups: z.array(z.any()).optional(),
  workspace_name: z.string().max(100).optional(),
  admin_email: z.string().email().or(z.literal("")).optional(),
  brand_name: z.string().max(100).optional(),
  brand_description: z.string().max(1000).optional(),
  brand_tone: z.string().max(100).optional(),
  brand_style: z.string().max(100).optional(),
  brand_prohibited_words: z.string().max(500).optional(),
  brand_hashtags: z.string().max(300).optional(),
  brand_signature: z.string().max(500).optional(),
  language: z.string().max(20).optional(),
  theme_preference: z.enum(["light", "dark", "system"]).optional(),
});

const UpdateTopicBody = z.object({
  enabled: z.boolean().optional(),
  text: z.string().trim().min(1).max(MAX_TOPIC_LENGTH).optional(),
});

const UpdatePostBody = z.object({
  title: z.string().min(1).max(120).optional(),
  description: z.string().min(1).max(500).optional(),
  hashtags: z.array(z.string()).max(15).optional(),
  linkUrl: z.string().url().optional().or(z.literal("")),
  pageId: z.string().min(1).optional(),
  pageName: z.string().min(1).optional(),
  targetPageIds: z.array(z.string()).optional(),
  postFormat: z.enum(["feed", "reel", "story", "video", "carousel"]).optional(),
  videoUrl: z.string().url().optional().or(z.literal("")),
  scheduledAt: z.string().datetime().nullable().optional(),
  status: z.enum(["draft", "scheduled"]).optional(),
});

export async function PATCH(req: Request, ctx: Ctx) {
  const { path } = await ctx.params;
  const route = path.join("/");
  const url = new URL(req.url);

  return safely(async () => {
    const denied = await guard(route, req, url);
    if (denied) return denied;

    if (route === "settings") {
      const parsed = SettingsBody.safeParse(await req.json().catch(() => null));
      if (!parsed.success) return json({ error: "Invalid settings payload." }, 400);

      const {
        openai_api_key,
        anthropic_api_key,
        gemini_api_key,
        openrouter_api_key,
        whatsapp_api_key,
        ...standardFields
      } = parsed.data;

      const patch: Record<string, unknown> = { ...standardFields };

      if (openai_api_key !== undefined) {
        patch.openai_api_key_encrypted = openai_api_key.trim()
          ? encryptSecret(openai_api_key.trim())
          : null;
      }
      if (anthropic_api_key !== undefined) {
        patch.anthropic_api_key_encrypted = anthropic_api_key.trim()
          ? encryptSecret(anthropic_api_key.trim())
          : null;
      }
      if (gemini_api_key !== undefined) {
        patch.gemini_api_key_encrypted = gemini_api_key.trim()
          ? encryptSecret(gemini_api_key.trim())
          : null;
      }
      if (openrouter_api_key !== undefined) {
        patch.openrouter_api_key_encrypted = openrouter_api_key.trim()
          ? encryptSecret(openrouter_api_key.trim())
          : null;
      }
      if (whatsapp_api_key !== undefined) {
        patch.whatsapp_api_key_encrypted = whatsapp_api_key.trim()
          ? encryptSecret(whatsapp_api_key.trim())
          : null;
      }

      try {
        return json(await publicSettings(await updateSettings(patch)));
      } catch (err) {
        // Installs made before topics existed lack the column until
        // schema.sql is run again.
        if (err instanceof Error && /topic_source/.test(err.message)) {
          return json({ error: new TopicsTableMissingError().message }, 409);
        }
        throw err;
      }
    }

    // topics/<id>
    if (path.length === 2 && path[0] === "topics") {
      const parsed = UpdateTopicBody.safeParse(await req.json().catch(() => null));
      if (!parsed.success) return json({ error: "Invalid topic update." }, 400);
      return json({ topic: await updateTopic(path[1], parsed.data) });
    }

    // posts/<id>
    if (path.length === 2 && path[0] === "posts") {
      const id = path[1];
      const existing = await getPost(id);
      if (!existing) return json({ error: "Post not found." }, 404);
      if (existing.status === "posted") {
        return json({ error: "A published post can no longer be edited here." }, 409);
      }

      const parsed = UpdatePostBody.safeParse(await req.json().catch(() => null));
      if (!parsed.success) return json({ error: "Invalid update payload." }, 400);
      const b = parsed.data;

      const updated = await updatePostRecord(id, {
        ...(b.title !== undefined && { title: b.title }),
        ...(b.description !== undefined && { description: b.description }),
        ...(b.hashtags !== undefined && { hashtags: b.hashtags }),
        ...(b.linkUrl !== undefined && { link_url: b.linkUrl || null }),
        ...(b.pageId !== undefined && { page_id: b.pageId }),
        ...(b.pageName !== undefined && { page_name: b.pageName }),
        ...(b.scheduledAt !== undefined && { scheduled_at: b.scheduledAt }),
        ...(b.status !== undefined && { status: b.status }),
      });

      return json({ post: updated });
    }

    return notFound();
  });
}

/* --------------------------------------------------------------- DELETE */

export async function DELETE(req: Request, ctx: Ctx) {
  const { path } = await ctx.params;
  const route = path.join("/");
  const url = new URL(req.url);

  return safely(async () => {
    const denied = await guard(route, req, url);
    if (denied) return denied;

    if (path.length === 2 && path[0] === "posts") {
      await deletePostRecord(path[1]);
      return json({ ok: true });
    }

    if (path.length === 2 && path[0] === "topics") {
      await deleteTopic(path[1]);
      return json({ ok: true });
    }

    if (route === "automation/page-groups") {
      const settings = await getSettings();
      const body = await req.json().catch(() => null);
      const groupId = body?.id || url.searchParams.get("id");
      if (!groupId) return json({ error: "ID du groupe requis." }, 400);
      const existing = (settings.page_groups || []) as PageGroup[];
      const updated = existing.filter((g) => g.id !== groupId);
      await updateSettings({ page_groups: updated });
      return json({ ok: true, groups: updated });
    }

    if (route === "facebook/groups") {
      const body = await req.json().catch(() => null);
      const groupId = body?.id || body?.groupId || url.searchParams.get("id") || url.searchParams.get("groupId");
      const pageId = body?.pageId || url.searchParams.get("pageId");
      if (!groupId) return json({ error: "ID du groupe requis." }, 400);

      try {
        const db = supabaseAdmin();
        await db.from("facebook_groups").delete().eq("id", groupId);
        if (pageId) {
          const { data: pageRow } = await db.from("pages_cache").select("linked_groups").eq("page_id", pageId).maybeSingle();
          if (Array.isArray(pageRow?.linked_groups)) {
            const updated = pageRow.linked_groups.filter((g: any) => g.id !== groupId);
            await db.from("pages_cache").update({ linked_groups: updated }).eq("page_id", pageId);
          }
        }
      } catch {}

      return json({ ok: true, removed: groupId });
    }

    if (route === "automation/connected-websites") {
      const settings = await getSettings();
      const body = await req.json().catch(() => null);
      const siteId = body?.id || url.searchParams.get("id");
      if (!siteId) return json({ error: "ID du site requis." }, 400);
      const existing = (settings.connected_websites || []) as ConnectedWebsite[];
      const updated = existing.filter((s) => s.id !== siteId);
      await updateSettings({ connected_websites: updated });
      return json({ ok: true, websites: updated });
    }

    if (route === "team/members") {
      const body = await req.json().catch(() => null);
      const memberId = body?.id || url.searchParams.get("id");
      if (!memberId) return json({ error: "ID du membre requis." }, 400);
      if (memberId === "owner-1" || memberId.includes("owner")) {
        return json({ error: "Le propriétaire principal du compte ne peut pas être supprimé." }, 403);
      }
      const settings = await getSettings();
      const existing = (((settings as any).team_members as any[]) || []);
      const removed = existing.find((m) => m.id === memberId);
      const updated = existing.filter((m) => m.id !== memberId);
      try {
        await updateSettings({ team_members: updated } as any);
      } catch {}
      if (removed) {
        await logAutomationEvent({
          event_type: "webhook_received",
          source: "Équipe",
          title: `Révocation accès : ${removed.name || removed.email}`,
          status: "success",
          details: `Rôle révoqué : ${removed.role}`,
        });
      }
      return json({ ok: true, members: updated });
    }

    return notFound();
  });
}

/* ------------------------------------------------------------- handlers */

async function getPages(refresh: boolean) {
  const db = supabaseAdmin();
  try {
    let cached: any[] = [];
    if (!refresh) {
      const { data } = await db.from("pages_cache").select("*").order("name");
      cached = data ?? [];
    }

    // Auto-fetch if refresh is requested OR cache is empty
    if (refresh || cached.length === 0) {
      try {
        const pages = await fetchPages();
        if (pages.length > 0) {
          await savePagesCache(pages);
          const { data } = await db.from("pages_cache").select("*").order("name");
          cached = data ?? [];
        }
      } catch (fetchErr) {
        if (fetchErr instanceof FacebookNotConnectedError) {
          if (cached.length === 0) throw fetchErr;
        } else {
          console.error("fetchPages error in getPages:", fetchErr);
          if (cached.length === 0) throw fetchErr;
        }
      }
    }

    const settings = await getSettings();

    // Auto-select or set default page if user has pages
    let defaultPageId = settings.default_page_id;
    if ((!defaultPageId || !cached.some((p) => p.page_id === defaultPageId)) && cached.length > 0) {
      defaultPageId = cached[0].page_id;
      const token = cached[0].access_token || settings.default_page_token;
      await updateSettings({
        default_page_id: cached[0].page_id,
        default_page_name: cached[0].name,
        ...(token ? { default_page_token: token } : {}),
      });
    }

    return json({ pages: cached, defaultPageId });
  } catch (err) {
    if (err instanceof FacebookNotConnectedError) return json({ error: err.message }, 409);
    return json({ error: err instanceof Error ? err.message : "Failed to load Pages." }, 502);
  }
}

/**
 * Send the browser back to Settings on the SAME origin it arrived from. The
 * project answers on more than one Vercel alias, and the session cookie is
 * scoped to whichever one the user is actually on, so redirecting to a
 * configured canonical URL would silently drop their login.
 */
function redirectToSettings(origin: string, status: "connected" | "error", message?: string) {
  const target = new URL("/dashboard/settings", origin || env.siteUrl);
  target.searchParams.set("facebook", status);
  if (message) target.searchParams.set("message", message);
  return NextResponse.redirect(target);
}

async function oauthCallback(req: Request, url: URL, origin: string) {
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieState = req.headers
    .get("cookie")
    ?.split("; ")
    .find((c) => c.startsWith(`${OAUTH_STATE_COOKIE}=`))
    ?.split("=")[1];

  if (!code || !state || !cookieState || state !== cookieState) {
    return redirectToSettings(
      origin,
      "error",
      "Login was cancelled or the request expired. Please try again."
    );
  }

  const creds = await getFacebookCredentials(origin);
  if (!creds) {
    return redirectToSettings(origin, "error", "Meta app credentials are no longer set.");
  }

  try {
    // The short-lived token is immediately traded up: Page tokens minted from a
    // long-lived user token never expire, which is what the autopilot needs.
    const shortLived = await exchangeCodeForToken(creds, code);
    const longLived = await exchangeForLongLivedToken(creds, shortLived.access_token);

    await updateSettings({
      facebook_user_token: longLived.access_token,
      facebook_token_expires_at: longLived.expires_in
        ? new Date(Date.now() + longLived.expires_in * 1000).toISOString()
        : null,
    });

    // Catch a half-granted connection here rather than at publish time, where
    // Facebook reports it as a bare "(#200) Permissions error".
    const missing = await missingPermissions(longLived.access_token);
    if (missing.length > 0) {
      return redirectToSettings(
        origin,
        "error",
        `Connected, but these permissions were not granted: ${missing.join(", ")}. ` +
          `Add them to your Meta app (use case permissions, and the Login for Business ` +
          `configuration if you use one), then disconnect and connect again.`
      );
    }

    // Best-effort extras: the connection still counts as successful without a
    // display name, and without a Page the user simply picks one next.
    try {
      const account = await fetchAccount();
      await updateSettings({ facebook_user_name: account.name });
    } catch {}

    try {
      const pages = await fetchPages();
      if (pages.length > 0) {
        await savePagesCache(pages);
        const currentSettings = await getSettings();
        if (pages.length === 1 || !currentSettings.default_page_id) {
          await updateSettings({
            default_page_id: pages[0].id,
            default_page_name: pages[0].name,
            default_page_token: pages[0].access_token,
          });
        }
      }
    } catch (err) {
      console.warn("Could not auto-fetch pages in oauth callback:", err);
    }

    const res = redirectToSettings(origin, "connected");
    res.cookies.set(OAUTH_STATE_COOKIE, "", { path: "/", maxAge: 0 });
    return res;
  } catch (err) {
    return redirectToSettings(
      origin,
      "error",
      err instanceof Error ? err.message : "Connection failed."
    );
  }
}

/**
 * Autopilot tick. Vercel's Hobby plan permits only one cron run per day — a
 * more frequent schedule in vercel.json is rejected at deploy time — so the
 * built-in cron fires once at 04:00 UTC (09:00 Asia/Karachi, the first default
 * posting hour). Every guard in maybeRunAutopilot is idempotent, so the
 * remaining posting slots can be driven by pointing any free external cron
 * (cron-job.org, UptimeRobot) at this same path with the CRON_SECRET.
 */
async function runCron(req: Request, url: URL) {
  if (env.cronSecret) {
    const auth = req.headers.get("authorization");
    const provided = url.searchParams.get("secret");
    if (auth !== `Bearer ${env.cronSecret}` && provided !== env.cronSecret) {
      return json({ error: "Unauthorized" }, 401);
    }
  }

  const due = await listDuePosts(new Date().toISOString());
  const queueResults = [];
  for (const post of due) {
    const result = await publishPostNow(post.id);
    queueResults.push({ id: result.id, status: result.status });
  }

  return json({
    processedFromQueue: queueResults.length,
    queueResults,
    autopilot: await maybeRunAutopilot(),
  });
}
