import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Search, SlidersHorizontal, X } from "lucide-react";
import {
  getAdminUsers, getAdminUserDetail, suspendUser, unsuspendUser, deleteUserAdmin,
} from "@/lib/admin.functions";
import {
  AdminCard,
  AdminPageTitle,
  AdminChip,
  AdminPager,
  AdminEmpty,
  AdminSortHeader,
  type SortDir,
} from "@/components/admin/ui";

export const Route = createFileRoute("/admin/users")({ component: UsersPage });

type Status = "active" | "suspended" | "admin";
type Flag = "blueprint" | "channel" | "no_channel";
type SortField =
  | "created_at"
  | "email"
  | "full_name"
  | "last_sign_in_at"
  | "scripts"
  | "competitors";

const STATUS_OPTS: { value: Status; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
  { value: "admin", label: "Admin" },
];
const FLAG_OPTS: { value: Flag; label: string }[] = [
  { value: "blueprint", label: "Has blueprint" },
  { value: "channel", label: "Has channel" },
  { value: "no_channel", label: "No channel" },
];

function useDebounced<T>(value: T, ms = 250): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}

function UsersPage() {
  const usersFn = useServerFn(getAdminUsers);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounced(searchInput, 250);
  const [statuses, setStatuses] = useState<Set<Status>>(new Set());
  const [flags, setFlags] = useState<Set<Flag>>(new Set());
  const [showMore, setShowMore] = useState(false);
  const [sortBy, setSortBy] = useState<SortField>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [openUser, setOpenUser] = useState<string | null>(null);

  // Reset page when filters/sort change
  useEffect(() => {
    setPage(1);
  }, [search, statuses, flags, sortBy, sortDir]);

  const statusArr = useMemo(() => Array.from(statuses), [statuses]);
  const flagArr = useMemo(() => Array.from(flags), [flags]);

  const { data, isLoading } = useQuery({
    queryKey: [
      "admin-users",
      page,
      search,
      statusArr.slice().sort().join(","),
      flagArr.slice().sort().join(","),
      sortBy,
      sortDir,
    ],
    queryFn: () =>
      usersFn({
        data: {
          page,
          limit: 20,
          search: search || undefined,
          statuses: statusArr.length ? statusArr : undefined,
          flags: flagArr.length ? flagArr : undefined,
          sortBy,
          sortDir,
        },
      }),
  });

  const rows: any[] = data?.rows ?? [];
  const toggle = <T,>(set: Set<T>, v: T): Set<T> => {
    const n = new Set(set);
    n.has(v) ? n.delete(v) : n.add(v);
    return n;
  };
  const hasFilters =
    !!search || statuses.size > 0 || flags.size > 0 || sortBy !== "created_at" || sortDir !== "desc";

  const clearAll = () => {
    setSearchInput("");
    setStatuses(new Set());
    setFlags(new Set());
    setSortBy("created_at");
    setSortDir("desc");
  };

  const onSort = (field: SortField, dir: SortDir) => {
    setSortBy(field);
    setSortDir(dir);
  };

  return (
    <div className="space-y-5">
      <AdminPageTitle
        title="Users"
        description={
          data
            ? `${data.total.toLocaleString()} match${data.total === 1 ? "" : "es"} · ${rows.length} on this page${data.capped ? " · showing top 5000" : ""}`
            : "Loading users…"
        }
      />

      {/* Toolbar */}
      <div className="rounded-xl border border-[#1a1a1a] bg-[#0d0d0d]">
        <div className="flex flex-wrap items-center gap-3 px-4 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search name or email"
              className="w-72 rounded-md bg-[#0a0a0a] border border-[#1a1a1a] pl-9 pr-3 py-1.5 text-sm placeholder:text-zinc-600 focus:outline-none focus:border-[#2a2a2a]"
            />
          </div>
          <PillGroup
            label="Status"
            options={STATUS_OPTS}
            selected={statuses}
            onToggle={(v) => setStatuses((s) => toggle(s, v))}
          />
          <button
            onClick={() => setShowMore((s) => !s)}
            className={`inline-flex items-center gap-1.5 rounded-md border border-[#1a1a1a] px-3 py-1.5 text-xs transition-colors ${
              showMore || flags.size > 0
                ? "bg-[#1a1a1a] text-amber-300"
                : "bg-[#0a0a0a] text-zinc-400 hover:text-white"
            }`}
          >
            <SlidersHorizontal className="h-3 w-3" />
            More filters{flags.size > 0 ? ` · ${flags.size}` : ""}
          </button>
          {hasFilters && (
            <button
              onClick={clearAll}
              className="ml-auto text-xs text-zinc-500 hover:text-amber-300 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
        {showMore && (
          <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-t border-[#161616]">
            <PillGroup
              label="Flags"
              options={FLAG_OPTS}
              selected={flags}
              onToggle={(v) => setFlags((s) => toggle(s, v))}
            />
          </div>
        )}
      </div>

      <AdminCard padding={false}>
        <table className="w-full text-sm">
          <thead className="bg-[#0a0a0a] text-[10px] uppercase tracking-wider text-zinc-500">
            <tr>
              <AdminSortHeader field="full_name" label="User" sortBy={sortBy} sortDir={sortDir} onSort={onSort} defaultDir="asc" />
              <AdminSortHeader field="email" label="Email" sortBy={sortBy} sortDir={sortDir} onSort={onSort} defaultDir="asc" />
              <AdminSortHeader field="created_at" label="Signed up" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <AdminSortHeader field="last_sign_in_at" label="Last active" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <AdminSortHeader field="competitors" label="Competitors" sortBy={sortBy} sortDir={sortDir} onSort={onSort} align="right" />
              <AdminSortHeader field="scripts" label="Scripts" sortBy={sortBy} sortDir={sortDir} onSort={onSort} align="right" />
              <th className="text-left px-4 py-2.5 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={7} className="px-3 py-10 text-center text-zinc-500">Loading…</td></tr>
            )}
            {!isLoading && rows.length === 0 && (
              <tr><td colSpan={7}><AdminEmpty>No users match these filters.</AdminEmpty></td></tr>
            )}
            {rows.map((u: any) => (
              <tr
                key={u.userId}
                onClick={() => setOpenUser(u.userId)}
                className="border-t border-[#161616] hover:bg-[#111] cursor-pointer transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className="h-7 w-7 rounded-full bg-gradient-to-br from-[#1f1f1f] to-[#141414] flex items-center justify-center text-[11px] font-semibold text-amber-200/90">
                      {(u.fullName || u.email || "?").trim().slice(0, 2).toUpperCase()}
                    </span>
                    <span className="text-zinc-200">{u.fullName || "—"}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-zinc-400">{u.email}</td>
                <td className="px-4 py-3 text-zinc-500 text-xs tabular-nums">{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-zinc-500 text-xs tabular-nums">{u.lastSignInAt ? new Date(u.lastSignInAt).toLocaleDateString() : "—"}</td>
                <td className="px-4 py-3 text-right tabular-nums">{u.competitorCount}</td>
                <td className="px-4 py-3 text-right tabular-nums">{u.scriptCount}</td>
                <td className="px-4 py-3">
                  {u.isAdmin ? (
                    <AdminChip tone="gold">Admin</AdminChip>
                  ) : u.isSuspended ? (
                    <AdminChip tone="danger">Suspended</AdminChip>
                  ) : (
                    <AdminChip tone="success">Active</AdminChip>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <AdminPager page={page} setPage={setPage} total={data?.total ?? 0} limit={20} label="users" />
      </AdminCard>

      {openUser && <UserPanel userId={openUser} onClose={() => setOpenUser(null)} />}
    </div>
  );
}

function PillGroup<T extends string>({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: { value: T; label: string }[];
  selected: Set<T>;
  onToggle: (v: T) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] uppercase tracking-wider text-zinc-600">{label}</span>
      <div className="flex gap-1 p-1 rounded-md bg-[#0a0a0a] border border-[#1a1a1a]">
        {options.map((o) => {
          const active = selected.has(o.value);
          return (
            <button
              key={o.value}
              onClick={() => onToggle(o.value)}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                active
                  ? "bg-[#1a1a1a] text-amber-300"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
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
    <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="absolute right-0 top-0 h-full w-[460px] bg-[#0d0d0d] border-l border-[#1a1a1a] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 px-5 py-4 border-b border-[#1a1a1a] bg-[#0d0d0d] flex items-start justify-between">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-white truncate">{data?.fullName || "User"}</div>
            <div className="text-xs text-zinc-500 truncate">{data?.email}</div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1.5 text-zinc-500 hover:text-white hover:bg-[#1a1a1a]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {!data ? (
          <div className="p-5 text-sm text-zinc-500">Loading…</div>
        ) : (
          <div className="p-5 space-y-5 text-sm">
            {data.isSuspended && (
              <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs">
                <div className="font-medium text-red-300">Suspended</div>
                {data.suspensionReason && <div className="text-red-200/80 mt-1">{data.suspensionReason}</div>}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {[
                ["Signed up", new Date(data.createdAt).toLocaleString()],
                ["Last active", data.lastSignInAt ? new Date(data.lastSignInAt).toLocaleString() : "—"],
                ["Onboarded", data.onboardingCompleted ? "Yes" : "No"],
                ["Scripts", data.scriptCount],
                ["Competitors", data.competitorCount],
                ["Admin", data.isAdmin ? "Yes" : "No"],
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-md bg-[#0a0a0a] border border-[#161616] px-3 py-2">
                  <div className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</div>
                  <div className="text-sm text-zinc-200 mt-0.5">{String(value)}</div>
                </div>
              ))}
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1.5">My channels</div>
              {data.myChannels.length === 0 ? (
                <div className="text-xs text-zinc-600">None</div>
              ) : (
                <ul className="space-y-1">
                  {data.myChannels.map((c: any, i: number) => (
                    <li key={i} className="text-xs text-zinc-300">{c.title}</li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1.5">Recent briefs</div>
              {data.recentBriefs.length === 0 ? (
                <div className="text-xs text-zinc-600">None</div>
              ) : (
                <ul className="space-y-1">
                  {data.recentBriefs.map((b: any) => (
                    <li key={b.id} className="text-xs text-zinc-300">{b.title}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="pt-4 border-t border-[#1a1a1a] space-y-3">
              {data.isSuspended ? (
                <button
                  disabled={busy}
                  onClick={async () => { setBusy(true); await unsuspendFn({ data: { targetUserId: userId } }); await refresh(); setBusy(false); }}
                  className="w-full rounded-md bg-emerald-600 hover:bg-emerald-500 py-2 text-sm font-medium"
                >Unsuspend</button>
              ) : !data.isAdmin && (
                <>
                  {!showSuspend ? (
                    <button
                      onClick={() => setShowSuspend(true)}
                      className="w-full rounded-md bg-amber-600/90 hover:bg-amber-500 py-2 text-sm font-medium"
                    >Suspend…</button>
                  ) : (
                    <div className="space-y-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                      <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Reason for suspension"
                        className="w-full rounded bg-[#0a0a0a] border border-[#1a1a1a] p-2 text-xs"
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <button onClick={() => { setShowSuspend(false); setReason(""); }} className="flex-1 rounded border border-[#1a1a1a] py-2 text-xs hover:bg-[#1a1a1a]">Cancel</button>
                        <button
                          disabled={!reason.trim() || busy}
                          onClick={async () => { setBusy(true); await suspendFn({ data: { targetUserId: userId, reason: reason.trim() } }); await refresh(); setShowSuspend(false); setReason(""); setBusy(false); }}
                          className="flex-1 rounded bg-amber-600 hover:bg-amber-500 py-2 text-xs disabled:opacity-40 font-medium"
                        >Confirm</button>
                      </div>
                    </div>
                  )}
                </>
              )}
              {!data.isAdmin && (
                <div className="rounded-lg border-t-2 border-red-500/40 bg-[#120808] p-3 space-y-2">
                  <div className="text-[10px] uppercase tracking-wider text-red-400 font-semibold">Danger zone</div>
                  <div className="text-xs text-zinc-400">Type the user's email to confirm deletion:</div>
                  <input
                    value={confirmDelete}
                    onChange={(e) => setConfirmDelete(e.target.value)}
                    placeholder={data.email}
                    className="w-full rounded bg-[#0a0a0a] border border-[#1a1a1a] p-2 text-xs"
                  />
                  <button
                    disabled={confirmDelete !== data.email || busy}
                    onClick={async () => { setBusy(true); await deleteFn({ data: { targetUserId: userId } }); await qc.invalidateQueries({ queryKey: ["admin-users"] }); onClose(); }}
                    className="w-full rounded-md bg-red-600 hover:bg-red-500 py-2 text-sm font-medium disabled:opacity-40"
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
