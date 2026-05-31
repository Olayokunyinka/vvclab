import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  getAdminUsers, getAdminUserDetail, suspendUser, unsuspendUser, deleteUserAdmin,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/users")({ component: UsersPage });

type Filter = "all" | "blueprint" | "channel" | "suspended";

function UsersPage() {
  const usersFn = useServerFn(getAdminUsers);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [openUser, setOpenUser] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", page],
    queryFn: () => usersFn({ data: { page, limit: 20 } }),
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.rows.filter((u: any) => {
      if (search && !`${u.fullName} ${u.email}`.toLowerCase().includes(search.toLowerCase())) return false;
      if (filter === "blueprint" && !u.hasBlueprint) return false;
      if (filter === "channel" && !u.hasChannel) return false;
      if (filter === "suspended" && !u.isSuspended) return false;
      return true;
    });
  }, [data, search, filter]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / 20)) : 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email"
          className="w-64 rounded-md border border-[#1a1a1a] bg-[#0d0d0d] px-3 py-2 text-sm"
        />
        <div className="flex gap-1">
          {(["all", "blueprint", "channel", "suspended"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-xs ${
                filter === f ? "bg-[#e53e3e] text-white" : "bg-[#1a1a1a] text-zinc-300 hover:bg-[#222]"
              }`}
            >
              {f === "all" ? "All" : f === "blueprint" ? "Has Blueprint" : f === "channel" ? "Has Channel" : "Suspended"}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-[#1a1a1a] bg-[#0d0d0d] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#111] text-xs text-zinc-500">
            <tr>
              <th className="text-left px-3 py-2">User</th>
              <th className="text-left px-3 py-2">Email</th>
              <th className="text-left px-3 py-2">Signed up</th>
              <th className="text-left px-3 py-2">Last active</th>
              <th className="text-right px-3 py-2">Competitors</th>
              <th className="text-right px-3 py-2">Scripts</th>
              <th className="text-left px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={7} className="px-3 py-6 text-center text-zinc-500">Loading…</td></tr>
            )}
            {filtered.map((u: any) => (
              <tr key={u.userId} onClick={() => setOpenUser(u.userId)} className="border-t border-[#1a1a1a] hover:bg-[#141414] cursor-pointer">
                <td className="px-3 py-2 flex items-center gap-2">
                  <span className="h-7 w-7 rounded-full bg-[#1a1a1a] flex items-center justify-center text-xs">
                    {(u.fullName || u.email || "?").trim().slice(0, 2).toUpperCase()}
                  </span>
                  <span>{u.fullName || "—"}</span>
                </td>
                <td className="px-3 py-2 text-zinc-400">{u.email}</td>
                <td className="px-3 py-2 text-zinc-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className="px-3 py-2 text-zinc-500">{u.lastSignInAt ? new Date(u.lastSignInAt).toLocaleDateString() : "—"}</td>
                <td className="px-3 py-2 text-right">{u.competitorCount}</td>
                <td className="px-3 py-2 text-right">{u.scriptCount}</td>
                <td className="px-3 py-2">
                  {u.isAdmin ? (
                    <span className="px-2 py-0.5 rounded text-xs bg-amber-500/20 text-amber-300">Admin</span>
                  ) : u.isSuspended ? (
                    <span className="px-2 py-0.5 rounded text-xs bg-red-500/20 text-red-300">Suspended</span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-xs bg-emerald-500/20 text-emerald-300">Active</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between text-xs text-zinc-500">
        <span>{data?.total ?? 0} users · page {page} of {totalPages}</span>
        <div className="flex gap-2">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1 rounded border border-[#1a1a1a] disabled:opacity-40">Prev</button>
          <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="px-3 py-1 rounded border border-[#1a1a1a] disabled:opacity-40">Next</button>
        </div>
      </div>

      {openUser && <UserPanel userId={openUser} onClose={() => setOpenUser(null)} />}
    </div>
  );
}

function UserPanel({ userId, onClose }: { userId: string; onClose: () => void }) {
  const qc = useQueryClient();
  const detailFn = useServerFn(getAdminUserDetail);
  const suspendFn = useServerFn(suspendUser);
  const unsuspendFn = useServerFn(unsuspendUser);
  const deleteFn = useServerFn(deleteUserAdmin);
  const { data, refetch } = useQuery({
    queryKey: ["admin-user-detail", userId],
    queryFn: () => detailFn({ data: { userId } }),
  });
  const [reason, setReason] = useState("");
  const [showSuspend, setShowSuspend] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    await refetch();
    await qc.invalidateQueries({ queryKey: ["admin-users"] });
  };

  return (
    <div className="fixed inset-0 z-40 bg-black/60" onClick={onClose}>
      <div className="absolute right-0 top-0 h-full w-[440px] bg-[#0d0d0d] border-l border-[#1a1a1a] overflow-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-[#1a1a1a] flex justify-between">
          <div>
            <div className="text-sm font-semibold">{data?.fullName || "User"}</div>
            <div className="text-xs text-zinc-500">{data?.email}</div>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white">×</button>
        </div>
        {!data ? (
          <div className="p-5 text-sm text-zinc-500">Loading…</div>
        ) : (
          <div className="p-5 space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><span className="text-zinc-500">Signed up:</span> {new Date(data.createdAt).toLocaleString()}</div>
              <div><span className="text-zinc-500">Last active:</span> {data.lastSignInAt ? new Date(data.lastSignInAt).toLocaleString() : "—"}</div>
              <div><span className="text-zinc-500">Onboarded:</span> {data.onboardingCompleted ? "yes" : "no"}</div>
              <div><span className="text-zinc-500">Scripts:</span> {data.scriptCount}</div>
              <div><span className="text-zinc-500">Competitors:</span> {data.competitorCount}</div>
              <div><span className="text-zinc-500">Admin:</span> {data.isAdmin ? "yes" : "no"}</div>
            </div>
            {data.isSuspended && (
              <div className="rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs">
                <div className="font-medium text-red-300">Suspended</div>
                {data.suspensionReason && <div className="text-red-200/80 mt-1">{data.suspensionReason}</div>}
              </div>
            )}
            <div>
              <div className="text-xs text-zinc-500 mb-1">My channels</div>
              {data.myChannels.length === 0 ? <div className="text-xs text-zinc-600">None</div> : data.myChannels.map((c: any, i: number) => (
                <div key={i} className="text-xs">{c.title}</div>
              ))}
            </div>
            <div>
              <div className="text-xs text-zinc-500 mb-1">Recent briefs</div>
              {data.recentBriefs.length === 0 ? <div className="text-xs text-zinc-600">None</div> : data.recentBriefs.map((b: any) => (
                <div key={b.id} className="text-xs">{b.title}</div>
              ))}
            </div>
            <div className="pt-4 border-t border-[#1a1a1a] space-y-2">
              {data.isSuspended ? (
                <button
                  disabled={busy}
                  onClick={async () => { setBusy(true); await unsuspendFn({ data: { targetUserId: userId } }); await refresh(); setBusy(false); }}
                  className="w-full rounded bg-emerald-600 hover:bg-emerald-500 py-2 text-sm"
                >Unsuspend</button>
              ) : !data.isAdmin && (
                <>
                  {!showSuspend ? (
                    <button onClick={() => setShowSuspend(true)} className="w-full rounded bg-amber-600 hover:bg-amber-500 py-2 text-sm">Suspend…</button>
                  ) : (
                    <div className="space-y-2">
                      <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Reason for suspension"
                        className="w-full rounded bg-[#0a0a0a] border border-[#1a1a1a] p-2 text-xs"
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <button onClick={() => { setShowSuspend(false); setReason(""); }} className="flex-1 rounded border border-[#1a1a1a] py-2 text-xs">Cancel</button>
                        <button
                          disabled={!reason.trim() || busy}
                          onClick={async () => { setBusy(true); await suspendFn({ data: { targetUserId: userId, reason: reason.trim() } }); await refresh(); setShowSuspend(false); setReason(""); setBusy(false); }}
                          className="flex-1 rounded bg-amber-600 hover:bg-amber-500 py-2 text-xs disabled:opacity-40"
                        >Confirm suspension</button>
                      </div>
                    </div>
                  )}
                </>
              )}
              {!data.isAdmin && (
                <div className="space-y-2">
                  <div className="text-xs text-zinc-500">Type the user's email to confirm deletion:</div>
                  <input
                    value={confirmDelete}
                    onChange={(e) => setConfirmDelete(e.target.value)}
                    placeholder={data.email}
                    className="w-full rounded bg-[#0a0a0a] border border-[#1a1a1a] p-2 text-xs"
                  />
                  <button
                    disabled={confirmDelete !== data.email || busy}
                    onClick={async () => { setBusy(true); await deleteFn({ data: { targetUserId: userId } }); await qc.invalidateQueries({ queryKey: ["admin-users"] }); onClose(); }}
                    className="w-full rounded bg-red-600 hover:bg-red-500 py-2 text-sm disabled:opacity-40"
                  >Delete account permanently</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
