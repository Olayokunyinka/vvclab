import { queryOptions } from "@tanstack/react-query";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { getMyProfile } from "@/lib/profile.functions";
import { AppShell } from "@/components/AppShell";

export const profileQueryOptions = queryOptions({
  queryKey: ["my-profile"],
  queryFn: () => getMyProfile(),
});

export const Route = createFileRoute("/_authenticated/_onboarded")({
  beforeLoad: async ({ context }) => {
    // Skip during SSR — no auth header is available, the server fn would 401.
    if (typeof window === "undefined") return;
    // Make sure the Supabase session is actually hydrated before calling a
    // protected server fn; otherwise the bearer attacher sends no token and
    // the request 401s, surfacing as an unhandled runtime error.
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session?.access_token) return;
    try {
      const profile = await context.queryClient.ensureQueryData(profileQueryOptions);
      if (!profile.onboardingCompleted) {
        throw redirect({ to: "/onboarding" });
      }
    } catch (e: any) {
      if (e?.isRedirect || e?.to) throw e;
      // Swallow transient auth/network errors — _authenticated already gates access.
    }
  },
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
  errorComponent: ({ error }) => (
    <div className="p-8 text-sm text-muted-foreground">
      Couldn't load your account: {error.message}
    </div>
  ),
});
