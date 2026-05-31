import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { computeChannelAverages, computeMultiplier, fmtMultiplier } from "./outliers";
import { callAIGateway } from "./aiGateway.server";

const AnalysisSchema = z.object({
  hookType: z.string(),
  hookExplanation: z.string(),
  titlePattern: z.string(),
  titlePatternExplanation: z.string(),
  thumbnailStyle: z.string(),
  thumbnailExplanation: z.string(),
  viralReason: z.string(),
});

export type AiAnalysis = z.infer<typeof AnalysisSchema>;

const SYSTEM_PROMPT = `You are a viral YouTube content analyst. Your job is to reverse-engineer exactly why a video performed far above a channel's average, so a creator can replicate the winning formula. Be specific and tactical — not generic. Always respond in valid JSON only.`;

function buildUserPrompt(args: {
  title: string;
  channelTitle: string;
  viewCount: number;
  multiplier: number;
  channelAvg: number;
  thumbnailUrl: string | null;
}) {
  return `Analyse this YouTube video and explain why it went viral.

Title: ${args.title}
Channel: ${args.channelTitle}
Views: ${args.viewCount} (${fmtMultiplier(args.multiplier)} above this channel's average of ${Math.round(args.channelAvg)} views)
Thumbnail URL: ${args.thumbnailUrl ?? "—"}

Return a JSON object with exactly these fields:

hookType: The psychological trigger in the title that makes someone click. Pick the single most dominant one: "Bold Claim" | "Curiosity Gap" | "VS Comparison" | "Number List" | "Personal Story" | "Tutorial" | "Controversy" | "FOMO" | "Social Proof"

hookExplanation: One sentence explaining exactly why this specific hook worked for this specific video — not generic advice.

titlePattern: The reusable structural template a creator can copy. E.g. "I [Tested/Spent] [X Hours/Dollars] on [Topic] — Here's What Happened" or "How [Tool] [Verb]ed My [Outcome] in [Timeframe]"

titlePatternExplanation: One sentence on why this title structure drives clicks for this topic.

thumbnailStyle: Describe the visual formula of the thumbnail in 6-10 words. E.g. "Face left, bold text right, high contrast background" or "Screen recording with red arrow pointing to result"

thumbnailExplanation: One sentence on what makes this thumbnail style work for this video.

viralReason: Two to three sentences summarising the single core reason this video outperformed — what need, emotion, or curiosity did it tap into that the channel's average videos don't?`;
}

async function callGateway(_apiKey: string, userPrompt: string, userId: string | null): Promise<AiAnalysis> {
  const result = await callAIGateway({
    userId,
    callType: "pattern_analysis",
    systemPrompt: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
    responseFormat: { type: "json_object" },
    maxTokens: 1500,
  });
  const content = result.content;
  if (!content.trim()) throw new Error("Empty response from AI");
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    const m = content.match(/\{[\s\S]*\}/);
    if (!m) throw new Error("AI response was not valid JSON");
    parsed = JSON.parse(m[0]);
  }
  return AnalysisSchema.parse(parsed);
}

/** Internal: ensure an analysis exists in `scores` for (userId, videoUuid). Returns it. */
export async function ensureVideoAnalysis(
  supabase: any,
  userId: string,
  videoUuid: string,
): Promise<AiAnalysis> {
  // 1. cache
  const { data: existing } = await supabase
    .from("scores")
    .select("id, criteria")
    .eq("user_id", userId)
    .eq("video_uuid", videoUuid)
    .maybeSingle();
  const cached = existing?.criteria as any;
  if (cached && cached.kind === "ai_analysis") {
    const result = AnalysisSchema.safeParse(cached);
    if (result.success) return result.data;
  }

  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

  // 2. video + channel context
  const { data: video, error: vErr } = await supabase
    .from("videos")
    .select("id, title, thumbnail_url, view_count, channel_uuid, channels(title)")
    .eq("id", videoUuid)
    .single();
  if (vErr || !video) throw new Error("Video not found");

  const channelUuid = video.channel_uuid as string;
  const channelTitle = (video.channels?.title as string) ?? "Unknown channel";

  const { data: chVids } = await supabase
    .from("videos")
    .select("channel_uuid, view_count, published_at")
    .eq("channel_uuid", channelUuid)
    .order("published_at", { ascending: false })
    .limit(20);
  const avgs = computeChannelAverages(chVids || []);
  const channelAvg = avgs[channelUuid] || 0;
  const multiplier = computeMultiplier(video.view_count, channelAvg);

  // 3. AI
  const userPrompt = buildUserPrompt({
    title: video.title,
    channelTitle,
    viewCount: video.view_count || 0,
    multiplier,
    channelAvg,
    thumbnailUrl: video.thumbnail_url,
  });
  const analysis = await callGateway(apiKey, userPrompt, userId);

  // 4. upsert into scores
  const criteria = { kind: "ai_analysis", ...analysis, generated_at: new Date().toISOString() };
  if (existing?.id) {
    await supabase.from("scores").update({ criteria }).eq("id", existing.id);
  } else {
    await supabase
      .from("scores")
      .insert({ user_id: userId, video_uuid: videoUuid, criteria, total: 0 });
  }

  return analysis;
}

const VideoIdInput = z.object({ videoUuid: z.string().uuid() });

export const analyzeVideo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => VideoIdInput.parse(d))
  .handler(async ({ data, context }) => {
    return ensureVideoAnalysis(context.supabase, context.userId, data.videoUuid);
  });

export const getVideoAnalysis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => VideoIdInput.parse(d))
  .handler(async ({ data, context }) => {
    const { data: row } = await context.supabase
      .from("scores")
      .select("criteria")
      .eq("user_id", context.userId)
      .eq("video_uuid", data.videoUuid)
      .maybeSingle();
    const c = row?.criteria as any;
    if (!c || c.kind !== "ai_analysis") return null;
    const result = AnalysisSchema.safeParse(c);
    return result.success ? result.data : null;
  });