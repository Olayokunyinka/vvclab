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

  if (!data) return <div className="text-sm text-zinc-400">Loading…</div>;

  const cardColor = (s?: string) =>
    s === "success" || s === "connected"
      ? "border-emerald-500/30 text-emerald-300"
      : s === "rate_limited" || s === "credits_exhausted"
      ? "border-amber-500/30 text-amber-300"
      : s
      ? "border-red-500/30 text-red-300"
      : "border-[#1a1a1a] text-zinc-400";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className={`rounded-lg border ${cardColor(data.aiGateway?.status)} bg-[#0d0d0d] p-4`}>
          <div className="text-xs text-zinc-500">Lovable AI Gateway</div>
          <div className="text-sm mt-1">{data.aiGateway ? data.aiGateway.status : "no calls yet"}</div>
          {data.aiGateway && <div className="text-xs text-zinc-500 mt-1">{new Date(data.aiGateway.at).toLocaleString()}</div>}
        </div>
        <div className={`rounded-lg border ${cardColor(data.youtubeApi?.status)} bg-[#0d0d0d] p-4`}>
          <div className="text-xs text-zinc-500">YouTube Data API (proxy)</div>
          <div className="text-sm mt-1">{data.youtubeApi ? data.youtubeApi.status : "no calls yet"}</div>
          {data.youtubeApi && <div className="text-xs text-zinc-500 mt-1">{new Date(data.youtubeApi.at).toLocaleString()}</div>}
        </div>
        <div className={`rounded-lg border ${cardColor(data.supabase.status)} bg-[#0d0d0d] p-4`}>
          <div className="text-xs text-zinc-500">Supabase</div>
          <div className="text-sm mt-1">{data.supabase.status}</div>
        </div>
      </div>

      <div className="rounded-lg border border-[#1a1a1a] bg-[#0d0d0d] overflow-hidden">
        <div className="px-4 py-2 text-sm text-zinc-300 border-b border-[#1a1a1a]">Call type breakdown</div>
        <table className="w-full text-sm">
          <thead className="bg-[#111] text-xs text-zinc-500">
            <tr>
              <th className="text-left px-3 py-2">Type</th>
              <th className="text-right px-3 py-2">Total</th>
              <th className="text-right px-3 py-2">Success rate</th>
              <th className="text-right px-3 py-2">Avg tokens</th>
              <th className="text-right px-3 py-2">This month</th>
            </tr>
          </thead>
          <tbody>
            {data.breakdown.map((b: any) => (
              <tr key={b.callType} className="border-t border-[#1a1a1a]">
                <td className="px-3 py-2">{b.callType}</td>
                <td className="px-3 py-2 text-right">{b.total}</td>
                <td className="px-3 py-2 text-right">{b.successRate}%</td>
                <td className="px-3 py-2 text-right">{b.avgTokens}</td>
                <td className="px-3 py-2 text-right">{b.thisMonth}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-lg border border-[#1a1a1a] bg-[#0d0d0d] p-4">
        <div className="text-sm text-zinc-300 mb-3">Rate-limit incidents — last 7 days</div>
        {data.incidents.length === 0 ? (
          <div className="text-xs text-zinc-500">No incidents 🎉</div>
        ) : (
          <ul className="space-y-1 text-sm">
            {data.incidents.map((i: any) => (
              <li key={i.date} className="flex justify-between"><span>{i.date}</span><span className="text-zinc-500">{i.count} events</span></li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-lg border border-[#1a1a1a] bg-[#0d0d0d] p-4 space-y-4">
        <div className="text-sm text-zinc-300">Cost intelligence — last 30 days</div>
        {!ci ? (
          <div className="text-xs text-zinc-500">Loading…</div>
        ) : (
          <>
            <div style={{ width: "100%", height: 260 }}>
              <ResponsiveContainer>
                <BarChart data={ci.dailyCost}>
                  <CartesianGrid stroke="#1a1a1a" />
                  <XAxis dataKey="date" stroke="#555" fontSize={10} />
                  <YAxis stroke="#555" fontSize={10} tickFormatter={(v) => `$${Number(v).toFixed(4)}`} />
                  <Tooltip
                    contentStyle={{ background: "#0d0d0d", border: "1px solid #1a1a1a", fontSize: 12 }}
                    formatter={(v: any) => money4(Number(v))}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {ci.callTypes.map((t: string) => (
                    <Bar key={t} dataKey={t} stackId="a" fill={TYPE_COLORS[t] ?? "#888"} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-zinc-500 mb-2">Top 10 most expensive calls</div>
                <table className="w-full text-xs">
                  <thead className="text-zinc-500">
                    <tr>
                      <th className="text-left py-1">User</th>
                      <th className="text-left py-1">Type</th>
                      <th className="text-right py-1">Tokens</th>
                      <th className="text-right py-1">Cost</th>
                      <th className="text-left py-1">When</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ci.topExpensive.map((t: any, i: number) => (
                      <tr key={i} className="border-t border-[#1a1a1a]">
                        <td className="py-1 text-zinc-300">{t.userEmail}</td>
                        <td className="py-1 text-zinc-400">{t.callType}</td>
                        <td className="py-1 text-right">{(t.tokens || 0).toLocaleString()}</td>
                        <td className="py-1 text-right">{money6(t.cost)}</td>
                        <td className="py-1 text-zinc-500">{new Date(t.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="space-y-3">
                <div className="rounded border border-[#1a1a1a] p-3">
                  <div className="text-xs text-zinc-500">Cached token savings</div>
                  <div className="text-lg font-semibold mt-1">{money6(ci.cachedSavings)}</div>
                  <div className="text-xs text-zinc-600 mt-1">
                    {(ci.cachedTokens || 0).toLocaleString()} cached tokens · @ $0.00000075
                  </div>
                </div>
                <div className="rounded border border-[#1a1a1a] p-3">
                  <div className="text-xs text-zinc-500">BYOK confirmation</div>
                  <div className="mt-1 flex gap-4 text-sm">
                    <span className="text-emerald-300">BYOK: {ci.byok.yes}</span>
                    <span className={ci.byok.no > 0 ? "text-red-400 font-semibold" : "text-zinc-400"}>
                      Lovable-paid: {ci.byok.no}
                    </span>
                  </div>
                  {ci.byok.no > 0 && (
                    <div className="text-xs text-red-300 mt-1">
                      ⚠ Some calls were not BYOK — verify your gateway key.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>



      <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4">
        <div className="text-sm text-red-300 font-medium mb-2">Danger zone</div>
        <div className="text-xs text-zinc-400 mb-3">Permanently delete admin activity log entries older than 90 days.</div>
        {!confirming ? (
          <button onClick={() => setConfirming(true)} className="rounded bg-red-600 hover:bg-red-500 px-3 py-1.5 text-sm">Flush activity log &gt; 90 days</button>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => setConfirming(false)} className="rounded border border-[#1a1a1a] px-3 py-1.5 text-sm">Cancel</button>
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
              className="rounded bg-red-600 hover:bg-red-500 px-3 py-1.5 text-sm disabled:opacity-40"
            >Confirm purge</button>
          </div>
        )}
        {msg && <div className="text-xs text-zinc-400 mt-2">{msg}</div>}
      </div>
    </div>
  );
}
