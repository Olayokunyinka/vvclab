import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/_onboarded/calendar")({
  head: () => ({ meta: [{ title: "Content Calendar — VVCLab" }] }),
  component: CalendarPage,
});

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function CalendarPage() {
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  // Mon-Sun: shift Sunday(0) to 6
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = lastDay.getDate();

  const cells: { day: number | null; isToday: boolean }[] = [];
  for (let i = 0; i < startOffset; i++) cells.push({ day: null, isToday: false });
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday =
      d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    cells.push({ day: d, isToday });
  }
  while (cells.length % 7 !== 0) cells.push({ day: null, isToday: false });

  const monthLabel = cursor.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 lg:px-10 lg:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight lg:text-[28px]">Content Calendar</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Plan when each script should be published.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCursor(new Date(year, month - 1, 1))}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-border bg-card hover:bg-surface"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[100px] text-center text-sm font-medium lg:min-w-[140px]">{monthLabel}</span>
          <button
            type="button"
            onClick={() => setCursor(new Date(year, month + 1, 1))}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-border bg-card hover:bg-surface"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <div className="min-w-[360px]">
          <div className="grid grid-cols-7 border-b border-border bg-surface">
            {DAY_LABELS.map((d) => (
              <div
                key={d}
                className="px-1.5 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-text-tertiary lg:px-2"
              >
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((c, i) => (
              <div
                key={i}
                className="min-h-[60px] border-b border-r border-border p-1.5 last:border-r-0 lg:min-h-[100px] lg:p-2 [&:nth-child(7n)]:border-r-0"
              >
                {c.day && (
                  <div className="flex items-center">
                    {c.isToday ? (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-red text-[10px] font-bold text-white lg:h-6 lg:w-6 lg:text-[11px]">
                        {c.day}
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-muted-foreground lg:text-sm">
                        {c.day}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-10 text-center">
        <p className="text-sm font-medium text-foreground">No scheduled briefs yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Generate scripts from the{" "}
          <Link to="/outliers" className="font-medium text-accent-amber hover:underline">
            Outliers page
          </Link>{" "}
          and schedule them here.
        </p>
      </div>
    </div>
  );
}
