// Deterministic title/thumbnail/hook pattern detection — pure functions, no AI.

export type TitlePattern =
  | "Number list"
  | "How-to"
  | "Curiosity gap"
  | "VS Comparison"
  | "Bold claim"
  | "Question"
  | "Result reveal"
  | "Contrarian";

export type ThumbnailStyle =
  | "Talking head"
  | "Screen recording"
  | "Text-only"
  | "Before/after"
  | "Reaction face"
  | "Data chart";

export type HookType =
  | "Curiosity gap"
  | "Bold claim"
  | "Question"
  | "Story open"
  | "Result first";

export type DetectedPatterns = {
  titlePattern: TitlePattern | string;
  thumbnailStyle: ThumbnailStyle | string;
  hookType: HookType | string;
};

export function detectTitlePattern(title: string): TitlePattern {
  const t = title.trim();
  const lower = t.toLowerCase();
  if (/^\d{1,3}\s+[a-z]/i.test(t) || /\b(top|best|worst)\s+\d{1,3}\b/i.test(t))
    return "Number list";
  if (/^how to\b|^how i\b|^how we\b/i.test(t)) return "How-to";
  if (/\bvs\.?\b|\bversus\b/i.test(t)) return "VS Comparison";
  if (t.endsWith("?") || /^(why|what|when|where|who|which|is|are|can|should|do|does)\b/i.test(t))
    return "Question";
  if (
    /\b(i made|i tried|i built|i spent|i turned|results|after \d+|in \d+ (days|weeks|months))\b/i.test(
      t,
    )
  )
    return "Result reveal";
  if (
    /\b(nobody|no one|everyone is wrong|stop|don't|dont|never|the truth|unpopular|hot take)\b/i.test(
      t,
    )
  )
    return "Contrarian";
  if (
    /\b(secret|nobody tells|hidden|what they don't|you won't believe|before you|the real reason)\b/i.test(
      lower,
    )
  )
    return "Curiosity gap";
  return "Bold claim";
}

export function detectThumbnailStyle(title: string, _thumbUrl?: string | null): ThumbnailStyle {
  const t = title.toLowerCase();
  if (/\b(before|after|transformation|from .* to )\b/i.test(t)) return "Before/after";
  if (/\b(reacting|reaction|reacts to|i watched|first time)\b/i.test(t)) return "Reaction face";
  if (
    /\b(tutorial|coding|build|code|app|software|setup|review|using|tested|demo)\b/i.test(t)
  )
    return "Screen recording";
  if (/\b(\d+%|\$\d|chart|stats|data|analysis|results|growth|revenue)\b/i.test(t))
    return "Data chart";
  if (/\b(quote|fact|did you know|truth about)\b/i.test(t)) return "Text-only";
  return "Talking head";
}

export function detectHookType(title: string): HookType {
  const t = title.trim();
  if (t.endsWith("?") || /^(why|what|when|where|who|which|is|are|can|should|do|does)\b/i.test(t))
    return "Question";
  if (
    /\b(secret|nobody|hidden|the truth|you won't believe|before you|what they don't)\b/i.test(t)
  )
    return "Curiosity gap";
  if (/\b(i made|i tried|i spent|i built|i turned|results|after \d+)\b/i.test(t))
    return "Result first";
  if (/\b(my story|how i went|the day|when i|the time)\b/i.test(t)) return "Story open";
  return "Bold claim";
}

export function detectPatterns(title: string, thumbUrl?: string | null): DetectedPatterns {
  return {
    titlePattern: detectTitlePattern(title),
    thumbnailStyle: detectThumbnailStyle(title, thumbUrl),
    hookType: detectHookType(title),
  };
}
