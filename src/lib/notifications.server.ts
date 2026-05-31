import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type NotificationType =
  | "outlier_detected"
  | "script_generated"
  | "linkedin_generated"
  | "blueprint_created"
  | "competitor_added"
  | "system";

/**
 * Fire-and-forget notification insert using the service role client.
 * Never throws — failures are logged and swallowed so the caller's main
 * flow is unaffected.
 */
export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  if (!userId) return;
  try {
    const { error } = await supabaseAdmin.from("notifications").insert({
      user_id: userId,
      type,
      title,
      body,
      metadata: metadata as any,
    } as any);
    if (error) console.error("[notifications] insert failed", error.message);
  } catch (e) {
    console.error("[notifications] insert threw", e);
  }
}
