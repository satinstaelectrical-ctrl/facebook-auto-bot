import {
  publishPhoto,
  publishMultiPhotos,
  publishVideo,
  publishReel,
  publishStory,
  publishToGroup,
  publishStatusUpdate,
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

  // Check if media is genuinely a video file
  const isVideo = Boolean(
    post.video_url ||
      (post.image_url && /\.(mp4|mov|webm|m4v)(\?.*)?$/i.test(post.image_url)) ||
      format === "video" ||
      format === "reel"
  );
  const videoUrl =
    post.video_url ||
    (isVideo && post.image_url && !/\.(jpe?g|png|webp|gif)(\?.*)?$/i.test(post.image_url)
      ? post.image_url
      : null);

  // If a video is present, always route through dedicated video endpoints
  if (videoUrl && !videoUrl.startsWith("blob:")) {
    if (format === "reel") {
      return publishReel({
        pageId,
        pageToken,
        caption: message,
        videoUrl,
        audioName: post.audio_name ?? undefined,
      });
    }

    if (format === "story") {
      return publishStory({
        pageId,
        pageToken,
        imageUrl: undefined,
        videoUrl,
      });
    }

    // Both "video" and "feed" with video media must be published via publishVideo
    return publishVideo({
      pageId,
      pageToken,
      description: message,
      title: post.title,
      videoUrl,
    });
  }

  // Handle story with photo
  if (format === "story") {
    return publishStory({
      pageId,
      pageToken,
      imageUrl: post.image_url && !post.image_url.startsWith("blob:") ? post.image_url : undefined,
      videoUrl: undefined,
    });
  }

  const mediaUrls = (
    post.media_urls && post.media_urls.length > 0 ? post.media_urls : [post.image_url]
  ).filter((url) => Boolean(url) && !url.startsWith("blob:"));

  if (mediaUrls.length > 1) {
    return publishMultiPhotos({
      pageId,
      pageToken,
      message,
      imageUrls: mediaUrls,
    });
  }

  if (mediaUrls.length === 1 && !/\.(mp4|mov|webm|m4v)(\?.*)?$/i.test(mediaUrls[0])) {
    return publishPhoto({
      pageId,
      pageToken,
      message,
      imageUrl: mediaUrls[0],
    });
  }

  // Text-only status update fallback if no valid photo or video media
  return publishStatusUpdate({
    pageId,
    pageToken,
    message,
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
      // In real-time: cross-publish / share to selected Facebook Groups / Communities
      const publishedGroupIds: string[] = [];
      if (post.target_group_ids && post.target_group_ids.length > 0) {
        const shareToken = (await resolvePageToken(publishedPageIds[0])) || settings.facebook_user_token || "";
        const message = composeMessage(post, settings.utm_suffix);
        const resolvedVideo = post.video_url || (post.image_url && /\.(mp4|mov|webm|m4v)(\?.*)?$/i.test(post.image_url) ? post.image_url : undefined);
        const resolvedPhoto = !resolvedVideo && post.image_url && !post.image_url.startsWith("blob:") ? post.image_url : undefined;
        for (const gid of post.target_group_ids) {
          try {
            await publishToGroup({
              groupId: gid,
              token: shareToken,
              message,
              officialPostId: firstPostId || undefined,
              videoUrl: resolvedVideo,
              imageUrl: resolvedPhoto,
            });
            publishedGroupIds.push(gid);
          } catch (grpErr) {
            console.warn(`Error sharing to group ${gid}:`, grpErr);
          }
        }
      }

      return await updatePostRecord(postId, {
        status: "posted",
        facebook_post_id: firstPostId,
        published_page_ids: publishedPageIds,
        published_group_ids: publishedGroupIds,
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

    // In real-time: cross-publish / share to selected Facebook Groups / Communities
    const publishedGroupIds: string[] = [];
    if (post.target_group_ids && post.target_group_ids.length > 0) {
      const shareToken = pageToken || settings.facebook_user_token || "";
      const message = composeMessage(post, settings.utm_suffix);
      const resolvedVideo = post.video_url || (post.image_url && /\.(mp4|mov|webm|m4v)(\?.*)?$/i.test(post.image_url) ? post.image_url : undefined);
      const resolvedPhoto = !resolvedVideo && post.image_url && !post.image_url.startsWith("blob:") ? post.image_url : undefined;
      for (const gid of post.target_group_ids) {
        try {
          await publishToGroup({
            groupId: gid,
            token: shareToken,
            message,
            officialPostId: result.id,
            videoUrl: resolvedVideo,
            imageUrl: resolvedPhoto,
          });
          publishedGroupIds.push(gid);
        } catch (grpErr) {
          console.warn(`Failed to share to group ${gid}:`, grpErr);
        }
      }
    }

    return await updatePostRecord(postId, {
      status: "posted",
      facebook_post_id: result.id,
      published_page_ids: [pageId],
      published_group_ids: publishedGroupIds,
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
