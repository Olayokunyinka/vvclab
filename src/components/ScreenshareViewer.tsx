import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Monitor, X, Copy, Check, ChevronLeft, ChevronRight } from "lucide-react";
import type { ParsedScript, BodySection } from "@/lib/scriptParse";

function buildAllCopy(title: string, cards: BodySection[]): string {
  const lines: string[] = [];
  lines.push(`SCREENSHARE GUIDE — ${title}`);
  cards.forEach((c, i) => {
    lines.push("", `${i + 1}. ${c.name}`, c.screenShare.trim());
  });
  return lines.join("\n");
}

export function ScreenshareViewer({
  parsed,
  videoTitle,
  onClose,
}: {
  parsed: ParsedScript;
  videoTitle?: string;
  onClose: () => void;
}) {
  const cards = useMemo(
    () => parsed.bodySections.filter((s) => s.screenShare && s.screenShare.trim()),
    [parsed],
  );
  const total = cards.length;
  const title = parsed.title || videoTitle || "Untitled video";

  const [activeIdx, setActiveIdx] = useState(0);
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const el = cardRefs.current[activeIdx];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeIdx]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setActiveIdx((i) => Math.max(0, i - 1));
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setActiveIdx((i) => Math.min(Math.max(0, total - 1), i + 1));
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [total, onClose]);

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(buildAllCopy(title, cards));
      setCopiedAll(true);
      toast.success("Instructions copied to clipboard");
      setTimeout(() => setCopiedAll(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const copyOne = async (idx: number) => {
    try {
      await navigator.clipboard.writeText(cards[idx].screenShare.trim());
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx((c) => (c === idx ? null : c)), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] overflow-hidden"
      style={{ backgroundColor: "#0a0a14" }}
    >
      {/* Header */}
      <div
        className="fixed top-0 inset-x-0 flex items-center justify-between gap-2 px-4 lg:px-6"
        style={{
          height: 56,
          backgroundColor: "#0d0d1a",
          borderBottom: "1px solid #1a1a2a",
        }}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2 lg:gap-3">
          <span style={{ fontSize: 18 }}>🖥</span>
          <span className="hidden lg:inline" style={{ color: "white", fontSize: 15, fontWeight: 600 }}>
            Screenshare Viewer
          </span>
          <span className="hidden lg:inline" style={{ color: "#3a3a50" }}>·</span>
          <span
            className="truncate flex-1 lg:max-w-[480px] lg:flex-none"
            style={{ color: "#6b8cff", fontSize: 14 }}
          >
            {title}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={copyAll}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-white/5 lg:px-3"
            style={{ color: "#6b8cff", border: "1px solid #1a1a35" }}
          >
            {copiedAll ? (
              <>
                <Check className="h-4 w-4" /> <span className="hidden lg:inline">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" /> <span className="hidden lg:inline">Copy all instructions</span>
              </>
            )}
          </button>
          <button
            onClick={onClose}
            aria-label="Exit"
            className="rounded-md p-2 hover:bg-white/5"
            style={{ color: "#8a8880" }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main scroll area */}
      <div
        className="absolute inset-x-0 overflow-y-auto"
        style={{ top: 56, bottom: total > 0 ? 96 : 0 }}
      >
        <div className="mx-auto max-w-[760px] px-4 py-8 lg:px-6 lg:py-12">
          {/* Context card */}
          <div
            className="rounded-xl p-4 mb-6 lg:p-5 lg:mb-8"
            style={{ backgroundColor: "#111120", border: "1px solid #1a1a30" }}
          >
            <div
              style={{
                color: "#6b8cff",
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.15em",
              }}
            >
              NOW RECORDING:
            </div>
            <div
              style={{
                color: "white",
                fontSize: 20,
                fontWeight: 700,
                marginTop: 6,
              }}
            >
              {title}
            </div>
            {parsed.framework.acronym && (
              <div style={{ color: "#8a8880", fontSize: 14, marginTop: 4 }}>
                Framework: {parsed.framework.acronym}
              </div>
            )}
          </div>

          {total === 0 ? (
            <div
              className="text-center py-12"
              style={{ color: "#555", fontSize: 14 }}
            >
              No screen share moments in this script.
            </div>
          ) : (
            cards.map((s, i) => (
              <div
                key={i}
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                className="rounded-xl overflow-hidden mb-4"
                style={{
                  backgroundColor: "#111120",
                  border:
                    i === activeIdx
                      ? "1px solid var(--accent-gold)"
                      : "1px solid #1a1a30",
                  transition: "border-color 150ms",
                }}
                onClick={() => setActiveIdx(i)}
              >
                <div
                  className="flex items-center justify-between px-4 py-3 lg:px-5"
                  style={{
                    backgroundColor: "#1a1a35",
                    borderBottom: "1px solid #1a1a30",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Monitor size={16} style={{ color: "#6b8cff" }} />
                    <span
                      style={{
                        color: "#6b8cff",
                        fontSize: 11,
                        textTransform: "uppercase",
                        letterSpacing: "0.15em",
                      }}
                    >
                      SCREEN SHARE MOMENT
                    </span>
                  </div>
                  <div style={{ color: "#8a8880", fontSize: 13 }}>
                    Section {s.n}: {s.letter} — {s.name}
                  </div>
                </div>
                <div className="px-4 py-4 lg:px-5">
                  <p
                    className="whitespace-pre-wrap"
                    style={{ color: "white", fontSize: 16, lineHeight: 1.7 }}
                  >
                    {s.screenShare.trim()}
                  </p>
                  <div className="flex items-center justify-between mt-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyOne(i);
                      }}
                      className="flex items-center gap-1.5 hover:underline"
                      style={{ color: "#6b8cff", fontSize: 12 }}
                    >
                      {copiedIdx === i ? (
                        <>
                          <Check className="h-3 w-3" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" /> Copy this instruction
                        </>
                      )}
                    </button>
                    <span style={{ color: "#555", fontSize: 12 }}>
                      {i + 1} of {total}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Bottom nav */}
      {total > 0 && (
        <div
          className="fixed bottom-0 inset-x-0 py-3 px-4 lg:py-4 lg:px-8 backdrop-blur flex items-center justify-between gap-3 lg:gap-6"
          style={{ backgroundColor: "rgba(10,10,20,0.95)" }}
        >
          <button
            onClick={() => setActiveIdx((i) => Math.max(0, i - 1))}
            disabled={activeIdx === 0}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-md px-4 py-2 text-sm disabled:opacity-40"
            style={{ color: "#8a8880", border: "1px solid #1a1a35" }}
          >
            <ChevronLeft className="h-4 w-4" /> <span className="hidden lg:inline">Previous</span>
          </button>

          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              {cards.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIdx(i)}
                  aria-label={`Go to step ${i + 1}`}
                  className="rounded-full h-2 w-2 lg:h-3 lg:w-3"
                  style={{
                    backgroundColor:
                      i === activeIdx ? "var(--accent-gold)" : "#2a2a3a",
                    transition: "background-color 150ms",
                  }}
                />
              ))}
            </div>
            <div className="text-xs" style={{ color: "#555" }}>
              {activeIdx + 1} of {total} screen share moments
            </div>
          </div>

          <button
            onClick={() =>
              setActiveIdx((i) => Math.min(total - 1, i + 1))
            }
            disabled={activeIdx >= total - 1}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-md px-4 py-2 text-sm disabled:opacity-40"
            style={{
              color: "var(--accent-gold)",
              border: "1px solid var(--accent-gold)",
            }}
          >
            <span className="hidden lg:inline">Next</span> <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}