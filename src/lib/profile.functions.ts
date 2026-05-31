import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const blueprintSchema = z
  .object({
    name: z.string().max(200).optional().default(""),
    path: z.enum(["starting", "existing"]).optional(),
    youtubeUrl: z.string().max(500).optional().default(""),
    ikigai: z
      .object({
        love: z.string().max(4000).default(""),
        great: z.string().max(4000).default(""),
        need: z.string().max(4000).default(""),
        paid: z.string().max(4000).default(""),
      })
      .optional(),
    contentPillars: z.array(z.string().max(500)).max(20).optional().default([]),
    brandVoice: z.string().max(4000).optional().default(""),
    targetAudience: z.string().max(4000).optional().default(""),
    monetisationAngle: z.string().max(4000).optional().default(""),
    youtubeNiche: z.string().max(4000).optional().default(""),
    brandSummary: z.string().max(8000).optional().default(""),
  })
  .passthrough();

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId, claims } = context;
    let { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);

    // Self-heal: trigger should have created this row, but if not, do it now.
    if (!data) {
      const meta = (claims as any).user_metadata || {};
      const insertRes = await supabase
        .from("profiles")
        .insert({
          user_id: userId,
          full_name: meta.full_name || meta.name || "",
          email: (claims as any).email || null,
        })
        .select()
        .single();
      if (insertRes.error) throw new Error(insertRes.error.message);
      data = insertRes.data;
    }

    return {
      userId: data!.user_id,
      fullName: data!.full_name ?? "",
      email: data!.email ?? "",
      onboardingCompleted: data!.onboarding_completed,
      onboardingStep: data!.onboarding_step,
      brandBlueprint: (data!.brand_blueprint as any) || {},
      theme: ((data as any)!.theme as "light" | "dark") ?? "light",
      isSuspended: (data as any)!.is_suspended ?? false,
      suspensionReason: (data as any)!.suspension_reason ?? null,
    };
  });

export const updateMyTheme = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ theme: z.enum(["light", "dark"]) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("profiles")
      .update({ theme: data.theme } as any)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const saveMyBlueprint = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        blueprint: blueprintSchema,
        advanceStep: z.number().int().min(0).max(4).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const update: { brand_blueprint: any; onboarding_step?: number } = {
      brand_blueprint: data.blueprint as any,
    };
    if (typeof data.advanceStep === "number") {
      update.onboarding_step = data.advanceStep;
    }
    const { error } = await supabase
      .from("profiles")
      .update(update)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateOnboardingStep = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ step: z.number().int().min(0).max(4) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("profiles")
      .update({ onboarding_step: data.step })
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const completeOnboarding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("profiles")
      .update({ onboarding_completed: true, onboarding_step: 4 })
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
