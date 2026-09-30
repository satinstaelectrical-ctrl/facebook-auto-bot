export type ImageSource = "ai" | "stock" | "upload";
export type ImageSourcePref = "ai" | "stock" | "mixed";
export type PostStatus = "draft" | "scheduled" | "posted" | "failed";

/**
 * Where autopilot gets its subjects. "mine" rotates through the owner's own
 * topic list and only borrows trending ideas while that list is empty.
 */
export type TopicSource = "mine" | "trending" | "mixed";

export interface Topic {
  id: string;
  text: string;
  enabled: boolean;
  use_count: number;
  last_used_at: string | null;
  created_at: string;
}

export type AIProvider = "free" | "openai" | "anthropic" | "gemini" | "openrouter";

export interface RSSFeedConfig {
  id: string;
  name: string;
  url: string;
  pageId?: string;
  enabled: boolean;
  autoPublish?: boolean;
  lastCheckedAt?: string;
  lastItemGuid?: string;
}

export interface MetaCampaign {
  id: string;
  post_id: string | null;
  facebook_post_id: string | null;
  page_id: string | null;
  campaign_id: string;
  adset_id?: string | null;
  ad_id?: string | null;
  name: string;
  objective: string;
  budget_cents: number;
  budget_type: "daily" | "lifetime";
  duration_days: number;
  status: string;
  meta_response?: Record<string, unknown> | null;
  created_at: string;
}

export interface PostMetrics {
  reach?: number;
  impressions?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  clicks?: number;
  video_views?: number;
  retention_3s?: number; // percentage (0-100)
  completion_rate?: number; // percentage (0-100)
}

export type PostFormat = "feed" | "reel" | "story" | "video" | "carousel";

export interface PageGroup {
  id: string;
  name: string;
  page_ids: string[];
  created_at: string;
}

export interface ConnectedWebsite {
  id: string;
  name: string;
  url: string;
  platform: "wordpress" | "shopify" | "rss" | "custom";
  rss_url?: string | null;
  webhook_secret: string;
  auto_publish: boolean;
  target_page_id?: string | null;
  last_sync_at?: string | null;
  created_at: string;
}

export interface AppSettings {
  id: 1;
  /** Meta app credentials, normally entered in Settings rather than env vars. */
  facebook_app_id: string | null;
  facebook_app_secret: string | null;
  /**
   * Facebook Login for Business "login configuration" id. Apps created with the
   * Page-management use case get Login for Business, where config_id replaces
   * scope — the permissions come from the saved configuration instead of the
   * URL. Null means the app uses classic Facebook Login and scopes.
   */
  facebook_config_id: string | null;
  /** Long-lived user token — lists Pages and mints Page tokens, never posts. */
  facebook_user_token: string | null;
  facebook_token_expires_at: string | null;
  facebook_user_name: string | null;
  default_page_id: string | null;
  default_page_name: string | null;
  /** Page tokens derived from a long-lived user token do not expire. */
  default_page_token: string | null;
  image_source: ImageSourcePref;
  utm_suffix: string;
  auto_post_enabled: boolean;
  posts_per_day: number;
  posting_hours: number[];
  timezone: string;
  last_auto_post_at: string | null;
  /** Absent on databases created before topics existed; treat as "mine". */
  topic_source?: TopicSource;
  /** BYOK Custom AI providers (AES-256-GCM encrypted in DB) */
  openai_api_key_encrypted?: string | null;
  anthropic_api_key_encrypted?: string | null;
  gemini_api_key_encrypted?: string | null;
  openrouter_api_key_encrypted?: string | null;
  preferred_ai_provider?: AIProvider;
  ai_model_name?: string | null;
  /** Webhook & RSS Gateway */
  webhook_secret?: string | null;
  rss_feeds?: RSSFeedConfig[];
  connected_websites?: ConnectedWebsite[];
  page_groups?: PageGroup[];
  /** Meta Ads Account */
  meta_ad_account_id?: string | null;
  updated_at: string;
}

export interface Post {
  id: string;
  topic: string;
  title: string;
  description: string;
  hashtags: string[];
  image_url: string;
  image_source: ImageSource;
  media_urls?: string[];
  video_url?: string | null;
  post_format?: PostFormat;
  link_url: string | null;
  page_id: string | null;
  page_name: string | null;
  target_page_ids?: string[];
  published_page_ids?: string[];
  status: PostStatus;
  scheduled_at: string | null;
  posted_at: string | null;
  facebook_post_id: string | null;
  error_message: string | null;
  metrics?: PostMetrics | null;
  created_at: string;
}

export interface PageCache {
  page_id: string;
  name: string;
  category: string | null;
  access_token?: string | null;
  avatar_url?: string | null;
  fetched_at: string;
}

export type ContentTone =
  | "engaging"
  | "professional"
  | "mysterious"
  | "educational"
  | "promotional";

export type ContentLanguage = "fr" | "en" | "es" | "de";

export type ContentProvider =
  | "openai"
  | "anthropic"
  | "gemini"
  | "openrouter"
  | "groq"
  | "pollinations"
  | "template";

export interface GeneratedContent {
  title: string;
  description: string;
  hashtags: string[];
  provider?: ContentProvider;
  /** First provider failure, surfaced so a degraded draft can explain itself. */
  providerError?: string;
}

/**
 * Public URL of a published post. Facebook returns `post_id` as
 * `<page-id>_<post-id>`, and that composite is itself addressable.
 */
export const facebookPostUrl = (postId: string) => `https://www.facebook.com/${postId}`;

export const isFacebookConnected = (s: Pick<AppSettings, "facebook_user_token">) =>
  Boolean(s.facebook_user_token);

/**
 * Facebook takes one `message` per post, so the separately-edited parts are
 * composed here — one place, shared by the publisher and the preview.
 */
export function composeMessage(
  post: Pick<Post, "title" | "description" | "hashtags" | "link_url">,
  utmSuffix = ""
): string {
  const tags = post.hashtags.map((h) => `#${h.replace(/^#/, "")}`).join(" ");
  return [post.title, post.description, post.link_url ?? "", tags, utmSuffix]
    .map((part) => part.trim())
    .filter(Boolean)
    .join("\n\n");
}
