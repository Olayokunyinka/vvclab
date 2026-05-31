import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getActivityLog } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/activity")({ component: ActivityPage });

function ActivityPage() {
  const fn = useServerFn(getActivityLog);
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-activity", page],
    queryFn: () => fn({ data: { page, limit: 25 } }),
  });
  const totalPages = data ? Math.max(1, Math.ceil(data.total / 25)) : 1;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-[#1a1a1a] bg-[#0d0d0d] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#111] text-xs text-zinc-500">
            <tr>
              <th className="text-left px-3 py-2">Admin</th>
              <th className="text-left px-3 py-2">Action</th>
              <th className="text-left px-3 py-2">Target user</th>
              <th className="text-left px-3 py-2">Details</th>
              <th className="text-left px-3 py-2">Time</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={5} className="px-3 py-6 text-center text-zinc-500">Loading…</td></tr>}
            {(data?.rows ?? []).map((r: any) => (
              <tr key={r.id} className="border-t border-[#1a1a1a] align-top">
                <td className="px-3 py-2 text-zinc-300">{r.adminEmail || "—"}</td>
                <td className="px-3 py-2 text-zinc-300">{r.action}</td>
                <td className="px-3 py-2 text-zinc-400">{r.targetEmail || "—"}</td>
                <td className="px-3 py-2 text-xs text-zinc-500"><pre className="whitespace-pre-wrap">{JSON.stringify(r.details ?? {}, null, 0)}</pre></td>
                <td className="px-3 py-2 text-zinc-500 text-xs">{new Date(r.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-between text-xs text-zinc-500">
        <span>{data?.total ?? 0} rows · page {page} of {totalPages}</span>
        <div className="flex gap-2">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1 rounded border border-[#1a1a1a] disabled:opacity-40">Prev</button>
          <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="px-3 py-1 rounded border border-[#1a1a1a] disabled:opacity-40">Next</button>
        </div>
      </div>
    </div>
  );
}
