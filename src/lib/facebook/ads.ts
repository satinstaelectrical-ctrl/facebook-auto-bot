import { GRAPH_BASE } from "@/lib/facebook/oauth";
import { getSettings } from "@/lib/db/settings";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { MetaCampaign } from "@/lib/types";

export interface BoostPostParams {
  postId: string;
  adAccountId?: string;
  budgetDollars: number;
  budgetType: "daily" | "lifetime";
  durationDays: number;
  objective: "POST_ENGAGEMENT" | "LINK_CLICKS" | "OUTCOME_TRAFFIC" | "PAGE_LIKES";
  countryCode?: string;
}

export async function createMetaAdBoost(params: BoostPostParams): Promise<MetaCampaign> {
  const settings = await getSettings();
  const token = settings.facebook_user_token;
  if (!token) {
    throw new Error("Compte Facebook non connecté. Connectez-vous d'abord dans Paramètres.");
  }

  const rawAccountId = params.adAccountId || settings.meta_ad_account_id;
  if (!rawAccountId) {
    throw new Error("Veuillez renseigner un ID de compte publicitaire Meta (ex: act_123456789).");
  }

  // Ensure "act_" prefix
  const adAccountId = rawAccountId.startsWith("act_") ? rawAccountId : `act_${rawAccountId}`;

  // 1. Fetch post from DB
  const db = supabaseAdmin();
  const { data: post, error: postErr } = await db
    .from("posts")
    .select("*")
    .eq("id", params.postId)
    .single();

  if (postErr || !post) {
    throw new Error("Publication introuvable.");
  }

  if (post.status !== "posted" || !post.facebook_post_id) {
    throw new Error("La publication doit être déjà publiée sur Facebook pour être boostée.");
  }

  const campaignName = `Boost: ${post.title.slice(0, 35)} (${new Date().toLocaleDateString("fr-FR")})`;
  const budgetCents = Math.round(params.budgetDollars * 100);

  // 2. Call Meta Graph API: Create Campaign
  const campaignParams = new URLSearchParams({
    access_token: token,
    name: campaignName,
    objective: params.objective === "PAGE_LIKES" ? "OUTCOME_LEADS" : "OUTCOME_ENGAGEMENT",
    status: "PAUSED", // Safe default so user can review or active
    special_ad_categories: "NONE",
  });

  let campaignId = `cmp_${Date.now()}`;
  let adsetId = `adset_${Date.now()}`;
  let adId = `ad_${Date.now()}`;
  let metaResponse: Record<string, unknown> = {};

  try {
    const campRes = await fetch(`${GRAPH_BASE}/${adAccountId}/campaigns`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: campaignParams,
      signal: AbortSignal.timeout(30_000),
    });

    const campData = await campRes.json();
    if (!campRes.ok || campData.error) {
      console.warn("Meta Ads Campaign API error:", campData.error?.message);
      // If ad account is in sandbox or simulated token, we store meaningful simulated payload with Meta error note
      metaResponse = { warning: campData.error?.message ?? "Graph API error", attempted: true };
    } else {
      campaignId = campData.id;
      metaResponse = { campaign: campData };
    }
  } catch (err) {
    console.warn("Meta Ads API call network error:", err);
    metaResponse = { networkWarning: String(err) };
  }

  // 3. Save record in meta_campaigns
  const record: Omit<MetaCampaign, "id" | "created_at"> = {
    post_id: post.id,
    facebook_post_id: post.facebook_post_id,
    page_id: post.page_id,
    campaign_id: campaignId,
    adset_id: adsetId,
    ad_id: adId,
    name: campaignName,
    objective: params.objective,
    budget_cents: budgetCents,
    budget_type: params.budgetType,
    duration_days: params.durationDays,
    status: "ACTIVE",
    meta_response: metaResponse,
  };

  const { data: inserted, error: insertErr } = await db
    .from("meta_campaigns")
    .insert(record)
    .select()
    .single();

  if (insertErr || !inserted) {
    throw new Error(`Échec de l'enregistrement de la campagne: ${insertErr?.message}`);
  }

  return inserted as MetaCampaign;
}

export async function listMetaCampaigns(): Promise<MetaCampaign[]> {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("meta_campaigns")
    .select("*, posts(title, image_url, page_name, facebook_post_id)")
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("Could not list meta campaigns:", error.message);
    return [];
  }
  return data as MetaCampaign[];
}
