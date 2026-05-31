// Parse the structured AI script output into UI-friendly sections.

export const HOOK_STEPS: { name: string; subLabel: string }[] = [
  { name: "PATTERN INTERRUPT", subLabel: "Stop the scroll" },
  { name: "MIRROR THE VIEWER", subLabel: "That's literally me" },
  { name: "REVEAL THE OPPORTUNITY", subLabel: "Shift their thinking" },
  { name: "EXPOSE THE GAP", subLabel: "Create curiosity" },
  { name: "PROMISE TRANSFORMATION", subLabel: "Show the value" },
  { name: "AUTHORITY / SYSTEMS", subLabel: "Build trust" },
  { name: "CLEAN TRANSITION", subLabel: "Start the content" },
];

export type HookStep = {
  n: number;
  name: string;
  subLabel: string;
  body: string;
};

export type BodySection = {
  n: number;
  letter: string;
  name: string;
  analogy: string;
  talkingPoints: string[];
  whyItMatters: string;
  screenShare: string;
  transition: string;
};

export type ThumbnailConcept = {
  expression: string;
  textOverlay: string;
  textColor: string;
  background: string;
  layout: string;
};

export type ParsedScript = {
  title: string;
  estimatedMinutes: string;
  hookSteps: HookStep[];
  framework: { acronym: string; tagline: string };
  bodySections: BodySection[];
  closeAndCta: string;
  thumbnail: ThumbnailConcept;
  isLegacy: boolean;
};

function pickLine(text: string, key: string): string {
  const re = new RegExp(`^\\s*${key}\\s*:\\s*(.+)$`, "im");
  const m = text.match(re);
  return m ? m[1].trim() : "";
}

function sliceBetween(md: string, startRe: RegExp, endRes: RegExp[]): string {
  const start = md.match(startRe);
  if (!start || start.index == null) return "";
  const from = start.index + start[0].length;
  let end = md.length;
  for (const r of endRes) {
    const m = md.slice(from).match(r);
    if (m && m.index != null) end = Math.min(end, from + m.index);
  }
  return md.slice(from, end).trim();
}

function parseHookSteps(text: string): HookStep[] {
  // Split on lines like "1. NAME | sub-label"
  const parts = text.split(/\n(?=\s*\d+\.\s+[A-Z][A-Z /]*\s*\|)/g);
  const out: HookStep[] = [];
  for (const part of parts) {
    const m = part.match(/^\s*(\d+)\.\s+([A-Z][A-Z /]*?)\s*\|\s*([^\n]+)\n?([\s\S]*)$/);
    if (!m) continue;
    out.push({
      n: parseInt(m[1], 10),
      name: m[2].trim(),
      subLabel: m[3].trim(),
      body: m[4].trim(),
    });
  }
  // Defensive: fill missing steps from canonical list
  const filled: HookStep[] = HOOK_STEPS.map((canon, i) => {
    const found = out.find((s) => s.n === i + 1) || out[i];
    return {
      n: i + 1,
      name: found?.name || canon.name,
      subLabel: found?.subLabel || canon.subLabel,
      body: found?.body || "",
    };
  });
  return filled;
}

function parseFrameworkLine(text: string): { acronym: string; tagline: string } {
  // Match "FRAMEWORK: ACRONYM - tagline" anywhere in text
  const m = text.match(/^\s*FRAMEWORK\s*:\s*([A-Z]{3,12})\s*(?:[-—:]\s*(.+))?$/im);
  if (!m) return { acronym: "", tagline: "" };
  return { acronym: m[1].trim(), tagline: (m[2] || "").trim() };
}

function parseBodySections(text: string): BodySection[] {
  // Split on lines like "1. C - Section Name"
  const parts = text.split(/\n(?=\s*\d+\.\s+[A-Z]\s*[-–—]\s+)/g);
  const out: BodySection[] = [];
  for (const part of parts) {
    const head = part.match(/^\s*(\d+)\.\s+([A-Z])\s*[-–—]\s+([^\n]+)\n?([\s\S]*)$/);
    if (!head) continue;
    const body = head[4];
    const analogy = pickMulti(body, "ANALOGY", ["TALKING POINTS", "WHY IT MATTERS", "SCREEN SHARE MOMENT", "TRANSITION"]);
    const tpBlock = pickMulti(body, "TALKING POINTS", ["WHY IT MATTERS", "SCREEN SHARE MOMENT", "TRANSITION"]);
    const why = pickMulti(body, "WHY IT MATTERS", ["SCREEN SHARE MOMENT", "TRANSITION"]);
    const screen = pickMulti(body, "SCREEN SHARE MOMENT", ["TRANSITION"]);
    const transitionRaw = pickMulti(body, "TRANSITION", []);
    const talkingPoints = tpBlock
      .split(/\n/)
      .map((l) => l.replace(/^\s*[-•*]\s*/, "").trim())
      .filter(Boolean);
    out.push({
      n: parseInt(head[1], 10),
      letter: head[2].trim(),
      name: head[3].trim(),
      analogy,
      talkingPoints,
      whyItMatters: why,
      screenShare: screen,
      transition: transitionRaw.replace(/^→\s*/, "").trim(),
    });
  }
  return out;
}

