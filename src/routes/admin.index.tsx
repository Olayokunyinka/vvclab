import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getAdminDashboardStats, getActivityLog } from "@/lib/admin.functions";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";

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

function Stat({ label, value, sub, accent }: { label: string; value: any; sub?: string; accent?: "red" }) {
  return (
    <div className="rounded-lg border border-[#1a1a1a] bg-[#0d0d0d] p-4">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className={`mt-1 text-2xl font-semibold ${accent === "red" ? "text-red-400" : "text-white"}`}>{value}</div>
      {sub && <div className="text-xs text-zinc-500 mt-1">{sub}</div>}
    </div>
  );
}

function AdminDashboard() {
  const statsFn = useServerFn(getAdminDashboardStats);
  const activityFn = useServerFn(getActivityLog);
  const { data: s, isLoading } = useQuery({ queryKey: ["admin-stats"], queryFn: () => statsFn() });
  const { data: act } = useQuery({ queryKey: ["admin-recent-activity"], queryFn: () => activityFn({ data: { page: 1, limit: 10 } }) });

  if (isLoading || !s) return <div className="text-sm text-zinc-400">Loading…</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Total Users" value={s.totalUsers} sub={`+${s.newUsersToday} today`} />
        <Stat label="New This Week" value={s.newUsersThisWeek} />
        <Stat label="Blueprints Generated" value={s.usersWithBlueprint} />
        <Stat label="Channels Connected" value={s.usersWithChannel} />
        <Stat label="Scripts Generated" value={s.totalScriptsGenerated} sub={`${s.scriptsThisMonth} this month`} />
        <Stat label="LinkedIn Posts" value={s.totalLinkedInPosts} />
        <Stat label="Total AI Calls" value={s.totalAiCalls} sub={`${s.aiCallsThisMonth} this month`} />
        <Stat label="Failed AI Calls" value={s.failedCalls} accent={s.failedCalls > 0 ? "red" : undefined} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-lg border border-[#1a1a1a] bg-[#0d0d0d] p-4">
          <div className="text-sm text-zinc-300 mb-3">New signups — last 30 days</div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={s.signupsByDay}>
                <CartesianGrid stroke="#1a1a1a" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#71717a" }} />
                <YAxis tick={{ fontSize: 10, fill: "#71717a" }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "#0d0d0d", border: "1px solid #1a1a1a" }} />
                <Line type="monotone" dataKey="count" stroke="#e53e3e" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-lg border border-[#1a1a1a] bg-[#0d0d0d] p-4">
          <div className="text-sm text-zinc-300 mb-3">AI calls by type — last 7 days</div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={s.aiCallsByDayByType}>
                <CartesianGrid stroke="#1a1a1a" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#71717a" }} />
                <YAxis tick={{ fontSize: 10, fill: "#71717a" }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "#0d0d0d", border: "1px solid #1a1a1a" }} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                {CALL_TYPES.map((t) => (
                  <Bar key={t} dataKey={t} stackId="a" fill={TYPE_COLORS[t]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-lg border border-[#1a1a1a] bg-[#0d0d0d] p-4">
          <div className="text-sm text-zinc-300 mb-3">Most tracked competitor channels</div>
          {s.mostTrackedChannels.length === 0 ? (
            <div className="text-xs text-zinc-500">No competitors tracked yet</div>
          ) : (
            <ul className="space-y-2">
              {s.mostTrackedChannels.map((c: any) => (
                <li key={c.title} className="flex justify-between text-sm">
                  <span className="text-zinc-200">{c.title}</span>
                  <span className="text-zinc-500">{c.count} users</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-lg border border-[#1a1a1a] bg-[#0d0d0d] p-4">
          <div className="text-sm text-zinc-300 mb-3">Recent admin activity</div>
          {!act || act.rows.length === 0 ? (
            <div className="text-xs text-zinc-500">No activity yet</div>
          ) : (
            <table className="w-full text-xs">
              <tbody>
                {act.rows.map((r: any) => (
                  <tr key={r.id} className="border-t border-[#1a1a1a]">
                    <td className="py-2 text-zinc-300">{r.action}</td>
                    <td className="py-2 text-zinc-400">{r.targetEmail || "—"}</td>
                    <td className="py-2 text-zinc-500">{r.adminEmail}</td>
                    <td className="py-2 text-zinc-500 text-right">{new Date(r.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
