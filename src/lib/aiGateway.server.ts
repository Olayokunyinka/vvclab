import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type AICallType =
  | "blueprint"
  | "channel_analysis"
  | "script"
  | "pattern_analysis"
  | "linkedin_posts"
  | "linkedin_image"
  | "thumbnail_image";

export interface AICallOptions {
  userId: string | null;
  callType: AICallType;
  messages: Array<{ role: string; content: string }>;
  systemPrompt?: string;
  maxTokens?: number;
  tools?: any[];
  toolChoice?: any;
  responseFormat?: any;
  temperature?: number;
  model?: string;
}

export interface AIUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  upstreamCostUsd: number;
  upstreamPromptCostUsd: number;
  upstreamCompletionCostUsd: number;
  cachedTokens: number;
  reasoningTokens: number;
  isByok: boolean;
}

export interface AICallResult {
  content: string;
  usage: AIUsage;
  rawResponse: any;
}

const DEFAULT_MODEL = "google/gemini-3-flash-preview";

const EMPTY_USAGE: AIUsage = {
  promptTokens: 0,
  completionTokens: 0,
  totalTokens: 0,
  upstreamCostUsd: 0,
  upstreamPromptCostUsd: 0,
  upstreamCompletionCostUsd: 0,
  cachedTokens: 0,
  reasoningTokens: 0,
  isByok: false,
};

export async function callAIGateway(options: AICallOptions): Promise<AICallResult> {
  const startTime = Date.now();
  let status = "success";
  let errorMessage: string | null = null;
  let rawResponse: any = null;
  let usage: AIUsage = { ...EMPTY_USAGE };
  const model = options.model || DEFAULT_MODEL;

  try {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

    const messages = options.systemPrompt
      ? [{ role: "system", content: options.systemPrompt }, ...options.messages]
      : options.messages;

    const body: any = {
      model,
      max_tokens: options.maxTokens ?? 8000,
      messages,
    };
    if (typeof options.temperature === "number") body.temperature = options.temperature;
    if (options.tools) body.tools = options.tools;
    if (options.toolChoice) body.tool_choice = options.toolChoice;
    if (options.responseFormat) body.response_format = options.responseFormat;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (response.status === 429) {
      status = "rate_limited";
      throw new Error("Rate limit reached. Try again in a moment.");
    }
    if (response.status === 402) {
      status = "credits_exhausted";
      throw new Error("AI credits exhausted — add credits to your workspace.");
    }
    if (!response.ok) {
      status = "error";
      const text = await response.text().catch(() => "");
      throw new Error(`AI gateway error (${response.status}): ${text.slice(0, 200)}`);
    }

    rawResponse = await response.json();

    const u = rawResponse?.usage || {};
    const cd = u.cost_details || {};
    const ptd = u.prompt_tokens_details || {};
    const ctd = u.completion_tokens_details || {};

    usage = {
      promptTokens: u.prompt_tokens || 0,
      completionTokens: u.completion_tokens || 0,
      totalTokens: u.total_tokens || 0,
      upstreamCostUsd: Number(cd.upstream_inference_cost) || 0,
      upstreamPromptCostUsd: Number(cd.upstream_inference_prompt_cost) || 0,
      upstreamCompletionCostUsd: Number(cd.upstream_inference_completions_cost) || 0,
      cachedTokens: ptd.cached_tokens || 0,
      reasoningTokens: ctd.reasoning_tokens || 0,
      isByok: !!u.is_byok,
    };

    const content: string = rawResponse?.choices?.[0]?.message?.content ?? "";
    const durationMs = Date.now() - startTime;

    try {
      await supabaseAdmin.from("ai_call_log").insert({
        user_id: options.userId,
        call_type: options.callType,
        status,
        model: rawResponse?.model ?? model,
        model_used: rawResponse?.model ?? model,
        provider: rawResponse?.provider ?? null,
        prompt_tokens: usage.promptTokens,
        completion_tokens: usage.completionTokens,
        total_tokens: usage.totalTokens,
        upstream_cost_usd: usage.upstreamCostUsd,
        upstream_prompt_cost_usd: usage.upstreamPromptCostUsd,
        upstream_completion_cost_usd: usage.upstreamCompletionCostUsd,
        cached_tokens: usage.cachedTokens,
        reasoning_tokens: usage.reasoningTokens,
        is_byok: usage.isByok,
        tokens_used: usage.totalTokens,
        response_id: rawResponse?.id ?? null,
        finish_reason: rawResponse?.choices?.[0]?.finish_reason ?? null,
        duration_ms: durationMs,
        error_message: null,
      } as any);
    } catch (logError) {
      console.error("[aiGateway] Failed to log call:", logError);
    }

    return { content, usage, rawResponse };
  } catch (error: any) {
    const durationMs = Date.now() - startTime;
    if (status === "success") status = "error";
    errorMessage = error?.message ?? String(error);

    try {
      await supabaseAdmin.from("ai_call_log").insert({
        user_id: options.userId,
        call_type: options.callType,
        status,
        model,
        model_used: model,
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
        upstream_cost_usd: 0,
        tokens_used: 0,
        duration_ms: durationMs,
        error_message: errorMessage,
      } as any);
    } catch (logError) {
      console.error("[aiGateway] Failed to log error call:", logError);
    }

    throw error;
  }
}

