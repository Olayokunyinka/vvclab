import { useState } from "react";
import { z } from "zod";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { queryOptions, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Bell,
  FileText,
  BookOpen,
  Users,
  Linkedin,
  TrendingUp,
  Search,
  ChevronLeft,
  ChevronRight,
  Check,
  RotateCcw,
} from "lucide-react";
import {
  listNotifications,
  markNotificationRead,
  markNotificationUnread,
  markAllNotificationsRead,
  type NotificationRow,
} from "@/lib/notifications.functions";

const searchSchema = z.object({
  page: z.number().int().min(1).catch(1).default(1),
  status: z.enum(["all", "unread", "read"]).catch("all").default("all"),
  type: z.string().catch("all").default("all"),
  q: z.string().catch("").default(""),
});

type SearchParams = z.infer<typeof searchSchema>;

const notifListQueryOptions = (s: SearchParams) =>
  queryOptions({
    queryKey: ["notifications", "list", s],
    queryFn: () => listNotifications({ data: s }),
  });

export const Route = createFileRoute("/_authenticated/_onboarded/notifications")({
  validateSearch: (s) => searchSchema.parse(s),
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) =>
    context.queryClient.ensureQueryData(notifListQueryOptions(deps)),
  head: () => ({ meta: [{ title: "Notifications — VVCLab" }] }),
  component: NotificationsPage,
});

const TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All types" },
  { value: "script_generated", label: "Scripts" },
  { value: "blueprint_created", label: "Blueprints" },
  { value: "competitor_added", label: "Competitors" },
  { value: "linkedin_generated", label: "LinkedIn" },
  { value: "outlier_detected", label: "Outliers" },
];

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "";
  const diff = Math.max(0, Date.now() - then);
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(mo / 12)}y ago`;
}

function NotifIcon({ type }: { type: string }) {
  const cls = "h-5 w-5 shrink-0";
  switch (type) {
    case "script_generated":
      return <FileText className={cls} style={{ color: "#c9a84c" }} />;
    case "blueprint_created":
      return <BookOpen className={cls} style={{ color: "#c9a84c" }} />;
    case "competitor_added":
      return <Users className={cls} style={{ color: "#6b8cff" }} />;
    case "linkedin_generated":
      return <Linkedin className={cls} style={{ color: "#0077b5" }} />;
    case "outlier_detected":
      return <TrendingUp className={cls} style={{ color: "#c9a84c" }} />;
    default:
      return <Bell className={cls} style={{ color: "var(--text-secondary)" }} />;
  }
}

function NotificationsPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const queryClient = useQueryClient();
  const { data } = useSuspenseQuery(notifListQueryOptions(search));

  const markRead = useServerFn(markNotificationRead);
  const markUnread = useServerFn(markNotificationUnread);
  const markAll = useServerFn(markAllNotificationsRead);

  const [searchInput, setSearchInput] = useState(search.q);

  const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize));

  function update(patch: Partial<SearchParams>) {
    navigate({
      search: (prev: SearchParams) => {
        const next = { ...prev, ...patch } as SearchParams;
        if (!("page" in patch)) next.page = 1;
        return next;
      },
    });
  }

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  }

  async function onToggleRead(n: NotificationRow) {
    // optimistic
    queryClient.setQueryData(
      notifListQueryOptions(search).queryKey,
      (old: any) =>
        old
          ? {
              ...old,
              notifications: old.notifications.map((r: NotificationRow) =>
                r.id === n.id ? { ...r, read: !r.read } : r,
              ),
              unreadTotal: Math.max(
                0,
                (old.unreadTotal ?? 0) + (n.read ? 1 : -1),
              ),
            }
          : old,
    );
    try {
      if (n.read) await markUnread({ data: { id: n.id } });
      else await markRead({ data: { id: n.id } });
    } catch (e) {
      console.error("toggle read failed", e);
    } finally {
      invalidate();
    }
  }

  async function onMarkAll() {
    try {
      await markAll();
    } catch (e) {
      console.error("mark all failed", e);
    } finally {
      invalidate();
    }
  }

  function onSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    update({ q: searchInput.trim() });
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6 lg:px-10 lg:py-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight lg:text-[28px]">
          Notifications
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {data.total} total · {data.unreadTotal} unread
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
          {(["all", "unread", "read"] as const).map((s) => {
            const active = search.status === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => update({ status: s })}
                className={`rounded-md px-3 py-1.5 text-[13px] font-medium capitalize transition-colors ${
                  active
                    ? "bg-[var(--bg-card)] text-[var(--text-primary)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                {s}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <select
            value={search.type}
            onChange={(e) => update({ type: e.target.value })}
            className="h-9 rounded-md border border-[var(--border-card)] bg-[var(--bg-card)] px-2 text-[13px] text-[var(--text-primary)]"
          >
            {TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          <form onSubmit={onSearchSubmit} className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search…"
              className="h-9 w-56 rounded-md border border-[var(--border-card)] bg-[var(--bg-card)] pl-8 pr-2 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
            />
          </form>

          <button
            type="button"
            onClick={onMarkAll}
            disabled={data.unreadTotal === 0}
            className="rounded-md px-3 py-1.5 text-[13px] font-medium transition-opacity hover:opacity-80 disabled:opacity-40"
            style={{ color: "#c9a84c" }}
          >
            Mark all read
          </button>
        </div>
      </div>

      {/* List */}
      <div className="overflow-hidden rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)]">
        {data.notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Bell className="h-8 w-8" style={{ color: "var(--text-secondary)" }} />
            <div className="mt-3 text-[14px] text-[var(--text-secondary)]">
              No notifications match these filters
            </div>
          </div>
        ) : (
          data.notifications.map((n) => (
            <div
              key={n.id}
              className="group flex items-start gap-3 border-b border-[var(--border-card)] px-4 py-4 last:border-b-0 hover:bg-[var(--bg-page)]"
              style={{
                borderLeft: !n.read
                  ? "3px solid #c9a84c"
                  : "3px solid transparent",
              }}
            >
              <div className="mt-0.5">
                <NotifIcon type={n.type} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-[15px] font-medium text-[var(--text-primary)]">
                    {n.title}
                  </div>
                  <div className="shrink-0 text-[12px] text-[var(--text-secondary)]">
                    {timeAgo(n.createdAt)}
                  </div>
                </div>
                <div className="mt-1 text-[13px] text-[var(--text-secondary)]">
                  {n.body}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onToggleRead(n)}
                className="ml-2 flex shrink-0 items-center gap-1 rounded-md border border-[var(--border-card)] px-2 py-1 text-[12px] text-[var(--text-secondary)] opacity-0 transition-opacity hover:text-[var(--text-primary)] group-hover:opacity-100"
                title={n.read ? "Mark as unread" : "Mark as read"}
              >
                {n.read ? (
                  <>
                    <RotateCcw className="h-3 w-3" />
                    Unread
                  </>
                ) : (
                  <>
                    <Check className="h-3 w-3" />
                    Read
                  </>
                )}
              </button>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {data.total > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-[13px] text-[var(--text-secondary)]">
            Page {search.page} of {totalPages} · {data.total} total
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={search.page <= 1}
              onClick={() => update({ page: search.page - 1 })}
              className="flex items-center gap-1 rounded-md border border-[var(--border-card)] px-3 py-1.5 text-[13px] text-[var(--text-primary)] disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </button>
            <button
              type="button"
              disabled={search.page >= totalPages}
              onClick={() => update({ page: search.page + 1 })}
              className="flex items-center gap-1 rounded-md border border-[var(--border-card)] px-3 py-1.5 text-[13px] text-[var(--text-primary)] disabled:opacity-40"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
