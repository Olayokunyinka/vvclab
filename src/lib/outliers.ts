// View-velocity outlier scoring: multiplier = video views / channel average

export type OutlierTone = "mega" | "strong" | "outlier" | "above" | "average";

export type OutlierBucket = {
  label: string;
  tone: OutlierTone;
};

export function getBucket(multiplier: number): OutlierBucket {
  if (multiplier >= 10) return { label: "Mega outlier", tone: "mega" };
  if (multiplier >= 5) return { label: "Strong outlier", tone: "strong" };
  if (multiplier >= 3) return { label: "Outlier", tone: "outlier" };
  if (multiplier >= 1.5) return { label: "Above average", tone: "above" };
  return { label: "Average", tone: "average" };
}

export const TONE_BG: Record<OutlierTone, string> = {
  mega: "bg-red-600",
  strong: "bg-orange-500",
  outlier: "bg-amber-500",
  above: "bg-emerald-600",
  average: "bg-muted-foreground",
};

export const TONE_TEXT: Record<OutlierTone, string> = {
  mega: "text-red-600",
  strong: "text-orange-500",
  outlier: "text-amber-600",
  above: "text-emerald-600",
  average: "text-muted-foreground",
};

// Hook-type → color pill (matches spec: Bold Claim=red, How-To=blue,
// Curiosity Gap=purple, VS Comparison=green, others=neutral)
export function hookPillClasses(hookType: string): string {
  const t = (hookType || "").toLowerCase();
  if (t.includes("bold")) return "bg-surface-red-soft text-accent-red";
  if (t.includes("how")) return "bg-surface-blue-soft text-accent-blue";
  if (t.includes("curiosity")) return "bg-surface-purple-soft text-accent-indigo";
  if (t.includes("vs") || t.includes("compar")) return "bg-surface-green-soft text-accent-green";
  if (t.includes("question")) return "bg-surface-blue-soft text-accent-blue";
  if (t.includes("story")) return "bg-surface-amber-soft text-accent-amber";
  if (t.includes("result")) return "bg-surface-amber-soft text-accent-amber";
  return "bg-secondary text-foreground";
}

/**
 * Compute channel averages from a flat list of videos.
 * Uses up to the last 20 most-recent videos per channel.
 */
export function computeChannelAverages<
  V extends { channel_uuid: string; view_count: number | null; published_at: string | null },
>(videos: V[]): Record<string, number> {
  const byChannel: Record<string, V[]> = {};
  for (const v of videos) {
    (byChannel[v.channel_uuid] ||= []).push(v);
  }
  const out: Record<string, number> = {};
  for (const [cid, vs] of Object.entries(byChannel)) {
    const sorted = [...vs].sort((a, b) => {
      const da = a.published_at ? new Date(a.published_at).getTime() : 0;
      const db = b.published_at ? new Date(b.published_at).getTime() : 0;
      return db - da;
    });
    const last20 = sorted.slice(0, 20);
    const total = last20.reduce((s, v) => s + (v.view_count || 0), 0);
    out[cid] = last20.length > 0 ? total / last20.length : 0;
  }
  return out;
}

export function computeMultiplier(views: number | null, channelAvg: number): number {
  if (!channelAvg || channelAvg <= 0) return 0;
  return (views || 0) / channelAvg;
}

export function fmtMultiplier(m: number): string {
  if (m <= 0) return "—";
  if (m >= 10) return `${m.toFixed(0)}x`;
  return `${m.toFixed(1)}x`;
}
