import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type AdminContext = {
  adminUserId: string;
  email: string;
};

/**
 * Throws a 403 Response unless the user is in admin_users.
 * Returns the admin row id + email.
 */
export async function assertAdmin(userId: string): Promise<AdminContext> {
  const { data, error } = await supabaseAdmin
    .from("admin_users")
    .select("id, email")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) {
    throw new Response("Forbidden", { status: 403 });
  }
  return { adminUserId: (data as any).id, email: (data as any).email };
}

export async function isAdmin(userId: string): Promise<boolean> {
  try {
    const { data } = await supabaseAdmin
      .from("admin_users")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    return !!data;
  } catch (error) {
    console.warn("Admin status check unavailable", error);
    return false;
  }
}

export async function logAdminAction(
  adminUserId: string,
  action: string,
  targetUserId: string | null,
  details: Record<string, unknown> = {},
) {
  try {
    await supabaseAdmin.from("admin_activity_log").insert({
      admin_user_id: adminUserId,
      action,
      target_user_id: targetUserId,
      details: details as any,
    } as any);
  } catch (e) {
    console.error("admin_activity_log insert failed", e);
  }
}

function startOfTodayIso(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}
function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 86400_000).toISOString();
}
function startOfMonthIso(): string {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString();
}

export async function getDashboardStats() {
  const todayIso = startOfTodayIso();
  const weekAgo = daysAgoIso(7);
  const monthStart = startOfMonthIso();
  const thirtyAgo = daysAgoIso(30);

  const sb = supabaseAdmin;
  const c = (q: any) => q.then((r: any) => r.count ?? 0);

  const [
    totalUsers,
    newUsersToday,
    newUsersThisWeek,
    totalScripts,
    scriptsThisMonth,
    totalLinkedInPosts,
    totalAiCalls,
    aiCallsThisMonth,
    rateLimitedCalls,
    failedCallsErr,
    failedCallsCred,
    totalCompetitors,
    youtubeApiCallsToday,
  ] = await Promise.all([
    c(sb.from("profiles").select("*", { count: "exact", head: true })),
    c(sb.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", todayIso)),
    c(sb.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", weekAgo)),
    c(sb.from("briefs").select("*", { count: "exact", head: true })),
    c(sb.from("briefs").select("*", { count: "exact", head: true }).gte("created_at", monthStart)),
    c(sb.from("ai_call_log").select("*", { count: "exact", head: true }).eq("call_type", "linkedin_posts").eq("status", "success")),
    c(sb.from("ai_call_log").select("*", { count: "exact", head: true })),
    c(sb.from("ai_call_log").select("*", { count: "exact", head: true }).gte("created_at", monthStart)),
    c(sb.from("ai_call_log").select("*", { count: "exact", head: true }).eq("status", "rate_limited")),
    c(sb.from("ai_call_log").select("*", { count: "exact", head: true }).eq("status", "error")),
    c(sb.from("ai_call_log").select("*", { count: "exact", head: true }).eq("status", "credits_exhausted")),
    c(sb.from("user_competitors").select("*", { count: "exact", head: true })),
    c(sb.from("ai_call_log").select("*", { count: "exact", head: true }).eq("call_type", "channel_analysis").gte("created_at", todayIso)),
  ]);

  // distinct user_ids with blueprints + with channels
  const [{ data: bpRows }, { data: chRows }] = await Promise.all([
    sb.from("profiles").select("user_id, brand_blueprint"),
    sb.from("my_channels").select("user_id"),
  ]);
  const usersWithBlueprint = (bpRows ?? []).filter(
    (r: any) => r.brand_blueprint && Object.keys(r.brand_blueprint).length > 0,
  ).length;
  const usersWithChannel = new Set((chRows ?? []).map((r: any) => r.user_id)).size;

  // most tracked channels (top 5)
  const { data: compRows } = await sb
    .from("user_competitors")
    .select("channel_uuid");
  const counts = new Map<string, number>();
  for (const r of compRows ?? []) {
    counts.set((r as any).channel_uuid, (counts.get((r as any).channel_uuid) ?? 0) + 1);
  }
  const topUuids = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const uuids = topUuids.map(([u]) => u);
  let mostTrackedChannels: { title: string; count: number }[] = [];
  if (uuids.length > 0) {
    const { data: ch } = await sb.from("channels").select("id, title").in("id", uuids);
    const map = new Map((ch ?? []).map((c: any) => [c.id, c.title]));
    mostTrackedChannels = topUuids.map(([u, n]) => ({
      title: (map.get(u) as string) ?? "Unknown",
      count: n,
    }));
  }

  // signups per day (last 30 days)
  const { data: signupRows } = await sb
    .from("profiles")
    .select("created_at")
    .gte("created_at", thirtyAgo);
  const signupsByDay = bucketByDay(signupRows ?? [], 30, "created_at");

  // ai calls per day by type (last 7d)
  const { data: aiRows } = await sb
    .from("ai_call_log")
    .select("created_at, call_type")
    .gte("created_at", daysAgoIso(7));
  const aiCallsByDayByType = bucketByDayByType(aiRows ?? [], 7);

  return {
    totalUsers,
    newUsersToday,
    newUsersThisWeek,
    usersWithBlueprint,
    usersWithChannel,
    totalScriptsGenerated: totalScripts,
    scriptsThisMonth,
    totalLinkedInPosts,
    totalAiCalls,
    aiCallsThisMonth,
    rateLimitedCalls,
    failedCalls: failedCallsErr + failedCallsCred,
    totalCompetitorChannels: totalCompetitors,
    mostTrackedChannels,
    youtubeApiCallsToday,
    signupsByDay,
    aiCallsByDayByType,
  };
}

function bucketByDay(rows: any[], days: number, field: string) {
  const out: { date: string; count: number }[] = [];
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 86400_000);
    out.push({ date: d.toISOString().slice(0, 10), count: 0 });
  }
  const idx = new Map(out.map((r, i) => [r.date, i]));
  for (const r of rows) {
    const date = String(r[field]).slice(0, 10);
    const i = idx.get(date);
    if (i !== undefined) out[i].count++;
  }
  return out;
}

