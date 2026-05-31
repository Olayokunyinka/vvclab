import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { authState, type AuthSnapshot } from "@/lib/auth-state";
import { BLUEPRINT_KEY, saveBlueprint } from "@/lib/brandBlueprint";

type AuthContextValue = AuthSnapshot & { isAppReady: boolean };

const AuthContext = createContext<AuthContextValue>({ ...authState.get(), isAppReady: false });

// Move all Supabase auth keys from localStorage to sessionStorage so the
// session only lives for the current tab. Used when "Remember me" is off.
function downgradeSessionToTab() {
  if (typeof window === "undefined") return;
  try {
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && (k.startsWith("sb-") || k.startsWith("supabase.auth."))) {
        keys.push(k);
      }
    }
    for (const k of keys) {
      const v = window.localStorage.getItem(k);
      if (v !== null) {
        window.sessionStorage.setItem(k, v);
        window.localStorage.removeItem(k);
      }
    }
  } catch {
    // ignore
  }
}

async function syncBlueprintFromServer() {
  if (typeof window === "undefined") return;
  // Only fetch when we actually have a usable access token to send. Otherwise
  // the protected server fn 401s and surfaces as an unhandled runtime error.
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session?.access_token) return;
  try {
    const { getMyProfile } = await import("@/lib/profile.functions");
    const profile = await getMyProfile();
    const bp: any = (profile as any)?.brandBlueprint;
    if (bp && typeof bp === "object" && Object.keys(bp).length > 0) {
      const meaningful =
        (typeof bp.name === "string" && bp.name.trim().length > 0) ||
        (Array.isArray(bp.contentPillars) && bp.contentPillars.length > 0) ||
        (typeof bp.brandSummary === "string" && bp.brandSummary.trim().length > 0);
      if (meaningful) {
        saveBlueprint(bp);
        return;
      }
    }
    // Server has no meaningful blueprint — drop any stale cache.
    window.localStorage.removeItem(BLUEPRINT_KEY);
    window.dispatchEvent(new Event("brandBlueprint:changed"));
  } catch {
    // ignore — keep whatever is currently cached
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [snap, setSnap] = useState<AuthSnapshot>(() => authState.get());
  const [isAppReady, setIsAppReady] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    let mounted = true;

    const apply = (session: any) => {
      const next: AuthSnapshot = session?.user
        ? {
            status: "signedIn",
            userId: session.user.id,
            email: session.user.email ?? null,
            fullName:
              session.user.user_metadata?.full_name ||
              session.user.user_metadata?.name ||
              null,
          }
        : { status: "signedOut", userId: null, email: null, fullName: null };
      authState.set(next);
      if (mounted) setSnap(next);
    };

    const markReady = () => {
      if (mounted) setIsAppReady(true);
    };

    let cleanupSub: (() => void) | null = null;

    // Hydrate from existing session FIRST to avoid a signed-out flash on reload.
    // Use getUser() so we await storage hydration AND re-validate the token —
    // a stale/expired session in storage won't trigger a protected-fn 401.
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const { data: sessionData } = await supabase.auth.getSession();
      const session = userData.user ? sessionData.session : null;
      apply(session);

      // If signed in, wait for profile to hydrate before flipping ready.
      if (session?.user) {
        try {
          const { getMyProfile } = await import("@/lib/profile.functions");
          const profile = await getMyProfile();
          const next = authState.get();
          if (profile?.fullName && next.status === "signedIn") {
            const updated: AuthSnapshot = { ...next, fullName: profile.fullName };
            authState.set(updated);
            if (mounted) setSnap(updated);
          }
          const bp: any = (profile as any)?.brandBlueprint;
          if (bp && typeof bp === "object") {
            const meaningful =
              (typeof bp.name === "string" && bp.name.trim().length > 0) ||
              (Array.isArray(bp.contentPillars) && bp.contentPillars.length > 0) ||
              (typeof bp.brandSummary === "string" && bp.brandSummary.trim().length > 0);
            if (meaningful) {
              saveBlueprint(bp);
            } else {
              try {
                window.localStorage.removeItem(BLUEPRINT_KEY);
              } catch {
                /* ignore */
              }
              window.dispatchEvent(new Event("brandBlueprint:changed"));
            }
          }
        } catch {
          // ignore — keep whatever is currently cached
        }
      }
      markReady();

      // Then attach the listener for ongoing changes.
      const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
        const prev = authState.get();
        apply(session);

        const nextUid = session?.user?.id ?? null;

        if (event === "SIGNED_IN" && nextUid) {
          let remember: string | null = null;
          try {
            remember = window.localStorage.getItem("auth.remember");
          } catch {
            remember = null;
          }
          if (remember === "0") {
            downgradeSessionToTab();
          }
          void syncBlueprintFromServer();
        }

        if (event === "SIGNED_OUT") {
          try {
            window.localStorage.removeItem(BLUEPRINT_KEY);
          } catch {
            /* ignore */
          }
          window.dispatchEvent(new Event("brandBlueprint:changed"));
        }

        if (prev.userId !== nextUid) {
          if (nextUid === null) {
            queryClient.clear();
          } else {
            queryClient.invalidateQueries();
          }
          router.invalidate();
        }
      });

      cleanupSub = () => sub.subscription.unsubscribe();
    })().catch(() => {
      markReady();
    });



    return () => {
      mounted = false;
      if (cleanupSub) cleanupSub();
    };
  }, [router, queryClient]);

  return (
    <AuthContext.Provider value={{ ...snap, isAppReady }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
