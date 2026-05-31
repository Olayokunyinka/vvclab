import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import { ThemeToggle } from "@/components/ThemeToggle";

const NAV_LINKS = [
  { label: "Blueprint", href: "/blueprint" },
  { label: "Content Studio", href: "/content-studio" },
  { label: "LinkedIn", href: "/linkedin-engine" },
  { label: "Pricing", href: "/pricing" },
];

export function MarketingNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-50 h-14 w-full"
      style={{ backgroundColor: "var(--m-navbar-bg)", borderBottom: "1px solid var(--m-navbar-border)" }}
    >
      <div className="mx-auto flex h-full max-w-[1200px] items-center justify-between px-6">
        <Logo />

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              to={l.href}
              className="cursor-pointer text-[14px] transition-colors hover:text-[var(--m-text-primary)]"
              style={{ color: "var(--m-text-secondary)" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Desktop right */}
        <div className="hidden items-center gap-5 md:flex">
          <Link
            to="/login"
            className="cursor-pointer text-[14px] transition-colors hover:underline"
            style={{ color: "var(--m-text-secondary)" }}
          >
            Sign in
          </Link>
          <Link
            to="/signup"
            className="rounded-lg px-4 py-2 text-[14px] font-semibold"
            style={{ backgroundColor: "var(--m-gold)", color: "#ffffff" }}
          >
            Get started
          </Link>
          <ThemeToggle size="small" />
        </div>

        {/* Mobile right */}
        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle size="small" />
          <button
            type="button"
            aria-label="Toggle menu"
            onClick={() => setMobileOpen((v) => !v)}
            className="cursor-pointer p-2"
            style={{ color: "var(--m-text-primary)" }}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div
          className="absolute left-0 right-0 top-14 z-40 flex flex-col gap-1 px-6 py-4 md:hidden"
          style={{ backgroundColor: "var(--m-navbar-bg)", borderBottom: "1px solid var(--m-navbar-border)" }}
        >
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              to={l.href}
              onClick={() => setMobileOpen(false)}
              className="rounded-md px-2 py-2 text-[14px] hover:bg-[var(--m-bg-elevated)]"
              style={{ color: "var(--m-text-primary)" }}
            >
              {l.label}
            </Link>
          ))}
          <div className="mt-3 flex items-center gap-3 border-t pt-3" style={{ borderColor: "var(--m-border-subtle)" }}>
            <Link
              to="/login"
              onClick={() => setMobileOpen(false)}
              className="flex-1 rounded-md px-2 py-2 text-[14px]"
              style={{ color: "var(--m-text-secondary)" }}
            >
              Sign in
            </Link>
            <Link
              to="/signup"
              onClick={() => setMobileOpen(false)}
              className="flex-1 rounded-lg px-4 py-2 text-center text-[14px] font-semibold"
              style={{ backgroundColor: "var(--m-gold)", color: "#ffffff" }}
            >
              Get started
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

export default MarketingNavbar;
