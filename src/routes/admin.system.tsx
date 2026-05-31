import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  getAdminSystemHealth,
  purgeOldActivity,
  getAdminCostIntelligence,
} from "@/lib/admin.functions";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  AdminCard,
  AdminPageTitle,
  AdminSectionHeader,
  AdminChip,
  AdminStat,
  AdminEmpty,
  CHART_AXIS,
  CHART_GRID_STROKE,
  CHART_TOOLTIP_STYLE,
} from "@/components/admin/ui";

export const Route = createFileRoute("/admin/system")({ component: SystemPage });

const TYPE_COLORS: Record<string, string> = {
  blueprint: "#e53e3e",
  channel_analysis: "#f59e0b",
  script: "#3b82f6",
  pattern_analysis: "#ec4899",
  linkedin_posts: "#10b981",
  linkedin_image: "#a855f7",
  thumbnail_image: "#06b6d4",
};

const money4 = (n: number) => `$${(n || 0).toFixed(4)}`;
const money6 = (n: number) => `$${(n || 0).toFixed(6)}`;

function healthTone(s?: string): "success" | "warn" | "danger" | "neutral" {
  if (s === "success" || s === "connected") return "success";
  if (s === "rate_limited" || s === "credits_exhausted") return "warn";
  if (s) return "danger";
  return "neutral";
}

