import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { ytFetch } from "./youtube.server";
import { callAIGateway, callImageGateway } from "./aiGateway.server";
import { createNotification } from "./notifications.server";

const TOPICS = ["Story", "Framework", "Contrarian", "Data Insight", "Quick Win", "Bold Take"] as const;
type Topic = (typeof TOPICS)[number];

function extractVideoId(input: string): string {
  const trimmed = input.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(trimmed)) return trimmed;
  try {
    const u = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    const v = u.searchParams.get("v");
    if (v && /^[A-Za-z0-9_-]{11}$/.test(v)) return v;
    const parts = u.pathname.split("/").filter(Boolean);
    // youtu.be/<id>, /shorts/<id>, /embed/<id>, /live/<id>
    const last = parts[parts.length - 1];
    if (last && /^[A-Za-z0-9_-]{11}$/.test(last)) return last;
  } catch {
    /* fall through */
  }
  throw new Error(`Could not find a YouTube video ID in "${input}"`);
}

const VideoSchema = z.object({
  videoId: z.string(),
  title: z.string(),
  description: z.string(),
  thumbnail: z.string().nullable(),
  channelTitle: z.string(),
  tags: z.array(z.string()),
  durationSeconds: z.number(),
  publishedAt: z.string(),
});
export type VideoMeta = z.infer<typeof VideoSchema>;

export const getVideoMetadata = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { url: string }) =>
    z.object({ url: z.string().min(1).max(500) }).parse(d),
  )
  .handler(async ({ data }): Promise<VideoMeta> => {
    const videoId = extractVideoId(data.url);
    const res = await ytFetch("videos", {
      part: "snippet,contentDetails,statistics",
      id: videoId,
    });
    const item = res.items?.[0];
    if (!item) throw new Error("Video not found or is private/unavailable");
    const sn = item.snippet || {};
    const dur = item.contentDetails?.duration || "PT0S";
    const m = dur.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    const durationSeconds = m ? +(m[1] || 0) * 3600 + +(m[2] || 0) * 60 + +(m[3] || 0) : 0;
    return {
      videoId,
      title: sn.title || "",
      description: sn.description || "",
      thumbnail:
        sn.thumbnails?.maxres?.url ||
        sn.thumbnails?.high?.url ||
        sn.thumbnails?.medium?.url ||
        sn.thumbnails?.default?.url ||
        null,
      channelTitle: sn.channelTitle || "",
      tags: sn.tags || [],
      durationSeconds,
      publishedAt: sn.publishedAt || "",
    };
  });

const BlueprintInputSchema = z.object({
  name: z.string().optional().default(""),
  youtubeNiche: z.string().default(""),
  brandVoice: z.string().default(""),
  targetAudience: z.string().default(""),
  contentPillars: z.array(z.string()).default([]),
  brandSummary: z.string().default(""),
});

const PostSchema = z.object({
  type: z.enum(TOPICS),
  hook: z.string(),
  body: z.string(),
  cta: z.string(),
});
export type LinkedInPost = z.infer<typeof PostSchema>;

// Helper removed — using shared callAIGateway directly.

