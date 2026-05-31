import { useMemo, useState } from "react";
import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Sparkles,
  Copy,
  Loader2,
  RefreshCw,
  Linkedin,
  History,
  Trash2,
  ImagePlus,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useBrandBlueprint } from "@/hooks/useBrandBlueprint";
import {
  getVideoMetadata,
  generateLinkedInPosts,
  generateLinkedInPostImage,
  saveLinkedInRun,
  listLinkedInRuns,
  deleteLinkedInRun,
  type VideoMeta,
  type LinkedInPost,
} from "@/lib/linkedin.functions";

export const Route = createFileRoute("/_authenticated/_onboarded/linkedin")({
  head: () => ({
    meta: [
      { title: "LinkedIn Engine — VVCLab" },
      {
        name: "description",
        content: "Turn any YouTube video into 6 LinkedIn posts in 30 seconds.",
      },
    ],
  }),
  component: LinkedInPage,
});

const ALL_TOPICS = [
  "Story",
  "Framework",
  "Contrarian",
  "Data Insight",
  "Quick Win",
  "Bold Take",
] as const;
type Topic = (typeof ALL_TOPICS)[number];

export const TOPIC_COLORS: Record<Topic, string> = {
  Story: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
  Framework: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  Contrarian: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  "Data Insight": "bg-sky-500/15 text-sky-400 border-sky-500/30",
  "Quick Win": "bg-amber-500/15 text-amber-400 border-amber-500/30",
  "Bold Take": "bg-violet-500/15 text-violet-400 border-violet-500/30",
};

export const IMAGE_STYLE_HINT: Record<Topic, string> = {
  Story: "Documentary style · authentic, warm, no text overlay",
  Framework: "Infographic style · structured, scannable, high contrast",
  "Data Insight": "Data visualization · dominant stat, dark bg, gold accent",
  Contrarian: "Typographic tension · high contrast, stark, disruptive",
  "Quick Win": "Actionable energy · checklist aesthetic, bright colors",
  "Bold Take": "Billboard typography · one statement, massive scale",
};

export type PostCard = LinkedInPost;

export type ImageState =
  | { status: "idle" }
  | { status: "generating" }
  | { status: "ready"; dataUrl: string }
  | { status: "error"; error: string };

type Stage = "input" | "generating" | "results";

