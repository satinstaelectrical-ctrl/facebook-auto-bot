import { generateContent } from "@/lib/ai/text";
import { createPostRecord } from "@/lib/db/posts";
import { getSettings, updateSettings } from "@/lib/db/settings";
import { publishPostNow } from "@/lib/facebook/publish";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { RSSFeedConfig } from "@/lib/types";

export interface ParsedFeedItem {
  title: string;
  link: string;
  description: string;
  imageUrl?: string;
  guid: string;
  publishedAt?: string;
}

/**
 * Robust zero-dependency RSS/Atom XML parser.
 */
export function parseFeedXml(xml: string): ParsedFeedItem[] {
  const items: ParsedFeedItem[] = [];

  // Match RSS <item> tags or Atom <entry> tags
  const isAtom = xml.includes("<entry");
  const blockRegex = isAtom ? /<entry[\s\S]*?<\/entry>/gi : /<item[\s\S]*?<\/item>/gi;

  const blocks = xml.match(blockRegex) || [];

  for (const block of blocks.slice(0, 10)) {
    // Extract title
    const titleMatch =
      block.match(/<title[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/title>/i) ||
      block.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].replace(/<\/?[^>]+(>|$)/g, "").trim() : "";

    // Extract link
    let link = "";
    const linkMatch =
      block.match(/<link[^>]*href=["']([^"']+)["']/i) ||
      block.match(/<link[^>]*>([\s\S]*?)<\/link>/i);
    if (linkMatch) {
      link = (linkMatch[1] || "").trim();
    }

    // Extract description / content
    const descMatch =
      block.match(/<content[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/content>/i) ||
      block.match(/<description[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/description>/i) ||
      block.match(/<content[^>]*>([\s\S]*?)<\/content>/i) ||
      block.match(/<description[^>]*>([\s\S]*?)<\/description>/i);
    let description = descMatch ? descMatch[1].replace(/<\/?[^>]+(>|$)/g, " ").trim() : "";
    description = description.replace(/\s+/g, " ").slice(0, 400);

    // Extract image
    let imageUrl: string | undefined;
    const mediaMatch =
      block.match(/<media:content[^>]*url=["']([^"']+)["']/i) ||
      block.match(/<media:thumbnail[^>]*url=["']([^"']+)["']/i) ||
      block.match(/<enclosure[^>]*url=["']([^"']+)["'][^>]*type=["']image/i) ||
      block.match(/<img[^>]*src=["']([^"']+)["']/i);
    if (mediaMatch) {
      imageUrl = mediaMatch[1];
    }

    // Extract guid / id
    const guidMatch =
      block.match(/<guid[^>]*>([\s\S]*?)<\/guid>/i) ||
      block.match(/<id[^>]*>([\s\S]*?)<\/id>/i);
    const guid = guidMatch ? guidMatch[1].trim() : link || title;

    if (title && (link || description)) {
      items.push({ title, link, description, imageUrl, guid });
    }
  }

  return items;
}

export async function syncAllRssFeeds(): Promise<{
  syncedFeeds: number;
  newPostsGenerated: number;
  errors: string[];
}> {
  const settings = await getSettings();
  const feeds = settings.rss_feeds || [];
  const errors: string[] = [];
  let newPostsCount = 0;

  if (feeds.length === 0) {
    return { syncedFeeds: 0, newPostsGenerated: 0, errors: [] };
  }

  const db = supabaseAdmin();
  const updatedFeeds: RSSFeedConfig[] = [];

  for (const feed of feeds) {
    if (!feed.enabled || !feed.url) {
      updatedFeeds.push(feed);
      continue;
    }

    try {
      const res = await fetch(feed.url, {
        headers: { "User-Agent": "FacebookAutoBot/2.0 (+https://fundoral.shop)" },
        signal: AbortSignal.timeout(20_000),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const xml = await res.text();
      const items = parseFeedXml(xml);

      let latestGuid = feed.lastItemGuid;

      for (const item of items) {
        if (item.guid === feed.lastItemGuid) break;

        // Check if link already exists in posts table
        if (item.link) {
          const { data: existing } = await db
            .from("posts")
            .select("id")
            .eq("link_url", item.link)
            .maybeSingle();
          if (existing) continue;
        }

        // Synthesize via AI
        const topicPrompt = `${item.title}. ${item.description}`;
        const aiCopy = await generateContent(topicPrompt, { tone: "engaging", language: "fr" });

        const targetPageId = feed.pageId || settings.default_page_id || "";
        const targetPageName = settings.default_page_name || "Page Facebook";
        const finalImage =
          item.imageUrl ||
          "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1080&auto=format&fit=crop&q=80";

        const newPost = await createPostRecord({
          topic: item.title,
          title: aiCopy.title,
          description: aiCopy.description,
          hashtags: aiCopy.hashtags,
          image_url: finalImage,
          image_source: item.imageUrl ? "upload" : "ai",
          media_urls: [finalImage],
          link_url: item.link || null,
          page_id: targetPageId,
          page_name: targetPageName,
          status: feed.autoPublish ? "posted" : "draft",
          scheduled_at: null,
        });

        if (feed.autoPublish && targetPageId) {
          try {
            await publishPostNow(newPost.id);
          } catch (pubErr) {
            console.warn("Auto-publish failed for RSS item:", pubErr);
          }
        }

        newPostsCount++;
        if (!latestGuid) latestGuid = item.guid;
        // Limit to max 2 new posts per feed sync
        break;
      }

      updatedFeeds.push({
        ...feed,
        lastCheckedAt: new Date().toISOString(),
        lastItemGuid: latestGuid || feed.lastItemGuid,
      });
    } catch (err) {
      errors.push(`${feed.name}: ${err instanceof Error ? err.message : String(err)}`);
      updatedFeeds.push(feed);
    }
  }

  await updateSettings({ rss_feeds: updatedFeeds });

  return {
    syncedFeeds: feeds.filter((f) => f.enabled).length,
    newPostsGenerated: newPostsCount,
    errors,
  };
}