export const generateLinkedInPosts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: { video: VideoMeta; blueprint: unknown; selectedTopics: Topic[]; temperature?: number }) =>
      z
        .object({
          video: VideoSchema,
          blueprint: BlueprintInputSchema,
          selectedTopics: z.array(z.enum(TOPICS)).min(1).max(6),
          temperature: z.number().min(0).max(1.5).optional(),
        })
        .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { video, blueprint, selectedTopics } = data;
    const userId = (context as any).userId as string;

    const systemPrompt =
      'You are an elite LinkedIn content strategist who writes posts that generate genuine engagement — not generic thought leadership fluff. You write in the creator\'s exact voice. Every post must feel personal, specific, and immediately useful to their audience. Output only valid JSON — no prose, no markdown fences. Return an object with shape { "posts": [...] }.';

    const userPrompt = `Write ${selectedTopics.length} LinkedIn posts from this YouTube video for ${blueprint.name || "this creator"}.

CREATOR PROFILE:
Niche: ${blueprint.youtubeNiche}
Brand voice: ${blueprint.brandVoice}
Target audience: ${blueprint.targetAudience}
Content pillars: ${blueprint.contentPillars.join(", ")}
Brand summary: ${blueprint.brandSummary}

VIDEO:
Title: ${video.title}
Channel: ${video.channelTitle}
Description: ${video.description.slice(0, 1500)}
Tags: ${video.tags.join(", ")}

SELECTED POST TYPES: ${selectedTopics.join(", ")}

For each selected post type, write one LinkedIn post. Return JSON shaped as { "posts": [...] } where each post item has:
- type: the post type (Story | Framework | Contrarian | Data Insight | Quick Win | Bold Take)
- hook: the first line — must stop the scroll, under 15 words, no question marks
- body: the full post body — specific, personal, no fluff. Use line breaks for readability. 150-250 words.
- cta: one closing line driving a specific action

Rules:
- Never start with "I"
- Never use the words "game-changer", "leverage", "synergy", "dive in", or "journey"
- Each post must feel completely different in structure and angle
- Write in ${blueprint.brandVoice} voice
- The hook must be the most compelling line in the post`;

    const aiResult = await callAIGateway({
      userId,
      callType: "linkedin_posts",
      systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
      responseFormat: { type: "json_object" },
      temperature: typeof data.temperature === "number" ? data.temperature : undefined,
      maxTokens: 6000,
    });

    const content = aiResult.content;
    if (!content) throw new Error("AI returned an empty response");
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new Error("AI returned non-JSON output");
    }
    const obj = parsed as { posts?: unknown };
    const posts = z.array(PostSchema).parse(obj.posts ?? []);
    return { posts };
  });

export const generatePostImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { imagePrompt: string }) =>
    z.object({ imagePrompt: z.string().min(1).max(2000) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const userId = (context as any).userId as string;
    const { dataUrl } = await callImageGateway({
      userId,
      callType: "linkedin_image",
      prompt: data.imagePrompt,
      model: "openai/gpt-image-2",
      quality: "low",
    });
    return { dataUrl };
  });

/* ---------- per-post-type image generation ---------- */

function extractFirstSentence(text: string, maxWords = 12): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return "";
  const firstSentence = cleaned.split(/[.!?\n]/)[0] ?? cleaned;
  const words = firstSentence.split(/\s+/).slice(0, maxWords);
  return words.join(" ");
}

function extractStat(text: string): string {
  const m = text.match(/[^.\n]*?(\d+(?:[.,]\d+)?\s*[%xX]?|\$\d[\d,.]*)[^.\n]*/);
  return m ? m[0].trim().slice(0, 120) : extractFirstSentence(text, 10);
}

function extractNumberedStructure(text: string): string {
  const lines = text.split(/\n/).map((l) => l.trim()).filter(Boolean);
  const numbered = lines.filter((l) => /^(\d+[\).:-]|[-•*])\s+/.test(l));
  if (numbered.length >= 2) return numbered.slice(0, 5).join(" / ").slice(0, 200);
  return extractFirstSentence(text, 14);
}

const IMAGE_MODEL = "openai/gpt-image-2";

type PostContent = { hook: string; body: string; cta: string | null };

