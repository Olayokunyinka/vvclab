import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { computeChannelAverages, computeMultiplier, fmtMultiplier } from "./outliers";
import { ensureVideoAnalysis, type AiAnalysis } from "./analysis.functions";
import { detectPatterns } from "./patterns";
import { callAIGateway } from "./aiGateway.server";
import { createNotification } from "./notifications.server";

const blueprintSchema = z.object({
  name: z.string().default(""),
  brandSummary: z.string().default(""),
  youtubeNiche: z.string().default(""),
  targetAudience: z.string().default(""),
  contentPillars: z.array(z.string()).default([]),
  brandVoice: z.string().default(""),
  monetisationAngle: z.string().default(""),
});

const inputSchema = z.object({
  videoUuid: z.string().uuid(),
  blueprint: blueprintSchema,
});

export const generateScript = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => inputSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;


    const { data: video, error: vErr } = await supabase
      .from("videos")
      .select("*, channels(id, title, subscriber_count)")
      .eq("id", data.videoUuid)
      .single();
    if (vErr || !video) throw new Error("Video not found");

    const channelUuid = (video as any).channel_uuid as string;
    const channelTitle = ((video as any).channels?.title as string) ?? "Unknown channel";
    const channelSubscriberCount =
      ((video as any).channels?.subscriber_count as number | null) ?? null;

    // Compute multiplier from this channel's last 20 videos.
    const { data: chVids } = await supabase
      .from("videos")
      .select("channel_uuid, view_count, published_at")
      .eq("channel_uuid", channelUuid)
      .order("published_at", { ascending: false })
      .limit(20);
    const avgs = computeChannelAverages((chVids as any) || []);
    const multiplier = computeMultiplier(video.view_count, avgs[channelUuid] || 0);

    let analysis: AiAnalysis | null = null;
    try {
      analysis = await ensureVideoAnalysis(supabase, userId, data.videoUuid);
    } catch (e) {
      console.error("Analysis unavailable, falling back to regex patterns", e);
    }
    const regex = detectPatterns(video.title, video.thumbnail_url);
    const criteria = {
      hookType: analysis?.hookType ?? regex.hookType,
      hookExplanation: analysis?.hookExplanation ?? "—",
      titlePattern: analysis?.titlePattern ?? regex.titlePattern,
      titlePatternExplanation: analysis?.titlePatternExplanation ?? "—",
      thumbnailStyle: analysis?.thumbnailStyle ?? regex.thumbnailStyle,
      thumbnailExplanation: analysis?.thumbnailExplanation ?? "—",
      viralReason: analysis?.viralReason ?? "—",
    };
    const patterns = {
      hookType: criteria.hookType,
      titlePattern: criteria.titlePattern,
      thumbnailStyle: criteria.thumbnailStyle,
    };

    const { data: myChannel } = await supabase
      .from("my_channels")
      .select("style_profile")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const bp = data.blueprint;
    const style = ((myChannel?.style_profile as any) || {}) as {
      toneKeywords?: string[];
      sentenceStyle?: string;
      titlePatterns?: string[];
      hookStyle?: string;
      avoidPatterns?: string[];
    };

    const creatorName = bp.name?.trim() || "the creator";

    const systemPrompt = `You are an elite YouTube script writer. You write complete, teleprompter-ready scripts in the exact voice of a specific creator. Every sentence must sound like them — never generic YouTube filler. Follow the requested output format EXACTLY, including the exact section headers and bracket markers. No preamble, no postscript.`;

    const userPrompt = `You are a YouTube scriptwriter. Write a complete teleprompter-ready video script for ${creatorName}.

CREATOR PROFILE:
Name: ${creatorName}
Brand summary: ${bp.brandSummary || "—"}
Niche: ${bp.youtubeNiche || "—"}
Content pillars: ${(bp.contentPillars || []).join(", ") || "—"}
Brand voice: ${bp.brandVoice || "—"}
Tone keywords: ${(style.toneKeywords || []).join(", ") || "—"}
Sentence style: ${style.sentenceStyle || "—"}
Title patterns: ${(style.titlePatterns || []).join("; ") || "—"}
Hook style: ${style.hookStyle || "—"}
Things they never do: ${(style.avoidPatterns || []).join("; ") || "—"}

TARGET AUDIENCE (THIS IS THE MOST IMPORTANT CONSTRAINT IN THIS ENTIRE PROMPT):
${bp.targetAudience || "—"}

AUDIENCE RULES — every single sentence in this script must comply with all of these:

1. ASSUMED KNOWLEDGE: Write as if the viewer has never done this before and knows none of the jargon. If a technical term must be used, define it immediately in plain English the moment it appears. Never assume the viewer already knows what a tool, platform, or concept is.

2. VOCABULARY: Use everyday conversational language. No industry jargon, no acronyms without explanation, no phrases that assume prior experience. If you catch yourself writing something an expert would say, rewrite it as something a curious beginner would understand.

3. EXPLANATION DEPTH: Over-explain rather than under-explain. A beginner would rather hear something explained too simply than feel lost. Every concept gets a real-world analogy before the technical explanation.

4. TONE: Encouraging and reassuring throughout. Beginners are often scared they're not smart enough or technical enough. Every section should make the viewer feel capable, not overwhelmed.

5. PACING: Short sentences. One idea at a time. Never stack multiple concepts into one sentence. If a sentence has more than 20 words, break it into two.

6. EXAMPLES: Every example must be something a complete beginner would recognize from daily life — not from industry practice. Use everyday objects, situations, and experiences as analogies. Never use an example that requires prior knowledge of the topic.

7. NEVER DO THIS FOR THIS AUDIENCE:
   - Never reference advanced concepts without explaining them first
   - Never use phrases like "as you know", "obviously", "simply", or "just" — these make beginners feel stupid
   - Never assume the viewer has tried this before or has any existing setup
   - Never skip steps because they seem obvious — what's obvious to an expert is invisible to a beginner
   - Never use the competitor video's vocabulary directly — their audience may be more advanced than yours

OUTLIER VIDEO BEING RECREATED:
Title: ${video.title}
Channel: ${channelTitle}
Subscribers: ${channelSubscriberCount ?? "—"}
Views: ${video.view_count} (${fmtMultiplier(multiplier)} above this channel's average)

WHY THIS VIDEO WENT VIRAL:
${criteria.viralReason}

HOOK TYPE: ${criteria.hookType}
Why this hook worked for this video: ${criteria.hookExplanation}

TITLE PATTERN TO ADAPT: ${criteria.titlePattern}
Why this title structure drives clicks: ${criteria.titlePatternExplanation}

THUMBNAIL FORMULA: ${criteria.thumbnailStyle}
Why this thumbnail works: ${criteria.thumbnailExplanation}

SCRIPT INSTRUCTIONS:
- Your title MUST follow the title pattern above, adapted to ${creatorName}'s niche and voice
- Your Pattern Interrupt hook step MUST use the same hook type (${criteria.hookType}) that made the original video go viral — adapted to ${creatorName}'s topic and audience, never copied word for word
- Your framework acronym MUST be relevant to the specific topic of this video — not generic
- Every analogy in the body MUST be specific to ${creatorName}'s audience as described in their brand profile — use their world, their language, their references
- The Screen Share Moments must be actionable and specific — name exact tools, menus, URLs, and steps
- The transition lines must sound like natural spoken conversation, not written prose
- Never use the phrases "game-changer", "dive in", "in today's video", or "don't forget to like and subscribe"
- Every analogy in the body MUST use something from everyday life that a complete beginner would immediately recognize — household objects, common experiences, things everyone has done
- The Pattern Interrupt hook step MUST open with something a beginner would personally relate to — their fear, their confusion, or their frustration — not an impressive result that only an experienced person would understand

OUTPUT — write in this exact format. Do not skip any section. Do not use placeholders. Every line must be the exact words the creator will say or do.

TITLE: <one title under 60 characters>
ESTIMATED LENGTH: <X> minutes

---INTRO: 7-STEP HOOK---
1. PATTERN INTERRUPT | Stop the scroll
<word-for-word script>

2. MIRROR THE VIEWER | That's literally me
<word-for-word script>

3. REVEAL THE OPPORTUNITY | Shift their thinking
<word-for-word script>

4. EXPOSE THE GAP | Create curiosity
<word-for-word script>

5. PROMISE TRANSFORMATION | Show the value
<word-for-word script>

6. AUTHORITY / SYSTEMS | Build trust
<word-for-word script>

7. CLEAN TRANSITION | Start the content
<word-for-word script>

FRAMEWORK: <invent a relevant acronym for this topic — e.g. CRAFT, SCORE, BUILD — where each letter stands for one body section topic. Format: ACRONYM - one short tagline>

---BODY---
For each letter of the framework acronym, write one section in this exact format. The number of sections MUST equal the number of letters in the acronym.

1. <LETTER> - <SECTION NAME>
ANALOGY: <a vivid, specific, relatable real-world comparison that makes the concept obvious to a non-expert>
TALKING POINTS:
- <specific point with concrete example>
- <specific point with concrete example>
- <specific point with concrete example>
WHY IT MATTERS: <one paragraph, personal and direct, explaining why this matters to the viewer>
SCREEN SHARE MOMENT: <exact instructions — what to open, what to type, what to click, what to show. Be specific: name the tool, the menu, the value to type.>
TRANSITION: → <italic bridge sentence to the next section>

2. <LETTER> - <SECTION NAME>
...continue for every letter...

---CLOSE AND CTA---
<exact word-for-word closing lines and call to action in ${creatorName}'s voice>

THUMBNAIL:
Expression: <exact facial expression>
Text overlay: <2-4 words in caps>
Text color: <hex>
Background: <description and hex>
Layout: <face and text positions>`;

    const aiResult = await callAIGateway({
      userId,
      callType: "script",
      systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
      maxTokens: 8000,
    });
    const markdown = aiResult.content;
    if (!markdown.trim()) throw new Error("Empty response from AI");

    const payload = {
      kind: "script" as const,
      markdown,
      multiplier,
      channelTitle,
      creatorName,
      patterns,
      generated_at: new Date().toISOString(),
    };

    const { data: existing } = await supabase
      .from("briefs")
      .select("id")
      .eq("user_id", userId)
      .eq("video_uuid", data.videoUuid)
      .maybeSingle();
    if (existing) {
      await supabase.from("briefs").update({ content: payload as any }).eq("id", existing.id);
    } else {
      await supabase
        .from("briefs")
        .insert({ user_id: userId, video_uuid: data.videoUuid, content: payload as any });
    }

    try {
      await createNotification(
        userId,
        "script_generated",
        "Script ready",
        `Your script for "${(video as any).title}" has been generated.`,
        {
          videoId: data.videoUuid,
          channelName: channelTitle,
          multiplier: fmtMultiplier(multiplier),
        },
      );
    } catch (e) {
      console.error("notification failed", e);
    }

    return payload;
  });


export const getScript = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ videoUuid: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row } = await supabase
      .from("briefs")
      .select("content, created_at")
      .eq("user_id", userId)
      .eq("video_uuid", data.videoUuid)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!row) return null;
    const c = row.content as any;
    if (!c || c.kind !== "script") return null;
    return {
      markdown: c.markdown as string,
      multiplier: (c.multiplier as number) || 0,
      channelTitle: (c.channelTitle as string) || "",
      creatorName: (c.creatorName as string) || "",
      patterns: c.patterns || null,
      generated_at: c.generated_at || row.created_at,
    };
  });