function slugify(t: string) {
  return t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function downloadImage(dataUrl: string, postType: Topic) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = `vvclab-${slugify(postType)}-image.jpg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function LinkedInPage() {
  const { blueprint, ready } = useBrandBlueprint();
  const navigate = useNavigate();

  const [stage, setStage] = useState<Stage>("input");
  const [url, setUrl] = useState("");
  const [selected, setSelected] = useState<Set<Topic>>(new Set(ALL_TOPICS));
  const [video, setVideo] = useState<VideoMeta | null>(null);
  const [posts, setPosts] = useState<PostCard[]>([]);
  const [images, setImages] = useState<Record<number, ImageState>>({});
  const [regeneratingIdx, setRegeneratingIdx] = useState<number | null>(null);

  const fetchMeta = useServerFn(getVideoMetadata);
  const fetchPosts = useServerFn(generateLinkedInPosts);
  const fetchImage = useServerFn(generateLinkedInPostImage);
  const saveRun = useServerFn(saveLinkedInRun);

  const metaMut = useMutation({ mutationFn: (u: string) => fetchMeta({ data: { url: u } }) });
  const postsMut = useMutation({
    mutationFn: (vars: { video: VideoMeta; topics: Topic[] }) =>
      fetchPosts({
        data: {
          video: vars.video,
          blueprint: {
            name: blueprint?.name ?? "",
            youtubeNiche: blueprint?.youtubeNiche ?? "",
            brandVoice: blueprint?.brandVoice ?? "",
            targetAudience: blueprint?.targetAudience ?? "",
            contentPillars: blueprint?.contentPillars ?? [],
            brandSummary: blueprint?.brandSummary ?? "",
          },
          selectedTopics: vars.topics,
        },
      }),
  });

  const selectedTopics = useMemo(() => [...selected] as Topic[], [selected]);

  function toggleTopic(t: Topic) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(t)) {
        if (next.size <= 1) return prev;
        next.delete(t);
      } else {
        next.add(t);
      }
      return next;
    });
  }

  async function persistRun(meta: VideoMeta, items: PostCard[]) {
    try {
      const { runId } = await saveRun({
        data: {
          video: {
            videoId: meta.videoId,
            title: meta.title,
            thumbnail: meta.thumbnail,
            channelTitle: meta.channelTitle,
          },
          posts: items.map((p) => ({
            type: p.type,
            hook: p.hook,
            body: p.body,
            cta: p.cta,
          })),
        },
      });
      navigate({
        to: "/linkedin/$runId",
        params: { runId },
        replace: true,
      });
    } catch (e) {
      console.error("save failed", e);
      toast.error("Couldn't save this run — results still visible below.");
    }
  }

  async function handleGenerate() {
    if (!blueprint) {
      toast.error("Build your brand blueprint first.");
      return;
    }
    if (!url.trim()) {
      toast.error("Paste a YouTube URL first.");
      return;
    }
    if (selected.size === 0) {
      toast.error("Pick at least one post type.");
      return;
    }
    setStage("generating");
    setVideo(null);
    setPosts([]);
    setImages({});
    try {
      const meta = await metaMut.mutateAsync(url);
      setVideo(meta);
      const { posts: generated } = await postsMut.mutateAsync({
        video: meta,
        topics: selectedTopics,
      });
      setPosts(generated);
      setStage("results");
      void persistRun(meta, generated);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      toast.error(msg);
      setStage("input");
    }
  }

  function copyPost(p: PostCard) {
    const text = `${p.hook}\n\n${p.body}\n\n${p.cta}`;
    navigator.clipboard.writeText(text).then(
      () => toast.success("Copied to clipboard"),
      () => toast.error("Could not copy"),
    );
  }

  async function handleGenerateImage(idx: number) {
    const target = posts[idx];
    if (!target) return;
    setImages((prev) => ({ ...prev, [idx]: { status: "generating" } }));
    try {
      const { dataUrl } = await fetchImage({
        data: {
          postType: target.type,
          post: { hook: target.hook, body: target.body, cta: target.cta ?? null },
        },
      });
      setImages((prev) => ({ ...prev, [idx]: { status: "ready", dataUrl } }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Image generation failed";
      setImages((prev) => ({ ...prev, [idx]: { status: "error", error: msg } }));
      toast.error(msg);
    }
  }

  async function handleRegenerateOne(idx: number) {
    if (!video) return;
    const target = posts[idx];
    if (!target) return;
    setRegeneratingIdx(idx);
    try {
      const { posts: regen } = await fetchPosts({
        data: {
          video,
          blueprint: {
            name: blueprint?.name ?? "",
            youtubeNiche: blueprint?.youtubeNiche ?? "",
            brandVoice: blueprint?.brandVoice ?? "",
            targetAudience: blueprint?.targetAudience ?? "",
            contentPillars: blueprint?.contentPillars ?? [],
            brandSummary: blueprint?.brandSummary ?? "",
          },
          selectedTopics: [target.type],
          temperature: 0.9,
        },
      });
      const fresh = regen[0];
      if (!fresh) throw new Error("No post returned");
      setPosts((prev) => prev.map((p, i) => (i === idx ? fresh : p)));
      // clear image — text changed
      setImages((prev) => {
        const next = { ...prev };
        delete next[idx];
        return next;
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Regenerate failed");
    } finally {
      setRegeneratingIdx(null);
    }
  }

  if (!ready) return null;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 lg:space-y-8 lg:px-10 lg:py-10">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Linkedin className="h-6 w-6 text-sky-500" />
          <span className="text-sm font-medium text-muted-foreground">LinkedIn Engine</span>
        </div>
        <PastRunsDrawer />
      </div>

      {stage === "input" && (
        <InputState
          url={url}
          setUrl={setUrl}
          niche={blueprint?.youtubeNiche ?? ""}
          selected={selected}
          toggle={toggleTopic}
          onGenerate={handleGenerate}
          hasBlueprint={!!blueprint}
        />
      )}

      {stage === "generating" && (
        <GeneratingState video={video} topicsCount={selected.size} />
      )}

      {stage === "results" && video && (
        <ResultsState
          video={video}
          posts={posts}
          images={images}
          onRegenerate={handleGenerate}
          onRegenerateOne={handleRegenerateOne}
          onGenerateImage={handleGenerateImage}
          onCopy={copyPost}
          regenerating={postsMut.isPending || metaMut.isPending}
          regeneratingIdx={regeneratingIdx}
        />
      )}
    </div>
  );
}

function InputState({
  url,
  setUrl,
  niche,
  selected,
  toggle,
  onGenerate,
  hasBlueprint,
}: {
  url: string;
  setUrl: (v: string) => void;
  niche: string;
  selected: Set<Topic>;
  toggle: (t: Topic) => void;
  onGenerate: () => void;
  hasBlueprint: boolean;
}) {
  return (
    <div className="space-y-10">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
          Turn any video into LinkedIn
        </h1>
        <p className="max-w-2xl text-base text-muted-foreground md:text-lg">
          Paste a YouTube URL. Get 6 posts on 6 different topics in 30 seconds.
        </p>
      </div>

      {!hasBlueprint && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
          Build your Brand Blueprint first so posts match your voice.
        </div>
      )}

      <div className="space-y-3">
        <label className="text-sm font-medium">Paste your URL</label>
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          className="h-12"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Your niche</label>
        <Input value={niche} readOnly className="h-12 bg-muted/40" />
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium">Post types</label>
        <div className="flex flex-wrap gap-2">
          {ALL_TOPICS.map((t) => {
            const active = selected.has(t);
            return (
              <button
                key={t}
                type="button"
                onClick={() => toggle(t)}
                className={`rounded-full border px-4 py-1.5 text-sm transition ${
                  active
                    ? TOPIC_COLORS[t]
                    : "border-border bg-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>

      <Button
        onClick={onGenerate}
        className="h-12 w-full bg-accent-amber text-black hover:bg-accent-amber/90"
      >
        <Sparkles className="mr-2 h-4 w-4" />
        Generate LinkedIn Posts
      </Button>
    </div>
  );
}