function buildImagePrompt(postType: Topic, post: PostContent): string {
  const hook = post.hook;
  const body = post.body;
  switch (postType) {
    case "Story":
      return `LinkedIn post image for a personal story post. Documentary photography style. Warm, natural lighting. Authentic, unposed feel. Single subject implied presence (no actual face — suggest human presence through environment, hands, or silhouette). Scene related to: ${extractFirstSentence(hook, 16)}. Muted warm color palette. Film grain texture. No text overlay. No logos. No stock photo aesthetic. 16:9 landscape format.`;
    case "Framework":
      return `LinkedIn post image for a framework or how-to post. Clean infographic style. High contrast design. Bold sans-serif typography implied through layout structure. Visual representation of ${extractNumberedStructure(body)}. Color palette: dark background (#1a1a1a or #0a2540) with white and #c9a84c gold accent elements. Geometric, structured, professional. No photography. No stock imagery. Clear visual hierarchy. 16:9 landscape format.`;
    case "Data Insight":
      return `LinkedIn post image for a data insight post. Statistical visualization style. Dark background (#0a0a0a or #0a2540). One key number or finding dominates the visual: ${extractStat(hook + " " + body)}. Large, bold typography for the number. Minimal supporting chart or graph element suggested in the background. Single accent color: #c9a84c gold. Clean, authoritative, data-driven aesthetic. No photography. No illustrations. 16:9 landscape format.`;
    case "Contrarian":
      return `LinkedIn post image for a contrarian or bold opinion post. High contrast typographic style. Near-black background (#0a0a0a). White or #e53e3e red accent. Visual tension and disruption as the aesthetic goal. Large bold typography suggesting the contrarian angle without spelling it out: ${extractFirstSentence(hook, 5)}. Stark, minimal, slightly confrontational. No photography. No friendly colors. No rounded elements — sharp edges only. 16:9 landscape format.`;
    case "Quick Win":
      return `LinkedIn post image for a quick win or actionable tip post. High energy, actionable aesthetic. Bright, saturated color palette with a dominant brand color. Background: deep navy (#0a2540) or forest green (#0a1f0a). Accent: bright white and #c9a84c gold. Visual checklist or step indicator element suggested in the composition — numbered items, checkboxes, or progress indicators. The core quick win topic visualized: ${extractFirstSentence(hook, 14)}. Energetic, optimistic, immediately useful aesthetic. 16:9 landscape format.`;
    case "Bold Take":
      return `LinkedIn post image for a bold opinion or prediction post. Typographic billboard style. Extreme simplicity — the statement IS the image. Background: solid #0a0a0a black. One short phrase dominates: ${extractFirstSentence(hook, 8)}. Oversized typography, massive negative space, nothing else. No icons, no decorative elements, no photography, no gradients. White text on black background. The phrase should take up 40-50% of the image height. 16:9 landscape format.`;
  }
}

export const generateLinkedInPostImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { postType: Topic; post: PostContent }) =>
    z
      .object({
        postType: z.enum(TOPICS),
        post: z.object({
          hook: z.string().min(1).max(2000),
          body: z.string().min(1).max(8000),
          cta: z.string().nullable().optional().transform((v) => v ?? null),
        }),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const userId = (context as any).userId as string;
    const prompt = buildImagePrompt(data.postType, data.post);
    const { dataUrl } = await callImageGateway({
      userId,
      callType: "linkedin_image",
      prompt,
      model: IMAGE_MODEL,
      size: "1536x1024",
      quality: "low",
    });
    return { dataUrl };
  });


const BUCKET = "linkedin-images";

function decodeDataUrl(dataUrl: string): { bytes: Uint8Array; contentType: string } {
  const m = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!m) throw new Error("Invalid image data URL");
  const contentType = m[1];
  const b64 = m[2];
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return { bytes, contentType };
}

async function uploadImage(
  supabase: ReturnType<typeof import("@supabase/supabase-js").createClient>,
  userId: string,
  runId: string,
  idx: number,
  dataUrl: string,
): Promise<string> {
  const { bytes, contentType } = decodeDataUrl(dataUrl);
  const path = `${userId}/${runId}/${idx}.png`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType, upsert: true });
  if (error) throw new Error(`Storage upload failed: ${error.message}`);
  return path;
}

const SavePostSchema = z.object({
  type: z.enum(TOPICS),
  hook: z.string(),
  body: z.string(),
  cta: z.string().nullable().optional(),
  imagePrompt: z.string().nullable().optional(),
  imageDataUrl: z.string().nullable().optional(),
});

export const saveLinkedInRun = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      video: { videoId: string; title: string; thumbnail: string | null; channelTitle: string };
      posts: Array<z.infer<typeof SavePostSchema>>;
    }) =>
      z
        .object({
          video: z.object({
            videoId: z.string().min(1).max(50),
            title: z.string().min(1).max(500),
            thumbnail: z.string().nullable(),
            channelTitle: z.string().max(200),
          }),
          posts: z.array(SavePostSchema).min(1).max(12),
        })
        .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: run, error: runErr } = await supabase
      .from("linkedin_post_runs")
      .insert({
        user_id: userId,
        video_id: data.video.videoId,
        video_title: data.video.title,
        video_thumbnail: data.video.thumbnail,
        video_channel: data.video.channelTitle,
      })
      .select("id")
      .single();
    if (runErr || !run) throw new Error(runErr?.message ?? "Failed to create run");

    const runId = run.id as string;

    const rows = await Promise.all(
      data.posts.map(async (p, idx) => {
        let imagePath: string | null = null;
        if (p.imageDataUrl) {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            imagePath = await uploadImage(supabase as any, userId, runId, idx, p.imageDataUrl);
          } catch (e) {
            console.error("upload failed", e);
          }
        }
        return {
          run_id: runId,
          user_id: userId,
          idx,
          type: p.type,
          hook: p.hook,
          body: p.body,
          cta: p.cta ?? null,
          image_prompt: p.imagePrompt ?? null,
          image_path: imagePath,
        };
      }),
    );

    const { error: postsErr } = await supabase.from("linkedin_run_posts").insert(rows);
    if (postsErr) throw new Error(postsErr.message);

    try {
      await createNotification(
        userId,
        "linkedin_generated",
        "LinkedIn posts ready",
        `${data.posts.length} LinkedIn posts generated from "${data.video.title}".`,
        { videoTitle: data.video.title, postCount: data.posts.length, runId },
      );
    } catch (e) {
      console.error("notification failed", e);
    }

    return { runId };
  });


