const YT_API = "https://www.googleapis.com/youtube/v3";

export function parseDuration(iso: string): number {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return (+(m[1] || 0)) * 3600 + (+(m[2] || 0)) * 60 + (+(m[3] || 0));
}

const KEY_MISSING_MSG =
  "YouTube API key is missing. Add YOUTUBE_API_KEY in Settings → Integrations.";
const KEY_INVALID_MSG =
  "YouTube API key is invalid or out of quota. Update YOUTUBE_API_KEY in Settings → Integrations.";

export async function ytFetch(path: string, params: Record<string, string>) {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new Error(KEY_MISSING_MSG);
  const url = new URL(`${YT_API}/${path}`);
  Object.entries({ ...params, key }).forEach(([k, v]) => url.searchParams.set(k, v));
  const r = await fetch(url.toString());
  if (!r.ok) {
    if (r.status === 400 || r.status === 401 || r.status === 403) {
      throw new Error(KEY_INVALID_MSG);
    }
    const t = await r.text();
    throw new Error(`YouTube API ${r.status}: ${t.slice(0, 200)}`);
  }
  return r.json();
}

export async function resolveChannelId(raw: string): Promise<string> {
  const trimmed = raw.trim();
  if (/^UC[A-Za-z0-9_-]{20,}$/.test(trimmed)) return trimmed;

  let handle: string | null = null;
  let channelIdFromUrl: string | null = null;
  if (trimmed.startsWith("@")) {
    handle = trimmed.slice(1);
  } else {
    try {
      const u = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
      const parts = u.pathname.split("/").filter(Boolean);
      if (parts[0]?.startsWith("@")) handle = parts[0].slice(1);
      else if (parts[0] === "channel" && parts[1]) channelIdFromUrl = parts[1];
      else if (parts[0] === "c" && parts[1]) handle = parts[1];
      else if (parts[0] === "user" && parts[1]) handle = parts[1];
    } catch {
      handle = trimmed;
    }
  }

  if (channelIdFromUrl) return channelIdFromUrl;

  if (handle) {
    try {
      const r = await ytFetch("channels", { part: "id", forHandle: handle });
      if (r.items?.[0]?.id) return r.items[0].id;
    } catch { /* fall through */ }
    const s = await ytFetch("search", {
      part: "snippet", type: "channel", q: handle, maxResults: "1",
    });
    const id = s.items?.[0]?.snippet?.channelId || s.items?.[0]?.id?.channelId;
    if (id) return id;
  }

  throw new Error(`Could not resolve channel from "${raw}"`);
}
