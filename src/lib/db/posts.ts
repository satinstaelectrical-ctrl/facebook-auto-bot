import { supabaseAdmin } from "@/lib/supabase/server";
import type { Post, PostStatus } from "@/lib/types";

/**
 * Valid columns confirmed to exist in the production Supabase `posts` table.
 * Any extended properties (target_group_ids, published_group_ids, audio_*)
 * are safely stored inside the `metrics` jsonb column to prevent schema cache errors.
 */
const KNOWN_POST_COLUMNS = new Set([
  "id",
  "topic",
  "title",
  "description",
  "hashtags",
  "image_url",
  "image_source",
  "link_url",
  "page_id",
  "page_name",
  "status",
  "scheduled_at",
  "posted_at",
  "facebook_post_id",
  "error_message",
  "created_at",
  "media_urls",
  "user_id",
  "post_format",
  "video_url",
  "target_page_ids",
  "published_page_ids",
  "metrics",
]);

function splitPayload(data: Record<string, unknown>): {
  columns: Record<string, unknown>;
  extras: Record<string, unknown>;
} {
  const columns: Record<string, unknown> = {};
  const extras: Record<string, unknown> = {};

  for (const [key, val] of Object.entries(data)) {
    if (val === undefined) continue;
    if (KNOWN_POST_COLUMNS.has(key)) {
      columns[key] = val;
    } else {
      extras[key] = val;
    }
  }

  // Pack any extra properties safely into metrics jsonb
  if (Object.keys(extras).length > 0) {
    const existingMetrics = (columns.metrics as Record<string, unknown>) || {};
    columns.metrics = {
      ...existingMetrics,
      ...extras,
    };
  }

  return { columns, extras };
}

function hydratePost(row: Record<string, unknown> | null): Post | null {
  if (!row) return null;
  const metrics = (row.metrics as Record<string, unknown>) || {};
  return {
    ...row,
    target_group_ids:
      (row.target_group_ids as string[] | undefined) ??
      (metrics.target_group_ids as string[] | undefined) ??
      [],
    published_group_ids:
      (row.published_group_ids as string[] | undefined) ??
      (metrics.published_group_ids as string[] | undefined) ??
      [],
    audio_name:
      (row.audio_name as string | null | undefined) ??
      (metrics.audio_name as string | null | undefined) ??
      null,
    audio_url:
      (row.audio_url as string | null | undefined) ??
      (metrics.audio_url as string | null | undefined) ??
      null,
    audio_track_id:
      (row.audio_track_id as string | null | undefined) ??
      (metrics.audio_track_id as string | null | undefined) ??
      null,
  } as Post;
}

export async function listPosts(
  opts: { status?: PostStatus | PostStatus[]; limit?: number } = {}
): Promise<Post[]> {
  const db = supabaseAdmin();
  let query = db.from("posts").select("*").order("created_at", { ascending: false });

  if (opts.status) {
    query = Array.isArray(opts.status)
      ? query.in("status", opts.status)
      : query.eq("status", opts.status);
  }
  if (opts.limit) query = query.limit(opts.limit);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list posts: ${error.message}`);
  return ((data ?? []) as Record<string, unknown>[]).map((r) => hydratePost(r)!) as Post[];
}

export async function getPost(id: string): Promise<Post | null> {
  const db = supabaseAdmin();
  const { data, error } = await db.from("posts").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`Failed to load post: ${error.message}`);
  return hydratePost(data as Record<string, unknown> | null);
}

export async function createPostRecord(
  input: Omit<
    Post,
    "id" | "created_at" | "status" | "posted_at" | "facebook_post_id" | "error_message"
  > & {
    status: PostStatus;
    media_urls?: string[];
  }
): Promise<Post> {
  const db = supabaseAdmin();
  const { columns } = splitPayload(input as Record<string, unknown>);

  try {
    const { data, error } = await db.from("posts").insert(columns).select().single();
    if (error) throw error;
    return hydratePost(data as Record<string, unknown>)!;
  } catch (err: any) {
    const msg = err?.message || String(err);
    // Dynamic retry if any unexpected column is rejected by schema cache
    const colMatch = msg.match(/'([^']+)' column/i) || msg.match(/column "([^"]+)"/i);
    if (colMatch && colMatch[1]) {
      delete columns[colMatch[1]];
      const { data: retryData, error: retryError } = await db
        .from("posts")
        .insert(columns)
        .select()
        .single();
      if (!retryError && retryData) {
        return hydratePost(retryData as Record<string, unknown>)!;
      }
    }
    throw new Error(`Failed to create post: ${msg}`);
  }
}

export async function updatePostRecord(id: string, patch: Partial<Post>): Promise<Post> {
  const db = supabaseAdmin();
  const { columns } = splitPayload(patch as Record<string, unknown>);

  try {
    const { data, error } = await db.from("posts").update(columns).eq("id", id).select().single();
    if (error) throw error;
    return hydratePost(data as Record<string, unknown>)!;
  } catch (err: any) {
    const msg = err?.message || String(err);
    // Dynamic retry if any unexpected column is rejected by schema cache
    const colMatch = msg.match(/'([^']+)' column/i) || msg.match(/column "([^"]+)"/i);
    if (colMatch && colMatch[1]) {
      delete columns[colMatch[1]];
      const { data: retryData, error: retryError } = await db
        .from("posts")
        .update(columns)
        .eq("id", id)
        .select()
        .single();
      if (!retryError && retryData) {
        return hydratePost(retryData as Record<string, unknown>)!;
      }
    }
    throw new Error(`Failed to update post: ${msg}`);
  }
}

export async function deletePostRecord(id: string): Promise<void> {
  const db = supabaseAdmin();
  const { error } = await db.from("posts").delete().eq("id", id);
  if (error) throw new Error(`Failed to delete post: ${error.message}`);
}

/** Scheduled posts whose time has come, oldest first — used by the cron worker. */
export async function listDuePosts(nowIso: string): Promise<Post[]> {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("posts")
    .select("*")
    .eq("status", "scheduled")
    .lte("scheduled_at", nowIso)
    .order("scheduled_at", { ascending: true })
    .limit(20);
  if (error) throw new Error(`Failed to list due posts: ${error.message}`);
  return ((data ?? []) as Record<string, unknown>[]).map((r) => hydratePost(r)!) as Post[];
}