export const listLinkedInRuns = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("linkedin_post_runs")
      .select("id, video_id, video_title, video_thumbnail, video_channel, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return { runs: data ?? [] };
  });

export const getLinkedInRun = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { runId: string }) => z.object({ runId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: run, error: runErr } = await supabase
      .from("linkedin_post_runs")
      .select("id, video_id, video_title, video_thumbnail, video_channel, created_at")
      .eq("id", data.runId)
      .maybeSingle();
    if (runErr) throw new Error(runErr.message);
    if (!run) throw new Error("Run not found");

    const { data: posts, error: postsErr } = await supabase
      .from("linkedin_run_posts")
      .select("id, idx, type, hook, body, cta, image_prompt, image_path")
      .eq("run_id", data.runId)
      .order("idx", { ascending: true });
    if (postsErr) throw new Error(postsErr.message);

    const paths = (posts ?? []).map((p) => p.image_path).filter((x): x is string => !!x);
    const signedMap = new Map<string, string>();
    if (paths.length > 0) {
      const { data: signed } = await supabase.storage
        .from(BUCKET)
        .createSignedUrls(paths, 60 * 60);
      for (const s of signed ?? []) {
        if (s.path && s.signedUrl) signedMap.set(s.path, s.signedUrl);
      }
    }

    return {
      run,
      posts: (posts ?? []).map((p) => ({
        ...p,
        imageUrl: p.image_path ? (signedMap.get(p.image_path) ?? null) : null,
      })),
    };
  });

export const deleteLinkedInRun = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { runId: string }) => z.object({ runId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // Best-effort cleanup of storage objects
    const { data: posts } = await supabase
      .from("linkedin_run_posts")
      .select("image_path")
      .eq("run_id", data.runId);
    const paths = (posts ?? []).map((p) => p.image_path).filter((x): x is string => !!x);
    if (paths.length > 0) {
      await supabase.storage.from(BUCKET).remove(paths);
    }
    const { error } = await supabase
      .from("linkedin_post_runs")
      .delete()
      .eq("id", data.runId)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateLinkedInRunPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      postId: string;
      runId: string;
      idx: number;
      type: Topic;
      hook: string;
      body: string;
      cta?: string | null;
      imagePrompt?: string | null;
      imageDataUrl?: string | null;
    }) =>
      z
        .object({
          postId: z.string().uuid(),
          runId: z.string().uuid(),
          idx: z.number().int().min(0).max(50),
          type: z.enum(TOPICS),
          hook: z.string(),
          body: z.string(),
          cta: z.string().nullable().optional(),
          imagePrompt: z.string().nullable().optional(),
          imageDataUrl: z.string().nullable().optional(),
        })
        .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    let imagePath: string | null = null;
    if (data.imageDataUrl) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        imagePath = await uploadImage(supabase as any, userId, data.runId, data.idx, data.imageDataUrl);
      } catch (e) {
        console.error("upload failed", e);
      }
    }
    const patch = {
      type: data.type,
      hook: data.hook,
      body: data.body,
      cta: data.cta ?? null,
      image_prompt: data.imagePrompt ?? null,
      ...(imagePath ? { image_path: imagePath } : {}),
    };
    const { error } = await supabase
      .from("linkedin_run_posts")
      .update(patch)
      .eq("id", data.postId);
    if (error) throw new Error(error.message);

    let imageUrl: string | null = null;
    if (imagePath) {
      const { data: signed } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(imagePath, 60 * 60);
      imageUrl = signed?.signedUrl ?? null;
    }
    return { ok: true, imageUrl };
  });
