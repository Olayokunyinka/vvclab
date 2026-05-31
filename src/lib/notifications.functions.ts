import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type NotificationRow = {
  id: string;
  type: string;
  title: string;
  body: string;
  metadata: Record<string, any>;
  read: boolean;
  createdAt: string;
};

export const getNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("notifications")
      .select("id, type, title, body, metadata, read, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) throw new Error(error.message);

    const notifications: NotificationRow[] = (data ?? []).map((r: any) => ({
      id: r.id,
      type: r.type,
      title: r.title,
      body: r.body,
      metadata: (r.metadata ?? {}) as Record<string, any>,
      read: !!r.read,
      createdAt: r.created_at,
    }));
    const unreadCount = notifications.filter((n) => !n.read).length;
    return { notifications, unreadCount };
  });

export const markNotificationRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("notifications")
      .update({ read: true } as any)
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const markAllNotificationsRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("notifications")
      .update({ read: true } as any)
      .eq("user_id", userId)
      .eq("read", false);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const markNotificationUnread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("notifications")
      .update({ read: false } as any)
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const PAGE_SIZE = 20;

export const listNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        page: z.number().int().min(1).default(1),
        status: z.enum(["all", "unread", "read"]).default("all"),
        type: z.string().max(64).default("all"),
        q: z.string().max(200).default(""),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const from = (data.page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from("notifications")
      .select("id, type, title, body, metadata, read, created_at", {
        count: "exact",
      })
      .eq("user_id", userId);

    if (data.status === "unread") query = query.eq("read", false);
    if (data.status === "read") query = query.eq("read", true);
    if (data.type && data.type !== "all") query = query.eq("type", data.type);
    if (data.q.trim()) {
      const term = data.q.trim().replace(/[%,]/g, "");
      query = query.or(`title.ilike.%${term}%,body.ilike.%${term}%`);
    }

    const { data: rows, error, count } = await query
      .order("created_at", { ascending: false })
      .range(from, to);
    if (error) throw new Error(error.message);

    const unreadHead = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("read", false);

    const notifications: NotificationRow[] = (rows ?? []).map((r: any) => ({
      id: r.id,
      type: r.type,
      title: r.title,
      body: r.body,
      metadata: (r.metadata ?? {}) as Record<string, any>,
      read: !!r.read,
      createdAt: r.created_at,
    }));

    return {
      notifications,
      total: count ?? 0,
      unreadTotal: unreadHead.count ?? 0,
      page: data.page,
      pageSize: PAGE_SIZE,
    };
  });
