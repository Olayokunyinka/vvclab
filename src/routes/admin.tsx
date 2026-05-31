import { createFileRoute, Outlet, Link, useNavigate, useLocation } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { X, LayoutDashboard, Users, Sparkles, ScrollText, Cog, LogOut } from "lucide-react";
import { checkIsAdmin } from "@/lib/admin.functions";
import { useAuth } from "@/components/AuthProvider";


export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — VVCLab" }] }),
  component: AdminLayout,
});

type NavItem = { to: string; label: string; exact?: boolean; icon: typeof LayoutDashboard };
type NavGroup = { label: string; items: NavItem[] };

const NAV: NavGroup[] = [
  {
    label: "Overview",
    items: [{ to: "/admin", label: "Dashboard", exact: true, icon: LayoutDashboard }],
  },
  {
    label: "People",
    items: [{ to: "/admin/users", label: "Users", icon: Users }],
  },
  {
    label: "Activity",
    items: [
      { to: "/admin/ai-calls", label: "AI Calls", icon: Sparkles },
      { to: "/admin/activity", label: "Activity Log", icon: ScrollText },
    ],
  },
  {
    label: "Operations",
    items: [{ to: "/admin/system", label: "System", icon: Cog }],
  },
];

function currentTitle(pathname: string): string {
  for (const g of NAV) {
    for (const i of g.items) {
      if (i.exact ? pathname === i.to : pathname.startsWith(i.to)) return i.label;
    }
  }
  return "Admin";
}

function AdminLayout() {
  const navigate = useNavigate();
  const loc = useLocation();
  const auth = useAuth();
  const [state, setState] = useState<"loading" | "ok" | "denied" | "error">("loading");
  const [email, setEmail] = useState<string>("");
  const [showMobileWarning, setShowMobileWarning] = useState(true);
  const [attempt, setAttempt] = useState(0);

  const runCheck = useCallback(() => setAttempt((n) => n + 1), []);

  useEffect(() => {
    if (!auth.isAppReady) return;

    if (!auth.userId) {
      const safe = loc.pathname.startsWith("/login") ? undefined : loc.href;
      navigate({ to: "/login", search: safe ? { redirect: safe } : {} });
      return;
    }

    let cancelled = false;
    setState("loading");
    (async () => {
      try {
        const r = await checkIsAdmin();
        if (cancelled) return;
        if (!r.isAdmin) {
          setState("denied");
          return;
        }
        setEmail(r.email ?? "");
        setState("ok");
      } catch {
        if (!cancelled) setState("error");
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.isAppReady, auth.userId, attempt]);

  if (!auth.isAppReady || state === "loading") {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-4 bg-[#0a0a0a] text-zinc-100">
        <div className="flex items-center gap-2">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect width="24" height="24" rx="6" fill="#e53e3e" />
            <path d="M9.5 7.5L17 12L9.5 16.5V7.5Z" fill="#ffffff" />
          </svg>
          <span className="text-lg font-bold tracking-tight">VVCLab</span>
        </div>
        <div className="h-[2px] w-12 animate-pulse" style={{ background: "#c9a84c" }} />
      </div>
    );
  }

  if (state === "denied" || state === "error") {
    const isError = state === "error";
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-4 bg-[#0a0a0a] text-zinc-100 px-6 text-center">
        <div className="text-lg font-semibold">
          {isError ? "Couldn't verify admin access" : "Admin access required"}
        </div>
        <div className="text-sm text-zinc-400 max-w-md">
          {isError
            ? "Something went wrong while checking your admin permissions. Try again, or head back."
            : "Your account doesn't have admin permissions. If this is unexpected, try again or contact support."}
        </div>
        <div className="flex items-center gap-3 mt-2">
          <button
            onClick={runCheck}
            className="rounded-md bg-[#1a1a1a] hover:bg-[#222] px-4 py-2 text-sm border border-[#2a2a2a]"
          >
            Retry
          </button>
          <Link
            to="/today"
            className="rounded-md px-4 py-2 text-sm text-zinc-400 hover:text-white"
          >
            Back to app
          </Link>
        </div>
      </div>
    );
  }

  const title = currentTitle(loc.pathname);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 flex">
      <aside className="w-[232px] shrink-0 bg-[#0b0b0b] border-r border-[#1a1a1a] flex flex-col">
        <div className="px-5 py-5 border-b border-[#1a1a1a] flex items-center gap-2">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect width="24" height="24" rx="6" fill="#e53e3e" />
            <path d="M9.5 7.5L17 12L9.5 16.5V7.5Z" fill="#ffffff" />
          </svg>
          <div className="text-sm font-bold tracking-tight">
            VVCLab <span className="text-amber-300/80 font-normal">Admin</span>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
          {NAV.map((group) => (
            <div key={group.label}>
              <div className="px-2 pb-1.5 text-[10px] uppercase tracking-[0.16em] text-zinc-600 font-semibold">
                {group.label}
              </div>
              <div className="space-y-0.5">
                {group.items.map((n) => {
                  const active = n.exact ? loc.pathname === n.to : loc.pathname.startsWith(n.to);
                  const Icon = n.icon;
                  return (
                    <Link
                      key={n.to}
                      to={n.to}
                      className={`group relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors ${
                        active
                          ? "bg-[#161616] text-white"
                          : "text-zinc-400 hover:bg-[#121212] hover:text-white"
                      }`}
                    >
                      {active && (
                        <span
                          className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-r"
                          style={{ background: "#c9a84c" }}
                        />
                      )}
                      <Icon className="h-4 w-4 shrink-0 opacity-80" />
                      <span>{n.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="px-3 py-3 border-t border-[#1a1a1a]">
          <Link
            to="/today"
            className="flex items-center gap-2 rounded-md px-2.5 py-2 text-xs text-zinc-500 hover:text-white hover:bg-[#121212]"
          >
            <LogOut className="h-3.5 w-3.5" />
            Exit admin
          </Link>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        {showMobileWarning && (
          <div className="lg:hidden flex items-center justify-between gap-3 bg-amber-500/10 border-b border-amber-500/30 px-4 py-2.5 text-xs text-amber-200">
            <span>This page is best viewed on desktop.</span>
            <button
              onClick={() => setShowMobileWarning(false)}
              aria-label="Dismiss"
              className="rounded p-1 hover:bg-amber-500/20"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
        <header className="h-14 flex items-center justify-between px-7 border-b border-[#1a1a1a] bg-[#0b0b0b]">
          <div className="flex items-center gap-3">
            <span className="text-[11px] uppercase tracking-[0.18em] text-zinc-600">
              Admin
            </span>
            <span className="text-zinc-700">/</span>
            <span className="text-sm font-medium text-zinc-100">{title}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-zinc-400">
            <span className="hidden md:inline text-zinc-500">{email}</span>
            <span className="h-7 w-7 rounded-full bg-[#1a1a1a] flex items-center justify-center text-[11px] font-semibold text-amber-200">
              {(email || "?").slice(0, 1).toUpperCase()}
            </span>
          </div>
        </header>
        <main className="flex-1 px-7 py-7 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
