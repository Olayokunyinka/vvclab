import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";

const PRODUCT = [
  { label: "Personal Brand Blueprint", href: "/blueprint" },
  { label: "Content Studio", href: "/content-studio" },
  { label: "LinkedIn Engine", href: "/linkedin-engine" },
  { label: "Content Analysis", href: "/content-analysis" },
];

function ColHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 text-[13px] font-semibold text-white">{children}</div>
  );
}

function FootLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="block cursor-pointer py-1 text-[14px] text-[var(--m-text-secondary)] transition-colors hover:text-white"
    >
      {children}
    </a>
  );
}

export function MarketingFooter() {
  return (
    <footer
      className="px-8 py-16"
      style={{ backgroundColor: "var(--m-footer-bg)", borderTop: "1px solid var(--m-footer-border)" }}
    >

      <div className="mx-auto max-w-[1200px]">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          <div>
            <Logo />
            <p className="mt-4 max-w-[220px] text-[14px]" style={{ color: "var(--m-text-secondary)" }}>
              Beat your competitors on every upload.
            </p>
            <p className="mt-4 text-[13px]" style={{ color: "var(--m-text-tertiary)" }}>
              © 2026 VVCLab
            </p>
          </div>

          <div>
            <ColHeading>Product</ColHeading>
            {PRODUCT.map((p) => (
              <FootLink key={p.href} href={p.href}>
                {p.label}
              </FootLink>
            ))}
          </div>

          <div>
            <ColHeading>Account</ColHeading>
            <Link
              to="/login"
              className="block cursor-pointer py-1 text-[14px] text-[var(--m-text-secondary)] transition-colors hover:text-white"
            >
              Sign in
            </Link>
            <Link
              to="/signup"
              className="block cursor-pointer py-1 text-[14px] text-[var(--m-text-secondary)] transition-colors hover:text-white"
            >
              Get started
            </Link>
            
          </div>

          <div>
            <ColHeading>Legal</ColHeading>
            <Link
              to="/privacy"
              className="block cursor-pointer py-1 text-[14px] text-[var(--m-text-secondary)] transition-colors hover:text-white"
            >
              Privacy Policy
            </Link>
            <Link
              to="/terms"
              className="block cursor-pointer py-1 text-[14px] text-[var(--m-text-secondary)] transition-colors hover:text-white"
            >
              Terms of Service
            </Link>
          </div>
        </div>

        <div
          className="mt-12 pt-6 text-center text-[13px]"
          style={{ borderTop: "1px solid var(--m-border-subtle)", color: "var(--m-text-tertiary)" }}
        >
          Built for YouTube creators who are serious about growth.

        </div>
      </div>
    </footer>
  );
}

export default MarketingFooter;