function pickMulti(text: string, label: string, stopLabels: string[]): string {
  const startRe = new RegExp(`^\\s*${label}\\s*:\\s*`, "im");
  const start = text.match(startRe);
  if (!start || start.index == null) return "";
  const from = start.index + start[0].length;
  let end = text.length;
  for (const stop of stopLabels) {
    const r = new RegExp(`^\\s*${stop}\\s*:`, "im");
    const m = text.slice(from).match(r);
    if (m && m.index != null) end = Math.min(end, from + m.index);
  }
  return text.slice(from, end).trim();
}

function parseThumbnail(text: string): ThumbnailConcept {
  return {
    expression: pickLine(text, "Expression"),
    textOverlay: pickLine(text, "Text overlay"),
    textColor: pickLine(text, "Text color"),
    background: pickLine(text, "Background"),
    layout: pickLine(text, "Layout"),
  };
}

export function parseScript(markdown: string): ParsedScript {
  const md = markdown.replace(/\r\n/g, "\n");

  const title = pickLine(md, "TITLE");
  const estimatedMinutes = pickLine(md, "ESTIMATED LENGTH").replace(/\s*minutes?\s*$/i, "").trim();

  const hookBlock = sliceBetween(
    md,
    /^---\s*INTRO:\s*7-STEP HOOK\s*---\s*$/im,
    [/^\s*FRAMEWORK\s*:/im, /^---\s*BODY\s*---/im, /^---\s*CLOSE AND CTA\s*---/im],
  );
  const framework = parseFrameworkLine(md);
  const bodyBlock = sliceBetween(
    md,
    /^---\s*BODY\s*---\s*$/im,
    [/^---\s*CLOSE AND CTA\s*---/im, /^\s*THUMBNAIL\s*:/im],
  );
  const closeBlock = sliceBetween(
    md,
    /^---\s*CLOSE AND CTA\s*---\s*$/im,
    [/^\s*THUMBNAIL\s*:/im],
  );
  const thumbBlock = sliceBetween(md, /^\s*THUMBNAIL\s*:\s*$/im, []);

  const hookSteps = parseHookSteps(hookBlock);
  const bodySections = parseBodySections(bodyBlock);

  // Legacy detection: old script format had "TITLE" with "Option 1 [Safe]..." or "[HOOK —" markers.
  const isLegacy =
    !title ||
    hookBlock.length === 0 ||
    bodySections.length === 0 ||
    /Option\s*\d+\s*\[/i.test(md) ||
    /\[HOOK\s*[—-]/i.test(md);

  return {
    title,
    estimatedMinutes,
    hookSteps,
    framework,
    bodySections,
    closeAndCta: closeBlock,
    thumbnail: parseThumbnail(thumbBlock),
    isLegacy,
  };
}

export function buildHookCopy(steps: HookStep[]): string {
  return steps
    .map((s) => `${s.n}. ${s.name} — ${s.subLabel}\n${s.body}`)
    .join("\n\n");
}

export function buildFullScriptCopy(p: ParsedScript): string {
  const lines: string[] = [];
  lines.push(`TITLE: ${p.title}`);
  if (p.estimatedMinutes) lines.push(`ESTIMATED LENGTH: ${p.estimatedMinutes} minutes`);
  lines.push("", "---INTRO: 7-STEP HOOK---", buildHookCopy(p.hookSteps));
  if (p.framework.acronym) {
    lines.push("", `FRAMEWORK: ${p.framework.acronym}${p.framework.tagline ? " - " + p.framework.tagline : ""}`);
  }
  lines.push("", "---BODY---");
  for (const s of p.bodySections) {
    lines.push(
      `\n${s.n}. ${s.letter} - ${s.name}`,
      `ANALOGY: ${s.analogy}`,
      `TALKING POINTS:`,
      ...s.talkingPoints.map((tp) => `- ${tp}`),
      `WHY IT MATTERS: ${s.whyItMatters}`,
      `SCREEN SHARE MOMENT: ${s.screenShare}`,
      `TRANSITION: → ${s.transition}`,
    );
  }
  lines.push("", "---CLOSE AND CTA---", p.closeAndCta);
  return lines.join("\n");
}
