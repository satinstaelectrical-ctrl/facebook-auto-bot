import { getSettings } from "@/lib/db/settings";
import { decryptSecret } from "@/lib/crypto";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { ListingWebhookPayload, WhatsAppTargetGroup } from "@/lib/types";

export interface WhatsAppGatewayConfig {
  apiUrl: string;
  apiKey?: string;
  instanceName: string;
}

export interface WhatsAppConnectionResult {
  connected: boolean;
  state: "open" | "connecting" | "close" | "refused" | "unknown";
  qrCode?: string | null;
  pairingCode?: string | null;
  error?: string | null;
}

export interface WhatsAppGroupItem {
  id: string;
  name: string;
  size?: number;
}

export interface WhatsAppBroadcastResult {
  enabled: boolean;
  totalTargets: number;
  successful: number;
  failed: number;
  details: Array<{
    groupId: string;
    groupName: string;
    status: "sent" | "failed";
    error?: string;
  }>;
}

function normalizeApiUrl(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

function buildHeaders(apiKey?: string): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (apiKey?.trim()) {
    headers["apikey"] = apiKey.trim();
    headers["Authorization"] = `Bearer ${apiKey.trim()}`;
  }
  return headers;
}

/**
 * Tests connection to the WhatsApp Gateway (Evolution API or compatible),
 * and fetches the QR code if pairing is required.
 */
export async function testWhatsAppConnection(
  config: WhatsAppGatewayConfig
): Promise<WhatsAppConnectionResult> {
  const base = normalizeApiUrl(config.apiUrl);
  const instance = encodeURIComponent(config.instanceName.trim() || "yamoura-bot");
  const headers = buildHeaders(config.apiKey);

  try {
    // 1. Check current connection state
    const stateUrl = `${base}/instance/connectionState/${instance}`;
    const stateRes = await fetch(stateUrl, {
      method: "GET",
      headers,
      signal: AbortSignal.timeout(10_000),
    });

    if (stateRes.ok) {
      const data = await stateRes.json().catch(() => null);
      const state =
        data?.instance?.state ||
        data?.state ||
        (data?.status === "CONNECTED" ? "open" : "unknown");

      if (state === "open" || state === "CONNECTED") {
        return { connected: true, state: "open" };
      }
    }

    // 2. If not open, request connect / QR Code
    const connectUrl = `${base}/instance/connect/${instance}`;
    const connectRes = await fetch(connectUrl, {
      method: "GET",
      headers,
      signal: AbortSignal.timeout(12_000),
    });

    if (connectRes.ok) {
      const data = await connectRes.json().catch(() => null);
      const qrCode = data?.base64 || data?.qrcode?.base64 || data?.code || null;
      const pairingCode = data?.pairingCode || null;
      return {
        connected: false,
        state: "connecting",
        qrCode,
        pairingCode,
      };
    }

    return {
      connected: false,
      state: "close",
      error: `Passerelle joignable mais instance déconnectée (HTTP ${connectRes.status}).`,
    };
  } catch (err) {
    return {
      connected: false,
      state: "refused",
      error: err instanceof Error ? err.message : "Impossible de contacter la passerelle WhatsApp.",
    };
  }
}

/**
 * Fetches the list of WhatsApp Groups the instance is joined in.
 */
