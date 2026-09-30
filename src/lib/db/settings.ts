import { supabaseAdmin } from "@/lib/supabase/server";
import type { AppSettings } from "@/lib/types";

export async function getSettings(): Promise<AppSettings> {
  const db = supabaseAdmin();
  const { data, error } = await db.from("app_settings").select("*").eq("id", 1).single();
  if (error || !data) {
    throw new Error(`Failed to load settings: ${error?.message ?? "no row"}`);
  }
  return data as AppSettings;
}

export async function updateSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
  const db = supabaseAdmin();
  try {
    const { data, error } = await db
      .from("app_settings")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", 1)
      .select()
      .single();
    if (error || !data) {
      throw error || new Error("no row");
    }
    return data as AppSettings;
  } catch (err: unknown) {
    const msg = err && typeof err === "object" && "message" in err ? String((err as { message: unknown }).message) : "";
    if (msg.includes("column") && msg.includes("does not exist")) {
      const safePatch = { ...patch };
      const newCols: Array<keyof AppSettings> = [
        "workspace_name",
        "admin_email",
        "brand_name",
        "brand_description",
        "brand_tone",
        "brand_style",
        "brand_prohibited_words",
        "brand_hashtags",
        "brand_signature",
        "language",
        "theme_preference",
      ];
      for (const col of newCols) {
        delete safePatch[col];
      }
      const { data, error } = await db
        .from("app_settings")
        .update({ ...safePatch, updated_at: new Date().toISOString() })
        .eq("id", 1)
        .select()
        .single();
      if (!error && data) return data as AppSettings;
    }
    throw new Error(`Failed to update settings: ${msg || "no row"}`);
  }
}
