import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getMyUsageThisMonth = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
    const { data, error } = await supabase
      .from("ai_call_log")
      .select("call_type, status")
      .eq("user_id", userId)
      .eq("status", "success")
      .gte("created_at", monthStart)
      .limit(5000);
    if (error) throw new Error(error.message);


    const rows = data ?? [];
    const count = (t: string) => rows.filter((r: any) => r.call_type === t).length;
    const usage = {
      script: count("script"),
      linkedin_posts: count("linkedin_posts"),
      images: count("linkedin_image") + count("thumbnail_image"),
      blueprint: count("blueprint"),
    };
    return {
      usage,
      limits: {
        script: 2,
        linkedin_posts: 2,
        images: 3,
        blueprint: 1,
      },
    };
  });
