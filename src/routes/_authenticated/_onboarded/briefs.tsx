import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, Loader2, Eye, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ScriptPanel } from "@/components/ScriptPanel";

export const Route = createFileRoute("/_authenticated/_onboarded/briefs")({
  head: () => ({ meta: [{ title: "My Scripts — VVCLab" }] }),
  component: BriefsPage,
});

type Row = {
  id: string;
  created_at: string;
  video_uuid: string;
  videos: {
    id: string;
    title: string;
    thumbnail_url: string | null;
  } | null;
};

function BriefsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<{ id: string; title: string } | null>(null);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("briefs")
      .select("id, created_at, video_uuid, videos(id, title, thumbnail_url)")
      .order("created_at", { ascending: false });
    setRows((data as any) || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 lg:px-10 lg:py-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight lg:text-[28px]">My Briefs</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every script you've generated, newest first.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-lg border border-border bg-card py-16 text-center">
          <FileText className="mx-auto mb-3 h-10 w-10 text-text-tertiary" />
          <h2 className="text-lg font-semibold">No scripts yet</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            Generate your version from any outlier on the Outliers page.
          </p>
          <Link
            to="/outliers"
            className="mt-4 inline-flex cursor-pointer items-center rounded-md bg-accent-amber px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Browse outliers →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <div
              key={r.id}
              className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-surface sm:flex-row sm:items-center sm:gap-4 lg:p-6"
            >
              {r.videos?.thumbnail_url ? (
                <img
                  src={r.videos.thumbnail_url}
                  alt=""
                  className="h-14 w-24 shrink-0 rounded object-cover sm:h-[54px]"
                />
              ) : (
                <div className="h-14 w-24 shrink-0 rounded bg-secondary sm:h-[54px]" />
              )}
              <div className="min-w-0 flex-1">
                <div className="line-clamp-2 text-sm font-semibold text-foreground lg:text-base">
                  {r.videos?.title || "Untitled video"}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Generated{" "}
                  {new Date(r.created_at).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
              </div>
              <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={() =>
                    r.videos && setActive({ id: r.videos.id, title: r.videos.title })
                  }
                  className="inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface sm:w-auto"
                >
                  <Eye className="h-3.5 w-3.5" />
                  View script
                </button>
                <button
                  type="button"
                  onClick={() =>
                    r.videos && setActive({ id: r.videos.id, title: r.videos.title })
                  }
                  className="inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface sm:w-auto"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy all
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ScriptPanel
        videoUuid={active?.id || null}
        videoTitle={active?.title}
        onClose={() => setActive(null)}
      />
    </div>
  );
}