function bucketByDayByType(rows: any[], days: number) {
  const types = [
    "blueprint",
    "channel_analysis",
    "script",
    "linkedin_posts",
    "linkedin_image",
    "pattern_analysis",
  ];
  const out: any[] = [];
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 86400_000);
    const row: any = { date: d.toISOString().slice(0, 10) };
    for (const t of types) row[t] = 0;
    out.push(row);
  }
  const idx = new Map(out.map((r, i) => [r.date, i]));
  for (const r of rows) {
    const date = String(r.created_at).slice(0, 10);
    const i = idx.get(date);
    if (i !== undefined && types.includes(r.call_type)) out[i][r.call_type]++;
  }
  return out;
}

export async function getAllUsers(
  page: number,
  limit: number,
  filters: {
    search?: string;
    statuses?: ("active" | "suspended" | "admin")[];
    flags?: ("blueprint" | "channel" | "no_channel")[];
    sortBy?:
      | "created_at"
      | "email"
      | "full_name"
      | "last_sign_in_at"
      | "scripts"
      | "competitors";
    sortDir?: "asc" | "desc";
  } = {},
) {
  const sb = supabaseAdmin;
  const sortBy = filters.sortBy ?? "created_at";
  const sortDir = filters.sortDir ?? "desc";
  const ascending = sortDir === "asc";
  const isCoreSort =
    sortBy === "created_at" || sortBy === "email" || sortBy === "full_name";
  const wantAdmin = (filters.statuses ?? []).includes("admin");
  const wantSuspended = (filters.statuses ?? []).includes("suspended");
  const wantActive = (filters.statuses ?? []).includes("active");
  const onlyStatuses = (filters.statuses ?? []).length > 0;

  // Load admin id set (small table) — needed for filter and status chip
  const { data: adminsAll } = await sb.from("admin_users").select("user_id");
  const adminSet = new Set((adminsAll ?? []).map((a: any) => a.user_id));

  // Base profiles query with search + suspended filter applied server-side
  const buildProfilesQuery = (forCount = false) => {
    let q = sb.from("profiles").select("*", forCount ? { count: "exact" } : undefined);
    if (filters.search?.trim()) {
      const s = filters.search.trim().replace(/[%_]/g, "");
      q = q.or(`full_name.ilike.%${s}%,email.ilike.%${s}%`);
    }
    if (onlyStatuses && wantSuspended && !wantActive && !wantAdmin) {
      q = q.eq("is_suspended", true);
    } else if (onlyStatuses && wantActive && !wantSuspended && !wantAdmin) {
      q = q.eq("is_suspended", false);
    }
    return q;
  };

  const SOFT_CAP = 5000;
  let rows: any[] = [];
  let total = 0;
  let capped = false;

  if (isCoreSort) {
    // Server-side order + range
    const fromIdx = (page - 1) * limit;
    const toIdx = fromIdx + limit - 1;
    const col =
      sortBy === "email" ? "email" : sortBy === "full_name" ? "full_name" : "created_at";
    const { data, count } = await buildProfilesQuery(true)
      .order(col, { ascending, nullsFirst: false })
      .range(fromIdx, toIdx);
    rows = data ?? [];
    total = count ?? 0;
  } else {
    // Derived sort — fetch matching set (capped), enrich, sort, slice
    const { data, count } = await buildProfilesQuery(true)
      .order("created_at", { ascending: false })
      .range(0, SOFT_CAP - 1);
    rows = data ?? [];
    total = count ?? 0;
    capped = (count ?? 0) > SOFT_CAP;
  }

  // Apply admin-status filter (post-fetch, requires adminSet)
  if (onlyStatuses) {
    rows = rows.filter((p: any) => {
      const isAdmin = adminSet.has(p.user_id);
      const isSus = !!p.is_suspended;
      const isActive = !isSus && !isAdmin;
      return (
        (wantAdmin && isAdmin) ||
        (wantSuspended && isSus) ||
        (wantActive && isActive)
      );
    });
  }

  if (rows.length === 0) return { rows: [], total: 0, capped: false };

  // Counts for derived columns + flag filters
  const ids = rows.map((r: any) => r.user_id);
  const [{ data: briefs }, { data: channels }, { data: comps }] = await Promise.all([
    sb.from("briefs").select("user_id").in("user_id", ids),
    sb.from("my_channels").select("user_id").in("user_id", ids),
    sb.from("user_competitors").select("user_id").in("user_id", ids),
  ]);
  const briefCount = countBy(briefs ?? [], "user_id");
  const channelCount = countBy(channels ?? [], "user_id");
  const compCount = countBy(comps ?? [], "user_id");

  // Flag filters (AND semantics)
  const flags = filters.flags ?? [];
  if (flags.length) {
    rows = rows.filter((p: any) => {
      if (flags.includes("blueprint")) {
        const has = p.brand_blueprint && Object.keys(p.brand_blueprint).length > 0;
        if (!has) return false;
      }
      if (flags.includes("channel") && (channelCount.get(p.user_id) ?? 0) === 0) return false;
      if (flags.includes("no_channel") && (channelCount.get(p.user_id) ?? 0) > 0) return false;
      return true;
    });
  }

  // last_sign_in_at from auth.users
  const authMap = new Map<string, string | null>();
  try {
    const { data: list } = await sb.auth.admin.listUsers({ perPage: 1000 });
    for (const u of list?.users ?? []) {
      authMap.set(u.id, u.last_sign_in_at ?? null);
    }
  } catch (e) {
    console.error("listUsers failed", e);
  }

  let enriched = rows.map((p: any) => ({
    userId: p.user_id,
    fullName: p.full_name ?? "",
    email: p.email ?? "",
    createdAt: p.created_at,
    lastSignInAt: authMap.get(p.user_id) ?? null,
    isSuspended: p.is_suspended ?? false,
    suspensionReason: p.suspension_reason ?? null,
    isAdmin: adminSet.has(p.user_id),
    hasBlueprint:
      p.brand_blueprint && Object.keys(p.brand_blueprint).length > 0,
    hasChannel: (channelCount.get(p.user_id) ?? 0) > 0,
    competitorCount: compCount.get(p.user_id) ?? 0,
    scriptCount: briefCount.get(p.user_id) ?? 0,
  }));

  if (!isCoreSort) {
    const dir = ascending ? 1 : -1;
    enriched.sort((a, b) => {
      let av: any;
      let bv: any;
      if (sortBy === "scripts") {
        av = a.scriptCount;
        bv = b.scriptCount;
      } else if (sortBy === "competitors") {
        av = a.competitorCount;
        bv = b.competitorCount;
      } else {
        av = a.lastSignInAt ? new Date(a.lastSignInAt).getTime() : 0;
        bv = b.lastSignInAt ? new Date(b.lastSignInAt).getTime() : 0;
      }
      return (av - bv) * dir;
    });
    total = enriched.length;
    const fromIdx = (page - 1) * limit;
    enriched = enriched.slice(fromIdx, fromIdx + limit);
  } else if (onlyStatuses && wantAdmin) {
    // Admin filter wasn't server-side; recompute total when admin filter active
    // (rows came from a single page so total is approximate). Use enriched length scaled.
    // Best-effort: leave total as-is from server count when only suspended/active filtered.
  }

  return { rows: enriched, total, capped };
}

