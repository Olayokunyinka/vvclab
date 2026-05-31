import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, Youtube, ExternalLink, Plus, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  computeChannelAverages,
  computeMultiplier,
  fmtMultiplier,
  getBucket,
  type OutlierTone,
} from "@/lib/outliers";
import { analyzeVideo, getVideoAnalysis, type AiAnalysis } from "@/lib/analysis.functions";
import { ScriptPanel } from "@/components/ScriptPanel";
import { profileQueryOptions } from "@/routes/_authenticated/_onboarded";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/_onboarded/outliers")({
  head: () => ({ meta: [{ title: "Outliers — VVCLab" }] }),
  component: OutliersPage,
});

type Channel = { id: string; title: string; thumbnail_url: string | null };
type Video = {
  id: string;
  channel_uuid: string;
  title: string;
  thumbnail_url: string | null;
  published_at: string | null;
  view_count: number;
};

function fmtN(n: number | null | undefined) {
  if (n == null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function timeAgo(d: string | null) {
  if (!d) return "";
  const diff = Date.now() - new Date(d).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  const mo = Math.floor(day / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(day / 365)}y ago`;
}

// Map the existing getBucket() tone onto one of the three filter pills.
type PillKey = "viral" | "strong" | "watch";
function pillForTone(tone: OutlierTone): PillKey {
  if (tone === "mega" || tone === "strong") return "viral";
  if (tone === "outlier" || tone === "above") return "strong";
  return "watch";
}

const PILLS: { key: PillKey; label: string; emoji: string }[] = [
  { key: "viral", label: "500x+ Viral", emoji: "⚡" },
  { key: "strong", label: "200x+ Strong", emoji: "📈" },
  { key: "watch", label: "<200x Watch", emoji: "👁" },
];

function OutliersPage() {
  const { data: profile } = useQuery(profileQueryOptions);
  const theme: "light" | "dark" = profile?.theme === "dark" ? "dark" : "light";
  const dark = theme === "dark";

  const analyzeFn = useServerFn(analyzeVideo);
  const getAnalysisFn = useServerFn(getVideoAnalysis);

  const [channels, setChannels] = useState<Channel[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [activePills, setActivePills] = useState<Record<PillKey, boolean>>({
    viral: true,
    strong: true,
    watch: true,
  });
  const [active, setActive] = useState<Video | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  type AnalysisState = AiAnalysis | "loading" | { error: string };
  const [analysisMap, setAnalysisMap] = useState<Record<string, AnalysisState>>({});

  async function loadAnalysis(videoId: string) {
    setAnalysisMap((s) => ({ ...s, [videoId]: "loading" }));
    try {
      const cached = await getAnalysisFn({ data: { videoUuid: videoId } });
      if (cached) {
        setAnalysisMap((s) => ({ ...s, [videoId]: cached }));
        return;
      }
      const fresh = await analyzeFn({ data: { videoUuid: videoId } });
      setAnalysisMap((s) => ({ ...s, [videoId]: fresh }));
    } catch (e: any) {
      setAnalysisMap((s) => ({
        ...s,
        [videoId]: { error: e?.message || "Failed to analyze video" },
      }));
    }
  }

  function toggleExpand(videoId: string) {
    setExpanded((s) => {
      const next = !s[videoId];
      if (next && !analysisMap[videoId]) loadAnalysis(videoId);
      return { ...s, [videoId]: next };
    });
  }

  async function load() {
    const { data: comps } = await supabase
      .from("user_competitors")
      .select("channels(id, title, thumbnail_url)");
    const chs = (comps || [])
      .map((c: any) => c.channels)
      .filter(Boolean) as Channel[];
    setChannels(chs);

    const ids = chs.map((c) => c.id);
    if (ids.length === 0) {
      setVideos([]);
      return;
    }

    const { data: vd } = await supabase
      .from("videos")
      .select("id,channel_uuid,title,thumbnail_url,published_at,view_count")
      .in("channel_uuid", ids);
    setVideos((vd || []) as Video[]);
  }

  useEffect(() => {
    load();
  }, []);

  const channelTitle = useMemo(
    () => Object.fromEntries(channels.map((c) => [c.id, c.title])),
    [channels],
  );

  const channelAverages = useMemo(() => computeChannelAverages(videos), [videos]);

  const visible = useMemo(() => {
    return videos
      .map((v) => {
        const mult = computeMultiplier(v.view_count, channelAverages[v.channel_uuid] || 0);
        return { ...v, mult };
      })
      .filter((v) => activePills[pillForTone(getBucket(v.mult).tone)])
      .sort((a, b) => b.mult - a.mult);
  }, [videos, channelAverages, activePills]);

  const noCompetitors = channels.length === 0;

  function togglePill(key: PillKey) {
    setActivePills((s) => ({ ...s, [key]: !s[key] }));
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 lg:px-10 lg:py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Outlier Feed</h1>
          <p className="mt-1 text-sm text-muted-foreground lg:text-base">
            Live YouTube data · Click any → Generate your version
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/competitors">
              <Plus className="h-4 w-4 lg:mr-1.5" />
              <span className="hidden lg:inline">Add Channels</span>
            </Link>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={() => load()}
            aria-label="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {noCompetitors ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Youtube className="h-10 w-10 text-muted-foreground" />
            <p className="max-w-md text-sm text-muted-foreground">
              No competitor channels yet — add some to start finding outliers.
            </p>
            <Button asChild variant="outline" size="sm">
              <Link to="/competitors">Go to Competitors</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex flex-nowrap items-center gap-2 overflow-x-auto scrollbar-hide pb-2 lg:flex-wrap lg:overflow-visible lg:pb-0">
            {PILLS.map((p) => {
              const on = activePills[p.key];
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => togglePill(p.key)}
                  aria-pressed={on}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                    on
                      ? dark
                        ? "border-[var(--accent-gold)] bg-[var(--accent-gold-bg)] text-[var(--accent-gold)]"
                        : "border-amber-500 bg-amber-50 text-amber-700"
                      : dark
                        ? "border-[var(--border-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span>{p.emoji}</span>
                  {p.label}
                </button>
              );
            })}
            <span className="ml-1 shrink-0 text-xs text-muted-foreground">
              {visible.length} video{visible.length === 1 ? "" : "s"} · sorted by multiplier
            </span>
          </div>

          {visible.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                No videos match this filter. Try enabling more buckets.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {visible.map((v) => {
                const bucket = getBucket(v.mult);
                const isOpen = !!expanded[v.id];
                const avg = channelAverages[v.channel_uuid] || 0;
                const analysisState = analysisMap[v.id];
                const analysis =
                  analysisState && analysisState !== "loading" && !("error" in analysisState)
                    ? (analysisState as AiAnalysis)
                    : null;
                const analysisLoading = analysisState === "loading";
                const analysisError =
                  analysisState && typeof analysisState === "object" && "error" in analysisState
                    ? (analysisState as { error: string }).error
                    : null;
                // Visual fill for the score bar (cap at 10x for a sensible scale).
                const fill = Math.max(4, Math.min(100, (v.mult / 10) * 100));
                return (
                  <div
                    key={v.id}
                    className={cn(
                      "overflow-hidden rounded-xl border transition-colors",
                      dark
                        ? "border-[var(--border-card)] bg-[var(--bg-card)]"
                        : "border-border bg-card",
                      isOpen && "lg:col-span-2",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => toggleExpand(v.id)}
                      className="flex w-full items-start gap-3 p-3 text-left"
                    >
                      <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded-lg bg-muted lg:h-[68px] lg:w-[120px]">
                        {v.thumbnail_url && (
                          <img
                            src={v.thumbnail_url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        )}
                        <div
                          className={cn(
                            "absolute right-1 top-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                            dark
                              ? "bg-[var(--accent-gold-bg)] text-[var(--accent-gold)]"
                              : "bg-amber-100 text-amber-700",
                          )}
                          title={bucket.label}
                        >
                          {fmtMultiplier(v.mult)}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div
                          className={cn(
                            "truncate text-[13px] font-medium",
                            dark ? "text-white" : "text-foreground",
                          )}
                        >
                          {channelTitle[v.channel_uuid]}
                        </div>
                        <h3 className="mt-0.5 line-clamp-2 text-sm leading-snug text-muted-foreground lg:text-base">
                          {v.title}
                        </h3>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground lg:text-sm">
                          {analysis && (
                            <Badge variant="secondary" className="text-xs">
                              {analysis.hookType}
                            </Badge>
                          )}
                          <span>{fmtN(v.view_count)} views</span>
                          <span>·</span>
                          <span>avg {fmtN(avg)}</span>
                          <span>·</span>
                          <span>{timeAgo(v.published_at)}</span>
                        </div>
                      </div>
                    </button>

                    {isOpen && (
                      <div
                        className={cn(
                          "border-t px-3 py-4",
                          dark ? "border-[var(--border-card)]" : "border-border",
                        )}
                      >
                        {/* Outlier score bar */}
                        <div className="mb-4">
                          <div className="mb-1.5 flex items-center justify-between text-[11px]">
                            <span className="font-medium text-muted-foreground">
                              Outlier score
                            </span>
                            <span
                              className={cn(
                                "font-semibold",
                                dark ? "text-[var(--accent-gold)]" : "text-amber-600",
                              )}
                            >
                              {fmtMultiplier(v.mult)} · {bucket.label}
                            </span>
                          </div>
                          <div
                            className={cn(
                              "h-2 w-full overflow-hidden rounded-full",
                              dark ? "bg-[var(--bg-page)]" : "bg-muted",
                            )}
                          >
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${fill}%`,
                                backgroundColor: dark
                                  ? "var(--accent-gold)"
                                  : "rgb(245 158 11)",
                              }}
                            />
                          </div>
                        </div>

                        {/* AI analysis */}
                        {analysisLoading && (
                          <div className="space-y-2">
                            <Skeleton className="h-16 w-full" />
                            <Skeleton className="h-16 w-full" />
                            <Skeleton className="h-20 w-full" />
                          </div>
                        )}
                        {analysisError && (
                          <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs">
                            <span>{analysisError}</span>
                            <button
                              type="button"
                              onClick={() => loadAnalysis(v.id)}
                              className="font-semibold underline"
                            >
                              Retry
                            </button>
                          </div>
                        )}
                        {analysis && (
                          <div className="space-y-2 text-xs">
                            <div className="grid grid-cols-1 gap-2 lg:grid-cols-3">
                              <DetailItem
                                label="Hook type"
                                value={analysis.hookType}
                                sub={analysis.hookExplanation}
                                dark={dark}
                              />
                              <DetailItem
                                label="Title pattern"
                                value={analysis.titlePattern}
                                sub={analysis.titlePatternExplanation}
                                dark={dark}
                              />
                              <DetailItem
                                label="Thumbnail style"
                                value={analysis.thumbnailStyle}
                                sub={analysis.thumbnailExplanation}
                                dark={dark}
                              />
                            </div>
                            <div
                              className={cn(
                                "rounded-lg border p-3",
                                dark
                                  ? "border-[var(--border-card)] bg-[var(--bg-page)]"
                                  : "border-border bg-muted/40",
                              )}
                            >
                              <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                Why it went viral
                              </div>
                              <p
                                className={cn(
                                  "mt-1 text-xs leading-relaxed",
                                  dark ? "text-[var(--text-primary)]" : "text-foreground",
                                )}
                              >
                                {analysis.viralReason}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="mt-4 flex w-full flex-col items-stretch gap-2 lg:w-auto lg:flex-row lg:flex-wrap lg:items-center">
                          <a
                            href={`https://www.youtube.com/watch?v=${v.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex w-full items-center justify-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground lg:w-auto"
                          >
                            Watch <ExternalLink className="h-3 w-3" />
                          </a>
                          <button
                            type="button"
                            onClick={() => setActive(v)}
                            className={cn(
                              "inline-flex w-full items-center justify-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-semibold transition-opacity hover:opacity-90 lg:ml-auto lg:w-auto",
                              dark
                                ? "bg-black text-white"
                                : "bg-foreground text-background",
                            )}
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                            Generate my version
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      <ScriptPanel
        videoUuid={active?.id || null}
        videoTitle={active?.title}
        competitorChannel={active ? channelTitle[active.channel_uuid] : undefined}
        multiplier={
          active
            ? computeMultiplier(active.view_count, channelAverages[active.channel_uuid] || 0)
            : undefined
        }
        patterns={
          active && analysisMap[active.id] && typeof analysisMap[active.id] === "object" &&
          !("error" in (analysisMap[active.id] as object)) &&
          analysisMap[active.id] !== "loading"
            ? {
                hookType: (analysisMap[active.id] as AiAnalysis).hookType,
                titlePattern: (analysisMap[active.id] as AiAnalysis).titlePattern,
                thumbnailStyle: (analysisMap[active.id] as AiAnalysis).thumbnailStyle,
              }
            : null
        }
        onClose={() => setActive(null)}
      />
    </div>
  );
}

function DetailItem({
  label,
  value,
  sub,
  dark,
}: {
  label: string;
  value: string;
  sub?: string;
  dark: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-2.5",
        dark ? "border-[var(--border-card)] bg-[var(--bg-page)]" : "border-border bg-muted/40",
      )}
    >
      <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          "mt-0.5 text-xs font-medium",
          dark ? "text-[var(--text-primary)]" : "text-foreground",
        )}
      >
        {value}
      </div>
      {sub && (
        <div className="mt-1 text-[11px] leading-snug text-muted-foreground">{sub}</div>
      )}
    </div>
  );
}
