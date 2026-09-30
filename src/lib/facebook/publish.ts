import {
  publishPhoto,
  publishMultiPhotos,
  fetchPages,
  savePagesCache,
  NoPageSelectedError,
} from "@/lib/facebook/client";
import { getPost, updatePostRecord } from "@/lib/db/posts";
import { getSettings } from "@/lib/db/settings";
import { composeMessage } from "@/lib/types";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { Post } from "@/lib/types";

/**
 * Publishes one queued post to its Facebook Page and records the outcome.
 * Shared by the "post now" route and the scheduled-queue cron worker so there
 * is exactly one place that talks to the Graph publish endpoint.
 */
export async function publishPostNow(postId: string): Promise<Post> {
  const post = await getPost(postId);
  if (!post) throw new Error("Post not found.");

  const settings = await getSettings();

  const pageId = post.page_id ?? settings.default_page_id;
  let pageToken: string | null =
    post.page_id && post.page_id === settings.default_page_id
      ? settings.default_page_token
      : null;

  // If token is missing, check pages_cache or re-fetch from Facebook
  if (!pageToken && pageId) {
    try {
      const db = supabaseAdmin();
      const { data: cached } = await db
        .from("pages_cache")
        .select("access_token")
        .eq("page_id", pageId)
        .maybeSingle();

      if (cached?.access_token) {
        pageToken = cached.access_token;
      } else {
        const pages = await fetchPages();
        const found = pages.find((p) => p.id === pageId);
        if (found?.access_token) {
          pageToken = found.access_token;
          await savePagesCache(pages);
        }
      }
    } catch (e) {
      console.warn("Could not lookup token from pages_cache:", e);
    }
  }

  // Fallback to default page token if pageId matches or if it's the only token we have
  if (!pageToken && settings.default_page_token) {
    pageToken = settings.default_page_token;
  }

  if (!pageId || !pageToken) {
    return updatePostRecord(postId, {
      status: "failed",
      error_message: new NoPageSelectedError().message,
    });
  }

  try {
    const message = composeMessage(post, settings.utm_suffix);
    const mediaUrls = post.media_urls && post.media_urls.length > 0 ? post.media_urls : [post.image_url];

    const result =
      mediaUrls.length > 1
        ? await publishMultiPhotos({
            pageId,
            pageToken,
            message,
            imageUrls: mediaUrls,
          })
        : await publishPhoto({
            pageId,
            pageToken,
            message,
            imageUrl: post.image_url,
          });

    return await updatePostRecord(postId, {
      status: "posted",
      facebook_post_id: result.id,
      posted_at: new Date().toISOString(),
      error_message: null,
    });
  } catch (err) {
    let message = err instanceof Error ? err.message : "Unknown error while posting.";

    // Facebook reports a token that lacks pages_manage_posts as a bare
    // "(#200) Permissions error", which says nothing about what to fix.
    if (/\(#200\)|permissions? error/i.test(message)) {
      message =
        "Facebook rejected this for missing permissions. The connected token needs " +
        "pages_manage_posts. Add it to your Meta app — and to the Login for Business " +
        "configuration if you use one — then disconnect and connect again so a new " +
        "token is issued.";
    }

    return await updatePostRecord(postId, { status: "failed", error_message: message });
  }
}