function countBy(rows: any[], field: string) {
  const m = new Map<string, number>();
  for (const r of rows) m.set(r[field], (m.get(r[field]) ?? 0) + 1);
  return m;
}

export async function getUserDetail(targetUserId: string) {
  const sb = supabaseAdmin;
  const { data: profile } = await sb
    .from("profiles")
    .select("*")
    .eq("user_id", targetUserId)
    .maybeSingle();
  if (!profile) throw new Error("User not found");

  const [
    { data: briefs },
    { data: channels },
    { data: comps },
    { data: adminRow },
  ] = await Promise.all([
    sb
      .from("briefs")
      .select("id, content, created_at")
      .eq("user_id", targetUserId)
      .order("created_at", { ascending: false })
      .limit(5),
    sb
      .from("my_channels")
      .select("title, channel_id, videos_analyzed")
      .eq("user_id", targetUserId),
    sb.from("user_competitors").select("channel_uuid").eq("user_id", targetUserId),
    sb.from("admin_users").select("id").eq("user_id", targetUserId).maybeSingle(),
  ]);

  let trackedChannels: string[] = [];
  if ((comps ?? []).length > 0) {
    const ids = (comps ?? []).map((c: any) => c.channel_uuid);
    const { data: ch } = await sb.from("channels").select("title").in("id", ids);
    trackedChannels = (ch ?? []).map((c: any) => c.title);
  }

  let lastSignInAt: string | null = null;
  try {
    const { data: u } = await sb.auth.admin.getUserById(targetUserId);
    lastSignInAt = u?.user?.last_sign_in_at ?? null;
  } catch {}

  return {
    userId: (profile as any).user_id,
    email: (profile as any).email ?? "",
    fullName: (profile as any).full_name ?? "",
    createdAt: (profile as any).created_at,
    lastSignInAt,
    isSuspended: (profile as any).is_suspended ?? false,
    suspensionReason: (profile as any).suspension_reason ?? null,
    onboardingCompleted: (profile as any).onboarding_completed,
    isAdmin: !!adminRow,
    brandBlueprint: (profile as any).brand_blueprint ?? {},
    myChannels: channels ?? [],
    trackedChannels,
    competitorCount: (comps ?? []).length,
    scriptCount: (briefs ?? []).length,
    recentBriefs: (briefs ?? []).map((b: any) => ({
      id: b.id,
      title:
        b.content?.title ||
        b.content?.channelTitle ||
        "Untitled brief",
      createdAt: b.created_at,
    })),
  };
}

