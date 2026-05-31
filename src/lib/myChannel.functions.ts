import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { parseDuration, resolveChannelId, ytFetch } from "./youtube.server";
import { callAIGateway } from "./aiGateway.server";

const styleProfileSchema = z.object({
  toneKeywords: z.array(z.string()).default([]),
  sentenceStyle: z.string().default(""),
  titlePatterns: z.array(z.string()).default([]),
  topicThemes: z.array(z.string()).default([]),
  audienceLanguage: z.string().default(""),
  hookStyle: z.string().default(""),
  avoidPatterns: z.array(z.string()).default([]),
  channelSummary: z.string().default(""),
});

export type StyleProfile = z.infer<typeof styleProfileSchema>;

export const analyzeMyChannel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { input: string }) =>
    z.object({ input: z.string().min(1).max(300) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;


    const channelId = await resolveChannelId(data.input);

    const chRes = await ytFetch("channels", {
      part: "snippet,contentDetails,statistics",
      id: channelId,
    });
    const item = chRes.items?.[0];
    if (!item) throw new Error("Channel not found");
    const uploadsId = item.contentDetails?.relatedPlaylists?.uploads;
    if (!uploadsId) throw new Error("Channel has no uploads playlist");

    const pl = await ytFetch("playlistItems", {
      part: "contentDetails",
      playlistId: uploadsId,
      maxResults: "20",
    });
    const videoIds: string[] = (pl.items || [])
      .map((i: any) => i.contentDetails?.videoId)
      .filter(Boolean);
    if (videoIds.length === 0) throw new Error("No videos found on this channel");

    const vids = await ytFetch("videos", {
      part: "snippet,contentDetails,statistics",
      id: videoIds.join(","),
    });

    const videos = (vids.items || []).map((v: any) => ({
      title: v.snippet.title as string,
      description: (v.snippet.description as string) || "",
      tags: (v.snippet.tags as string[]) || [],
      duration_seconds: parseDuration(v.contentDetails?.duration || "PT0S"),
      view_count: v.statistics?.viewCount ? Number(v.statistics.viewCount) : 0,
      like_count: v.statistics?.likeCount ? Number(v.statistics.likeCount) : 0,
    }));

    const videoDump = videos
      .map((v: typeof videos[number], i: number) => {
        const m = Math.floor(v.duration_seconds / 60);
        const s = v.duration_seconds % 60;
        return `### Video ${i + 1}
Title: ${v.title}
Duration: ${m}m${s.toString().padStart(2, "0")}s · Views: ${v.view_count} · Likes: ${v.like_count}
Tags: ${v.tags.join(", ") || "—"}
Description:
${v.description.slice(0, 1200)}`;
      })
      .join("\n\n");

    const systemPrompt = `You are a senior YouTube content strategist. You analyse a creator's recent videos and output a precise JSON style profile that captures HOW they communicate. Only output valid JSON matching the requested schema — no prose, no markdown fences.`;

    const userPrompt = `Analyse these YouTube video titles, descriptions, and tags from the same creator and extract a detailed style profile. Return a JSON object with these fields:

- toneKeywords: array of 5-8 words describing their communication style
- sentenceStyle: short description of how they write
- titlePatterns: array of 3-5 patterns they use in titles
- topicThemes: array of their 3-5 main content themes
- audienceLanguage: description of the language level and cultural references they use
- hookStyle: how they typically open videos
- avoidPatterns: things they never do
- channelSummary: one paragraph summarising this creator's style for brief generation

# Channel
${item.snippet.title}

# Last ${videos.length} videos
${videoDump}`;

    const aiResult = await callAIGateway({
      userId,
      callType: "channel_analysis",
      systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
      responseFormat: { type: "json_object" },
      maxTokens: 2000,
    });
    const content = aiResult.content;
    let parsed: StyleProfile;
    try {
      const cleaned = content.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
      parsed = styleProfileSchema.parse(JSON.parse(cleaned));
    } catch (err) {
      console.error("Style profile parse error", err, content.slice(0, 500));
      throw new Error("AI returned an unparseable style profile");
    }

    // Per-user single-row: wipe THIS user's row, then insert
    await supabase.from("my_channels").delete().eq("user_id", userId);
    const { data: inserted, error } = await supabase
      .from("my_channels")
      .insert({
        user_id: userId,
        channel_id: item.id,
        title: item.snippet.title,
        thumbnail_url:
          item.snippet.thumbnails?.high?.url ||
          item.snippet.thumbnails?.default?.url ||
          null,
        subscriber_count: item.statistics?.subscriberCount
          ? Number(item.statistics.subscriberCount)
          : null,
        videos_analyzed: videos.length,
        style_profile: parsed as any,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return inserted;
  });

export const getMyChannel = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("my_channels")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return data;
  });

export const deleteMyChannel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("my_channels")
      .delete()
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
