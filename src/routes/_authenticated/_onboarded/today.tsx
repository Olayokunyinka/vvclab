import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import {
  Flame,
  Sparkles,
  TrendingUp,
  Radio,
  Calendar,
  BookOpen,
  Youtube,
  Linkedin,
  BarChart3,
  CheckCircle2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useBrandBlueprint } from "@/hooks/useBrandBlueprint";
import {
  computeChannelAverages,
  computeMultiplier,
  fmtMultiplier,
  hookPillClasses,
} from "@/lib/outliers";
import { detectPatterns } from "@/lib/patterns";
import { ScriptPanel } from "@/components/ScriptPanel";
import { getMyChannel } from "@/lib/myChannel.functions";

export const Route = createFileRoute("/_authenticated/_onboarded/today")({
  head: () => ({ meta: [{ title: "Today — VVCLab" }] }),
  component: TodayPage,
});

type Video = {
  id: string;
  title: string;
  thumbnail_url: string | null;
  view_count: number;
  channel_uuid: string;
  published_at: string | null;
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
  const hr = Math.floor(diff / 3_600_000);
  if (hr < 1) return "just now";
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

function TodayPage() {
  const auth = useAuth();
  const { blueprint } = useBrandBlueprint();
  const fetchMyChannel = useServerFn(getMyChannel);
  const { data: myChannel } = useQuery({
    queryKey: ["myChannel"],
    queryFn: () => fetchMyChannel(),
    enabled: !!auth.userId,
  });
  const [top, setTop] = useState<{
    video: Video;
    channelTitle: string;
    mult: number;
  } | null>(null);
  const [stats, setStats] = useState({
    channels: 0,
    videosWeek: 0,
    briefs: 0,
    outlierCount: 0,
    bestScore: 0,
    bestChannel: "",
    channelsWithOutliers: 0,
  });
  const [active, setActive] = useState<Video | null>(null);
  const [allChannelAvgs, setAllChannelAvgs] = useState<Record<string, number>>({});

  async function load() {
    const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
    const [comps, videos, briefs] = await Promise.all([
      supabase.from("user_competitors").select("channel_uuid, channels(title)"),
      supabase
        .from("videos")
        .select("id,title,thumbnail_url,view_count,channel_uuid,published_at"),
      supabase.from("briefs").select("id"),
    ]);

    const channelTitle: Record<string, string> = {};
    (comps.data || []).forEach((c: any) => {
      if (c.channels) channelTitle[c.channel_uuid] = c.channels.title;
    });
    const trackedIds = new Set(Object.keys(channelTitle));
    const eligibleVideos = (videos.data || []).filter((v: any) =>
      trackedIds.has(v.channel_uuid),
    );
    const avgs = computeChannelAverages(eligibleVideos as any);
    setAllChannelAvgs(avgs);

    const weekVideos = eligibleVideos.filter(
      (v: any) => v.published_at && v.published_at >= weekAgo,
    );
    const ranked = weekVideos
      .map((v: any) => ({
        v,
        mult: computeMultiplier(v.view_count, avgs[v.channel_uuid] || 0),
      }))
      .sort((a: any, b: any) => b.mult - a.mult);

    const winner = ranked[0];
    setTop(
      winner
        ? {
            video: winner.v,
            channelTitle: channelTitle[winner.v.channel_uuid] || "",
            mult: winner.mult,
          }
        : null,
    );

    const outliers = ranked.filter((r: any) => r.mult >= 3);
    const channelsWithOutliers = new Set(outliers.map((r: any) => r.v.channel_uuid)).size;

    setStats({
      channels: trackedIds.size,
      videosWeek: weekVideos.length,
      briefs: (briefs.data || []).length,
      outlierCount: outliers.length,
      bestScore: winner ? winner.mult : 0,
      bestChannel: winner ? channelTitle[winner.v.channel_uuid] || "" : "",
      channelsWithOutliers,
    });
  }

  useEffect(() => {
    load();
  }, []);

  const firstName = useMemo(
    () => (auth.fullName || auth.email || "").split(/\s+/)[0] || "",
    [auth.fullName, auth.email],
  );

  const today = new Date();
  const dayName = today.toLocaleDateString("en-US", { weekday: "long" });
  const subDate = today.toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  // keep firstName referenced to avoid unused warnings
  void firstName;

  const topPatterns = top ? detectPatterns(top.video.title, top.video.thumbnail_url) : null;

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 lg:px-10 lg:py-10">
      {/* Heading row */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold leading-none tracking-tight text-foreground lg:text-5xl">
            {dayName}
          </h1>
          <p className="mt-3 text-sm text-[var(--text-secondary)] lg:text-base">{subDate}</p>
          <p className="mt-0.5 text-sm text-[var(--text-secondary)] lg:text-base">
            {stats.outlierCount} outlier{stats.outlierCount === 1 ? "" : "s"} across {stats.channelsWithOutliers || stats.channels} channel{stats.channels === 1 ? "" : "s"}
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-green-soft px-2 py-1 text-xs font-medium text-accent-green lg:px-3 lg:py-1.5 lg:text-sm">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent-green" />
          Live data
        </span>
      </div>

      {/* Stat cards */}
      <section className="grid gap-4 grid-cols-2 lg:grid-cols-4">

        <StatCard
          icon={Flame}
          iconClass="text-[var(--accent-gold)]"
          label="Best Score"
          value={stats.bestScore > 0 ? fmtMultiplier(stats.bestScore) : "—"}
          valueClass="text-[var(--accent-gold)]"
          sub={stats.bestChannel || "No outliers yet"}
        />
        <StatCard
          icon={TrendingUp}
          iconClass="text-accent-amber"
          label="Outliers"
          value={stats.outlierCount}
          sub="Last 48-72h"
        />
        <StatCard
          icon={Radio}
          iconClass="text-[#6b8cff]"
          label="Channels"
          value={stats.channels}
          sub="Tracked live"
        />
        <StatCard
          icon={Calendar}
          iconClass="text-[var(--text-secondary)]"
          label="Scheduled"
          value={0}
          sub="On the calendar"
        />
      </section>

      {/* Today's #1 + Upcoming */}
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-text-tertiary">
              <Flame className="h-3.5 w-3.5" />
              <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em]">
                Today's #1 outlier
              </h2>
            </div>
            {stats.outlierCount > 0 && (
              <Link to="/outliers" className="text-xs font-medium text-[var(--accent-gold)] hover:underline">
                See all {stats.outlierCount} →
              </Link>
            )}
          </div>
          {top ? (
            <div className="flex gap-4 rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] p-5">
              <div className="relative h-10 w-16 shrink-0 overflow-hidden rounded bg-secondary lg:h-14 lg:w-24">
                {top.video.thumbnail_url && (
                  <img src={top.video.thumbnail_url} alt="" className="h-full w-full object-cover" />
                )}
                {top.mult > 0 && (
                  <span className="absolute right-1.5 top-1.5 rounded-full bg-accent-amber px-2 py-0.5 text-[11px] font-bold text-white">
                    {fmtMultiplier(top.mult)}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-[var(--text-secondary)]">{top.channelTitle}</span>
                  {topPatterns && (
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${hookPillClasses(topPatterns.hookType)}`}>
                      {topPatterns.hookType}
                    </span>
                  )}
                </div>
                <h3 className="text-[16px] font-bold leading-snug text-foreground">
                  {top.video.title}
                </h3>
                <div className="text-xs text-[var(--text-secondary)]">
                  {fmtN(top.video.view_count)} views · avg {fmtN(allChannelAvgs[top.video.channel_uuid] || 0)} · {timeAgo(top.video.published_at)}
                </div>
                <button
                  type="button"
                  onClick={() => setActive(top.video)}
                  className="mt-1 inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-[var(--border-card)] bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-[var(--bg-card)] lg:w-auto lg:justify-start"

                >
                  <Sparkles className="h-3.5 w-3.5 text-[var(--accent-gold)]" />
                  Generate your version
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] p-10 text-center text-sm text-[var(--text-secondary)]">
              No outlier videos this week — add a competitor on the{" "}
              <Link to="/competitors" className="font-medium text-[var(--accent-gold)] hover:underline">
                Competitors
              </Link>{" "}
              page.
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-text-tertiary">
            Upcoming
          </h2>
          <div className="flex flex-col items-center rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] p-8 text-center">
            <Calendar className="mb-3 h-8 w-8 text-[var(--text-secondary)]" />
            <p className="text-sm text-[var(--text-secondary)]">No scheduled videos yet</p>
            <Link to="/outliers" className="mt-2 inline-block text-xs font-medium text-[var(--accent-gold)] hover:underline">
              Browse outliers →
            </Link>
          </div>
        </section>
      </div>

      {/* Your Modules */}
      <section className="space-y-4">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-text-tertiary">
          Your Modules
        </h2>
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          <ModuleCard
            icon={BookOpen}
            iconClass="text-[var(--accent-gold)]"
            title="Personal Brand Blueprint"
            description="Ikigai framework + AI analysis. Discover your unique positioning, content pillars, and brand voice — built from who you actually are."
            tags={["Ikigai", "Brand Voice", "Content Pillars"]}
            cta="Build My Brand"
            to="/brand"
            badge={
              blueprint ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-surface-green-soft px-2 py-0.5 text-[10px] font-medium text-accent-green">
                  <CheckCircle2 className="h-3 w-3" />
                  Blueprint ready
                </span>
              ) : null
            }
          />
          <ModuleCard
            icon={Youtube}
            iconClass="text-[#e53e3e]"
            title="Content Studio"
            description="Real-time outlier detection across your competitor channels. See why each video went viral and generate your version instantly."
            tags={["Live Data", "Outlier Scores", "Script Generator"]}
            cta="Explore Outliers"
            to="/outliers"
            badge={
              stats.outlierCount > 0 ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-accent-amber/15 px-2 py-0.5 text-[10px] font-medium text-accent-amber">
                  {stats.outlierCount} outliers today
                </span>
              ) : null
            }
          />
          <ModuleCard
            icon={Linkedin}
            iconClass="text-[#0077b5]"
            title="LinkedIn Content Engine"
            description="Paste a YouTube URL. Get 6 posts on 6 different topics — story, framework, data insight, and more. Includes AI image generation."
            tags={["6 Topics", "Image Gen", "Copy Ready"]}
            cta="Generate Posts"
            href="/linkedin"
          />
          <ModuleCard
            icon={BarChart3}
            iconClass="text-[#a78bfa]"
            title="Content Analysis"
            description="Deep dive on your own channel. See what worked, what flopped, and the exact lesson for next time — video by video."
            tags={[]}
            cta="Analyse My Channel"
            to="/brand"
            badge={
              myChannel ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-card)] bg-[var(--bg-page)] px-2 py-0.5 text-[10px] font-medium text-[var(--text-secondary)]">
                  {myChannel.thumbnail_url && (
                    <img
                      src={myChannel.thumbnail_url}
                      alt=""
                      className="h-4 w-4 rounded-full object-cover"
                    />
                  )}
                  <span className="max-w-[120px] truncate">{myChannel.title}</span>
                </span>
              ) : null
            }
          />
        </div>
      </section>


      <ScriptPanel
        videoUuid={active?.id || null}
        videoTitle={active?.title}
        competitorChannel={top?.channelTitle}
        multiplier={
          active ? computeMultiplier(active.view_count, allChannelAvgs[active.channel_uuid] || 0) : undefined
        }
        onClose={() => setActive(null)}
      />
    </div>
  );
}

function StatCard({
  icon: Icon,
  iconClass,
  label,
  value,
  sub,
  valueClass,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  iconClass?: string;
  label: string;
  value: string | number;
  sub?: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] p-4 lg:p-6">
      <div className="flex items-center gap-2">
        {Icon && <Icon className={`h-4 w-4 lg:h-5 lg:w-5 ${iconClass || ""}`} />}
        <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">
          {label}
        </div>
      </div>
      <div className={`mt-3 text-2xl font-bold leading-none lg:text-3xl ${valueClass || "text-foreground"}`}>
        {value}
      </div>
      {sub && <div className="mt-2 truncate text-xs text-[var(--text-secondary)]">{sub}</div>}

    </div>
  );
}

function ModuleCard({
  icon: Icon,
  iconClass,
  title,
  description,
  tags,
  cta,
  to,
  href,
  badge,
}: {
  icon: React.ComponentType<{ className?: string }>;
  iconClass?: string;
  title: string;
  description: string;
  tags: string[];
  cta: string;
  to?: string;
  href?: string;
  badge?: React.ReactNode;
}) {
  const ctaClass =
    "mt-auto inline-flex items-center gap-1 text-sm font-semibold text-[var(--accent-gold)] hover:underline";
  return (
    <div className="relative flex flex-col rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] p-5 lg:p-7">
      {badge && <div className="absolute right-4 top-4">{badge}</div>}
      <div className="flex items-center gap-2">
        <Icon className={`h-5 w-5 ${iconClass || ""}`} />
        <h3 className="text-[16px] font-bold text-foreground">{title}</h3>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)] lg:text-base">

        {description}
      </p>
      {tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <span
              key={t}
              className="rounded-full bg-[var(--bg-page)] px-2 py-0.5 text-[11px] text-[var(--text-secondary)]"
            >
              {t}
            </span>
          ))}
        </div>
      )}
      <div className="mt-5 flex">
        {to ? (
          <Link to={to} className={ctaClass}>
            {cta} →
          </Link>
        ) : (
          <a href={href} className={ctaClass}>
            {cta} →
          </a>
        )}
      </div>
    </div>
  );
}

