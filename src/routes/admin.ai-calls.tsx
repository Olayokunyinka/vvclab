import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getAiCallLog } from "@/lib/admin.functions";
import {
  AdminCard,
  AdminPageTitle,
  AdminSectionHeader,
  AdminStat,
  AdminChip,
  AdminPager,
  AdminInput,
  AdminSelect,
  AdminEmpty,
  AdminSortHeader,
  type SortDir,
} from "@/components/admin/ui";

type AiSortField =
  | "created_at"
  | "upstream_cost_usd"
  | "total_tokens"
  | "duration_ms"
  | "call_type"
  | "status";

export const Route = createFileRoute("/admin/ai-calls")({ component: AiCallsPage });

const TYPES = [
  { value: "", label: "All types" },
  { value: "blueprint", label: "Blueprint" },
  { value: "channel_analysis", label: "Channel analysis" },
  { value: "script", label: "Script" },
  { value: "pattern_analysis", label: "Pattern analysis" },
  { value: "linkedin_posts", label: "LinkedIn posts" },
  { value: "linkedin_image", label: "LinkedIn image" },
  { value: "thumbnail_image", label: "Thumbnail image" },
];
const STATUSES = [
  { value: "", label: "All statuses" },
  { value: "success", label: "Success" },
  { value: "rate_limited", label: "Rate limited" },
  { value: "credits_exhausted", label: "Credits exhausted" },
  { value: "error", label: "Error" },
];

function statusChip(s: string) {
  if (s === "success") return <AdminChip tone="success">success</AdminChip>;
  if (s === "rate_limited") return <AdminChip tone="warn">rate limited</AdminChip>;
  if (s === "credits_exhausted") return <AdminChip tone="warn">no credits</AdminChip>;
  return <AdminChip tone="danger">{s || "error"}</AdminChip>;
}

const money4 = (n: number) => `$${(n || 0).toFixed(4)}`;
const money6 = (n: number) => `$${(n || 0).toFixed(6)}`;
const num = (n: number) => (n || 0).toLocaleString();

