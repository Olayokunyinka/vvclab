import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getAiCallLog } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/ai-calls")({ component: AiCallsPage });

const TYPES = [
  "",
  "blueprint",
  "channel_analysis",
  "script",
  "pattern_analysis",
  "linkedin_posts",
  "linkedin_image",
  "thumbnail_image",
];
const STATUSES = ["", "success", "rate_limited", "credits_exhausted", "error"];

function statusColor(s: string) {
  if (s === "success") return "text-emerald-300 bg-emerald-500/15";
  if (s === "rate_limited") return "text-amber-300 bg-amber-500/15";
  if (s === "credits_exhausted") return "text-orange-300 bg-orange-500/15";
  return "text-red-300 bg-red-500/15";
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
  const [expanded, setExpanded] = useState<string | null>(null);
  const [planPrice, setPlanPrice] = useState(20);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-ai-calls", page, callType, status, from, to, userEmail, minCost],
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
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Stat label="Calls (month)" value={num(summary?.totalCalls ?? 0)} />
        <Stat label="Upstream cost" value={money4(summary?.totalCost ?? 0)} />
        <Stat label="Total tokens" value={num(summary?.totalTokens ?? 0)} />
        <Stat label="Success rate" value={`${summary?.successRate ?? 0}%`} />
        <Stat label="Avg cost/call" value={money6(summary?.avgCostPerCall ?? 0)} />
        <Stat label="Top cost type" value={summary?.mostExpensiveType ?? "—"} />
      </div>

      <Section title="Cost by call type (this month)">
        <table className="w-full text-sm">
          <thead className="bg-[#111] text-xs text-zinc-500">
            <tr>
              <th className="text-left px-3 py-2">Type</th>
              <th className="text-right px-3 py-2">Calls</th>
              <th className="text-right px-3 py-2">Success %</th>
              <th className="text-right px-3 py-2">Tokens</th>
              <th className="text-right px-3 py-2">Avg tokens</th>
              <th className="text-right px-3 py-2">Cost</th>
              <th className="text-right px-3 py-2">Avg cost</th>
              <th className="text-left px-3 py-2">Last called</th>
            </tr>
          </thead>
          <tbody>
            {(data?.breakdown ?? []).map((b: any) => (
              <tr key={b.callType} className="border-t border-[#1a1a1a]">
                <td className="px-3 py-2 text-zinc-300">{b.callType}</td>
                <td className="px-3 py-2 text-right">{num(b.totalCalls)}</td>
                <td className="px-3 py-2 text-right">{b.successRate}%</td>
                <td className="px-3 py-2 text-right">{num(b.totalTokens)}</td>
                <td className="px-3 py-2 text-right">{num(b.avgTokens)}</td>
                <td className="px-3 py-2 text-right">{money4(b.totalCost)}</td>
                <td className="px-3 py-2 text-right">{money6(b.avgCost)}</td>
                <td className="px-3 py-2 text-xs text-zinc-500">
                  {b.lastCalled ? new Date(b.lastCalled).toLocaleString() : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="Cost by user (this month)">
        <table className="w-full text-sm">
          <thead className="bg-[#111] text-xs text-zinc-500">
            <tr>
              <th className="text-left px-3 py-2">User</th>
              <th className="text-right px-3 py-2">Calls</th>
              <th className="text-right px-3 py-2">Tokens</th>
              <th className="text-right px-3 py-2">Cost</th>
              <th className="text-right px-3 py-2">Scripts</th>
              <th className="text-right px-3 py-2">LinkedIn</th>
              <th className="text-right px-3 py-2">Images</th>
              <th className="text-right px-3 py-2">Avg cost/call</th>
            </tr>
          </thead>
          <tbody>
            {(data?.perUser ?? []).slice(0, 50).map((u: any) => (
              <tr key={u.userId} className="border-t border-[#1a1a1a]">
                <td className="px-3 py-2 text-zinc-300">{u.email}</td>
                <td className="px-3 py-2 text-right">{num(u.totalCalls)}</td>
                <td className="px-3 py-2 text-right">{num(u.totalTokens)}</td>
                <td className="px-3 py-2 text-right">{money4(u.totalCost)}</td>
                <td className="px-3 py-2 text-right">{u.scripts}</td>
                <td className="px-3 py-2 text-right">{u.linkedinPosts}</td>
                <td className="px-3 py-2 text-right">{u.images}</td>
                <td className="px-3 py-2 text-right">{money6(u.avgCostPerSession)}</td>
              </tr>
            ))}
            {!(data?.perUser ?? []).length && (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-xs text-zinc-500">
                  No usage this month yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Section>

      <Section title="Cost projection">
        <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <Mini label="MTD cost" value={money4(projection?.currentMonthCost ?? 0)} />
          <Mini
            label="Projected month"
            value={money4(projection?.projectedMonthlyCost ?? 0)}
            sub={`day ${projection?.daysElapsed ?? 0}/${projection?.daysInMonth ?? 0}`}
          />
          <Mini label="Active users" value={num(projection?.activeUsers ?? 0)} />
          <Mini label="Cost/active user" value={money4(projection?.costPerActiveUser ?? 0)} />
          <label className="flex flex-col gap-1 text-xs col-span-2 md:col-span-1">
            <span className="text-zinc-500">Plan price ($/mo)</span>
            <input
              type="number"
              step="1"
              min={0}
              value={planPrice}
              onChange={(e) => setPlanPrice(Number(e.target.value) || 0)}
              className="rounded bg-[#0d0d0d] border border-[#1a1a1a] px-2 py-1 text-sm"
            />
          </label>
          <Mini
            label="Break-even users"
            value={breakeven ? Math.ceil(breakeven).toLocaleString() : "—"}
            sub={`@ ${money4(projection?.costPerActiveUser ?? 0)}/user`}
          />
          <Mini
            label="Free-plan cost/user/mo"
            value={money4(projection?.costPerActiveUser ?? 0)}
            sub="current observed"
          />
        </div>
      </Section>

      <Section title="Raw call log">
        <div className="flex flex-wrap items-end gap-3 text-xs p-3 border-b border-[#1a1a1a]">
          <Select label="Call type" value={callType} onChange={setCallType} options={TYPES} />
          <Select label="Status" value={status} onChange={setStatus} options={STATUSES} />
          <Input label="User email" value={userEmail} onChange={setUserEmail} placeholder="search…" />
          <Input label="Min cost ($)" type="number" value={minCost} onChange={setMinCost} />
          <Input label="From" type="date" value={from} onChange={setFrom} />
          <Input label="To" type="date" value={to} onChange={setTo} />
        </div>
        <table className="w-full text-sm">
          <thead className="bg-[#111] text-xs text-zinc-500">
            <tr>
              <th className="text-left px-3 py-2">Time</th>
              <th className="text-left px-3 py-2">User</th>
              <th className="text-left px-3 py-2">Type</th>
              <th className="text-left px-3 py-2">Status</th>
              <th className="text-right px-3 py-2">Prompt</th>
              <th className="text-right px-3 py-2">Compl.</th>
              <th className="text-right px-3 py-2">Total</th>
              <th className="text-right px-3 py-2">Cost</th>
              <th className="text-right px-3 py-2">Dur</th>
              <th className="text-left px-3 py-2">Model</th>
              <th className="text-center px-3 py-2">BYOK</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={11} className="px-3 py-6 text-center text-zinc-500">
                  Loading…
                </td>
              </tr>
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
        <Pager page={page} setPage={setPage} total={data?.total ?? 0} limit={25} />
      </Section>
    </div>
  );
}

function CallRow({ r, expanded, onToggle }: { r: any; expanded: boolean; onToggle: () => void }) {
  return (
    <>
      <tr onClick={onToggle} className="border-t border-[#1a1a1a] cursor-pointer hover:bg-[#111]">
        <td className="px-3 py-2 text-xs text-zinc-500">{new Date(r.created_at).toLocaleString()}</td>
        <td className="px-3 py-2 text-zinc-300">{r.userEmail || "—"}</td>
        <td className="px-3 py-2 text-zinc-400">{r.call_type}</td>
        <td className="px-3 py-2">
          <span className={`px-2 py-0.5 rounded text-xs ${statusColor(r.status)}`}>{r.status}</span>
        </td>
        <td className="px-3 py-2 text-right">{num(r.prompt_tokens)}</td>
        <td className="px-3 py-2 text-right">{num(r.completion_tokens)}</td>
        <td className="px-3 py-2 text-right">{num(r.total_tokens || r.tokens_used)}</td>
        <td className="px-3 py-2 text-right">{money6(r.upstream_cost_usd)}</td>
        <td className="px-3 py-2 text-right text-xs text-zinc-500">
          {r.duration_ms ? `${r.duration_ms}ms` : "—"}
        </td>
        <td className="px-3 py-2 text-xs text-zinc-500">{r.model_used || r.model || "—"}</td>
        <td className="px-3 py-2 text-center">{r.is_byok ? "✓" : "—"}</td>
      </tr>
      {expanded && (
        <tr className="bg-[#080808]">
          <td colSpan={11} className="px-4 py-3 text-xs text-zinc-400">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div><span className="text-zinc-500">response_id: </span><span className="font-mono">{r.response_id || "—"}</span></div>
              <div><span className="text-zinc-500">finish_reason: </span>{r.finish_reason || "—"}</div>
              <div><span className="text-zinc-500">cached_tokens: </span>{num(r.cached_tokens)}</div>
              <div><span className="text-zinc-500">reasoning_tokens: </span>{num(r.reasoning_tokens)}</div>
              <div><span className="text-zinc-500">provider: </span>{r.provider || "—"}</div>
              <div><span className="text-zinc-500">prompt cost: </span>{money6(r.upstream_prompt_cost_usd)}</div>
              <div><span className="text-zinc-500">completion cost: </span>{money6(r.upstream_completion_cost_usd)}</div>
            </div>
            {r.error_message && (
              <div className="mt-2 text-red-300 whitespace-pre-wrap">{r.error_message}</div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-[#1a1a1a] bg-[#0d0d0d] overflow-hidden">
      <div className="px-4 py-2 text-sm text-zinc-300 border-b border-[#1a1a1a]">{title}</div>
      {children}
    </div>
  );
}
function Select({ label, value, onChange, options }: any) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-zinc-500">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded bg-[#0d0d0d] border border-[#1a1a1a] px-2 py-1 text-xs"
      >
        {options.map((o: string) => (
          <option key={o} value={o}>
            {o || "All"}
          </option>
        ))}
      </select>
    </label>
  );
}
function Input({ label, value, onChange, type = "text", placeholder }: any) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-zinc-500">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="rounded bg-[#0d0d0d] border border-[#1a1a1a] px-2 py-1 text-xs"
      />
    </label>
  );
}
function Stat({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-lg border border-[#1a1a1a] bg-[#0d0d0d] p-3">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className="text-lg font-semibold mt-1 truncate">{value}</div>
    </div>
  );
}
function Mini({ label, value, sub }: { label: string; value: any; sub?: string }) {
  return (
    <div>
      <div className="text-xs text-zinc-500">{label}</div>
      <div className="text-base font-semibold mt-0.5">{value}</div>
      {sub && <div className="text-xs text-zinc-600">{sub}</div>}
    </div>
  );
}
function Pager({ page, setPage, total, limit }: any) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return (
    <div className="flex justify-between items-center text-xs text-zinc-500 px-3 py-2 border-t border-[#1a1a1a]">
      <span>
        {total} rows · page {page} of {totalPages}
      </span>
      <div className="flex gap-2">
        <button
          disabled={page <= 1}
          onClick={() => setPage(page - 1)}
          className="px-3 py-1 rounded border border-[#1a1a1a] disabled:opacity-40"
        >
          Prev
        </button>
        <button
          disabled={page >= totalPages}
          onClick={() => setPage(page + 1)}
          className="px-3 py-1 rounded border border-[#1a1a1a] disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
