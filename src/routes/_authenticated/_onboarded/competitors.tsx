import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Loader2,
  Search,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Play,
  ExternalLink,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { addChannel, refreshChannelVideos } from "@/lib/youtube.functions";
import { detectPatterns } from "@/lib/patterns";

export const Route = createFileRoute("/_authenticated/_onboarded/competitors")({
  head: () => ({ meta: [{ title: "Competitors — VVCLab" }] }),
  component: CompetitorsPage,
});

type Channel = {
  id: string;
  title: string;
  thumbnail_url: string | null;
  subscriber_count: number | null;
};

type Video = {
  id: string;
  video_id: string;
  title: string;
  thumbnail_url: string | null;
  view_count: number | null;
  like_count: number | null;
  comment_count: number | null;
  published_at: string | null;
};

type Stage = "input" | "loading" | "results";

const nf = new Intl.NumberFormat("en-US");
const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

function fmtSubs(n: number | null | undefined) {
  if (n == null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M subscribers`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K subscribers`;
  return `${nf.format(n)} subscribers`;
}

function timeAgo(iso: string | null) {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  const diff = (then - Date.now()) / 1000;
  const abs = Math.abs(diff);
  if (abs < 60) return rtf.format(Math.round(diff), "second");
  if (abs < 3600) return rtf.format(Math.round(diff / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), "hour");
  if (abs < 86400 * 30) return rtf.format(Math.round(diff / 86400), "day");
  if (abs < 86400 * 365) return rtf.format(Math.round(diff / (86400 * 30)), "month");
  return rtf.format(Math.round(diff / (86400 * 365)), "year");
}

function median(xs: number[]) {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function perfTier(pct: number): { color: string; badge: { label: string; cls: string } | null } {
  if (pct >= 500)
    return {
      color: "#ef4444",
      badge: { label: "🔥 Viral", cls: "bg-red-500/15 text-red-400 border-red-500/30" },
    };
  if (pct >= 200)
    return {
      color: "#f97316",
      badge: { label: "📈 Strong", cls: "bg-orange-500/15 text-orange-400 border-orange-500/30" },
    };
  if (pct >= 100) return { color: "var(--accent-amber)", badge: null };
  return { color: "hsl(var(--muted-foreground) / 0.4)", badge: null };
}

function CompetitorsPage() {
  const addFn = useServerFn(addChannel);
  const refreshFn = useServerFn(refreshChannelVideos);

  const [inputValue, setInputValue] = useState("");
  const [stage, setStage] = useState<Stage>("input");
  const [channel, setChannel] = useState<Channel | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const isAnalyzing = stage === "loading";
  const isDisabled = inputValue.trim().length === 0 || isAnalyzing;

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    if (isDisabled) return;
    setStage("loading");
    setExpandedId(null);
    try {
      const result = await addFn({ data: { input: inputValue.trim() } });
      if ("ownChannel" in result) {
        toast.error(result.message);
        setStage("input");
        return;
      }
      const ch = result as Channel;
      try {
        await refreshFn({ data: { channelUuid: ch.id } });
      } catch (e) {
        console.warn("refresh failed", e);
      }
      const { data: vids, error } = await supabase
        .from("videos")
        .select(
          "id, video_id, title, thumbnail_url, view_count, like_count, comment_count, published_at",
        )
        .eq("channel_uuid", ch.id)
        .order("view_count", { ascending: false })
        .limit(20);
      if (error) throw new Error(error.message);
      setChannel(ch);
      setVideos((vids ?? []) as Video[]);
      setStage("results");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to analyze channel");
      setStage("input");
    }
  }

  const avg =
    videos.length > 0
      ? videos.reduce((s, v) => s + (v.view_count ?? 0), 0) / videos.length
      : 0;
  const med = median(videos.map((v) => v.view_count ?? 0));

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 md:px-10 md:py-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight lg:text-[32px]">Competitors</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Paste any channel · see what's working for them · and why
        </p>
      </div>

      {/* Input card — always visible */}
      <form onSubmit={handleAnalyze} className="rounded-xl border border-border bg-card p-5">
        <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          Competitor's YouTube channel
        </label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="@handle, youtube.com/@handle, youtube.com/channel/UC..., or UC..."
              disabled={isAnalyzing}
              className="h-11 pl-9"
            />
          </div>
          <button
            type="submit"
            disabled={isDisabled}
            className={`inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg px-5 text-sm font-semibold transition sm:w-auto ${
              !isDisabled
                ? "bg-[var(--accent-gold)] text-[#0d0d0d] hover:opacity-90"
                : "cursor-not-allowed bg-muted text-muted-foreground"
            }`}
          >
            {stage === "loading" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing…
              </>
            ) : (
              "Analyze"
            )}
          </button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Pulls their last 20 uploads · ranks by views vs their baseline · AI analyzes each.
          CTR/retention (YouTube Studio Analytics) requires OAuth — coming soon.
        </p>
      </form>

      {stage === "input" && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card py-16 text-center">
          <BarChart3 className="h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Enter a competitor's YouTube handle above to study their strategy.
          </p>
        </div>
      )}

      {stage === "loading" && (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-accent-amber" />
          <div className="text-sm font-medium">
            Fetching their videos from YouTube + analyzing with AI…
          </div>
          <div className="text-xs text-muted-foreground">This takes ~15–20 seconds</div>
        </div>
      )}

      {stage === "results" && channel && (
        <ResultsView
          channel={channel}
          videos={videos}
          avg={avg}
          med={med}
          expandedId={expandedId}
          onToggle={(id) => setExpandedId((cur) => (cur === id ? null : id))}
        />
      )}
    </div>
  );
}

