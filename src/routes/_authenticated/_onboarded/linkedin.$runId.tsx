import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Linkedin, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  getLinkedInRun,
  generateLinkedInPosts,
  generateLinkedInPostImage,
  updateLinkedInRunPost,
} from "@/lib/linkedin.functions";
import { useBrandBlueprint } from "@/hooks/useBrandBlueprint";
import {
  ResultsState,
  type PostCard,
  type ResultsVideo,
  type ImageState,
} from "./linkedin";

export const Route = createFileRoute("/_authenticated/_onboarded/linkedin/$runId")({
  head: () => ({
    meta: [{ title: "Saved LinkedIn run — VVCLab" }],
  }),
  component: SavedRunPage,
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-3xl px-6 py-10 text-sm text-destructive">
      Couldn't load this run: {error.message}
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-6 py-10 text-sm text-muted-foreground">
      Run not found.
    </div>
  ),
});

type SavedPost = {
  id: string;
  idx: number;
  type: PostCard["type"];
  hook: string;
  body: string;
  cta: string | null;
  image_prompt: string | null;
  image_path: string | null;
  imageUrl: string | null;
};

function SavedRunPage() {
  const { runId } = Route.useParams();
  const { blueprint } = useBrandBlueprint();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const getRun = useServerFn(getLinkedInRun);
  const genPosts = useServerFn(generateLinkedInPosts);
  const genImage = useServerFn(generateLinkedInPostImage);
  const updatePost = useServerFn(updateLinkedInRunPost);

  const [regeneratingIdx, setRegeneratingIdx] = useState<number | null>(null);
  const [images, setImages] = useState<Record<number, ImageState>>({});

  const { data, isLoading, error } = useQuery({
    queryKey: ["linkedin-run", runId],
    queryFn: () => getRun({ data: { runId } }),
  });

  // Seed image state from persisted images on load / refresh
  useEffect(() => {
    if (!data) return;
    const seeded: Record<number, ImageState> = {};
    (data.posts as SavedPost[]).forEach((p, i) => {
      if (p.imageUrl) seeded[i] = { status: "ready", dataUrl: p.imageUrl };
    });
    setImages(seeded);
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10 text-sm text-destructive">
        {error instanceof Error ? error.message : "Failed to load run."}
      </div>
    );
  }

  const video: ResultsVideo = {
    videoId: data.run.video_id,
    title: data.run.video_title,
    thumbnail: data.run.video_thumbnail,
    channelTitle: data.run.video_channel ?? "",
  };

  const savedPosts = data.posts as SavedPost[];

  const posts: PostCard[] = savedPosts.map((p) => ({
    type: p.type,
    hook: p.hook,
    body: p.body,
    cta: p.cta ?? "",
  }));

  function copyPost(p: PostCard) {
    const text = `${p.hook}\n\n${p.body}\n\n${p.cta}`;
    navigator.clipboard.writeText(text).then(
      () => toast.success("Copied to clipboard"),
      () => toast.error("Could not copy"),
    );
  }

  async function handleGenerateImage(idx: number) {
    const target = savedPosts[idx];
    if (!target) return;
    setImages((prev) => ({ ...prev, [idx]: { status: "generating" } }));
    try {
      const { dataUrl } = await genImage({
        data: {
          postType: target.type,
          post: { hook: target.hook, body: target.body, cta: target.cta },
        },
      });
      setImages((prev) => ({ ...prev, [idx]: { status: "ready", dataUrl } }));
      // persist to storage so it survives refresh
      try {
        await updatePost({
          data: {
            postId: target.id,
            runId,
            idx: target.idx,
            type: target.type,
            hook: target.hook,
            body: target.body,
            cta: target.cta,
            imageDataUrl: dataUrl,
          },
        });
        await qc.invalidateQueries({ queryKey: ["linkedin-run", runId] });
      } catch (e) {
        console.error("persist image failed", e);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Image generation failed";
      setImages((prev) => ({ ...prev, [idx]: { status: "error", error: msg } }));
      toast.error(msg);
    }
  }

  async function handleRegenerateOne(idx: number) {
    if (!data) return;
    const target = savedPosts[idx];
    if (!target) return;
    setRegeneratingIdx(idx);
    try {
      const { posts: regen } = await genPosts({
        data: {
          video: {
            videoId: data.run.video_id,
            title: data.run.video_title,
            description: "",
            thumbnail: data.run.video_thumbnail,
            channelTitle: data.run.video_channel ?? "",
            tags: [],
            durationSeconds: 0,
            publishedAt: "",
          },
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

      await updatePost({
        data: {
          postId: target.id,
          runId,
          idx: target.idx,
          type: fresh.type,
          hook: fresh.hook,
          body: fresh.body,
          cta: fresh.cta,
        },
      });

      // Clear image — text changed
      setImages((prev) => {
        const next = { ...prev };
        delete next[idx];
        return next;
      });

      await qc.invalidateQueries({ queryKey: ["linkedin-run", runId] });
      toast.success("Regenerated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Regenerate failed");
    } finally {
      setRegeneratingIdx(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-6 py-10 md:px-10">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Linkedin className="h-6 w-6 text-sky-500" />
          <span className="text-sm font-medium text-muted-foreground">
            Saved LinkedIn run · {new Date(data.run.created_at).toLocaleString()}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate({ to: "/linkedin" })}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          New run
        </Button>
      </div>

      <ResultsState
        video={video}
        posts={posts}
        images={images}
        onCopy={copyPost}
        onRegenerateOne={handleRegenerateOne}
        onGenerateImage={handleGenerateImage}
        regeneratingIdx={regeneratingIdx}
      />
    </div>
  );
}