export interface ImageCallResult {
  dataUrl: string;
  costUsd: number;
  rawResponse: any;
}

export interface ImageCallOptions {
  userId: string | null;
  callType: "linkedin_image" | "thumbnail_image";
  prompt: string;
  model?: string;
  size?: string;
  quality?: string;
}

const DEFAULT_IMAGE_MODEL = "openai/gpt-image-2";
const DEFAULT_IMAGE_COST_USD = 0.04;

export async function callImageGateway(options: ImageCallOptions): Promise<ImageCallResult> {
  const startTime = Date.now();
  let status = "success";
  let errorMessage: string | null = null;
  const model = options.model || DEFAULT_IMAGE_MODEL;

  try {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

    const body: any = {
      model,
      prompt: options.prompt,
      n: 1,
    };
    if (options.size) body.size = options.size;
    if (options.quality) body.quality = options.quality;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (response.status === 429) {
      status = "rate_limited";
      throw new Error("Image gateway rate limited — please retry shortly.");
    }
    if (response.status === 402) {
      status = "credits_exhausted";
      throw new Error("AI credits exhausted — add credits in Workspace Settings.");
    }
    if (!response.ok) {
      status = "error";
      const text = await response.text().catch(() => "");
      throw new Error(`Image gateway ${response.status}: ${text.slice(0, 200)}`);
    }

    const rawResponse = await response.json();
    const b64 = rawResponse?.data?.[0]?.b64_json;
    const url = rawResponse?.data?.[0]?.url;
    if (!b64 && !url) throw new Error("Image gateway returned no image data");
    const dataUrl = b64 ? `data:image/png;base64,${b64}` : (url as string);

    const reportedCost = Number(rawResponse?.usage?.cost_details?.upstream_inference_cost);
    const costUsd = Number.isFinite(reportedCost) && reportedCost > 0 ? reportedCost : DEFAULT_IMAGE_COST_USD;
    const durationMs = Date.now() - startTime;

    try {
      await supabaseAdmin.from("ai_call_log").insert({
        user_id: options.userId,
        call_type: options.callType,
        status,
        model,
        model_used: model,
        provider: rawResponse?.provider ?? null,
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
        upstream_cost_usd: costUsd,
        tokens_used: 0,
        is_byok: !!rawResponse?.usage?.is_byok,
        response_id: rawResponse?.id ?? null,
        duration_ms: durationMs,
        error_message: null,
      } as any);
    } catch (logError) {
      console.error("[imageGateway] Failed to log:", logError);
    }

    return { dataUrl, costUsd, rawResponse };
  } catch (error: any) {
    const durationMs = Date.now() - startTime;
    if (status === "success") status = "error";
    errorMessage = error?.message ?? String(error);

    try {
      await supabaseAdmin.from("ai_call_log").insert({
        user_id: options.userId,
        call_type: options.callType,
        status,
        model,
        model_used: model,
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
        upstream_cost_usd: 0,
        tokens_used: 0,
        duration_ms: durationMs,
        error_message: errorMessage,
      } as any);
    } catch (logError) {
      console.error("[imageGateway] Failed to log error call:", logError);
    }

    throw error;
  }
}
