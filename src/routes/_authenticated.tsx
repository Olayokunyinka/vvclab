import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { getMyProfile } from "@/lib/profile.functions";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ location }) => {
    if (typeof window === "undefined") return;
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      // Avoid recursive ?redirect=/login?redirect=... loops by only passing
      // a redirect when the current location is not itself /login.
      const safe = location.pathname.startsWith("/login")
        ? undefined
        : location.href;
      throw redirect({
        to: "/login",
        search: safe ? { redirect: safe } : {},
      });
    }
    try {
      const profile = await getMyProfile();
      if (profile.isSuspended) {
        throw redirect({ to: "/suspended" });
      }
    } catch (e: any) {
      // Re-throw redirects; ignore other errors so we don't hard-block on transient fetch failures.
      if (e?.isRedirect || e?.to) throw e;
    }
  },
  component: () => <Outlet />,
});
