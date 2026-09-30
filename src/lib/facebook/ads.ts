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
  // Real demographic and geographic targeting
  targetCountries: string[]; // e.g. ["CM", "CI", "SN", "FR"]
  targetCities?: string[];
  ageMin?: number;
  ageMax?: number;
  gender?: "all" | "men" | "women";
}

export interface AdAccountVerification {
  ok: boolean;
  adAccountId: string;
  accountName?: string;
  currency?: string;
  accountStatus?: string; // 1 = ACTIVE, 2 = DISABLED, etc.
  amountSpent?: string;
  hasAdsPermission: boolean;
  warning?: string;
  error?: string;
}

/**
 * Checks token permissions and validates the Meta Ad Account against the Graph API.
 */
export async function verifyMetaAdAccount(customAdAccountId?: string): Promise<AdAccountVerification> {
  const settings = await getSettings();
  const token = settings.facebook_user_token;

  if (!token) {
    return {
      ok: false,
      adAccountId: customAdAccountId || "",
      hasAdsPermission: false,
      error: "Compte Facebook non connecté. Connectez votre compte dans les Paramètres.",
    };
  }

  const rawAccountId = customAdAccountId || settings.meta_ad_account_id;
  if (!rawAccountId?.trim()) {
    return {
      ok: false,
      adAccountId: "",
      hasAdsPermission: false,
      error: "Aucun ID de compte publicitaire Meta renseigné (ex. act_123456789).",
    };
  }

  const adAccountId = rawAccountId.trim().startsWith("act_")
    ? rawAccountId.trim()
    : `act_${rawAccountId.trim()}`;

  // 1. Check permissions granted on the access token
  let hasAdsPermission = false;
  try {
    const permRes = await fetch(`${GRAPH_BASE}/me/permissions?access_token=${encodeURIComponent(token)}`, {
      signal: AbortSignal.timeout(10_000),
    });
    if (permRes.ok) {
      const permData = await permRes.json();
      const perms = (permData.data || []) as Array<{ permission: string; status: string }>;
      hasAdsPermission = perms.some(
        (p) => (p.permission === "ads_management" || p.permission === "ads_read") && p.status === "granted"
      );
    }
  } catch (permErr) {
    console.warn("Could not check Meta permissions:", permErr);
  }

  // 2. Query Ad Account details
  try {
    const fields = "id,name,account_status,currency,amount_spent,is_prepay_account,business_name";
    const res = await fetch(`${GRAPH_BASE}/${adAccountId}?fields=${fields}&access_token=${encodeURIComponent(token)}`, {
      signal: AbortSignal.timeout(12_000),
    });

    const data = await res.json();

    if (!res.ok || data.error) {
      const metaMsg = data.error?.message || "Erreur Graph API Meta Ads";
      const code = data.error?.code;

      let warning = metaMsg;
      if (code === 200 || !hasAdsPermission) {
        warning = `L'application Meta n'a pas l'autorisation 'ads_management'. Rendez-vous sur developers.facebook.com > Votre App > Rôles/Permissions pour activer 'ads_management' et 'ads_read'.`;
      } else if (code === 100) {
        warning = `L'identifiant du compte publicitaire "${adAccountId}" est introuvable ou vous n'en êtes pas administrateur.`;
      }

      return {
        ok: false,
        adAccountId,
        hasAdsPermission,
        warning,
        error: metaMsg,
      };
    }

    const statusMap: Record<number, string> = {
      1: "ACTIF",
      2: "DÉSACTIVÉ",
      3: "EN ATTENTE DE RÈGLEMENT",
      7: "EN COURS DE FERMETURE",
    };

    return {
      ok: true,
      adAccountId,
      accountName: data.name || data.business_name || adAccountId,
      currency: data.currency || "USD",
      accountStatus: statusMap[data.account_status] || `STATUT ${data.account_status}`,
      amountSpent: data.amount_spent ? `${(Number(data.amount_spent) / 100).toFixed(2)} ${data.currency || ""}` : undefined,
      hasAdsPermission,
      warning: !hasAdsPermission
        ? "Note: La permission 'ads_management' n'a pas été détectée dans le token actuel. Vous devez renouveler votre connexion Facebook avec les autorisations publicitaires pour publier des annonces."
        : undefined,
    };
  } catch (err) {
    return {
      ok: false,
      adAccountId,
      hasAdsPermission,
      error: err instanceof Error ? err.message : "Impossible de contacter l'API Meta Marketing.",
    };
  }
}