function GeneratingState({ video, topicsCount }: { video: VideoMeta | null; topicsCount: number }) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-16 text-center">
      {video && (
        <div className="flex max-w-xl flex-col items-center gap-3 rounded-xl border border-border bg-card p-4 text-center lg:flex-row lg:items-center lg:gap-4 lg:text-left">
          {video.thumbnail && (
            <img
              src={video.thumbnail}
              alt={video.title}
              className="h-16 w-28 rounded object-cover"
            />
          )}
          <div className="text-center lg:text-left">
            <div className="line-clamp-2 text-sm font-medium">{video.title}</div>
            <div className="mt-1 text-xs text-muted-foreground">{video.channelTitle}</div>
          </div>
        </div>
      )}
      <div className="flex items-center gap-3 text-sm font-medium lg:text-base">
        <Loader2 className="h-5 w-5 animate-spin text-accent-amber" />
        Writing your posts…
      </div>
      <div className="text-sm text-muted-foreground">
        Generating 6 posts across {topicsCount} topics
      </div>
    </div>
  );
}

export type ResultsVideo = {
  videoId: string;
  title: string;
  thumbnail: string | null;
  channelTitle: string;
};

function PostImageSection({
  state,
  postType,
  onGenerate,
}: {
  state: ImageState;
  postType: Topic;
  onGenerate: () => void;
}) {
  if (state.status === "ready") {
    return (
      <div className="space-y-2">
        <img
          src={state.dataUrl}
          alt=""
          className="aspect-video w-full rounded-lg object-cover"
        />
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onGenerate}
            className="text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Regenerate
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => downloadImage(state.dataUrl, postType)}
            className="text-accent-amber hover:text-accent-amber/80"
          >
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Download
          </Button>
        </div>
      </div>
    );
  }

  if (state.status === "generating") {
    return (
      <div className="space-y-2">
        <div className="h-[120px] w-full animate-pulse rounded-lg bg-gradient-to-r from-muted/40 via-muted/70 to-muted/40 bg-[length:200%_100%]" />
        <Button
          variant="outline"
          size="sm"
          disabled
          className="border-accent-amber/60 text-accent-amber"
        >
          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          Generating…
        </Button>
      </div>
    );
  }

  // idle + error
  return (
    <div className="space-y-2">
      <div className="flex h-[120px] w-full flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border bg-muted/30">
        <ImagePlus className="h-5 w-5 text-muted-foreground/70" />
        <span className="text-[13px] text-muted-foreground">
          {state.status === "error" ? "Generation failed" : "Generate image"}
        </span>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onGenerate}
        className="border-accent-amber text-accent-amber hover:bg-accent-amber/10 hover:text-accent-amber"
      >
        {state.status === "error" ? "Retry" : "Generate image"}
      </Button>
    </div>
  );
}

