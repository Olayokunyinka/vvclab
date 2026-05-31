import { Link } from "@tanstack/react-router";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import type { ReactNode } from "react";

/* ---------- Card ---------- */
export function AdminCard({
  children,
  className = "",
  padding = true,
}: {
  children: ReactNode;
  className?: string;
  padding?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border border-[#1a1a1a] bg-[#0d0d0d] ${
        padding ? "p-5" : "overflow-hidden"
      } ${className}`}
    >
      {children}
    </div>
  );
}

/* ---------- Section header ---------- */
export function AdminSectionHeader({
  title,
  subtitle,
  action,
  className = "",
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-end justify-between gap-4 mb-3 ${className}`}>
      <div>
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-zinc-200">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs text-zinc-500 mt-0.5">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/* ---------- Stat ---------- */
export function AdminStat({
  label,
  value,
  sub,
  accent,
  size = "compact",
}: {
  label: string;
  value: ReactNode;
  sub?: string;
  accent?: "red" | "gold" | "emerald";
  size?: "hero" | "compact";
}) {
  const accentText =
    accent === "red"
      ? "text-red-400"
      : accent === "gold"
      ? "text-amber-300"
      : accent === "emerald"
      ? "text-emerald-300"
      : "text-white";
  const accentBar =
    accent === "red"
      ? "bg-red-500/70"
      : accent === "gold"
      ? "bg-amber-400/70"
      : accent === "emerald"
      ? "bg-emerald-400/70"
      : "bg-zinc-700";

  if (size === "hero") {
    return (
      <div className="relative rounded-xl border border-[#1a1a1a] bg-[#0d0d0d] p-5 overflow-hidden">
        <div className={`absolute left-0 top-0 h-full w-[2px] ${accentBar}`} />
        <div className="text-[11px] uppercase tracking-wider text-zinc-500">
          {label}
        </div>
        <div className={`mt-2 text-3xl font-semibold tabular-nums ${accentText}`}>
          {value}
        </div>
        {sub && <div className="text-xs text-zinc-500 mt-1">{sub}</div>}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[#1a1a1a] bg-[#0d0d0d] px-4 py-3">
      <div className="text-[11px] uppercase tracking-wider text-zinc-500">
        {label}
      </div>
      <div className={`mt-1.5 text-xl font-semibold tabular-nums ${accentText}`}>
        {value}
      </div>
      {sub && <div className="text-[11px] text-zinc-500 mt-0.5">{sub}</div>}
    </div>
  );
}

/* ---------- Toolbar ---------- */
export function AdminToolbar({
  children,
  right,
}: {
  children: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#1a1a1a] bg-[#0d0d0d] px-4 py-3">
      <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
        {children}
      </div>
      {right && <div className="flex items-center gap-2">{right}</div>}
    </div>
  );
}

/* ---------- Chip ---------- */
export function AdminChip({
  children,
  tone = "neutral",
  color,
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warn" | "danger" | "info" | "gold";
  color?: string;
}) {
  if (color) {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium"
        style={{
          color,
          background: `color-mix(in oklab, ${color} 14%, transparent)`,
        }}
      >
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: color }}
        />
        {children}
      </span>
    );
  }
  const styles: Record<string, string> = {
    neutral: "bg-zinc-500/15 text-zinc-300",
    success: "bg-emerald-500/15 text-emerald-300",
    warn: "bg-amber-500/15 text-amber-300",
    danger: "bg-red-500/15 text-red-300",
    info: "bg-sky-500/15 text-sky-300",
    gold: "bg-amber-400/15 text-amber-200",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${styles[tone]}`}
    >
      {children}
    </span>
  );
}

/* ---------- Page title ---------- */
export function AdminPageTitle({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-white">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-zinc-500 mt-1">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

/* ---------- Chart styling constants ---------- */
export const CHART_AXIS = { fontSize: 10, fill: "#71717a" } as const;
export const CHART_GRID_STROKE = "#1a1a1a";
export const CHART_TOOLTIP_STYLE = {
  background: "#0d0d0d",
  border: "1px solid #1a1a1a",
  borderRadius: 8,
  fontSize: 12,
} as const;

/* ---------- Form inputs ---------- */
export function AdminInput(
  props: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }
) {
  const { label, className = "", ...rest } = props;
  const input = (
    <input
      {...rest}
      className={`rounded-md bg-[#0a0a0a] border border-[#1a1a1a] px-3 py-1.5 text-sm placeholder:text-zinc-600 focus:outline-none focus:border-[#2a2a2a] ${className}`}
    />
  );
  if (!label) return input;
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] uppercase tracking-wider text-zinc-500">
        {label}
      </span>
      {input}
    </label>
  );
}