export async function fetchWhatsAppGroups(
  config: WhatsAppGatewayConfig
): Promise<WhatsAppGroupItem[]> {
  const base = normalizeApiUrl(config.apiUrl);
  const instance = encodeURIComponent(config.instanceName.trim() || "yamoura-bot");
  const headers = buildHeaders(config.apiKey);

  try {
    const url = `${base}/group/fetchAllGroups/${instance}?getParticipants=false`;
    const res = await fetch(url, {
      method: "GET",
      headers,
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Erreur récupération groupes WhatsApp (${res.status}): ${text.slice(0, 100)}`);
    }

    const data = await res.json();
    const groups: WhatsAppGroupItem[] = [];

    if (Array.isArray(data)) {
      for (const item of data) {
        if (item.id) {
          groups.push({
            id: String(item.id),
            name: String(item.subject || item.name || item.id),
            size: item.size || item.participants?.length || undefined,
          });
        }
      }
    }

    return groups;
  } catch (err) {
    console.error("fetchWhatsAppGroups error:", err);
    throw err;
  }
}

/**
 * Sends a media message (with photo & formatted caption) to a WhatsApp target (group JID or individual).
 */
export async function sendWhatsAppListingToTarget(
  config: WhatsAppGatewayConfig,
  targetJid: string,
  formattedMessage: string,
  imageUrl?: string
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  const base = normalizeApiUrl(config.apiUrl);
  const instance = encodeURIComponent(config.instanceName.trim() || "yamoura-bot");
  const headers = buildHeaders(config.apiKey);

  // If image URL is present, use sendMedia
  if (imageUrl?.trim()) {
    try {
      const mediaUrl = `${base}/message/sendMedia/${instance}`;
      const res = await fetch(mediaUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({
          number: targetJid,
          mediatype: "image",
          mimetype: "image/jpeg",
          caption: formattedMessage,
          media: imageUrl.trim(),
        }),
        signal: AbortSignal.timeout(25_000),
      });

      if (res.ok) {
        const data = await res.json().catch(() => null);
        return { success: true, data };
      }
      // If sendMedia fails, fall back to sendText
    } catch (e) {
      console.warn(`sendMedia failed for target ${targetJid}, falling back to text:`, e);
    }
  }

  // Fallback: send as standard text message
  try {
    const textUrl = `${base}/message/sendText/${instance}`;
    const res = await fetch(textUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        number: targetJid,
        text: imageUrl ? `${formattedMessage}\n\n🖼️ Photo : ${imageUrl}` : formattedMessage,
        linkPreview: true,
      }),
      signal: AbortSignal.timeout(20_000),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return {
        success: false,
        error: `Erreur passerelle WhatsApp (${res.status}): ${errText.slice(0, 140)}`,
      };
    }

    const data = await res.json().catch(() => null);
    return { success: true, data };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erreur inattendue d'envoi WhatsApp.",
    };
  }
}

/**
 * Broadcasts an incoming listing to all configured and active WhatsApp groups/channels.
 */
export async function broadcastListingToWhatsApp(
  listing: ListingWebhookPayload,
  formattedMessage: string
): Promise<WhatsAppBroadcastResult> {
  const settings = await getSettings();

  if (!settings.whatsapp_enabled || !settings.whatsapp_api_url?.trim()) {
    return {
      enabled: false,
      totalTargets: 0,
      successful: 0,
      failed: 0,
      details: [],
    };
  }

  const apiKey = settings.whatsapp_api_key_encrypted
    ? decryptSecret(settings.whatsapp_api_key_encrypted)
    : undefined;

  const config: WhatsAppGatewayConfig = {
    apiUrl: settings.whatsapp_api_url,
    apiKey,
    instanceName: settings.whatsapp_instance_name?.trim() || "yamoura-bot",
  };

  const allGroups = (settings.whatsapp_target_groups || []) as WhatsAppTargetGroup[];
  const activeGroups = allGroups.filter((g) => g.enabled);

  if (activeGroups.length === 0) {
    return {
      enabled: true,
      totalTargets: 0,
      successful: 0,
      failed: 0,
      details: [],
    };
  }

  const details: WhatsAppBroadcastResult["details"] = [];
  let successful = 0;
  let failed = 0;

  for (const group of activeGroups) {
    const outcome = await sendWhatsAppListingToTarget(
      config,
      group.id,
      formattedMessage,
      listing.imageUrl
    );

    // Save log entry to Supabase for auditability
    try {
      const db = supabaseAdmin();
      await db.from("whatsapp_broadcast_logs").insert({
        listing_title: listing.title,
        listing_url: listing.listingUrl,
        target_group_id: group.id,
        target_group_name: group.name,
        status: outcome.success ? "sent" : "failed",
        response_data: outcome.data ?? null,
        error_message: outcome.error ?? null,
      });
    } catch (logErr) {
      console.warn("Could not insert whatsapp_broadcast_logs:", logErr);
    }

    if (outcome.success) {
      successful++;
      details.push({
        groupId: group.id,
        groupName: group.name,
        status: "sent",
      });
    } else {
      failed++;
      details.push({
        groupId: group.id,
        groupName: group.name,
        status: "failed",
        error: outcome.error,
      });
    }
  }

  return {
    enabled: true,
    totalTargets: activeGroups.length,
    successful,
    failed,
    details,
  };
}
