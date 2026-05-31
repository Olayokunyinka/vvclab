import { useEffect, useState, type ReactNode } from "react";
import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import {
  Home,
  Settings,
  LogOut,
  Linkedin,
  RefreshCw,
  Bell,
  Moon,
  BookOpen,
  Clapperboard,
  BarChart3,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  User,
  Shield,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useBrandBlueprint } from "@/hooks/useBrandBlueprint";
import { ThemeToggle } from "@/components/ThemeToggle";
import { checkIsAdmin } from "@/lib/admin.functions";
import { NotificationBell } from "@/components/NotificationBell";

type SubItem = {
  to: string;
  hash?: string;
  label: string;
};

type Module = {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items: SubItem[];
};

const MODULES: Module[] = [
  {
    key: "blueprint",
    label: "My Blueprint",
    icon: BookOpen,
    items: [
      { to: "/brand", label: "Brand Blueprint" },
      { to: "/brand", hash: "export", label: "Export Blueprint" },
    ],
  },
  {
    key: "studio",
    label: "Content Studio",
    icon: Clapperboard,
    items: [
      { to: "/outliers", label: "Outliers" },
      { to: "/briefs", label: "My Briefs" },
      { to: "/competitors", label: "Competitors" },
      { to: "/calendar", label: "Calendar" },
    ],
  },
  {
    key: "linkedin",
    label: "LinkedIn Engine",
    icon: Linkedin,
    items: [{ to: "/linkedin", label: "Generate Posts" }],
  },
  {
    key: "channel",
    label: "My Channel",
    icon: BarChart3,
    items: [
      { to: "/brand", hash: "my-channel", label: "My Channel" },
      { to: "/personalize", label: "Personalize" },
    ],
  },
];

const SIDEBAR_STATE_KEY = "vvclab.sidebarState";

