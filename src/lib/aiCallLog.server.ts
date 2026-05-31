import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type AiCallType =
  | "blueprint"
  | "channel_analysis"
  | "script"
  | "linkedin_posts"
  | "linkedin_image"
  | "pattern_analysis";

export type AiCallStatus =
  | "success"
  | "rate_limited"
  | "credits_exhausted"
  | "error";

export function statusFromHttp(httpStatus: number): AiCallStatus {
  if (httpStatus >= 200 && httpStatus < 300) return "success";
  if (httpStatus === 429) return "rate_limited";
  if (httpStatus === 402) return "credits_exhausted";
  return "error";
}

export async function logAiCall(opts: {
  userId: string | null;
  callType: AiCallType;
  status: AiCallStatus;
  model?: string;
  tokensUsed?: number;
  errorMessage?: string;
}): Promise<void> {
  try {
    await supabaseAdmin.from("ai_call_log").insert({
      user_id: opts.userId,
      call_type: opts.callType,
      status: opts.status,
      model: opts.model ?? null,
      tokens_used: opts.tokensUsed ?? 0,
      error_message: opts.errorMessage ?? null,
    } as any);
  } catch (e) {
    console.error("ai_call_log insert failed", e);
  }
}