export async function suspendUserDb(
  adminUserId: string,
  targetUserId: string,
  reason: string,
) {
  const sb = supabaseAdmin;
  const { error } = await sb
    .from("profiles")
    .update({ is_suspended: true, suspension_reason: reason } as any)
    .eq("user_id", targetUserId);
  if (error) throw new Error(error.message);
  await logAdminAction(adminUserId, "suspend_user", targetUserId, { reason });
}

export async function unsuspendUserDb(adminUserId: string, targetUserId: string) {
  const sb = supabaseAdmin;
  const { error } = await sb
    .from("profiles")
    .update({ is_suspended: false, suspension_reason: null } as any)
    .eq("user_id", targetUserId);
  if (error) throw new Error(error.message);
  await logAdminAction(adminUserId, "unsuspend_user", targetUserId);
}

export async function deleteUserDb(adminUserId: string, targetUserId: string) {
  const sb = supabaseAdmin;
  // Guard: never delete another admin
  const { data: adm } = await sb
    .from("admin_users")
    .select("id")
    .eq("user_id", targetUserId)
    .maybeSingle();
  if (adm) throw new Error("Cannot delete an admin user");
  const { error } = await sb.auth.admin.deleteUser(targetUserId);
  if (error) throw new Error(error.message);
  await logAdminAction(adminUserId, "delete_user", targetUserId);
}