function readSidebarState(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(SIDEBAR_STATE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeSidebarState(state: Record<string, boolean>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SIDEBAR_STATE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

function LogoMark() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="24" height="24" rx="6" fill="#e53e3e" />
      <path d="M9.5 7.5L17 12L9.5 16.5V7.5Z" fill="#ffffff" />
    </svg>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const router = useRouter();
  const { blueprint } = useBrandBlueprint();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const [openModules, setOpenModules] = useState<Record<string, boolean>>({});
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!auth.isAppReady || !auth.userId) return;
    let cancelled = false;
    let inFlight = false;

    const run = async () => {
      if (cancelled || inFlight) return;
      inFlight = true;
      try {
        // getUser() awaits the async session restore from localStorage so the
        // bearer attacher actually has a token to send.
        const { data: userData } = await supabase.auth.getUser();
        if (cancelled || !userData.user) return;

        const { data: sessionData } = await supabase.auth.getSession();
        if (cancelled || !sessionData.session?.access_token) return;

        // Call the server fn directly (not via useServerFn) so we don't
        // depend on a function reference that changes every render and
        // tears this effect down mid-flight.
        const r = await checkIsAdmin();
        if (!cancelled) setIsAdmin(!!r?.isAdmin);
      } catch {
        // Transient (token race, network) — keep previous value; the
        // auth-state listener retries on SIGNED_IN / TOKEN_REFRESHED.
      } finally {
        inFlight = false;
      }
    };

    run();

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (event === "SIGNED_OUT" || !session?.access_token) {
        setIsAdmin(false);
        return;
      }
      run();
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [auth.isAppReady, auth.userId]);



  useEffect(() => {
    const saved = readSidebarState();
    const next: Record<string, boolean> = { ...saved };
    for (const m of MODULES) {
      if (m.items.some((i) => i.to === pathname)) {
        next[m.key] = true;
      } else if (next[m.key] === undefined) {
        next[m.key] = false;
      }
    }
    setOpenModules(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setOpenModules((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const m of MODULES) {
        if (m.items.some((i) => i.to === pathname) && !next[m.key]) {
          next[m.key] = true;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [pathname]);

  function toggleModule(key: string) {
    setOpenModules((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      writeSidebarState(next);
      return next;
    });
  }

  // Lock body scroll + close on Escape while mobile nav is open
  useEffect(() => {
    if (!mobileNavOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileNavOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [mobileNavOpen]);


  async function handleSignOut() {
    await supabase.auth.signOut();
    router.navigate({ to: "/" });
  }

  function handleRefresh() {
    if (typeof window !== "undefined") window.location.reload();
  }

  const firstName =
    (auth.fullName || auth.email || "").split(/\s+/)[0]?.split("@")[0] || "";

  function computeInitials(name: string | null): string {
    if (!name) return "";
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return "";
  }
  const initials = auth.isAppReady ? computeInitials(auth.fullName) : "";

  function Avatar({ size = "h-8 w-8" }: { size?: string }) {
    if (!auth.isAppReady) {
      return (
        <div
          className={`${size} shrink-0 animate-pulse rounded-full bg-[var(--border-card)]`}
          aria-hidden="true"
        />
      );
    }
    if (initials) {
      return (
        <div
          className={`flex ${size} shrink-0 items-center justify-center rounded-full bg-[var(--bg-card)] text-[11px] font-semibold text-[var(--text-primary)]`}
        >
          {initials}
        </div>
      );
    }
    return (
      <div
        className={`flex ${size} shrink-0 items-center justify-center rounded-full bg-[var(--bg-card)]`}
      >
        <User className="h-4 w-4 text-[var(--text-secondary)]" />
      </div>
    );
  }

  const sidebarBody = (
    <SidebarBody
      auth={auth}
      firstName={firstName}
      avatar={<Avatar />}
      blueprint={blueprint}
      openModules={openModules}
      pathname={pathname}
      isAdmin={isAdmin}
      onToggleModule={toggleModule}
      onSignOut={handleSignOut}
      onNavigate={() => setMobileNavOpen(false)}
    />
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-[var(--border-card)] bg-[var(--bg-sidebar)] lg:flex">
        {sidebarBody}
      </aside>

      {/* Mobile top bar */}
      <header className="fixed left-0 right-0 top-0 z-30 flex h-14 items-center justify-between border-b border-[var(--border-card)] bg-[var(--bg-sidebar)] px-4 lg:hidden">
        <button
          type="button"
          aria-label="Open menu"
          onClick={() => setMobileNavOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-md text-[var(--text-primary)] hover:bg-[var(--bg-card)]"
        >
          <Menu className="h-6 w-6" />
        </button>
        <div className="flex items-center gap-2">
          <LogoMark />
          <span className="text-[16px] font-semibold tracking-tight text-[var(--text-primary)]">
            VVCLab
          </span>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle size="small" />
          <IconBtn label="Refresh" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
          </IconBtn>
          <IconBtn label="Notifications">
            <Bell className="h-4 w-4" />
          </IconBtn>
        </div>
      </header>

      {/* Mobile drawer overlay */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileNavOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer panel (always rendered for slide animation) */}
      <aside
        className={`fixed left-0 top-0 z-50 h-full w-[280px] transform border-r border-[var(--border-card)] bg-[var(--bg-sidebar)] transition-transform duration-300 ease-in-out lg:hidden ${
          mobileNavOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!mobileNavOpen}
      >
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setMobileNavOpen(false)}
          className="absolute right-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-card)] hover:text-[var(--text-primary)]"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="flex h-full flex-col">{sidebarBody}</div>
      </aside>

      {/* Desktop top bar */}
      <header className="fixed right-0 top-0 z-20 hidden h-14 border-b border-[var(--border-card)] bg-[var(--bg-page)] lg:block lg:left-60">
        <div className="flex h-full items-center justify-end gap-1 px-6">
          {firstName && (
            <span className="mr-2 text-sm text-[var(--text-secondary)]">
              Hey {firstName}
            </span>
          )}
          <NotificationBell />
          <IconBtn label="Refresh" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
          </IconBtn>
          <ThemeToggle size="small" />
        </div>
      </header>

      <main className="min-h-screen w-full pt-[56px] lg:pl-60 lg:pt-14">
        <div className="px-4 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}

function SidebarBody({
  auth,
  firstName,
  avatar,
  blueprint,
  openModules,
  pathname,
  isAdmin,
  onToggleModule,
  onSignOut,
  onNavigate,
}: {
  auth: ReturnType<typeof useAuth>;
  firstName: string;
  avatar: ReactNode;
  blueprint: ReturnType<typeof useBrandBlueprint>["blueprint"];
  openModules: Record<string, boolean>;
  pathname: string;
  isAdmin: boolean;
  onToggleModule: (key: string) => void;
  onSignOut: () => void;
  onNavigate?: () => void;
}) {
  return (
    <>
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center gap-2">
          <LogoMark />
          <span className="text-[16px] font-bold tracking-tight text-[var(--text-primary)]">
            VVCLab
          </span>
        </div>
        {(auth.fullName || firstName) && (
          <div className="mt-1.5 truncate text-[12px] font-medium text-[var(--text-primary)]">
            {auth.fullName || firstName}
          </div>
        )}
        {blueprint?.youtubeNiche && (
          <div className="truncate text-[11px] text-[var(--text-secondary)]">
            {blueprint.youtubeNiche}
          </div>
        )}
      </div>

      <nav className="flex flex-1 flex-col gap-3 overflow-y-auto px-2 pb-2">
        <Section label="Overview">
          <NavLink to="/today" label="Today" Icon={Home} onNavigate={onNavigate} />
        </Section>

        {MODULES.map((mod) => {
          const open = !!openModules[mod.key];
          const Icon = mod.icon;
          const hasActive = mod.items.some((i) => i.to === pathname);
          return (
            <div key={mod.key} className="flex flex-col">
              <button
                type="button"
                onClick={() => onToggleModule(mod.key)}
                className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] transition-colors hover:text-[var(--text-primary)] ${
                  hasActive
                    ? "text-[var(--text-primary)]"
                    : "text-[var(--text-secondary)]"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="flex-1 text-left">{mod.label}</span>
                {open ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </button>
              {open && (
                <div className="mt-0.5 flex flex-col gap-0.5">
                  {mod.items.map((item) => (
                    <SubNavLink
                      key={`${item.to}#${item.hash || ""}-${item.label}`}
                      to={item.to}
                      hash={item.hash}
                      label={item.label}
                      onNavigate={onNavigate}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="border-t border-[var(--border-card)] p-2">
        <div className="mb-1 flex items-center justify-between rounded-md px-2 py-1 lg:hidden">
          <div className="flex items-center gap-2 text-[13px] text-[var(--text-secondary)]">
            <Moon className="h-3.5 w-3.5" />
            Appearance
          </div>
          <ThemeToggle size="small" />
        </div>
        <Section label="Account">
          {isAdmin && (
            <Link
              to="/admin"
              onClick={onNavigate}
              className="flex items-center gap-2 px-3 py-1.5 text-[11px] text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
            >
              <Shield className="h-3.5 w-3.5" />
              Admin
            </Link>
          )}
          <NavLink to="/settings" label="Settings" Icon={Settings} onNavigate={onNavigate} />
        </Section>
        <div className="mt-2 flex items-center gap-2 rounded-md px-2 py-2">
          {avatar}
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-medium leading-tight text-[var(--text-primary)]">
              {auth.fullName || firstName || auth.email}
            </div>
            <div className="truncate text-[11px] text-[var(--text-secondary)]">
              {auth.email}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onSignOut}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-[13px] text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-card)] hover:text-[var(--text-primary)]"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </div>
    </>
  );
}

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col">
      <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">
        {label}
      </div>
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  );
}

function IconBtn({
  children,
  label,
  onClick,
}: {
  children: ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-card)] hover:text-[var(--text-primary)]"
    >
      {children}
    </button>
  );
}

function NavLink({
  to,
  label,
  Icon,
  onNavigate,
}: {
  to: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  onNavigate?: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onNavigate}
      className="flex items-center gap-2.5 border-l-[3px] border-transparent px-3 py-2 text-[13px] text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-card)] hover:text-[var(--text-primary)]"
      activeProps={{
        className:
          "border-l-[3px] border-accent-red bg-[var(--bg-card)] text-[var(--text-primary)] font-semibold",
      }}
      activeOptions={{ exact: true }}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}

function SubNavLink({
  to,
  hash,
  label,
  onNavigate,
}: {
  to: string;
  hash?: string;
  label: string;
  onNavigate?: () => void;
}) {
  return (
    <Link
      to={to}
      hash={hash}
      onClick={onNavigate}
      className="flex items-center gap-2 border-l-[3px] border-transparent py-1.5 pl-9 pr-3 text-[13px] text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-card)] hover:text-[var(--text-primary)]"
      activeProps={{
        className:
          "border-l-[3px] border-accent-red bg-[var(--bg-card)] text-[var(--text-primary)] font-semibold",
      }}
      activeOptions={{ exact: true, includeHash: false }}
    >
      {label}
    </Link>
  );
}
