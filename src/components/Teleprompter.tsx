import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Play,
  Pause,
  RotateCcw,
  Copy,
  Check,
  X,
  HelpCircle,
  Turtle,
  Rabbit,
  Plus,
  Minus,
} from "lucide-react";
import { buildFullScriptCopy, type ParsedScript } from "@/lib/scriptParse";
import { useIsMobile } from "@/hooks/use-mobile";

type Block = { label?: string; text: string };

const SPEEDS = [
  { key: "slow", label: "Slow", pps: 40 },
  { key: "med", label: "Medium", pps: 80 },
  { key: "fast", label: "Fast", pps: 120 },
  { key: "vfast", label: "Very Fast", pps: 180 },
] as const;

const FONT_STEP = 2;

function buildBlocks(p: ParsedScript): Block[] {
  const blocks: Block[] = [];
  if (p.title) blocks.push({ text: p.title });
  p.hookSteps.forEach((s) => {
    if (s.body && s.body.trim()) {
      blocks.push({ label: `— Hook Step ${s.n}: ${s.name} —`, text: s.body.trim() });
    }
  });
  p.bodySections.forEach((s) => {
    const parts = [
      s.analogy,
      s.talkingPoints.join(" "),
      s.whyItMatters,
      s.transition,
    ]
      .map((t) => (t || "").trim())
      .filter(Boolean);
    if (parts.length) {
      blocks.push({
        label: `— Section ${s.n}: ${s.letter} · ${s.name} —`,
        text: parts.join("\n\n"),
      });
    }
  });
  if (p.closeAndCta && p.closeAndCta.trim()) {
    blocks.push({ label: "— Close & CTA —", text: p.closeAndCta.trim() });
  }
  return blocks;
}