const CALL_TYPES = [
  "blueprint",
  "channel_analysis",
  "script",
  "pattern_analysis",
  "linkedin_posts",
  "linkedin_image",
  "thumbnail_image",
] as const;

function n(v: any): number {
  if (v == null) return 0;
  const x = typeof v === "string" ? Number(v) : v;
  return Number.isFinite(x) ? x : 0;
}

export async function getAiCallLogPaged(
  page: number,
  limit: number,
  filters: {
    callType?: string;
    status?: string;
    from?: string;
    to?: string;
    userEmail?: string;
    minCost?: number;
    maxCost?: number;
    minTokens?: number;
    sortBy?:
      | "created_at"
      | "upstream_cost_usd"
      | "total_tokens"
      | "duration_ms"
      | "call_type"
      | "status";
    sortDir?: "asc" | "desc";
  },
) {
  const sb = supabaseAdmin;
  const fromIdx = (page - 1) * limit;
  const toIdx = fromIdx + limit - 1;
  const sortBy = filters.sortBy ?? "created_at";
  const ascending = (filters.sortDir ?? "desc") === "asc";

  // Resolve user-email filter to user_id list
  let userIdFilter: string[] | null = null;
  if (filters.userEmail && filters.userEmail.trim()) {
    const { data: matches } = await sb
      .from("profiles")
      .select("user_id, email")
      .ilike("email", `%${filters.userEmail.trim()}%`)
      .limit(200);
    userIdFilter = (matches ?? []).map((m: any) => m.user_id);
    if (!userIdFilter.length) {
      return {
        rows: [],
        total: 0,
        summary: monthSummaryEmpty(),
        breakdown: [],
        perUser: [],
        projection: projectionEmpty(),
      };
    }
  }

  const applyFilters = <T extends ReturnType<typeof sb.from>>(q: T): T => {
    let x: any = q;
    if (filters.callType) x = x.eq("call_type", filters.callType);
    if (filters.status) x = x.eq("status", filters.status);
    if (filters.from) x = x.gte("created_at", filters.from);
    if (filters.to) x = x.lte("created_at", filters.to);
    if (typeof filters.minCost === "number" && filters.minCost > 0)
      x = x.gte("upstream_cost_usd", filters.minCost);
    if (typeof filters.maxCost === "number" && filters.maxCost > 0)
      x = x.lte("upstream_cost_usd", filters.maxCost);
    if (typeof filters.minTokens === "number" && filters.minTokens > 0)
      x = x.gte("total_tokens", filters.minTokens);
    if (userIdFilter) x = x.in("user_id", userIdFilter);
    return x as T;
  };

  // Paginated raw rows
  let q = sb
    .from("ai_call_log")
    .select("*", { count: "exact" })
    .order(sortBy, { ascending, nullsFirst: false })
    .range(fromIdx, toIdx);
  q = applyFilters(q);
  const { data: pageData, count } = await q;
  const rows = pageData ?? [];

  // User emails for page rows
  const rowUserIds = Array.from(new Set(rows.map((r: any) => r.user_id).filter(Boolean)));
  let pageEmailMap = new Map<string, string>();
  if (rowUserIds.length) {
    const { data: profs } = await sb
      .from("profiles")
      .select("user_id, email")
      .in("user_id", rowUserIds);
    pageEmailMap = new Map((profs ?? []).map((p: any) => [p.user_id, p.email ?? ""]));
  }

  // Current-month aggregation for summary + breakdown + per-user + projection
  const monthStart = startOfMonthIso();
  const { data: monthData } = await sb
    .from("ai_call_log")
    .select(
      "user_id, call_type, status, tokens_used, total_tokens, upstream_cost_usd, created_at",
    )
    .gte("created_at", monthStart)
    .limit(20000);
  const monthRows = monthData ?? [];

  // Summary
  let totalCalls = monthRows.length;
  let successCalls = 0;
  let totalTokens = 0;
  let totalCost = 0;
  const perTypeCost = new Map<string, number>();
  for (const r of monthRows as any[]) {
    if (r.status === "success") successCalls++;
    totalTokens += n(r.total_tokens) || n(r.tokens_used);
    const c = n(r.upstream_cost_usd);
    totalCost += c;
    perTypeCost.set(r.call_type, (perTypeCost.get(r.call_type) ?? 0) + c);
  }
  const mostExpensiveType =
    Array.from(perTypeCost.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  // Per call-type breakdown
  const breakdown = CALL_TYPES.map((t) => {
    const tRows = (monthRows as any[]).filter((r) => r.call_type === t);
    const total = tRows.length;
    const success = tRows.filter((r) => r.status === "success").length;
    const tokens = tRows.reduce((s, r) => s + (n(r.total_tokens) || n(r.tokens_used)), 0);
    const cost = tRows.reduce((s, r) => s + n(r.upstream_cost_usd), 0);
    const last = tRows
      .map((r) => r.created_at)
      .sort()
      .at(-1);
    return {
      callType: t,
      totalCalls: total,
      successRate: total ? Math.round((success / total) * 100) : 0,
      totalTokens: tokens,
      avgTokens: total ? Math.round(tokens / total) : 0,
      totalCost: cost,
      avgCost: total ? cost / total : 0,
      lastCalled: last ?? null,
    };
  }).sort((a, b) => b.totalCost - a.totalCost);

  // Per-user
  const byUser = new Map<
    string,
    { calls: number; tokens: number; cost: number; scripts: number; linkedin: number; images: number }
  >();
  for (const r of monthRows as any[]) {
    if (!r.user_id) continue;
    const cur = byUser.get(r.user_id) ?? {
      calls: 0,
      tokens: 0,
      cost: 0,
      scripts: 0,
      linkedin: 0,
      images: 0,
    };
    cur.calls++;
    cur.tokens += n(r.total_tokens) || n(r.tokens_used);
    cur.cost += n(r.upstream_cost_usd);
    if (r.call_type === "script") cur.scripts++;
    if (r.call_type === "linkedin_posts") cur.linkedin++;
    if (r.call_type === "linkedin_image" || r.call_type === "thumbnail_image") cur.images++;
    byUser.set(r.user_id, cur);
  }
  const userIds = Array.from(byUser.keys());
  let userEmailMap = new Map<string, string>();
  if (userIds.length) {
    const { data: profs } = await sb
      .from("profiles")
      .select("user_id, email")
      .in("user_id", userIds);
    userEmailMap = new Map((profs ?? []).map((p: any) => [p.user_id, p.email ?? ""]));
  }
  const perUser = Array.from(byUser.entries())
    .map(([uid, v]) => ({
      userId: uid,
      email: userEmailMap.get(uid) ?? "—",
      totalCalls: v.calls,
      totalTokens: v.tokens,
      totalCost: v.cost,
      scripts: v.scripts,
      linkedinPosts: v.linkedin,
      images: v.images,
      avgCostPerSession: v.calls ? v.cost / v.calls : 0,
    }))
    .sort((a, b) => b.totalCost - a.totalCost);

  // Projection
  const now = new Date();
  const daysInMonth = new Date(now.getUTCFullYear(), now.getUTCMonth() + 1, 0).getUTCDate();
  const daysElapsed = Math.max(1, now.getUTCDate());
  const projectedMonthlyCost = (totalCost / daysElapsed) * daysInMonth;
  const activeUsers = perUser.length;
  const costPerActiveUser = activeUsers ? totalCost / activeUsers : 0;
  const projection = {
    currentMonthCost: totalCost,
    projectedMonthlyCost,
    activeUsers,
    costPerActiveUser,
    daysElapsed,
    daysInMonth,
  };

  return {
    rows: rows.map((r: any) => ({
      ...r,
      userEmail: r.user_id ? pageEmailMap.get(r.user_id) ?? "" : "",
      upstream_cost_usd: n(r.upstream_cost_usd),
      upstream_prompt_cost_usd: n(r.upstream_prompt_cost_usd),
      upstream_completion_cost_usd: n(r.upstream_completion_cost_usd),
    })),
    total: count ?? 0,
    summary: {
      totalCalls,
      successRate: totalCalls ? Math.round((successCalls / totalCalls) * 100) : 0,
      totalTokens,
      totalCost,
      avgCostPerCall: totalCalls ? totalCost / totalCalls : 0,
      mostExpensiveType,
    },
    breakdown,
    perUser,
    projection,
  };
}

function monthSummaryEmpty() {
  return {
    totalCalls: 0,
    successRate: 0,
    totalTokens: 0,
    totalCost: 0,
    avgCostPerCall: 0,
    mostExpensiveType: null as string | null,
  };
}
function projectionEmpty() {
  return {
    currentMonthCost: 0,
    projectedMonthlyCost: 0,
    activeUsers: 0,
    costPerActiveUser: 0,
    daysElapsed: 1,
    daysInMonth: 30,
  };
}

export async function getCostIntelligence() {
  const sb = supabaseAdmin;
  const thirtyAgo = daysAgoIso(30);
  const { data, error } = await sb
    .from("ai_call_log")
    .select("call_type, upstream_cost_usd, cached_tokens, is_byok, total_tokens, tokens_used, user_id, created_at")
    .gte("created_at", thirtyAgo)
    .limit(30000);
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as any[];

  // Daily stacked-by-type cost
  const dayTypeCost = new Map<string, Map<string, number>>();
  const types = new Set<string>();
  for (const r of rows) {
    const day = String(r.created_at).slice(0, 10);
    const t = r.call_type as string;
    types.add(t);
    const m = dayTypeCost.get(day) ?? new Map<string, number>();
    m.set(t, (m.get(t) ?? 0) + n(r.upstream_cost_usd));
    dayTypeCost.set(day, m);
  }
  const dailyCost = Array.from(dayTypeCost.entries())
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([date, m]) => {
      const obj: Record<string, any> = { date };
      for (const t of types) obj[t] = m.get(t) ?? 0;
      return obj;
    });

  // Top 10 most expensive
  const topRows = [...rows].sort((a, b) => n(b.upstream_cost_usd) - n(a.upstream_cost_usd)).slice(0, 10);
  const topUserIds = Array.from(new Set(topRows.map((r) => r.user_id).filter(Boolean)));
  let topEmailMap = new Map<string, string>();
  if (topUserIds.length) {
    const { data: profs } = await sb
      .from("profiles")
      .select("user_id, email")
      .in("user_id", topUserIds);
    topEmailMap = new Map((profs ?? []).map((p: any) => [p.user_id, p.email ?? ""]));
  }
  const topExpensive = topRows.map((r) => ({
    userEmail: r.user_id ? topEmailMap.get(r.user_id) ?? "—" : "—",
    callType: r.call_type,
    tokens: n(r.total_tokens) || n(r.tokens_used),
    cost: n(r.upstream_cost_usd),
    createdAt: r.created_at,
  }));

  // Cached token savings
  const cachedTokens = rows.reduce((s, r) => s + n(r.cached_tokens), 0);
  const cachedSavings = cachedTokens * 0.00000075;

  // BYOK counts
  const byokTrue = rows.filter((r) => r.is_byok === true).length;
  const byokFalse = rows.filter((r) => r.is_byok === false || r.is_byok == null).length;

  return {
    dailyCost,
    callTypes: Array.from(types),
    topExpensive,
    cachedTokens,
    cachedSavings,
    byok: { yes: byokTrue, no: byokFalse },
  };
}