function SystemPage() {
  const qc = useQueryClient();
  const fn = useServerFn(getAdminSystemHealth);
  const purgeFn = useServerFn(purgeOldActivity);
  const ciFn = useServerFn(getAdminCostIntelligence);
  const { data } = useQuery({ queryKey: ["admin-system"], queryFn: () => fn() });
  const { data: ci } = useQuery({ queryKey: ["admin-cost-intel"], queryFn: () => ciFn() });
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  if (!data) return <div className="text-sm text-zinc-400">Loading system health…</div>;

  return (
    <div className="space-y-8">
      <AdminPageTitle
        title="System"
        description="Environment health, cost intelligence and maintenance actions."
      />

      {/* Health */}
      <section>
        <AdminSectionHeader title="Environment & health" subtitle="Last observed status per integration" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <HealthCard
            label="Lovable AI Gateway"
            status={data.aiGateway?.status}
            at={data.aiGateway?.at}
          />
          <HealthCard
            label="YouTube Data API"
            status={data.youtubeApi?.status}
            at={data.youtubeApi?.at}
          />
          <HealthCard
            label="Supabase"
            status={data.supabase.status}
          />
        </div>
      </section>

      {/* Call type breakdown */}
      <section>
        <AdminSectionHeader title="Call type breakdown" subtitle="All time, with this-month delta" />
        <AdminCard padding={false}>
          <table className="w-full text-sm">
            <thead className="bg-[#0a0a0a] text-[10px] uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium">Type</th>
                <th className="text-right px-4 py-2.5 font-medium">Total</th>
                <th className="text-right px-4 py-2.5 font-medium">Success rate</th>
                <th className="text-right px-4 py-2.5 font-medium">Avg tokens</th>
                <th className="text-right px-4 py-2.5 font-medium">This month</th>
              </tr>
            </thead>
            <tbody>
              {data.breakdown.length === 0 && (
                <tr><td colSpan={5}><AdminEmpty>No calls recorded.</AdminEmpty></td></tr>
              )}
              {data.breakdown.map((b: any) => (
                <tr key={b.callType} className="border-t border-[#161616]">
                  <td className="px-4 py-2.5 text-zinc-200">{b.callType}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{b.total}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">
                    <AdminChip tone={b.successRate >= 95 ? "success" : b.successRate >= 80 ? "warn" : "danger"}>
                      {b.successRate}%
                    </AdminChip>
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-zinc-400">{b.avgTokens}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{b.thisMonth}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </AdminCard>
      </section>

      {/* Incidents */}
      <section>
        <AdminSectionHeader title="Rate-limit incidents" subtitle="Last 7 days" />
        <AdminCard>
          {data.incidents.length === 0 ? (
            <div className="text-xs text-zinc-500">No incidents 🎉</div>
          ) : (
            <ul className="divide-y divide-[#161616] -mx-1">
              {data.incidents.map((i: any) => (
                <li key={i.date} className="flex justify-between py-2 px-1 text-sm">
                  <span className="text-zinc-300 tabular-nums">{i.date}</span>
                  <span className="text-zinc-500">{i.count} events</span>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>
      </section>

      {/* Cost intelligence */}
      <section>
        <AdminSectionHeader title="Cost intelligence" subtitle="Last 30 days" />
        {!ci ? (
          <AdminCard><div className="text-xs text-zinc-500">Loading…</div></AdminCard>
        ) : (
          <div className="space-y-5">
            <AdminCard>
              <div className="h-64 -mx-1">
                <ResponsiveContainer>
                  <BarChart data={ci.dailyCost} margin={{ top: 4, right: 6, left: -4, bottom: 0 }}>
                    <CartesianGrid stroke={CHART_GRID_STROKE} vertical={false} />
                    <XAxis dataKey="date" tick={CHART_AXIS} tickLine={false} axisLine={{ stroke: CHART_GRID_STROKE }} />
                    <YAxis
                      tick={CHART_AXIS}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `$${Number(v).toFixed(2)}`}
                    />
                    <Tooltip
                      contentStyle={CHART_TOOLTIP_STYLE}
                      formatter={(v: any) => money4(Number(v))}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} iconSize={8} />
                    {ci.callTypes.map((t: string) => (
                      <Bar key={t} dataKey={t} stackId="a" fill={TYPE_COLORS[t] ?? "#888"} radius={[2, 2, 0, 0]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </AdminCard>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <AdminCard className="lg:col-span-2" padding={false}>
                <div className="px-5 pt-4">
                  <AdminSectionHeader title="Top 10 most expensive calls" />
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-[#0a0a0a] text-[10px] uppercase tracking-wider text-zinc-500">
                    <tr>
                      <th className="text-left px-4 py-2.5 font-medium">User</th>
                      <th className="text-left px-4 py-2.5 font-medium">Type</th>
                      <th className="text-right px-4 py-2.5 font-medium">Tokens</th>
                      <th className="text-right px-4 py-2.5 font-medium">Cost</th>
                      <th className="text-left px-4 py-2.5 font-medium">When</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ci.topExpensive.map((t: any, i: number) => (
                      <tr key={i} className="border-t border-[#161616]">
                        <td className="px-4 py-2 text-zinc-200">{t.userEmail}</td>
                        <td className="px-4 py-2 text-zinc-400">{t.callType}</td>
                        <td className="px-4 py-2 text-right tabular-nums">{(t.tokens || 0).toLocaleString()}</td>
                        <td className="px-4 py-2 text-right tabular-nums">{money6(t.cost)}</td>
                        <td className="px-4 py-2 text-xs text-zinc-500">{new Date(t.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </AdminCard>

              <div className="space-y-4">
                <AdminStat
                  label="Cached token savings"
                  value={money6(ci.cachedSavings)}
                  sub={`${(ci.cachedTokens || 0).toLocaleString()} cached tokens`}
                  accent="emerald"
                />
                <AdminCard>
                  <div className="text-[10px] uppercase tracking-wider text-zinc-500">BYOK confirmation</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <AdminChip tone="success">BYOK: {ci.byok.yes}</AdminChip>
                    <AdminChip tone={ci.byok.no > 0 ? "danger" : "neutral"}>
                      Lovable-paid: {ci.byok.no}
                    </AdminChip>
                  </div>
                  {ci.byok.no > 0 && (
                    <div className="text-xs text-red-300 mt-2">
                      ⚠ Some calls were not BYOK — verify your gateway key.
                    </div>
                  )}
                </AdminCard>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Danger zone */}
      <section>
        <AdminSectionHeader title="Maintenance" subtitle="Destructive actions — proceed with care" />
        <div className="rounded-xl border border-red-500/30 bg-[#120808] overflow-hidden">
          <div className="h-[2px] bg-red-500/60" />
          <div className="p-5">
            <div className="text-sm text-red-300 font-medium mb-1">Flush activity log</div>
            <div className="text-xs text-zinc-400 mb-4">
              Permanently delete admin activity log entries older than 90 days.
            </div>
            {!confirming ? (
              <button
                onClick={() => setConfirming(true)}
                className="rounded-md bg-red-600 hover:bg-red-500 px-4 py-2 text-sm font-medium"
              >
                Flush activity log &gt; 90 days
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirming(false)}
                  className="rounded-md border border-[#1a1a1a] hover:bg-[#1a1a1a] px-4 py-2 text-sm"
                >
                  Cancel
                </button>
                <button
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    try {
                      const r = await purgeFn();
                      setMsg(`Deleted ${r.deleted} rows`);
                      await qc.invalidateQueries({ queryKey: ["admin-system"] });
                    } finally {
                      setBusy(false);
                      setConfirming(false);
                    }
                  }}
                  className="rounded-md bg-red-600 hover:bg-red-500 px-4 py-2 text-sm font-medium disabled:opacity-40"
                >
                  Confirm purge
                </button>
              </div>
            )}
            {msg && <div className="text-xs text-zinc-400 mt-3">{msg}</div>}
          </div>
        </div>
      </section>
    </div>
  );
}

function HealthCard({
  label,
  status,
  at,
}: {
  label: string;
  status?: string;
  at?: string;
}) {
  const tone = healthTone(status);
  const dot =
    tone === "success" ? "bg-emerald-400"
    : tone === "warn" ? "bg-amber-400"
    : tone === "danger" ? "bg-red-400"
    : "bg-zinc-600";
  return (
    <div className="rounded-xl border border-[#1a1a1a] bg-[#0d0d0d] p-4">
      <div className="flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</div>
        <span className={`h-2 w-2 rounded-full ${dot} ${tone === "success" ? "shadow-[0_0_8px] shadow-emerald-400/60" : ""}`} />
      </div>
      <div className="mt-2 text-sm text-zinc-100">{status || "no calls yet"}</div>
      {at && (
        <div className="text-[11px] text-zinc-500 mt-1 tabular-nums">
          {new Date(at).toLocaleString()}
        </div>
      )}
    </div>
  );
}
