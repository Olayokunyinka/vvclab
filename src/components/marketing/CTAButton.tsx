import type { MouseEventHandler, ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AnyLink = Link as any;

const BASE =
  "inline-flex cursor-pointer items-center justify-center rounded-lg px-8 py-3 font-semibold transition-colors";
const STYLE = { backgroundColor: "var(--m-gold)", color: "var(--m-bg)" } as const;
const HOVER_CLASS = "hover:bg-[var(--m-gold)]";

export function CTAButton({
  to,
  href,
  onClick,
  children,
  className,
  type,
}: {
  to?: string;
  href?: string;
  onClick?: MouseEventHandler;
  children: ReactNode;
  className?: string;
  type?: "button" | "submit";
}) {
  const cls = cn(BASE, HOVER_CLASS, className);

  if (to) {
    return (
      <AnyLink to={to} className={cls} style={STYLE}>
        {children}
      </AnyLink>
    );
  }
  if (href) {
    return (
      <a href={href} className={cls} style={STYLE}>
        {children}
      </a>
    );
  }
  return (
    <button type={type ?? "button"} onClick={onClick} className={cls} style={STYLE}>
      {children}
    </button>
  );
}

export default CTAButton;