export async function getActivityLogPaged(page: number, limit: number) {
  const sb = supabaseAdmin;
  const fromIdx = (page - 1) * limit;
  const toIdx = fromIdx + limit - 1;
  const { data, count } = await sb
    .from("admin_activity_log")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(fromIdx, toIdx);
  const rows = data ?? [];
  const adminIds = Array.from(new Set(rows.map((r: any) => r.admin_user_id).filter(Boolean)));
  const targetIds = Array.from(new Set(rows.map((r: any) => r.target_user_id).filter(Boolean)));
  let adminMap = new Map<string, string>();
  let targetMap = new Map<string, string>();
  if (adminIds.length) {
    const { data: a } = await sb.from("admin_users").select("id, email").in("id", adminIds);
    adminMap = new Map((a ?? []).map((r: any) => [r.id, r.email]));
  }
  if (targetIds.length) {
    const { data: p } = await sb.from("profiles").select("user_id, email").in("user_id", targetIds);
    targetMap = new Map((p ?? []).map((r: any) => [r.user_id, r.email ?? ""]));
  }
  return {
    rows: rows.map((r: any) => ({
      ...r,
      adminEmail: r.admin_user_id ? adminMap.get(r.admin_user_id) ?? "" : "",
      targetEmail: r.target_user_id ? targetMap.get(r.target_user_id) ?? "" : "",
    })),
    total: count ?? 0,
  };
}