function ResultsView({
  channel,
  videos,
  avg,
  med,
  expandedId,
  onToggle,
}: {
  channel: Channel;
  videos: Video[];
  avg: number;
  med: number;
  expandedId: string | null;
  onToggle: (id: string) => void;
}) {
  return (
    <div className="space-y-5">
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Channel"
          big={<span className="text-base font-bold leading-tight lg:text-lg">{channel.title}</span>}
          sub={fmtSubs(channel.subscriber_count)}
        />
        <StatCard
          label="Analyzed"
          big={<span className="text-xl font-bold leading-none lg:text-2xl">{videos.length}</span>}
          sub="recent videos"
        />
        <StatCard
          label="Median Views"
          big={
            <span className="text-xl font-bold leading-none lg:text-2xl">{nf.format(Math.round(med))}</span>
          }
          sub="their baseline"
        />
        <StatCard
          label="Average"
          big={
            <span className="text-xl font-bold leading-none lg:text-2xl">{nf.format(Math.round(avg))}</span>
          }
          sub="views / video"
        />
      </div>

      {/* Section label */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          Videos sorted by performance (best → worst)
        </span>
        <span className="text-[11px] text-muted-foreground">Click to expand</span>
      </div>

      {/* Video list */}
      {videos.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          No videos found yet — try again in a moment.
        </div>
      ) : (
        <div className="space-y-2">
          {videos.map((v) => {
            const views = v.view_count ?? 0;
            const pct = avg > 0 ? (views / avg) * 100 : 0;
            const engagement =
              views > 0 ? (((v.like_count ?? 0) + (v.comment_count ?? 0)) / views) * 100 : 0;
            const tier = perfTier(pct);
            const hook = detectPatterns(v.title).hookType;
            const isOpen = expandedId === v.id;
            return (
              <div
                key={v.id}
                className="overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-border/80"
              >
                <button
                  type="button"
                  onClick={() => onToggle(v.id)}
                  className="flex w-full items-start gap-3 p-3 text-left lg:gap-4 lg:p-4"
                >
                  {v.thumbnail_url ? (
                    <img
                      src={v.thumbnail_url}
                      alt=""
                      className="h-10 w-16 shrink-0 rounded-lg object-cover lg:h-[68px] lg:w-[120px]"
                    />
                  ) : (
                    <div className="h-10 w-16 shrink-0 rounded-lg bg-muted lg:h-[68px] lg:w-[120px]" />
                  )}
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="line-clamp-2 text-sm font-medium lg:text-base">{v.title}</div>
                        <div className="mt-1 text-xs text-muted-foreground lg:text-sm">
                          {nf.format(views)} views · {Math.round(pct)}% of channel avg ·{" "}
                          {engagement.toFixed(2)}% engagement · {timeAgo(v.published_at)}
                        </div>
                      </div>
                      {tier.badge && (
                        <span
                          className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${tier.badge.cls}`}
                        >
                          {tier.badge.label}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 lg:gap-3">
                      <span className="rounded-full border border-border bg-muted/40 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                        {hook}
                      </span>
                      <div className="h-1.5 w-full flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(pct, 100)}%`,
                            backgroundColor: tier.color,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="hidden self-center text-muted-foreground sm:block">
                    {isOpen ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </div>
                </button>
                {isOpen && (
                  <div className="flex flex-col gap-2 border-t border-border px-4 py-3 sm:flex-row sm:flex-wrap">
                    <a
                      href={`https://youtube.com/watch?v=${v.video_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted sm:w-auto"
                    >
                      <Play className="h-3.5 w-3.5" />
                      Watch
                    </a>
                    <a
                      href={`https://studio.youtube.com/video/${v.video_id}/edit`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted sm:w-auto"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Open in YouTube Studio
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  big,
  sub,
}: {
  label: string;
  big: React.ReactNode;
  sub: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 lg:p-5">
      <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 line-clamp-2 text-foreground">{big}</div>
      <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}
