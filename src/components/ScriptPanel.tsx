import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import jsPDF from "jspdf";
import {
  Copy,
  Download,
  Loader2,
  Sparkles,
  AlertCircle,
  Lightbulb,
  Monitor,
  X,
  Calendar,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { generateScript, getScript } from "@/lib/script.functions";
import { useBrandBlueprint } from "@/hooks/useBrandBlueprint";
import {
  parseScript,
  buildHookCopy,
  buildFullScriptCopy,
  type ParsedScript,
} from "@/lib/scriptParse";
import { fmtMultiplier } from "@/lib/outliers";
import type { DetectedPatterns } from "@/lib/patterns";
import { Teleprompter } from "@/components/Teleprompter";
import { ScreenshareViewer } from "@/components/ScreenshareViewer";

type Props = {
  videoUuid: string | null;
  videoTitle?: string;
  competitorChannel?: string;
  multiplier?: number;
  patterns?: DetectedPatterns | null;
  onClose: () => void;
};

type ScriptData = {
  markdown: string;
  multiplier: number;
  channelTitle: string;
  creatorName: string;
  patterns: DetectedPatterns | null;
};

function copy(text: string, label = "Copied") {
  navigator.clipboard.writeText(text);
  toast.success(label);
}

const soon = (what: string) => toast(`${what} coming soon`);

export function ScriptPanel({
  videoUuid,
  videoTitle,
  competitorChannel,
  multiplier,
  patterns: _patterns,
  onClose,
}: Props) {
  const generateFn = useServerFn(generateScript);
  const getFn = useServerFn(getScript);
  const { blueprint, ready } = useBrandBlueprint();

  const [data, setData] = useState<ScriptData | null>(null);
  const [parsed, setParsed] = useState<ParsedScript | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teleprompterOpen, setTeleprompterOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);

  useEffect(() => {
    if (!videoUuid) {
      setData(null);
      setParsed(null);
      setError(null);
      setLoading(false);
    }
  }, [videoUuid]);

  // Lock body scroll while modal is open
  useEffect(() => {
    if (!videoUuid) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [videoUuid, onClose]);

  useEffect(() => {
    if (!videoUuid || !ready) return;
    let cancelled = false;

    (async () => {
      setError(null);
      setLoading(true);
      try {
        const cached = await getFn({ data: { videoUuid } });
        if (cancelled) return;
        if (cached?.markdown) {
          setData({
            markdown: cached.markdown,
            multiplier: cached.multiplier,
            channelTitle: cached.channelTitle,
            creatorName: cached.creatorName,
            patterns: cached.patterns,
          });
          setParsed(parseScript(cached.markdown));
          setLoading(false);
          return;
        }

        if (!blueprint) {
          setError(
            "Set up your Personal Brand Blueprint first — every line of the script is written from it.",
          );
          setLoading(false);
          return;
        }

        const fresh = await generateFn({
          data: {
            videoUuid,
            blueprint: {
              name: blueprint.name,
              brandSummary: blueprint.brandSummary,
              youtubeNiche: blueprint.youtubeNiche,
              targetAudience: blueprint.targetAudience,
              contentPillars: blueprint.contentPillars || [],
              brandVoice: blueprint.brandVoice,
              monetisationAngle: blueprint.monetisationAngle,
            },
          },
        });
        if (cancelled) return;
        setData({
          markdown: fresh.markdown,
          multiplier: fresh.multiplier,
          channelTitle: fresh.channelTitle,
          creatorName: fresh.creatorName,
          patterns: fresh.patterns,
        });
        setParsed(parseScript(fresh.markdown));
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to generate script");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [videoUuid, ready, blueprint, generateFn, getFn]);

  async function regenerate() {
    if (!videoUuid || !blueprint) return;
    setError(null);
    setLoading(true);
    try {
      const fresh = await generateFn({
        data: {
          videoUuid,
          blueprint: {
            name: blueprint.name,
            brandSummary: blueprint.brandSummary,
            youtubeNiche: blueprint.youtubeNiche,
            targetAudience: blueprint.targetAudience,
            contentPillars: blueprint.contentPillars || [],
            brandVoice: blueprint.brandVoice,
            monetisationAngle: blueprint.monetisationAngle,
          },
        },
      });
      setData({
        markdown: fresh.markdown,
        multiplier: fresh.multiplier,
        channelTitle: fresh.channelTitle,
        creatorName: fresh.creatorName,
        patterns: fresh.patterns,
      });
      setParsed(parseScript(fresh.markdown));
      toast.success("Regenerated");
    } catch (e: any) {
      setError(e?.message || "Failed to regenerate");
    } finally {
      setLoading(false);
    }
  }

  function downloadPdf() {
    if (!data) return;
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const margin = 40;
    const w = doc.internal.pageSize.getWidth();
    const h = doc.internal.pageSize.getHeight();
    const maxW = w - margin * 2;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    const title = `${data.creatorName}'s Version — ${data.channelTitle}`;
    doc.text(doc.splitTextToSize(title, maxW), margin, margin + 10);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const body = data.markdown.replace(/[#*`_>]+/g, "").replace(/\n{3,}/g, "\n\n");
    const lines = doc.splitTextToSize(body, maxW);
    let y = margin + 40;
    const lh = 13;
    for (const line of lines) {
      if (y > h - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += lh;
    }
    doc.save(
      `script-${(videoTitle || "video").slice(0, 40).replace(/[^a-z0-9]+/gi, "-")}.pdf`,
    );
  }

  if (!videoUuid) return null;

  const headerMult = data?.multiplier ?? multiplier ?? 0;
  const headerChannel = data?.channelTitle || competitorChannel || "";
  const headerCreator = data?.creatorName || blueprint?.name || "Your";
  const niche = blueprint?.youtubeNiche || "";

  return (
    <div className="fixed inset-0 z-50 flex bg-background lg:items-start lg:justify-center lg:overflow-y-auto lg:bg-black/60 lg:p-4">
      <div className="flex h-full w-full flex-col bg-background lg:my-8 lg:h-auto lg:max-h-[90vh] lg:max-w-4xl lg:overflow-hidden lg:rounded-2xl lg:border lg:border-[var(--border-card)] lg:shadow-2xl">
      {/* HEADER */}
      <div className="flex flex-col gap-1 border-b border-[var(--border-card)] bg-background px-4 py-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4 lg:px-6">
        <div className="flex min-w-0 flex-col gap-1 lg:flex-row lg:items-center lg:gap-2 lg:text-sm">
          <div className="flex min-w-0 items-center gap-2 text-sm">
            <Sparkles className="h-4 w-4 shrink-0 text-[var(--accent-gold)]" />
            <span className="truncate font-bold text-foreground">{headerCreator}'s Version</span>
            {headerChannel && (
              <span className="hidden truncate text-[var(--text-secondary)] lg:inline">
                · {headerChannel}
                {niche ? ` | ${niche}` : ""}
              </span>
            )}
            {headerMult > 0 && (
              <span className="ml-1 inline-flex shrink-0 items-center gap-1 rounded-full bg-[var(--accent-gold-bg)] px-2 py-0.5 text-xs font-semibold text-[var(--accent-gold)]">
                ⚡ {fmtMultiplier(headerMult)}
              </span>
            )}
          </div>
          {headerChannel && (
            <span className="truncate text-xs text-[var(--text-secondary)] lg:hidden">
              {headerChannel}
              {niche ? ` | ${niche}` : ""}
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2 self-end lg:self-auto">
          {parsed && (
            <Button
              size="sm"
              variant="outline"
              className="px-2 lg:px-3"
              onClick={() => copy(buildFullScriptCopy(parsed), "Full script copied")}
            >
              <Copy className="h-3.5 w-3.5 lg:mr-1.5" />
              <span className="hidden lg:inline">Copy all text</span>
            </Button>
          )}
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-card)] hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* BODY */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-sm text-[var(--text-secondary)]">
            <Loader2 className="h-6 w-6 animate-spin" />
            Writing your version in {blueprint?.name || "your"} voice…
          </div>
        )}

        {!loading && error && (
          <div className="m-6 flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div className="flex-1">{error}</div>
          </div>
        )}

        {!loading && data && parsed && (
          <Tabs defaultValue="script" className="mx-auto max-w-4xl px-4 pb-8 lg:px-6 lg:pb-12">
            <TabsList className="sticky top-0 z-10 mb-6 flex h-auto w-full justify-start gap-3 rounded-none border-b border-[var(--border-card)] bg-background p-0 lg:gap-6">
              <TabBtn value="script" label="📄 Script" />
              <TabBtn value="thumbnail" label="🟩 Thumbnail" />
              <TabBtn value="actions" label="⚡ Actions" />
            </TabsList>

            <TabsContent value="script" className="mt-0">
              <ScriptView parsed={parsed} onRegenerate={regenerate} hasBlueprint={!!blueprint} />
            </TabsContent>

            <TabsContent value="thumbnail" className="mt-0">
              <ThumbnailTab parsed={parsed} />
            </TabsContent>

            <TabsContent value="actions" className="mt-0">
              <ActionsTab
                onPdf={downloadPdf}
                onRegenerate={regenerate}
                hasBlueprint={!!blueprint}
                onTeleprompter={() => setTeleprompterOpen(true)}
                canTeleprompt={!!parsed}
                onViewer={() => setViewerOpen(true)}
                canViewer={!!parsed?.bodySections.some((s) => s.screenShare.trim())}
              />
            </TabsContent>
          </Tabs>
        )}
      </div>
      {teleprompterOpen && parsed && (
        <Teleprompter parsed={parsed} onClose={() => setTeleprompterOpen(false)} />
      )}
      {viewerOpen && parsed && (
        <ScreenshareViewer
          parsed={parsed}
          videoTitle={videoTitle}
          onClose={() => setViewerOpen(false)}
        />
      )}
      </div>
    </div>
  );
}

function TabBtn({ value, label }: { value: string; label: string }) {
  return (
    <TabsTrigger
      value={value}
      className="rounded-none border-b-2 border-transparent bg-transparent px-1 pb-2 pt-2 text-xs font-medium text-[var(--text-secondary)] shadow-none data-[state=active]:border-[var(--accent-gold)] data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none lg:pb-3 lg:pt-3 lg:text-sm"
    >
      {label}
    </TabsTrigger>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] font-semibold uppercase tracking-widest text-[var(--text-secondary)]">
      {children}
    </div>
  );
}

function NumBadge({ n }: { n: number | string }) {
  return (
    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-[var(--accent-gold-bg)] text-xs font-bold text-[var(--accent-gold)] lg:h-8 lg:w-8 lg:text-sm">
      {n}
    </div>
  );
}

function ScriptView({
  parsed,
  onRegenerate,
  hasBlueprint,
}: {
  parsed: ParsedScript;
  onRegenerate: () => void;
  hasBlueprint: boolean;
}) {
  if (parsed.isLegacy) {
    return (
      <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
        <div className="font-medium">Older script format</div>
        <p className="mt-1 text-[var(--text-secondary)]">
          This script was generated with the previous template. Regenerate to use the new 7-step
          hook + framework body format.
        </p>
        <Button
          size="sm"
          variant="outline"
          className="mt-3"
          onClick={onRegenerate}
          disabled={!hasBlueprint}
        >
          <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Regenerate
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* TITLE CARD */}
      <div className="relative rounded-xl bg-[var(--bg-card)] p-4 lg:p-6">
        <Label>
          TITLE
          {parsed.estimatedMinutes && <> · {parsed.estimatedMinutes} MINUTES</>}
        </Label>
        <h2 className="mt-3 pr-24 text-xl font-bold leading-tight text-foreground lg:pr-32 lg:text-2xl">
          {parsed.title}
        </h2>
        <Button
          size="sm"
          variant="ghost"
          className="absolute bottom-3 right-3 h-7 text-[var(--text-secondary)] lg:bottom-4 lg:right-4"
          onClick={() => copy(parsed.title, "Title copied")}
        >
          <Copy className="mr-1.5 h-3 w-3" /> Copy title
        </Button>
      </div>

      {/* INTRO */}
      <div className="space-y-3 rounded-xl bg-[var(--bg-card)] p-4 lg:p-6">
        <div className="flex items-center justify-between gap-3">
          <Label>INTRO · 7-STEP HOOK (WORD-BY-WORD, TELEPROMPTER-READY)</Label>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-[var(--text-secondary)]"
            onClick={() => copy(buildHookCopy(parsed.hookSteps), "Intro copied")}
          >
            <Copy className="mr-1.5 h-3 w-3" /> Copy intro
          </Button>
        </div>
        <div className="space-y-2">
          {parsed.hookSteps.map((step) => (
            <div key={step.n} className="rounded-lg bg-background/40 p-3 lg:p-4">
              <div className="flex items-start gap-3">
                <NumBadge n={step.n} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="text-xs font-semibold uppercase tracking-widest text-[var(--accent-gold)] lg:text-sm">
                      {step.name}
                    </span>
                    <span className="text-xs text-[var(--text-secondary)] lg:text-sm">
                      · {step.subLabel}
                    </span>
                  </div>
                  <pre className="mt-2 whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
                    {step.body || (
                      <span className="italic text-[var(--text-secondary)]">—</span>
                    )}
                  </pre>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FRAMEWORK BANNER */}
      {parsed.framework.acronym && (
        <div className="flex items-center gap-2.5 rounded-md border border-[var(--accent-purple-border)] bg-[var(--accent-purple-bg)] px-4 py-3 text-[#a78bfa]">
          <Lightbulb className="h-4 w-4 shrink-0" />
          <div className="text-sm font-semibold">
            💡 Framework: {parsed.framework.acronym}
            {parsed.framework.tagline && (
              <span className="font-normal opacity-80"> — {parsed.framework.tagline}</span>
            )}
          </div>
        </div>
      )}

      {/* BODY */}
      <div className="space-y-3">
        <Label>BODY · STEP-BY-STEP SCRIPT (ANALOGIES + SCREEN SHARE)</Label>
        <div className="space-y-4">
          {parsed.bodySections.map((s, i) => (
            <div key={s.n}>
              <div className="space-y-4 rounded-xl bg-[var(--bg-card)] p-4 lg:p-6">
                <div className="flex items-center gap-3">
                  <NumBadge n={s.n} />
                  <div className="text-[18px] font-bold text-foreground">
                    {s.letter} — {s.name}
                  </div>
                </div>

                {s.analogy && (
                  <div className="border-l-[3px] border-[var(--accent-gold)] bg-[#1e1a14] px-3 py-2 lg:px-4 lg:py-3">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent-gold)]">
                      ANALOGY
                    </div>
                    <p className="mt-1 text-sm italic leading-relaxed text-foreground">
                      {s.analogy}
                    </p>
                  </div>
                )}

                {s.talkingPoints.length > 0 && (
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-secondary)]">
                      TALKING POINTS
                    </div>
                    <ul className="mt-1.5 space-y-1.5 text-sm text-foreground">
                      {s.talkingPoints.map((tp, idx) => (
                        <li key={idx} className="flex gap-2">
                          <span className="text-[var(--text-secondary)]">•</span>
                          <span className="leading-relaxed">{tp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {s.whyItMatters && (
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-secondary)]">
                      WHY IT MATTERS
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-foreground">
                      {s.whyItMatters}
                    </p>
                  </div>
                )}

                {s.screenShare && (
                  <div className="rounded-md border border-[var(--accent-blue-border)] bg-[var(--accent-blue-bg)] px-3 py-2 lg:px-4 lg:py-3">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[var(--accent-blue-text)]">
                      <Monitor className="h-3 w-3" />
                      SCREEN SHARE MOMENT
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-foreground">
                      {s.screenShare}
                    </p>
                  </div>
                )}
              </div>
              {s.transition && i < parsed.bodySections.length - 1 && (
                <p className="mt-3 px-2 text-sm italic text-[var(--text-secondary)]">
                  → {s.transition}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* CLOSE & CTA */}
      {parsed.closeAndCta && (
        <div className="rounded-xl bg-[var(--bg-card)] p-4 lg:p-6">
          <Label>CLOSE &amp; CTA</Label>
          <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
            {parsed.closeAndCta}
          </pre>
        </div>
      )}
    </div>
  );
}

function ThumbField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[var(--bg-card)] p-4">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-secondary)]">
        {label}
      </div>
      <div className="mt-1.5 text-sm text-foreground">
        {value?.trim() || (
          <span className="italic text-[var(--text-secondary)]">Not specified</span>
        )}
      </div>
    </div>
  );
}

function ThumbnailTab({ parsed }: { parsed: ParsedScript }) {
  const t = parsed.thumbnail;
  const promptSeed = [
    t.expression && `Expression: ${t.expression}`,
    t.textOverlay && `Text: ${t.textOverlay}`,
    t.textColor && `Text color: ${t.textColor}`,
    t.background && `Background: ${t.background}`,
    t.layout && `Layout: ${t.layout}`,
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ThumbField label="EXPRESSION" value={t.expression} />
        <ThumbField label="TEXT" value={t.textOverlay} />
        <ThumbField label="TEXT COLOR" value={t.textColor} />
        <ThumbField label="BACKGROUND" value={t.background} />
        <ThumbField label="LAYOUT" value={t.layout} />
      </div>

      <div className="space-y-3">
        <Label>YOUR VARIATIONS · CLICK TO SELECT</Label>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {(["LEFT", "RIGHT"] as const).map((side) => (
            <div
              key={side}
              className="flex aspect-video items-center justify-center rounded-lg border-2 border-dashed border-[var(--border-card)] text-xs uppercase tracking-widest text-[var(--text-secondary)]"
            >
              {side}
            </div>
          ))}
        </div>
      </div>

      <details className="group rounded-lg bg-[var(--bg-card)] p-4">
        <summary className="cursor-pointer list-none text-[11px] font-semibold uppercase tracking-widest text-[var(--text-secondary)]">
          ADJUST THE PROMPT (OPTIONAL)
        </summary>
        <textarea
          defaultValue={promptSeed}
          rows={5}
          className="mt-3 w-full rounded-md border border-[var(--border-card)] bg-background p-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-[var(--accent-gold)]"
        />
      </details>

      <button
        onClick={() => soon("Thumbnail regeneration")}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent-gold)] px-4 py-3 text-sm font-semibold text-black hover:opacity-90"
      >
        <Sparkles className="h-4 w-4" /> Regenerate both
      </button>
    </div>
  );
}

function ActionsTab({
  onPdf,
  onRegenerate,
  hasBlueprint,
  onTeleprompter,
  canTeleprompt,
  onViewer,
  canViewer,
}: {
  onPdf: () => void;
  onRegenerate: () => void;
  hasBlueprint: boolean;
  onTeleprompter: () => void;
  canTeleprompt: boolean;
  onViewer: () => void;
  canViewer: boolean;
}) {
  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <Label>SCRIPT &amp; TELEPROMPTER</Label>
        <div className="flex flex-col gap-3 lg:flex-row">
          <Button
            variant="outline"
            className="w-full lg:w-auto lg:flex-1"
            onClick={canTeleprompt ? onTeleprompter : () => soon("Teleprompter")}
            disabled={!canTeleprompt}
          >
            <Play className="mr-2 h-4 w-4" /> Open (Teleprompter)
          </Button>
          <Button variant="outline" className="w-full lg:w-auto lg:flex-1" onClick={onPdf}>
            <Download className="mr-2 h-4 w-4" /> Save as PDF
          </Button>
        </div>
      </section>

      <section className="space-y-3">
        <Label>SCREENSHARE VIEWER</Label>
        <div className="flex flex-col gap-3 lg:flex-row">
          <Button
            variant="outline"
            className="w-full lg:w-auto lg:flex-1"
            onClick={canViewer ? onViewer : () => soon("Screenshare viewer")}
            disabled={!canViewer}
          >
            <Monitor className="mr-2 h-4 w-4" /> Open
          </Button>
          <Button
            variant="outline"
            className="w-full lg:w-auto lg:flex-1"
            onClick={() => soon("Screenshare PDF")}
          >
            <Download className="mr-2 h-4 w-4" /> Save as PDF
          </Button>
        </div>
      </section>

      <button
        onClick={() => soon("Google Calendar")}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent-gold)] px-4 py-3 text-sm font-semibold text-black hover:opacity-90"
      >
        <Calendar className="h-4 w-4" /> Add to Google Calendar
      </button>

      <div className="border-t border-[var(--border-card)] pt-4">
        <Button
          variant="ghost"
          className="w-full justify-start text-[var(--text-secondary)]"
          onClick={onRegenerate}
          disabled={!hasBlueprint}
        >
          <Sparkles className="mr-2 h-4 w-4" /> Regenerate
        </Button>
      </div>
    </div>
  );
}
