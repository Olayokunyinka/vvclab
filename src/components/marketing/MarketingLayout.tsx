import type { ReactNode } from "react";
import { MarketingNavbar } from "./MarketingNavbar";
import { MarketingFooter } from "./MarketingFooter";

export function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="marketing flex min-h-screen flex-col font-sans"
      style={{
        backgroundColor: "var(--m-bg)",
        color: "var(--m-text-primary)",
      }}
    >
      <MarketingNavbar />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  );
}

export default MarketingLayout;
