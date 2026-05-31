import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  assertAdmin,
  isAdmin,
  getDashboardStats,
  getAllUsers,
  getUserDetail,
  suspendUserDb,
  unsuspendUserDb,
  deleteUserDb,
  getAiCallLogPaged,
  getActivityLogPaged,
  getSystemHealth,
  purgeOldActivityDb,
  getCostIntelligence,
} from "./admin.server";

export const checkIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId, claims } = context;
    const ok = await isAdmin(userId);
    return {
      isAdmin: ok,
      email: (claims as any)?.email ?? null,
    };
  });

export const getAdminDashboardStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    return getDashboardStats();
  });

export const getAdminUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(100).default(20),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    return getAllUsers(data.page, data.limit);
  });

export const getAdminUserDetail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ userId: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    return getUserDetail(data.userId);
  });

export const suspendUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        targetUserId: z.string().uuid(),
        reason: z.string().min(1).max(500),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { adminUserId } = await assertAdmin(context.userId);
    await suspendUserDb(adminUserId, data.targetUserId, data.reason);
    return { ok: true };
  });

export const unsuspendUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ targetUserId: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { adminUserId } = await assertAdmin(context.userId);
    await unsuspendUserDb(adminUserId, data.targetUserId);
    return { ok: true };
  });

export const deleteUserAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ targetUserId: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { adminUserId } = await assertAdmin(context.userId);
    await deleteUserDb(adminUserId, data.targetUserId);
    return { ok: true };
  });

export const getAiCallLog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(100).default(25),
        callType: z.string().optional(),
        status: z.string().optional(),
        from: z.string().optional(),
        to: z.string().optional(),
        userEmail: z.string().optional(),
        minCost: z.number().min(0).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    return getAiCallLogPaged(data.page, data.limit, {
      callType: data.callType,
      status: data.status,
      from: data.from,
      to: data.to,
      userEmail: data.userEmail,
      minCost: data.minCost,
    });
  });

export const getAdminCostIntelligence = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    return getCostIntelligence();
  });

export const getActivityLog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(100).default(25),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    return getActivityLogPaged(data.page, data.limit);
  });

export const getAdminSystemHealth = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    return getSystemHealth();
  });

export const purgeOldActivity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { adminUserId } = await assertAdmin(context.userId);
    return purgeOldActivityDb(adminUserId);
  });
