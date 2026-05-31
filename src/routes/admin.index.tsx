import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getAdminDashboardStats, getActivityLog } from "@/lib/admin.functions";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import {
  AdminCard,
  AdminPageTitle,
  AdminSectionHeader,
  AdminStat,
  AdminLinkButton,
  AdminChip,
  AdminEmpty,
  CHART_AXIS,
  CHART_GRID_STROKE,
  CHART_TOOLTIP_STYLE,
} from "@/components/admin/ui";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

const CALL_TYPES = ["blueprint","channel_analysis","script","linkedin_posts","linkedin_image","pattern_analysis"];
const TYPE_COLORS: Record<string, string> = {
  blueprint: "#e53e3e",
  channel_analysis: "#f59e0b",
  script: "#3b82f6",
  linkedin_posts: "#10b981",
  linkedin_image: "#a855f7",
  pattern_analysis: "#ec4899",
};

function AdminDashboard() {
  const statsFn = useServerFn(getAdminDashboardStats);
  const activityFn = useServerFn(getActivityLog);
  const { data: s, isLoading } = useQuery({ queryKey: ["admin-stats"], queryFn: () => statsFn() });
  const { data: act } = useQuery({ queryKey: ["admin-recent-activity"], queryFn: () => activityFn({ data: { page: 1, limit: 6 } }) });

  if (isLoading || !s) {
    return <div className="text-sm text-zinc-400">Loading dashboard…</div>;
  }

  return (
    <div className="space-y-8">
      <AdminPageTitle
        title="Dashboard"
        description="A quick read on people, product adoption and AI usage."
      />

      {/* Hero KPIs */}
      <section>
        <AdminSectionHeader title="Headline" subtitle="The three numbers that matter most" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <AdminStat
            size="hero"
            label="Total users"
            value={s.totalUsers.toLocaleString()}
            sub={`+${s.newUsersToday} today · +${s.newUsersThisWeek} this week`}
            accent="gold"
          />
          <AdminStat
            size="hero"
            label="AI calls (this month)"
            value={(s.aiCallsThisMonth ?? 0).toLocaleString()}
            sub={`${s.totalAiCalls.toLocaleString()} all time`}
          />
          <AdminStat
            size="hero"
            label="Failed AI calls"
            value={s.failedCalls.toLocaleString()}
            sub={s.failedCalls > 0 ? "needs attention" : "all clear"}
            accent={s.failedCalls > 0 ? "red" : "emerald"}
          />
        </div>
      </section>

      {/* Charts */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <AdminCard>
          <AdminSectionHeader
            title="Signups"
            subtitle="New users — last 30 days"
          />
          <div className="h-60 -mx-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={s.signupsByDay} margin={{ top: 4, right: 6, left: -8, bottom: 0 }}>
                <CartesianGrid stroke={CHART_GRID_STROKE} vertical={false} />
                <XAxis dataKey="date" tick={CHART_AXIS} tickLine={false} axisLine={{ stroke: CHART_GRID_STROKE }} />
                <YAxis tick={CHART_AXIS} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                <Line type="monotone" dataKey="count" stroke="#e53e3e" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </AdminCard>

        <AdminCard>
          <AdminSectionHeader
            title="AI usage by type"
            subtitle="Last 7 days"
          />
          <div className="h-60 -mx-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={s.aiCallsByDayByType} margin={{ top: 4, right: 6, left: -8, bottom: 0 }}>
                <CartesianGrid stroke={CHART_GRID_STROKE} vertical={false} />
                <XAxis dataKey="date" tick={CHART_AXIS} tickLine={false} axisLine={{ stroke: CHART_GRID_STROKE }} />
                <YAxis tick={CHART_AXIS} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: 10 }} iconSize={8} />
                {CALL_TYPES.map((t) => (
                  <Bar key={t} dataKey={t} stackId="a" fill={TYPE_COLORS[t]} radius={[2, 2, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </AdminCard>
      </section>

      {/* Product adoption */}
      <section>
        <AdminSectionHeader
          title="Product adoption"
          subtitle="Cumulative usage across the core tools"
        />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <AdminStat label="Blueprints generated" value={s.usersWithBlueprint.toLocaleString()} />
          <AdminStat label="Channels connected" value={s.usersWithChannel.toLocaleString()} />
          <AdminStat
            label="Scripts generated"
            value={s.totalScriptsGenerated.toLocaleString()}
            sub={`${s.scriptsThisMonth} this month`}
          />
          <AdminStat label="LinkedIn posts" value={s.totalLinkedInPosts.toLocaleString()} />
        </div>
      </section>

      {/* Lists */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <AdminCard>
          <AdminSectionHeader title="Most tracked competitor channels" />
          {s.mostTrackedChannels.length === 0 ? (
            <AdminEmpty>No competitors tracked yet.</AdminEmpty>
          ) : (
            <ul className="space-y-2">
              {s.mostTrackedChannels.slice(0, 6).map((c: any, i: number) => {
                const max = s.mostTrackedChannels[0]?.count || 1;
                const pct = Math.max(6, Math.round((c.count / max) * 100));
                return (
                  <li key={c.title + i} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-200 truncate pr-3">{c.title}</span>
                      <span className="text-zinc-500 tabular-nums shrink-0">
                        {c.count} users
                      </span>
                    </div>
                    <div className="h-1 rounded-full bg-[#161616] overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          background: "linear-gradient(90deg, #e53e3e, #c9a84c)",
                        }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </AdminCard>

        <AdminCard>
          <AdminSectionHeader
            title="Recent admin activity"
            action={<AdminLinkButton to="/admin/activity">View all</AdminLinkButton>}
          />
          {!act || act.rows.length === 0 ? (
            <AdminEmpty>No activity yet.</AdminEmpty>
          ) : (
            <ul className="divide-y divide-[#161616] -mx-1">
              {act.rows.slice(0, 6).map((r: any) => (
                <li key={r.id} className="flex items-center justify-between gap-3 py-2.5 px-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <AdminChip tone="gold">{r.action}</AdminChip>
                    <span className="text-sm text-zinc-300 truncate">
                      {r.targetEmail || "—"}
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-500 shrink-0 tabular-nums">
                    {new Date(r.created_at).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>
      </section>
    </div>
  );
}