export async function getSystemHealth() {
  const sb = supabaseAdmin;
  const [{ data: lastAi }, { data: lastYt }] = await Promise.all([
    sb
      .from("ai_call_log")
      .select("status, created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    sb
      .from("ai_call_log")
      .select("status, created_at")
      .eq("call_type", "channel_analysis")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  // breakdown per call type
  const types = [
    "blueprint",
    "channel_analysis",
    "script",
    "linkedin_posts",
    "linkedin_image",
    "pattern_analysis",
  ];
  const monthStart = startOfMonthIso();
  const breakdown = await Promise.all(
    types.map(async (t) => {
      const { data } = await sb
        .from("ai_call_log")
        .select("status, tokens_used, created_at")
        .eq("call_type", t)
        .limit(5000);
      const rows = data ?? [];
      const total = rows.length;
      const success = rows.filter((r: any) => r.status === "success").length;
      const totalTokens = rows.reduce((s: number, r: any) => s + (r.tokens_used ?? 0), 0);
      const thisMonth = rows.filter((r: any) => r.created_at >= monthStart).length;
      return {
        callType: t,
        total,
        successRate: total ? Math.round((success / total) * 100) : 0,
        avgTokens: total ? Math.round(totalTokens / total) : 0,
        thisMonth,
      };
    }),
  );

  // rate-limit incidents (last 7d, grouped by day)
  const sevenAgo = daysAgoIso(7);
  const { data: rl } = await sb
    .from("ai_call_log")
    .select("created_at, status, call_type")
    .in("status", ["rate_limited", "credits_exhausted"])
    .gte("created_at", sevenAgo)
    .order("created_at", { ascending: false });
  const byDay = new Map<string, number>();
  for (const r of rl ?? []) {
    const d = String((r as any).created_at).slice(0, 10);
    byDay.set(d, (byDay.get(d) ?? 0) + 1);
  }
  const incidents = Array.from(byDay.entries())
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([date, count]) => ({ date, count }));

  return {
    aiGateway: lastAi
      ? { status: (lastAi as any).status, at: (lastAi as any).created_at }
      : null,
    youtubeApi: lastYt
      ? { status: (lastYt as any).status, at: (lastYt as any).created_at }
      : null,
    supabase: { status: "connected" as const },
    breakdown,
    incidents,
  };
}

export async function purgeOldActivityDb(adminUserId: string) {
  const sb = supabaseAdmin;
  const cutoff = daysAgoIso(90);
  const { error, count } = await sb
    .from("admin_activity_log")
    .delete({ count: "exact" })
    .lt("created_at", cutoff);
  if (error) throw new Error(error.message);
  await logAdminAction(adminUserId, "purge_activity_log", null, {
    cutoff,
    deleted: count ?? 0,
  });
  return { deleted: count ?? 0 };
}