export function ResultsState({
  video,
  posts,
  images,
  onRegenerate,
  onRegenerateOne,
  onGenerateImage,
  onCopy,
  regenerating,
  regeneratingIdx,
}: {
  video: ResultsVideo;
  posts: PostCard[];
  images: Record<number, ImageState>;
  onRegenerate?: () => void;
  onRegenerateOne?: (idx: number) => void;
  onGenerateImage: (idx: number) => void;
  onCopy: (p: PostCard) => void;
  regenerating?: boolean;
  regeneratingIdx?: number | null;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 rounded-xl border border-border bg-card p-4 lg:flex-row lg:items-center">
        <div className="flex w-full flex-col items-center gap-3 text-center lg:w-auto lg:flex-row lg:items-center lg:gap-4 lg:text-left">
          {video.thumbnail && (
            <img
              src={video.thumbnail}
              alt={video.title}
              className="h-16 w-28 rounded object-cover"
            />
          )}
          <div>
            <div className="line-clamp-2 text-sm font-medium">{video.title}</div>
            <div className="mt-1 text-xs text-muted-foreground">{video.channelTitle}</div>
          </div>
        </div>
        {onRegenerate && (
          <Button
            onClick={onRegenerate}
            disabled={regenerating}
            className="w-full bg-accent-amber text-black hover:bg-accent-amber/90 lg:w-auto"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Generate LinkedIn Posts
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {posts.map((p, idx) => {
          const imageState: ImageState = images[idx] ?? { status: "idle" };
          return (
            <div
              key={idx}
              className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 lg:p-5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col gap-1">
                  <span
                    className={`self-start rounded-full border px-3 py-0.5 text-xs font-medium ${TOPIC_COLORS[p.type]}`}
                  >
                    {p.type}
                  </span>
                  <span className="text-[11px] italic text-muted-foreground/70">
                    {IMAGE_STYLE_HINT[p.type]}
                  </span>
                </div>
                <button
                  onClick={() => onCopy(p)}
                  className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label="Copy post"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>

              <p className="whitespace-pre-wrap text-sm leading-relaxed lg:text-base">
                <span className="font-semibold">{p.hook}</span>
                {"\n\n"}
                {p.body}
                {"\n\n"}
                <span className="text-muted-foreground">{p.cta}</span>
              </p>

              <PostImageSection
                state={imageState}
                postType={p.type}
                onGenerate={() => onGenerateImage(idx)}
              />

              {onRegenerateOne && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRegenerateOne(idx)}
                  disabled={regeneratingIdx === idx}
                  className="w-full justify-center text-muted-foreground hover:text-foreground lg:w-auto lg:self-start lg:justify-start"
                >
                  {regeneratingIdx === idx ? (
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-3.5 w-3.5" />
                  )}
                  Regenerate this one
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PastRunsDrawer() {
  const [open, setOpen] = useState(false);
  const list = useServerFn(listLinkedInRuns);
  const del = useServerFn(deleteLinkedInRun);
  const qc = useQueryClient();
  const router = useRouter();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["linkedin-runs"],
    queryFn: () => list({}),
    enabled: open,
  });

  async function handleDelete(runId: string) {
    try {
      await del({ data: { runId } });
      await qc.invalidateQueries({ queryKey: ["linkedin-runs"] });
      router.invalidate();
      toast.success("Run deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <History className="mr-2 h-4 w-4" />
          Past runs
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Past runs</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-2 overflow-y-auto pb-6">
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          )}
          {!isLoading && (data?.runs ?? []).length === 0 && (
            <div className="text-sm text-muted-foreground">No runs yet.</div>
          )}
          {(data?.runs ?? []).map((r) => (
            <div
              key={r.id}
              className="group flex items-center gap-3 rounded-lg border border-border bg-card p-3 hover:border-accent-amber/40"
            >
              <button
                className="flex flex-1 items-center gap-3 text-left"
                onClick={() => {
                  setOpen(false);
                  navigate({ to: "/linkedin/$runId", params: { runId: r.id } });
                }}
              >
                {r.video_thumbnail && (
                  <img
                    src={r.video_thumbnail}
                    alt=""
                    className="h-12 w-20 rounded object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="line-clamp-2 text-sm font-medium">{r.video_title}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString()} · {r.video_channel}
                  </div>
                </div>
              </button>
              <button
                onClick={() => handleDelete(r.id)}
                aria-label="Delete run"
                className="rounded p-1.5 text-muted-foreground opacity-0 transition hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
