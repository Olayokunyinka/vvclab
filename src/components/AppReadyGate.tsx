import type { ReactNode } from "react";
import { useAuth } from "@/components/AuthProvider";

export function AppReadyGate({ children }: { children: ReactNode }) {
  const { isAppReady } = useAuth();
  if (isAppReady) return <>{children}</>;
  const isDark =
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark");
  const bg = isDark ? "#0d0d0d" : "#ffffff";
  const fg = isDark ? "#ffffff" : "#0d0d0d";
  return (
    <div
      style={{ background: bg, color: fg }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-4"
    >
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
