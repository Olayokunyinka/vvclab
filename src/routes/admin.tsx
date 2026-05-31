import { createFileRoute, Outlet, Link, useNavigate, useLocation } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import { checkIsAdmin } from "@/lib/admin.functions";
import { useAuth } from "@/components/AuthProvider";


export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — VVCLab" }] }),
  component: AdminLayout,
});

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
    // Wait for AuthProvider to finish hydrating the Supabase session before
    // calling any protected server fn — otherwise the bearer token isn't
    // attached and the call 401s.
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

  const nav = [
    { to: "/admin", label: "Dashboard", exact: true },
    { to: "/admin/users", label: "Users" },
    { to: "/admin/ai-calls", label: "AI Calls" },
    { to: "/admin/activity", label: "Activity Log" },
    { to: "/admin/system", label: "System" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 flex">
      <aside className="w-[220px] shrink-0 bg-[#0d0d0d] border-r border-[#1a1a1a] flex flex-col">
        <div className="px-5 py-5 border-b border-[#1a1a1a]">
          <div className="text-lg font-bold bg-gradient-to-r from-red-500 to-amber-400 bg-clip-text text-transparent">
            VVCLab Admin
          </div>
        </div>
        <nav className="flex-1 px-2 py-3 space-y-1">
          {nav.map((n) => {
            const active = n.exact ? loc.pathname === n.to : loc.pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`block rounded-md px-3 py-2 text-sm ${
                  active
                    ? "bg-[#1a1a1a] text-white"
                    : "text-zinc-400 hover:bg-[#161616] hover:text-white"
                }`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="flex-1 flex flex-col">
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
        <header className="h-12 flex items-center justify-between px-6 border-b border-[#1a1a1a] bg-[#0d0d0d]">
          <div className="text-sm font-medium text-zinc-300">Admin Panel</div>
          <div className="flex items-center gap-4 text-xs text-zinc-400">
            <span>{email}</span>
            <Link to="/today" className="text-zinc-300 hover:text-white">Exit admin</Link>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