export function AdminSelect({
  label,
  value,
  onChange,
  options,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  const select = (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-md bg-[#0a0a0a] border border-[#1a1a1a] px-3 py-1.5 text-sm focus:outline-none focus:border-[#2a2a2a]"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
  if (!label) return select;
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] uppercase tracking-wider text-zinc-500">
        {label}
      </span>
      {select}
    </label>
  );
}

/* ---------- Pager ---------- */
export function AdminPager({
  page,
  setPage,
  total,
  limit,
  label = "rows",
}: {
  page: number;
  setPage: (n: number) => void;
  total: number;
  limit: number;
  label?: string;
}) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 text-xs text-zinc-500 border-t border-[#1a1a1a]">
      <span>
        {total.toLocaleString()} {label} · page {page} of {totalPages}
      </span>
      <div className="flex gap-2">
        <button
          disabled={page <= 1}
          onClick={() => setPage(page - 1)}
          className="rounded-md border border-[#1a1a1a] bg-[#0a0a0a] px-3 py-1 hover:bg-[#141414] disabled:opacity-40 disabled:hover:bg-[#0a0a0a]"
        >
          Prev
        </button>
        <button
          disabled={page >= totalPages}
          onClick={() => setPage(page + 1)}
          className="rounded-md border border-[#1a1a1a] bg-[#0a0a0a] px-3 py-1 hover:bg-[#141414] disabled:opacity-40 disabled:hover:bg-[#0a0a0a]"
        >
          Next
        </button>
      </div>
    </div>
  );
}

/* ---------- Empty state ---------- */
export function AdminEmpty({ children }: { children: ReactNode }) {
  return (
    <div className="py-10 text-center text-xs text-zinc-500">{children}</div>
  );
}

/* ---------- Sort header ---------- */
export type SortDir = "asc" | "desc";
export function AdminSortHeader<K extends string>({
  field,
  label,
  sortBy,
  sortDir,
  onSort,
  align = "left",
  defaultDir = "desc",
}: {
  field: K;
  label: string;
  sortBy: K | null | undefined;
  sortDir: SortDir;
  onSort: (field: K, dir: SortDir) => void;
  align?: "left" | "right" | "center";
  defaultDir?: SortDir;
}) {
  const active = sortBy === field;
  const Icon = !active ? ChevronsUpDown : sortDir === "asc" ? ChevronUp : ChevronDown;
  const handle = () => {
    if (!active) onSort(field, defaultDir);
    else onSort(field, sortDir === "asc" ? "desc" : "asc");
  };
  const justify =
    align === "right" ? "justify-end" : align === "center" ? "justify-center" : "justify-start";
  const textAlign =
    align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";
  return (
    <th className={`${textAlign} px-4 py-2.5 font-medium`}>
      <button
        onClick={handle}
        className={`inline-flex items-center gap-1 ${justify} w-full transition-colors ${
          active ? "text-amber-300" : "text-zinc-500 hover:text-zinc-300"
        }`}
      >
        <span>{label}</span>
        <Icon className="h-3 w-3" />
      </button>
    </th>
  );
}

/* ---------- Helpers re-exported for table consistency ---------- */
export function AdminLinkButton({
  to,
  children,
}: {
  to: string;
  children: ReactNode;
}) {
  return (
    <Link
      to={to}
      className="text-xs text-amber-300/90 hover:text-amber-200 transition-colors"
    >
      {children} →
    </Link>
  );
}
