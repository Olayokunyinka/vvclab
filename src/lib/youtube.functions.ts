import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { parseDuration, resolveChannelId, ytFetch } from "./youtube.server";
import { createNotification } from "./notifications.server";

export const addChannel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { input: string }) =>
    z.object({ input: z.string().min(1).max(200) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const channelId = await resolveChannelId(data.input);

    // Reject the user's own channel — it lives in my_channels, not competitors.
    const { data: mine } = await supabase
      .from("my_channels")
      .select("channel_id")
      .eq("user_id", userId)
      .eq("channel_id", channelId)
      .maybeSingle();
    if (mine) {
      return {
        ownChannel: true as const,
        message:
          "This is your own channel — it's connected under My Brand and can't be tracked as a competitor.",
      };
    }

    const res = await ytFetch("channels", {
      part: "snippet,contentDetails,statistics",
      id: channelId,
    });
    const item = res.items?.[0];
    if (!item) throw new Error("Channel not found");

    const row = {
      channel_id: item.id,
      title: item.snippet.title,
      thumbnail_url:
        item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url || null,
      subscriber_count: item.statistics?.subscriberCount
        ? Number(item.statistics.subscriberCount)
        : null,
      uploads_playlist_id: item.contentDetails?.relatedPlaylists?.uploads || null,
    };
    const { data: inserted, error } = await supabase
      .from("channels")
      .upsert(row, { onConflict: "channel_id" })
      .select()
      .single();
    if (error) throw new Error(error.message);

    await supabase
      .from("user_competitors")
      .upsert(
        { user_id: userId, channel_uuid: inserted.id },
        { onConflict: "user_id,channel_uuid" },
      );

    try {
      await createNotification(
        userId,
        "competitor_added",
        "Competitor channel added",
        `${inserted.title} is now being tracked. Their latest videos have been fetched.`,
        { channelId: inserted.channel_id, channelTitle: inserted.title },
      );
    } catch (e) {
      console.error("notification failed", e);
    }

    return inserted;
  });

export const pruneMyChannelFromCompetitors = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: mine } = await supabase
      .from("my_channels")
      .select("channel_id")
      .eq("user_id", userId);
    const ids = (mine || []).map((r: any) => r.channel_id).filter(Boolean);
    if (ids.length === 0) return { removed: 0 };
    const { data: chs } = await supabase
      .from("channels")
      .select("id")
      .in("channel_id", ids);
    const uuids = (chs || []).map((c: any) => c.id);
    if (uuids.length === 0) return { removed: 0 };
    const { error } = await supabase
      .from("user_competitors")
      .delete()
      .eq("user_id", userId)
      .in("channel_uuid", uuids);
    if (error) throw new Error(error.message);
    return { removed: uuids.length };
  });

async function userOwnsChannel(
  supabase: ReturnType<typeof requireOwn>,
  userId: string,
  channelUuid: string,
) {
  const { data } = await supabase
    .from("user_competitors")
    .select("channel_uuid")
    .eq("user_id", userId)
    .eq("channel_uuid", channelUuid)
    .maybeSingle();
  return !!data;
}
// type helper so TS infers supabase shape
function requireOwn(_x: any): any {
  return _x;
}

export const refreshChannelVideos = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { channelUuid: string }) =>
    z.object({ channelUuid: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const owns = await userOwnsChannel(supabase, userId, data.channelUuid);
    if (!owns) throw new Error("Not your competitor");

    const { data: ch, error: chErr } = await supabase
      .from("channels")
      .select("*")
      .eq("id", data.channelUuid)
      .single();
    if (chErr || !ch) throw new Error("Channel not found");
    if (!ch.uploads_playlist_id) throw new Error("Channel has no uploads playlist");

    const pl = await ytFetch("playlistItems", {
      part: "contentDetails",
      playlistId: ch.uploads_playlist_id,
      maxResults: "20",
    });
    const videoIds: string[] = (pl.items || [])
      .map((i: any) => i.contentDetails?.videoId)
      .filter(Boolean);
    if (videoIds.length === 0) return { count: 0 };

    const vids = await ytFetch("videos", {
      part: "snippet,contentDetails,statistics",
      id: videoIds.join(","),
    });

    const rows = (vids.items || []).map((v: any) => ({
      channel_uuid: ch.id,
      video_id: v.id,
      title: v.snippet.title,
      description: v.snippet.description || null,
      thumbnail_url:
        v.snippet.thumbnails?.maxres?.url ||
        v.snippet.thumbnails?.high?.url ||
        v.snippet.thumbnails?.default?.url ||
        null,
      published_at: v.snippet.publishedAt,
      view_count: v.statistics?.viewCount ? Number(v.statistics.viewCount) : 0,
      like_count: v.statistics?.likeCount ? Number(v.statistics.likeCount) : 0,
      comment_count: v.statistics?.commentCount ? Number(v.statistics.commentCount) : 0,
      duration_seconds: parseDuration(v.contentDetails?.duration || "PT0S"),
      tags: v.snippet.tags || [],
    }));

    const { error } = await supabase
      .from("videos")
      .upsert(rows, { onConflict: "video_id" });
    if (error) throw new Error(error.message);



    return { count: rows.length };
  });

export const deleteChannel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { channelUuid: string }) =>
    z.object({ channelUuid: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // Only remove the join row; shared channel/videos stay
    const { error } = await supabase
      .from("user_competitors")
      .delete()
      .eq("user_id", userId)
      .eq("channel_uuid", data.channelUuid);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
