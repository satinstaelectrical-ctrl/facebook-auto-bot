import {
  publishPhoto,
  publishMultiPhotos,
  publishVideo,
  publishReel,
  publishStory,
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
 * Helper to retrieve a page token for a specific pageId from cache or settings.
 */
async function resolvePageToken(pageId: string): Promise<string | null> {
  const settings = await getSettings();
  if (pageId === settings.default_page_id && settings.default_page_token) {
    return settings.default_page_token;
  }

  try {
    const db = supabaseAdmin();
    const { data: cached } = await db
      .from("pages_cache")
      .select("access_token")
      .eq("page_id", pageId)
      .maybeSingle();

    if (cached?.access_token) {
      return cached.access_token;
    }

    const pages = await fetchPages();
    const found = pages.find((p) => p.id === pageId);
    if (found?.access_token) {
      await savePagesCache(pages);
      return found.access_token;
    }
  } catch (e) {
    console.warn("Could not lookup token from pages_cache:", e);
  }

  return settings.default_page_token || null;
}

/**
 * Publishes one post to a specific page given its format.
 */
async function publishToSinglePage(
  post: Post,
  pageId: string,
  pageToken: string,
  utmSuffix: string
): Promise<{ id: string }> {
  const message = composeMessage(post, utmSuffix);
  const format = post.post_format || "feed";

  if (format === "reel" && (post.video_url || post.image_url)) {
    return publishReel({
      pageId,
      pageToken,
      caption: message,
      videoUrl: post.video_url || post.image_url,
    });
  }

  if (format === "video" && (post.video_url || post.image_url)) {
    return publishVideo({
      pageId,
      pageToken,
      description: message,
      title: post.title,
      videoUrl: post.video_url || post.image_url,
    });
  }

  if (format === "story") {
    return publishStory({
      pageId,
      pageToken,
      imageUrl: post.image_url,
    });
  }

  const mediaUrls =
    post.media_urls && post.media_urls.length > 0 ? post.media_urls : [post.image_url];

  if (mediaUrls.length > 1) {
    return publishMultiPhotos({
      pageId,
      pageToken,
      message,
      imageUrls: mediaUrls,
    });
  }

  return publishPhoto({
    pageId,
    pageToken,
    message,
    imageUrl: post.image_url,
  });
}

/**
 * Publishes one queued post to its Facebook Page and records the outcome.
 * Supports single page or multi-page distribution.
 */
export async function publishPostNow(postId: string): Promise<Post> {
  const post = await getPost(postId);
  if (!post) throw new Error("Post not found.");

  const settings = await getSettings();

  // Multi-page distribution check
  const targetPages =
    post.target_page_ids && post.target_page_ids.length > 1
      ? post.target_page_ids
      : [post.page_id ?? settings.default_page_id].filter(Boolean) as string[];

  if (targetPages.length === 0) {
    return updatePostRecord(postId, {
      status: "failed",
      error_message: new NoPageSelectedError().message,
    });
  }

  // If publishing to multiple pages in 1-click
  if (targetPages.length > 1) {
    const publishedPageIds: string[] = [];
    const errors: string[] = [];
    let firstPostId: string | null = null;

    const results = await Promise.allSettled(
      targetPages.map(async (pid) => {
        const token = await resolvePageToken(pid);
        if (!token) throw new Error(`Missing token for page ${pid}`);
        const res = await publishToSinglePage(post, pid, token, settings.utm_suffix);
        return { pageId: pid, postId: res.id };
      })
    );

    for (const res of results) {
      if (res.status === "fulfilled") {
        publishedPageIds.push(res.value.pageId);
        if (!firstPostId) firstPostId = res.value.postId;
      } else {
        errors.push(res.reason?.message || "Unknown publishing error");
      }
    }

    if (publishedPageIds.length > 0) {
      return await updatePostRecord(postId, {
        status: "posted",
        facebook_post_id: firstPostId,
        published_page_ids: publishedPageIds,
        posted_at: new Date().toISOString(),
        error_message: errors.length > 0 ? `Partially published: ${errors.join(", ")}` : null,
      });
    }

    return await updatePostRecord(postId, {
      status: "failed",
      error_message: errors.join(" | ") || "Failed to publish on all selected pages.",
    });
  }

  // Single page publishing
  const pageId = targetPages[0];
  const pageToken = await resolvePageToken(pageId);

  if (!pageId || !pageToken) {
    return updatePostRecord(postId, {
      status: "failed",
      error_message: new NoPageSelectedError().message,
    });
  }

  try {
    const result = await publishToSinglePage(post, pageId, pageToken, settings.utm_suffix);

    return await updatePostRecord(postId, {
      status: "posted",
      facebook_post_id: result.id,
      published_page_ids: [pageId],
      posted_at: new Date().toISOString(),
      error_message: null,
    });
  } catch (err) {
    let message = err instanceof Error ? err.message : "Unknown error while posting.";

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

/**
 * Publishes a post to an explicit list of page IDs in parallel.
 */
export async function publishPostToMultiplePages(
  postId: string,
  pageIds: string[]
): Promise<Post> {
  await updatePostRecord(postId, { target_page_ids: pageIds });
  return publishPostNow(postId);
}
