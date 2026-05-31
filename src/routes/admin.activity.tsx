import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Search } from "lucide-react";
import { getActivityLog } from "@/lib/admin.functions";
import {
  AdminCard,
  AdminChip,
  AdminPageTitle,
  AdminPager,
  AdminEmpty,
} from "@/components/admin/ui";

export const Route = createFileRoute("/admin/activity")({ component: ActivityPage });

function actionTone(a: string): "gold" | "danger" | "warn" | "success" | "neutral" {
  const s = (a || "").toLowerCase();
  if (s.includes("delete") || s.includes("purge")) return "danger";
  if (s.includes("suspend")) return "warn";
  if (s.includes("unsuspend") || s.includes("restore")) return "success";
  if (s.includes("admin")) return "gold";
  return "neutral";
}

function ActivityPage() {
  const fn = useServerFn(getActivityLog);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-activity", page],
    queryFn: () => fn({ data: { page, limit: 25 } }),
  });

  const actions = useMemo(() => {
    const set = new Set<string>();
    (data?.rows ?? []).forEach((r: any) => r.action && set.add(r.action));
    return Array.from(set).sort();
  }, [data]);

  const filtered = useMemo(() => {
    const rows = data?.rows ?? [];
    return rows.filter((r: any) => {
      if (actionFilter && r.action !== actionFilter) return false;
      if (!search) return true;
      const hay = `${r.adminEmail} ${r.targetEmail} ${r.action} ${JSON.stringify(r.details ?? {})}`.toLowerCase();
      return hay.includes(search.toLowerCase());
    });
  }, [data, actionFilter, search]);

  return (
    <div className="space-y-5">
      <AdminPageTitle
        title="Activity Log"
        description={data ? `${data.total.toLocaleString()} total events` : "Loading…"}
      />

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#1a1a1a] bg-[#0d0d0d] px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search admin, target, action or details"
            className="w-80 rounded-md bg-[#0a0a0a] border border-[#1a1a1a] pl-9 pr-3 py-1.5 text-sm placeholder:text-zinc-600 focus:outline-none focus:border-[#2a2a2a]"
          />
        </div>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="rounded-md bg-[#0a0a0a] border border-[#1a1a1a] px-3 py-1.5 text-sm focus:outline-none focus:border-[#2a2a2a]"
        >
          <option value="">All actions</option>
          {actions.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      <AdminCard padding={false}>
        <table className="w-full text-sm">
          <thead className="bg-[#0a0a0a] text-[10px] uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="text-left px-4 py-2.5 font-medium">Action</th>
              <th className="text-left px-4 py-2.5 font-medium">Target</th>
              <th className="text-left px-4 py-2.5 font-medium">Admin</th>
              <th className="text-left px-4 py-2.5 font-medium">Details</th>
              <th className="text-right px-4 py-2.5 font-medium">When</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={5} className="px-3 py-10 text-center text-zinc-500">Loading…</td></tr>
            )}
            {!isLoading && filtered.length === 0 && (
              <tr><td colSpan={5}><AdminEmpty>No activity yet.</AdminEmpty></td></tr>
            )}
            {filtered.map((r: any) => {
              const detailStr = r.details && Object.keys(r.details).length
                ? JSON.stringify(r.details)
                : "—";
              return (
                <tr key={r.id} className="border-t border-[#161616] align-top hover:bg-[#111] transition-colors">
                  <td className="px-4 py-3"><AdminChip tone={actionTone(r.action)}>{r.action}</AdminChip></td>
                  <td className="px-4 py-3 text-zinc-300">{r.targetEmail || "—"}</td>
                  <td className="px-4 py-3 text-zinc-400">{r.adminEmail || "—"}</td>
                  <td className="px-4 py-3 text-xs text-zinc-500 max-w-md">
                    <span className="font-mono break-words line-clamp-2">{detailStr}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-zinc-500 tabular-nums whitespace-nowrap">
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <AdminPager page={page} setPage={setPage} total={data?.total ?? 0} limit={25} label="events" />
      </AdminCard>
    </div>
  );
}