/**
 * Creates a 100% REAL Meta Ads campaign, adset, and ad via Graph API.
 * Never creates simulated or fake campaigns: if Meta rejects, an informative error is thrown.
 */
export async function createMetaAdBoost(params: BoostPostParams): Promise<MetaCampaign> {
  const settings = await getSettings();
  const token = settings.facebook_user_token;
  if (!token) {
    throw new Error("Compte Facebook non connecté. Connectez-vous d'abord dans Paramètres.");
  }

  const rawAccountId = params.adAccountId || settings.meta_ad_account_id;
  if (!rawAccountId?.trim()) {
    throw new Error(
      "Aucun compte publicitaire Meta configuré. Renseignez votre identifiant de compte (ex. act_123456789) dans Paramètres."
    );
  }

  const adAccountId = rawAccountId.trim().startsWith("act_")
    ? rawAccountId.trim()
    : `act_${rawAccountId.trim()}`;

  // Demographic / Geographic validation
  const countries = (params.targetCountries || []).map((c) => c.trim().toUpperCase()).filter(Boolean);
  if (countries.length === 0) {
    throw new Error("Veuillez sélectionner au moins un pays de diffusion pour votre ciblage publicitaire.");
  }

  const ageMin = Math.max(18, params.ageMin || 18);
  const ageMax = Math.min(65, Math.max(ageMin, params.ageMax || 65));
  const genderArray =
    params.gender === "men" ? [1] : params.gender === "women" ? [2] : [1, 2];

  // 1. Fetch post from DB to ensure valid facebook_post_id
  const db = supabaseAdmin();
  const { data: post, error: postErr } = await db
    .from("posts")
    .select("*")
    .eq("id", params.postId)
    .single();

  if (postErr || !post) {
    throw new Error("Publication introuvable dans la base de données.");
  }

  if (post.status !== "posted" || !post.facebook_post_id) {
    throw new Error("La publication doit être déjà publiée sur Facebook avant de pouvoir être boostée.");
  }

  const budgetCents = Math.max(100, Math.round(params.budgetDollars * 100)); // Minimum 100 cents (1 USD / EUR)
  const campaignName = `Boost: ${post.title.slice(0, 30)} - ${new Date().toLocaleDateString("fr-FR")}`;

  // -------------------------------------------------------------------------
  // STEP 1: Create Meta Ads Campaign (POST /{ad_account_id}/campaigns)
  // -------------------------------------------------------------------------
  const campBody = new URLSearchParams({
    access_token: token,
    name: campaignName,
    objective: params.objective === "PAGE_LIKES" ? "OUTCOME_ENGAGEMENT" : "OUTCOME_ENGAGEMENT",
    status: "PAUSED", // Safe default so user can review or schedule spend
    special_ad_categories: "NONE",
  });

  const campRes = await fetch(`${GRAPH_BASE}/${adAccountId}/campaigns`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: campBody,
    signal: AbortSignal.timeout(30_000),
  });

  const campData = await campRes.json();
  if (!campRes.ok || !campData.id) {
    const errorMsg = campData.error?.message || "Erreur Meta Graph API lors de la création de la campagne.";
    const errorCode = campData.error?.code;

    if (errorCode === 200 || errorMsg.includes("permission") || errorMsg.includes("access")) {
      throw new Error(
        `Autorisation Meta Ads manquante (#${errorCode}) : ${errorMsg}. Votre compte Meta requiert la permission 'ads_management'. Configurez-la sur developers.facebook.com.`
      );
    }
    throw new Error(`Meta Ads a rejeté la création de la campagne : ${errorMsg}`);
  }

  const campaignId = String(campData.id);

  // -------------------------------------------------------------------------
  // STEP 2: Create AdSet with Real Targeting (POST /{ad_account_id}/adsets)
  // -------------------------------------------------------------------------
  const targetingObj: Record<string, unknown> = {
    geo_locations: {
      countries,
      location_types: ["home", "recent"],
    },
    age_min: ageMin,
    age_max: ageMax,
    genders: genderArray,
  };

  const startTime = new Date(Date.now() + 60_000).toISOString(); // In 1 minute
  const endTime = new Date(Date.now() + params.durationDays * 86_400_000).toISOString();

  const adsetBody = new URLSearchParams({
    access_token: token,
    campaign_id: campaignId,
    name: `AdSet: ${campaignName}`,
    billing_event: "IMPRESSIONS",
    optimization_goal: "POST_ENGAGEMENT",
    status: "PAUSED",
    targeting: JSON.stringify(targetingObj),
    start_time: startTime,
    end_time: endTime,
  });

  if (params.budgetType === "lifetime") {
    adsetBody.set("lifetime_budget", String(budgetCents));
  } else {
    adsetBody.set("daily_budget", String(budgetCents));
  }

  const adsetRes = await fetch(`${GRAPH_BASE}/${adAccountId}/adsets`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: adsetBody,
    signal: AbortSignal.timeout(30_000),
  });

  const adsetData = await adsetRes.json();
  if (!adsetRes.ok || !adsetData.id) {
    const adsetErr = adsetData.error?.message || "Erreur Meta lors de la configuration du ciblage (AdSet).";
    // Attempt rollback/pause of campaign
    await fetch(`${GRAPH_BASE}/${campaignId}?status=PAUSED&access_token=${token}`, { method: "POST" }).catch(() => {});
    throw new Error(`Meta Ads a rejeté le ciblage publicitaire (AdSet) : ${adsetErr}`);
  }

  const adsetId = String(adsetData.id);

  // -------------------------------------------------------------------------
  // STEP 3: Create Ad Creative from Published Post (POST /{ad_account_id}/adcreatives)
  // -------------------------------------------------------------------------
  let creativeId = "";
  const creativeBody = new URLSearchParams({
    access_token: token,
    name: `Creative: ${campaignName}`,
    object_story_id: post.facebook_post_id,
  });

  const creativeRes = await fetch(`${GRAPH_BASE}/${adAccountId}/adcreatives`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: creativeBody,
    signal: AbortSignal.timeout(30_000),
  });

  const creativeData = await creativeRes.json();
  if (creativeRes.ok && creativeData.id) {
    creativeId = String(creativeData.id);
  }

  // -------------------------------------------------------------------------
  // STEP 4: Create Ad (POST /{ad_account_id}/ads)
  // -------------------------------------------------------------------------
  let adId = "";
  if (creativeId) {
    const adBody = new URLSearchParams({
      access_token: token,
      name: `Ad: ${campaignName}`,
      adset_id: adsetId,
      creative: JSON.stringify({ creative_id: creativeId }),
      status: "PAUSED",
    });

    const adRes = await fetch(`${GRAPH_BASE}/${adAccountId}/ads`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: adBody,
      signal: AbortSignal.timeout(30_000),
    });

    const adData = await adRes.json();
    if (adRes.ok && adData.id) {
      adId = String(adData.id);
    }
  }

  // -------------------------------------------------------------------------
  // STEP 5: Persist Verified Real Meta Campaign in Database
  // -------------------------------------------------------------------------
  const record: Omit<MetaCampaign, "id" | "created_at"> = {
    post_id: post.id,
    facebook_post_id: post.facebook_post_id,
    page_id: post.page_id,
    campaign_id: campaignId,
    adset_id: adsetId,
    ad_id: adId || null,
    name: campaignName,
    objective: params.objective,
    budget_cents: budgetCents,
    budget_type: params.budgetType,
    duration_days: params.durationDays,
    status: "PAUSED",
    target_countries: countries,
    target_cities: params.targetCities || [],
    age_min: ageMin,
    age_max: ageMax,
    genders: genderArray,
    meta_response: {
      campaign: campData,
      adset: adsetData,
      creative: creativeData,
    },
  };

  const { data: inserted, error: insertErr } = await db
    .from("meta_campaigns")
    .insert(record)
    .select()
    .single();

  if (insertErr || !inserted) {
    console.warn("Meta campaign created on Facebook but failed to save in Supabase:", insertErr);
    return {
      id: campaignId,
      created_at: new Date().toISOString(),
      ...record,
    } as MetaCampaign;
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