function AiCallsPage() {
  const fn = useServerFn(getAiCallLog);
  const [page, setPage] = useState(1);
  const [callType, setCallType] = useState("");
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [minCost, setMinCost] = useState("");
  const [maxCost, setMaxCost] = useState("");
  const [minTokens, setMinTokens] = useState("");
  const [sortBy, setSortBy] = useState<AiSortField>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [planPrice, setPlanPrice] = useState(20);

  useEffect(() => {
    setPage(1);
  }, [callType, status, from, to, userEmail, minCost, maxCost, minTokens, sortBy, sortDir]);

  const hasFilters =
    !!(callType || status || from || to || userEmail || minCost || maxCost || minTokens) ||
    sortBy !== "created_at" ||
    sortDir !== "desc";

  const clearFilters = () => {
    setCallType("");
    setStatus("");
    setFrom("");
    setTo("");
    setUserEmail("");
    setMinCost("");
    setMaxCost("");
    setMinTokens("");
    setSortBy("created_at");
    setSortDir("desc");
  };

  const onSort = (field: AiSortField, dir: SortDir) => {
    setSortBy(field);
    setSortDir(dir);
  };

  const { data, isLoading } = useQuery({
    queryKey: [
      "admin-ai-calls", page, callType, status, from, to, userEmail,
      minCost, maxCost, minTokens, sortBy, sortDir,
    ],
    queryFn: () =>
      fn({
        data: {
          page,
          limit: 25,
          callType: callType || undefined,
          status: status || undefined,
          from: from || undefined,
          to: to || undefined,
          userEmail: userEmail || undefined,
          minCost: minCost ? Number(minCost) : undefined,
          maxCost: maxCost ? Number(maxCost) : undefined,
          minTokens: minTokens ? Number(minTokens) : undefined,
          sortBy,
          sortDir,
        },
      }),
  });

  const summary = data?.summary;
  const projection = data?.projection;
  const breakeven =
    projection && planPrice > 0 && projection.costPerActiveUser > 0
      ? planPrice / projection.costPerActiveUser
      : 0;

  return (
    <div className="space-y-8">
      <AdminPageTitle
        title="AI Calls"
        description="Usage, cost intelligence and the raw call log."
      />

      {/* Summary KPIs */}
      <section>
        <AdminSectionHeader title="This month" subtitle="Headline AI usage numbers" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <AdminStat label="Calls" value={num(summary?.totalCalls ?? 0)} />
          <AdminStat label="Upstream cost" value={money4(summary?.totalCost ?? 0)} accent="gold" />
          <AdminStat label="Total tokens" value={num(summary?.totalTokens ?? 0)} />
          <AdminStat
            label="Success rate"
            value={`${summary?.successRate ?? 0}%`}
            accent={(summary?.successRate ?? 100) >= 95 ? "emerald" : "red"}
          />
          <AdminStat label="Avg cost / call" value={money6(summary?.avgCostPerCall ?? 0)} />
          <AdminStat label="Top cost type" value={summary?.mostExpensiveType ?? "—"} />
        </div>
      </section>

      {/* Cost by type */}
      <section>
        <AdminSectionHeader title="Cost by call type" subtitle="This month" />
        <AdminCard padding={false}>
          <table className="w-full text-sm">
            <thead className="bg-[#0a0a0a] text-[10px] uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium">Type</th>
                <th className="text-right px-4 py-2.5 font-medium">Calls</th>
                <th className="text-right px-4 py-2.5 font-medium">Success</th>
                <th className="text-right px-4 py-2.5 font-medium">Tokens</th>
                <th className="text-right px-4 py-2.5 font-medium">Avg tokens</th>
                <th className="text-right px-4 py-2.5 font-medium">Cost</th>
                <th className="text-right px-4 py-2.5 font-medium">Avg cost</th>
                <th className="text-left px-4 py-2.5 font-medium">Last called</th>
              </tr>
            </thead>
            <tbody>
              {(data?.breakdown ?? []).length === 0 && (
                <tr><td colSpan={8}><AdminEmpty>No calls yet this month.</AdminEmpty></td></tr>
              )}
              {(data?.breakdown ?? []).map((b: any) => (
                <tr key={b.callType} className="border-t border-[#161616]">
                  <td className="px-4 py-2.5 text-zinc-200">{b.callType}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{num(b.totalCalls)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{b.successRate}%</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{num(b.totalTokens)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-zinc-400">{num(b.avgTokens)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{money4(b.totalCost)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-zinc-400">{money6(b.avgCost)}</td>
                  <td className="px-4 py-2.5 text-xs text-zinc-500">
                    {b.lastCalled ? new Date(b.lastCalled).toLocaleString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </AdminCard>
      </section>

      {/* Cost by user */}
      <section>
        <AdminSectionHeader title="Cost by user" subtitle="Top 50 this month" />
        <AdminCard padding={false}>
          <table className="w-full text-sm">
            <thead className="bg-[#0a0a0a] text-[10px] uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium">User</th>
                <th className="text-right px-4 py-2.5 font-medium">Calls</th>
                <th className="text-right px-4 py-2.5 font-medium">Tokens</th>
                <th className="text-right px-4 py-2.5 font-medium">Cost</th>
                <th className="text-right px-4 py-2.5 font-medium">Scripts</th>
                <th className="text-right px-4 py-2.5 font-medium">LinkedIn</th>
                <th className="text-right px-4 py-2.5 font-medium">Images</th>
                <th className="text-right px-4 py-2.5 font-medium">Avg / call</th>
              </tr>
            </thead>
            <tbody>
              {(data?.perUser ?? []).slice(0, 50).map((u: any) => (
                <tr key={u.userId} className="border-t border-[#161616]">
                  <td className="px-4 py-2.5 text-zinc-200">{u.email}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{num(u.totalCalls)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{num(u.totalTokens)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{money4(u.totalCost)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{u.scripts}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{u.linkedinPosts}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{u.images}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-zinc-400">{money6(u.avgCostPerSession)}</td>
                </tr>
              ))}
              {!(data?.perUser ?? []).length && (
                <tr><td colSpan={8}><AdminEmpty>No usage this month yet.</AdminEmpty></td></tr>
              )}
            </tbody>
          </table>
        </AdminCard>
      </section>

      {/* Projection */}
      <section>
        <AdminSectionHeader title="Cost projection" subtitle="Burn rate and break-even" />
        <AdminCard>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Mini label="MTD cost" value={money4(projection?.currentMonthCost ?? 0)} />
            <Mini
              label="Projected month"
              value={money4(projection?.projectedMonthlyCost ?? 0)}
              sub={`day ${projection?.daysElapsed ?? 0}/${projection?.daysInMonth ?? 0}`}
            />
            <Mini label="Active users" value={num(projection?.activeUsers ?? 0)} />
            <Mini label="Cost / active user" value={money4(projection?.costPerActiveUser ?? 0)} />
            <label className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-wider text-zinc-500">
                Plan price ($/mo)
              </span>
              <input
                type="number"
                step="1"
                min={0}
                value={planPrice}
                onChange={(e) => setPlanPrice(Number(e.target.value) || 0)}
                className="rounded-md bg-[#0a0a0a] border border-[#1a1a1a] px-3 py-1.5 text-sm focus:outline-none focus:border-[#2a2a2a]"
              />
            </label>
            <Mini
              label="Break-even users"
              value={breakeven ? Math.ceil(breakeven).toLocaleString() : "—"}
              sub={`@ ${money4(projection?.costPerActiveUser ?? 0)}/user`}
              accent="gold"
            />
          </div>
        </AdminCard>
      </section>

      {/* Raw log */}
      <section>
        <AdminSectionHeader title="Raw call log" subtitle="Click any row for expanded details" />
        <div className="rounded-xl border border-[#1a1a1a] bg-[#0d0d0d] mb-3">
          <div className="flex flex-wrap items-end gap-3 px-4 py-3">
            <AdminSelect label="Call type" value={callType} onChange={setCallType} options={TYPES} />
            <AdminSelect label="Status" value={status} onChange={setStatus} options={STATUSES} />
            <AdminInput label="User email" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} placeholder="search…" />
          </div>
          <div className="flex flex-wrap items-end gap-3 px-4 py-3 border-t border-[#161616]">
            <AdminInput label="From" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            <AdminInput label="To" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            <AdminInput label="Min cost ($)" type="number" value={minCost} onChange={(e) => setMinCost(e.target.value)} placeholder="0" />
            <AdminInput label="Max cost ($)" type="number" value={maxCost} onChange={(e) => setMaxCost(e.target.value)} placeholder="∞" />
            <AdminInput label="Min tokens" type="number" value={minTokens} onChange={(e) => setMinTokens(e.target.value)} placeholder="0" />
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="ml-auto rounded-md border border-[#1a1a1a] bg-[#0a0a0a] px-3 py-1.5 text-xs text-zinc-400 hover:text-amber-300 transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
        <AdminCard padding={false}>
          <table className="w-full text-sm">
            <thead className="bg-[#0a0a0a] text-[10px] uppercase tracking-wider text-zinc-500">
              <tr>
                <AdminSortHeader field="created_at" label="Time" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
                <th className="text-left px-4 py-2.5 font-medium">User</th>
                <AdminSortHeader field="call_type" label="Type" sortBy={sortBy} sortDir={sortDir} onSort={onSort} defaultDir="asc" />
                <AdminSortHeader field="status" label="Status" sortBy={sortBy} sortDir={sortDir} onSort={onSort} defaultDir="asc" />
                <th className="text-right px-3 py-2.5 font-medium">Prompt</th>
                <th className="text-right px-3 py-2.5 font-medium">Compl.</th>
                <AdminSortHeader field="total_tokens" label="Total" sortBy={sortBy} sortDir={sortDir} onSort={onSort} align="right" />
                <AdminSortHeader field="upstream_cost_usd" label="Cost" sortBy={sortBy} sortDir={sortDir} onSort={onSort} align="right" />
                <AdminSortHeader field="duration_ms" label="Dur" sortBy={sortBy} sortDir={sortDir} onSort={onSort} align="right" />
                <th className="text-left px-4 py-2.5 font-medium">Model</th>
                <th className="text-center px-3 py-2.5 font-medium">BYOK</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={11} className="px-3 py-10 text-center text-zinc-500">Loading…</td></tr>
              )}
              {!isLoading && (data?.rows ?? []).length === 0 && (
                <tr><td colSpan={11}><AdminEmpty>No calls match these filters.</AdminEmpty></td></tr>
              )}
              {(data?.rows ?? []).map((r: any) => (
                <CallRow
                  key={r.id}
                  r={r}
                  expanded={expanded === r.id}
                  onToggle={() => setExpanded(expanded === r.id ? null : r.id)}
                />
              ))}
            </tbody>
          </table>
          <AdminPager page={page} setPage={setPage} total={data?.total ?? 0} limit={25} label="calls" />
        </AdminCard>
      </section>
    </div>
  );
}

function CallRow({ r, expanded, onToggle }: { r: any; expanded: boolean; onToggle: () => void }) {
  return (
    <>
      <tr onClick={onToggle} className="border-t border-[#161616] cursor-pointer hover:bg-[#111] transition-colors">
        <td className="px-4 py-2.5 text-xs text-zinc-500 tabular-nums">{new Date(r.created_at).toLocaleString()}</td>
        <td className="px-4 py-2.5 text-zinc-200">{r.userEmail || "—"}</td>
        <td className="px-4 py-2.5 text-zinc-400">{r.call_type}</td>
        <td className="px-4 py-2.5">{statusChip(r.status)}</td>
        <td className="px-3 py-2.5 text-right tabular-nums text-zinc-400">{num(r.prompt_tokens)}</td>
        <td className="px-3 py-2.5 text-right tabular-nums text-zinc-400">{num(r.completion_tokens)}</td>
        <td className="px-3 py-2.5 text-right tabular-nums">{num(r.total_tokens || r.tokens_used)}</td>
        <td className="px-3 py-2.5 text-right tabular-nums">{money6(r.upstream_cost_usd)}</td>
        <td className="px-3 py-2.5 text-right text-xs text-zinc-500">
          {r.duration_ms ? `${r.duration_ms}ms` : "—"}
        </td>
        <td className="px-4 py-2.5 text-xs text-zinc-500">{r.model_used || r.model || "—"}</td>
        <td className="px-3 py-2.5 text-center text-xs">{r.is_byok ? "✓" : "—"}</td>
      </tr>
      {expanded && (
        <tr className="bg-[#080808]">
          <td colSpan={11} className="px-5 py-4 text-xs text-zinc-400">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                ["response_id", r.response_id || "—"],
                ["finish_reason", r.finish_reason || "—"],
                ["cached_tokens", num(r.cached_tokens)],
                ["reasoning_tokens", num(r.reasoning_tokens)],
                ["provider", r.provider || "—"],
                ["prompt cost", money6(r.upstream_prompt_cost_usd)],
                ["completion cost", money6(r.upstream_completion_cost_usd)],
              ].map(([k, v]) => (
                <div key={k as string}>
                  <span className="text-zinc-600">{k}: </span>
                  <span className="font-mono">{v}</span>
                </div>
              ))}
            </div>
            {r.error_message && (
              <div className="mt-3 rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-red-300 whitespace-pre-wrap">
                {r.error_message}
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

function Mini({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: any;
  sub?: string;
  accent?: "gold";
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</div>
      <div
        className={`text-lg font-semibold mt-1 tabular-nums ${
          accent === "gold" ? "text-amber-300" : "text-white"
        }`}
      >
        {value}
      </div>
      {sub && <div className="text-[11px] text-zinc-600 mt-0.5">{sub}</div>}
    </div>
  );
}
