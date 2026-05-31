import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getMyProfile } from "@/lib/profile.functions";

export const Route = createFileRoute("/suspended")({
  head: () => ({ meta: [{ title: "Account suspended — VVCLab" }] }),
  component: SuspendedPage,
});

function SuspendedPage() {
  const navigate = useNavigate();
  const [reason, setReason] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const p = await getMyProfile();
        if (!p.isSuspended) navigate({ to: "/today" });
        setReason(p.suspensionReason ?? null);
      } catch {
        navigate({ to: "/login" });
      }
    })();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-lg border border-[#1a1a1a] bg-[#0d0d0d] p-8">
        <div className="flex items-center gap-2 mb-6">
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
            <rect width="24" height="24" rx="6" fill="#e53e3e" />
            <path d="M9.5 7.5L17 12L9.5 16.5V7.5Z" fill="#ffffff" />
          </svg>
          <span className="text-[16px] font-semibold">VVCLab</span>
        </div>
        <h1 className="text-2xl font-semibold mb-3">Your account has been suspended.</h1>
        {reason && (
          <p className="text-sm text-zinc-400 mb-6">
            <span className="text-zinc-500">Reason:</span> {reason}
          </p>
        )}
        <div className="flex flex-col gap-3">
          <a
            href="mailto:mrolayokun@gmail.com"
            className="rounded-md bg-[#e53e3e] hover:bg-[#c53030] text-white text-sm font-medium py-2 text-center"
          >
            Contact support
          </a>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              navigate({ to: "/" });
            }}
            className="rounded-md border border-[#1a1a1a] text-sm py-2 hover:bg-[#1a1a1a]"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
