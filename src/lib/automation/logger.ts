import { supabaseAdmin } from "@/lib/supabase/server";

export interface AutomationLog {
  id: string;
  event_type:
    | "webhook_received"
    | "ai_generated"
    | "post_published"
    | "whatsapp_sent"
    | "api_error"
    | "test_ping";
  source: string;
  title: string | null;
  status: "success" | "failed" | "pending";
  details: string | null;
  payload?: Record<string, unknown> | null;
  error_message?: string | null;
  created_at: string;
}

/**
 * Persists an automation event into the `automation_logs` table.
 * Gracefully falls back to memory/console if table is not yet migrated in Supabase.
 */
export async function logAutomationEvent(
  event: Omit<AutomationLog, "id" | "created_at">
): Promise<AutomationLog | null> {
  try {
    const db = supabaseAdmin();
    const { data, error } = await db
      .from("automation_logs")
      .insert({
        event_type: event.event_type,
        source: event.source,
        title: event.title ?? null,
        status: event.status,
        details: event.details ?? null,
        payload: event.payload ?? null,
        error_message: event.error_message ?? null,
      })
      .select()
      .single();

    if (error) {
      console.warn("Could not insert automation log into Supabase:", error.message);
      return null;
    }
    return data as AutomationLog;
  } catch (err) {
    console.warn("Automation logger exception:", err);
    return null;
  }
}

/**
 * Retrieves the most recent real automation logs from Supabase.
 */
export async function listAutomationLogs(limit = 50): Promise<AutomationLog[]> {
  try {
    const db = supabaseAdmin();
    const { data, error } = await db
      .from("automation_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.warn("Could not list automation logs:", error.message);
      return [];
    }
    return (data || []) as AutomationLog[];
  } catch {
    return [];
  }
}

/**
 * Returns the most recent activity timestamp and log item, or null if no activity has occurred yet.
 */
export async function getLastAutomationActivity(): Promise<{
  lastActivityAt: string | null;
  lastLog: AutomationLog | null;
  totalReceived: number;
}> {
  try {
    const db = supabaseAdmin();
    const { data, error, count } = await db
      .from("automation_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) {
      return { lastActivityAt: null, lastLog: null, totalReceived: 0 };
    }

    return {
      lastActivityAt: data[0].created_at,
      lastLog: data[0] as AutomationLog,
      totalReceived: count || data.length,
    };
  } catch {
    return { lastActivityAt: null, lastLog: null, totalReceived: 0 };
  }
}
