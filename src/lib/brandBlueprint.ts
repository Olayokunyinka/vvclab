export type BlueprintPath = "starting" | "existing";

export type Ikigai = {
  love: string;
  great: string;
  need: string;
  paid: string;
};

export type BrandBlueprint = {
  name: string;
  path: BlueprintPath;
  youtubeUrl?: string;
  ikigai: Ikigai;
  contentPillars: string[];
  brandVoice: string;
  targetAudience: string;
  monetisationAngle: string;
  youtubeNiche: string;
  brandSummary: string;
  createdAt: string;
  updatedAt: string;
};

export const BLUEPRINT_KEY = "vvclab.brandBlueprint.v1";

export function getBlueprint(): BrandBlueprint | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(BLUEPRINT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as BrandBlueprint;
  } catch {
    return null;
  }
}

export function saveBlueprint(bp: BrandBlueprint) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(BLUEPRINT_KEY, JSON.stringify(bp));
  } catch {
    /* ignore */
  }
  // Notify same-tab listeners (storage event only fires cross-tab)
  window.dispatchEvent(new Event("brandBlueprint:changed"));
}

export function clearBlueprint() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(BLUEPRINT_KEY);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event("brandBlueprint:changed"));
}

function isMeaningfulBlueprint(bp: any): bp is BrandBlueprint {
  if (!bp || typeof bp !== "object") return false;
  const hasName = typeof bp.name === "string" && bp.name.trim().length > 0;
  const hasPillars = Array.isArray(bp.contentPillars) && bp.contentPillars.length > 0;
  const hasSummary = typeof bp.brandSummary === "string" && bp.brandSummary.trim().length > 0;
  return hasName || hasPillars || hasSummary;
}

/**
 * Pull the blueprint from the authenticated user's profile in Supabase,
 * cache it in localStorage, and return it. Returns null when the server has
 * no meaningful blueprint yet. Client-only.
 */
export async function hydrateBlueprintFromServer(): Promise<BrandBlueprint | null> {
  if (typeof window === "undefined") return null;
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session?.access_token) return null;
    const { getMyProfile } = await import("@/lib/profile.functions");
    const profile = await getMyProfile();
    const bp = (profile as any)?.brandBlueprint;
    if (!isMeaningfulBlueprint(bp)) return null;
    saveBlueprint(bp as BrandBlueprint);
    return bp as BrandBlueprint;
  } catch {
    return null;
  }
}

