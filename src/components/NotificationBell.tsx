import { useEffect, useRef, useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import {
  Bell,
  FileText,
  BookOpen,
  Users,
  Linkedin,
  TrendingUp,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type NotificationRow,
} from "@/lib/notifications.functions";

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
  const cls = "h-4 w-4 shrink-0";
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

export function NotificationBell() {
  const auth = useAuth();
  const fetchAll = useServerFn(getNotifications);
  const markRead = useServerFn(markNotificationRead);
  const markAllRead = useServerFn(markAllNotificationsRead);

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const refresh = useCallback(async () => {
    try {
      const r = await fetchAll();
      setItems(r.notifications);
      setUnread(r.unreadCount);
    } catch (e) {
      console.error("notifications fetch failed", e);
    } finally {
      setLoading(false);
    }
  }, [fetchAll]);

  // Initial fetch + 60s poll
  useEffect(() => {
    if (!auth.isAppReady || !auth.userId) return;
    let cancelled = false;
    setLoading(true);
    refresh();
    const id = window.setInterval(() => {
      if (!cancelled) refresh();
    }, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [auth.isAppReady, auth.userId, refresh]);

  // Realtime inserts for this user
  useEffect(() => {
    if (!auth.isAppReady || !auth.userId) return;
    const userId = auth.userId;
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes" as any,
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload: any) => {
          const r = payload.new;
          const next: NotificationRow = {
            id: r.id,
            type: r.type,
            title: r.title,
            body: r.body,
            metadata: r.metadata ?? {},
            read: !!r.read,
            createdAt: r.created_at,
          };
          setItems((prev) => [next, ...prev].slice(0, 20));
          if (!next.read) setUnread((c) => c + 1);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [auth.isAppReady, auth.userId]);

  // Click outside to close
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  async function onClickItem(n: NotificationRow) {
    if (n.read) return;
    setItems((prev) =>
      prev.map((p) => (p.id === n.id ? { ...p, read: true } : p)),
    );
    setUnread((c) => Math.max(0, c - 1));
    try {
      await markRead({ data: { id: n.id } });
    } catch (e) {
      console.error("mark read failed", e);
    }
  }

  async function onMarkAll() {
    setItems((prev) => prev.map((p) => ({ ...p, read: true })));
    setUnread(0);
    try {
      await markAllRead();
    } catch (e) {
      console.error("mark all failed", e);
    }
  }

  const badge =
    unread > 0 ? (unread > 9 ? "9+" : String(unread)) : null;

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        aria-label="Notifications"
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-card)] hover:text-[var(--text-primary)]"
      >
        <Bell className="h-4 w-4" />
        {badge && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {badge}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[380px] overflow-hidden rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] shadow-xl">
          <div className="flex items-center justify-between border-b border-[var(--border-card)] px-4 py-3">
            <span className="text-[15px] font-semibold text-[var(--text-primary)]">
              Notifications
            </span>
            <button
              type="button"
              onClick={onMarkAll}
              disabled={unread === 0}
              className="text-[13px] font-medium transition-opacity hover:opacity-80 disabled:opacity-40"
              style={{ color: "#c9a84c" }}
            >
              Mark all read
            </button>
          </div>

          <div className="max-h-[480px] overflow-y-auto">
            {loading ? (
              <div className="space-y-2 p-3">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-14 animate-pulse rounded bg-[var(--border-card)]"
                  />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Bell
                  className="h-8 w-8"
                  style={{ color: "var(--text-secondary)" }}
                />
                <div className="mt-3 text-[14px] text-[var(--text-secondary)]">
                  No notifications yet
                </div>
              </div>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => onClickItem(n)}
                  className={`flex w-full cursor-pointer items-start gap-3 border-b border-[var(--border-card)] px-4 py-3 text-left transition-colors hover:bg-[var(--bg-page)] ${
                    !n.read ? "bg-[var(--bg-page)]/40" : ""
                  }`}
                  style={
                    !n.read
                      ? { borderLeft: "3px solid #c9a84c" }
                      : { borderLeft: "3px solid transparent" }
                  }
                >
                  <div className="mt-0.5">
                    <NotifIcon type={n.type} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="truncate text-[14px] font-medium text-[var(--text-primary)]">
                        {n.title}
                      </div>
                      <div className="shrink-0 text-[12px] text-[var(--text-secondary)]">
                        {timeAgo(n.createdAt)}
                      </div>
                    </div>
                    <div className="mt-0.5 line-clamp-2 text-[13px] text-[var(--text-secondary)]">
                      {n.body}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="border-t border-[var(--border-card)] py-3 text-center">
            <Link
              to="/notifications"
              onClick={() => setOpen(false)}
              className="text-[13px] font-medium hover:opacity-80"
              style={{ color: "#c9a84c" }}
            >
              View all
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