export function Teleprompter({
  parsed,
  onClose,
}: {
  parsed: ParsedScript;
  onClose: () => void;
}) {
  const blocks = useMemo(() => buildBlocks(parsed), [parsed]);
  const isMobile = useIsMobile();
  const FONT_MIN = isMobile ? 18 : 24;
  const FONT_MAX = isMobile ? 48 : 72;

  const [playing, setPlaying] = useState(false);
  const [fontSize, setFontSize] = useState(36);
  const fontInitRef = useRef(false);
  useEffect(() => {
    if (fontInitRef.current) return;
    fontInitRef.current = true;
    setFontSize(isMobile ? 24 : 36);
  }, [isMobile]);
  const [speedIdx, setSpeedIdx] = useState(1); // Medium
  const [atEnd, setAtEnd] = useState(false);
  const [copied, setCopied] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const accumRef = useRef(0);
  const manualTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasPlayingRef = useRef(false);
  const ignoreScrollRef = useRef(false);

  const speed = SPEEDS[speedIdx].pps;

  // Auto-scroll loop
  useEffect(() => {
    if (!playing) {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTsRef.current = null;
      return;
    }
    const tick = (ts: number) => {
      const el = scrollRef.current;
      if (!el) return;
      if (lastTsRef.current == null) lastTsRef.current = ts;
      const dt = (ts - lastTsRef.current) / 1000;
      lastTsRef.current = ts;
      accumRef.current += speed * dt;
      const whole = Math.floor(accumRef.current);
      if (whole > 0) {
        accumRef.current -= whole;
        ignoreScrollRef.current = true;
        el.scrollTop += whole;
        // release on next frame
        requestAnimationFrame(() => {
          ignoreScrollRef.current = false;
        });
      }
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 1) {
        setAtEnd(true);
        setPlaying(false);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTsRef.current = null;
    };
  }, [playing, speed]);

  const togglePlay = () => {
    setAtEnd(false);
    setPlaying((p) => !p);
  };

  const restart = () => {
    const el = scrollRef.current;
    if (el) el.scrollTop = 0;
    setAtEnd(false);
  };

  const adjustFont = (delta: number) =>
    setFontSize((f) => Math.min(FONT_MAX, Math.max(FONT_MIN, f + delta)));

  const adjustSpeed = (delta: number) =>
    setSpeedIdx((i) => Math.min(SPEEDS.length - 1, Math.max(0, i + delta)));

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildFullScriptCopy(parsed));
      setCopied(true);
      toast.success("Script copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    if (isMobile) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        adjustSpeed(1);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        adjustSpeed(-1);
      } else if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        adjustFont(FONT_STEP);
      } else if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        adjustFont(-FONT_STEP);
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile]);

  // Manual scroll pause + resume after 2s idle
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onManual = () => {
      if (ignoreScrollRef.current) return;
      if (playing) {
        wasPlayingRef.current = true;
        setPlaying(false);
      }
      if (manualTimerRef.current) clearTimeout(manualTimerRef.current);
      manualTimerRef.current = setTimeout(() => {
        if (wasPlayingRef.current) {
          wasPlayingRef.current = false;
          setPlaying(true);
        }
      }, 2000);
    };
    el.addEventListener("wheel", onManual, { passive: true });
    el.addEventListener("touchmove", onManual, { passive: true });
    return () => {
      el.removeEventListener("wheel", onManual);
      el.removeEventListener("touchmove", onManual);
      if (manualTimerRef.current) clearTimeout(manualTimerRef.current);
    };
  }, [playing]);

  return (
    <div className="fixed inset-0 z-[100] bg-black text-[#f0ede6]">
      <div
        ref={scrollRef}
        onClick={togglePlay}
        className="h-full w-full overflow-y-auto cursor-pointer pt-24 pb-40 lg:pt-[200px] lg:pb-[280px]"
      >
        <div
          className="mx-auto max-w-full px-6 text-center lg:max-w-[800px] lg:px-0"
          style={{ fontSize, lineHeight: 1.8 }}
        >
          {blocks.map((b, i) => (
            <div key={i} className="mb-16">
              {b.label && (
                <div
                  className="mb-4"
                  style={{ fontSize: 14, color: "#555", lineHeight: 1.4 }}
                >
                  {b.label}
                </div>
              )}
              {b.text.split(/\n{2,}/).map((para, j) => (
                <p key={j} className="mb-6 whitespace-pre-wrap">
                  {para}
                </p>
              ))}
            </div>
          ))}
          {atEnd && (
            <div
              className="mt-12"
              style={{ fontSize: 14, color: "#555", lineHeight: 1.4 }}
            >
              — End of script —
            </div>
          )}
        </div>
      </div>

      {/* Controls bar — desktop */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="fixed bottom-0 inset-x-0 py-4 px-8 hidden lg:flex items-center justify-between gap-6 backdrop-blur"
        style={{ backgroundColor: "rgba(0,0,0,0.8)" }}
      >
        {/* Left: font + speed */}
        <div className="flex items-center gap-6 text-[#f0ede6]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => adjustFont(-FONT_STEP)}
              className="rounded-md p-1.5 hover:bg-white/10"
              aria-label="Decrease font size"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="text-sm tabular-nums w-12 text-center">
              {fontSize}px
            </span>
            <button
              onClick={() => adjustFont(FONT_STEP)}
              className="rounded-md p-1.5 hover:bg-white/10"
              aria-label="Increase font size"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Turtle className="h-4 w-4 opacity-70" />
            <input
              type="range"
              min={0}
              max={SPEEDS.length - 1}
              step={1}
              value={speedIdx}
              onChange={(e) => setSpeedIdx(parseInt(e.target.value, 10))}
              className="w-28 accent-[var(--accent-gold)]"
              aria-label="Scroll speed"
            />
            <Rabbit className="h-4 w-4 opacity-70" />
            <span className="text-sm w-20 text-center">{SPEEDS[speedIdx].label}</span>
          </div>
        </div>

        {/* Center: play / restart */}
        <div className="flex items-center gap-3">
          <button
            onClick={togglePlay}
            className="flex items-center gap-2 rounded-lg px-6 py-2 text-black font-semibold"
            style={{ backgroundColor: "var(--accent-gold)" }}
          >
            {playing ? (
              <>
                <Pause className="h-4 w-4" /> Pause
              </>
            ) : (
              <>
                <Play className="h-4 w-4" /> Start
              </>
            )}
          </button>
          <button
            onClick={restart}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-[#f0ede6] hover:bg-white/10"
            aria-label="Restart"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>

        {/* Right: copy + help + exit */}
        <div className="flex items-center gap-3 text-[#f0ede6]">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-white/10"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" /> Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" /> Copy full script
              </>
            )}
          </button>

          <div className="relative">
            <button
              onMouseEnter={() => setHelpOpen(true)}
              onMouseLeave={() => setHelpOpen(false)}
              onFocus={() => setHelpOpen(true)}
              onBlur={() => setHelpOpen(false)}
              className="rounded-md p-2 hover:bg-white/10"
              aria-label="Keyboard shortcuts"
            >
              <HelpCircle className="h-4 w-4" />
            </button>
            {helpOpen && (
              <div
                className="absolute right-0 bottom-full mb-2 w-64 rounded-lg p-3 text-xs"
                style={{
                  backgroundColor: "rgba(20,20,20,0.95)",
                  color: "#f0ede6",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <div className="mb-2 font-semibold">Keyboard shortcuts</div>
                <div className="flex justify-between"><span>Space</span><span>Play / Pause</span></div>
                <div className="flex justify-between"><span>↑ ↓</span><span>Adjust speed</span></div>
                <div className="flex justify-between"><span>+ −</span><span>Adjust font size</span></div>
                <div className="flex justify-between"><span>Esc</span><span>Exit</span></div>
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className="rounded-md p-2 hover:bg-white/10"
            aria-label="Exit teleprompter"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Controls bar — mobile */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="fixed bottom-0 inset-x-0 flex flex-col gap-3 px-4 py-3 backdrop-blur lg:hidden"
        style={{ backgroundColor: "rgba(0,0,0,0.8)" }}
      >
        {/* Row 1: play (flex-1) + restart + copy + exit */}
        <div className="flex w-full items-center gap-2 text-[#f0ede6]">
          <button
            onClick={togglePlay}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-black font-semibold"
            style={{ backgroundColor: "var(--accent-gold)" }}
          >
            {playing ? (
              <>
                <Pause className="h-4 w-4" /> Pause
              </>
            ) : (
              <>
                <Play className="h-4 w-4" /> Start
              </>
            )}
          </button>
          <button
            onClick={restart}
            className="rounded-lg p-2 hover:bg-white/10"
            aria-label="Restart"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            onClick={handleCopy}
            className="rounded-md p-2 hover:bg-white/10"
            aria-label="Copy full script"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </button>
          <button
            onClick={onClose}
            className="rounded-md p-2 hover:bg-white/10"
            aria-label="Exit teleprompter"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {/* Row 2: font controls + speed buttons */}
        <div className="flex w-full items-center justify-between gap-3 text-[#f0ede6]">
          <div className="flex items-center gap-1">
            <button
              onClick={() => adjustFont(-FONT_STEP)}
              className="rounded-md p-1.5 hover:bg-white/10"
              aria-label="Decrease font size"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="text-xs tabular-nums w-10 text-center">
              {fontSize}px
            </span>
            <button
              onClick={() => adjustFont(FONT_STEP)}
              className="rounded-md p-1.5 hover:bg-white/10"
              aria-label="Increase font size"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center gap-1">
            {SPEEDS.map((s, i) => (
              <button
                key={s.key}
                onClick={() => setSpeedIdx(i)}
                className={`rounded-md px-2 py-1.5 text-xs ${
                  i === speedIdx
                    ? "bg-[var(--accent-gold)] text-black"
                    : "text-[#f0ede6] hover:bg-white/10"
                }`}
              >
                {i === 0 ? "Slow" : i === 1 ? "Med" : i === 2 ? "Fast" : "V.Fast"}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}