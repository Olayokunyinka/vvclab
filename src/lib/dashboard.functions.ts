import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getMyDashboardData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: comps, error: cErr } = await supabase
      .from("user_competitors")
      .select("channel_uuid, channels(*)")
      .eq("user_id", userId);
    if (cErr) throw new Error(cErr.message);

    const channels = (comps || []).map((c: any) => c.channels).filter(Boolean);
    const channelIds = channels.map((c: any) => c.id);

    if (channelIds.length === 0) {
      return { channels: [], videos: [], briefs: [] };
    }

    const [vd, br] = await Promise.all([
      supabase
        .from("videos")
        .select("*")
        .in("channel_uuid", channelIds)
        .order("published_at", { ascending: false })
        .limit(300),
      supabase.from("briefs").select("video_uuid").eq("user_id", userId),
    ]);

    return {
      channels,
      videos: vd.data || [],
      briefs: br.data || [],
    };
  });
