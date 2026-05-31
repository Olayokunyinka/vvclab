import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Sparkles, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  analyzeMyChannel,
  deleteMyChannel,
  getMyChannel,
} from "@/lib/myChannel.functions";

type MyChannel = {
  id: string;
  channel_id: string;
  title: string;
  thumbnail_url: string | null;
  subscriber_count: number | null;
  videos_analyzed: number;
  style_profile: {
    toneKeywords?: string[];
    channelSummary?: string;
  } | null;
};

export function MyChannelCard({ onChange }: { onChange?: () => void }) {
  const [me, setMe] = useState<MyChannel | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [working, setWorking] = useState(false);

  const analyzeFn = useServerFn(analyzeMyChannel);
  const getFn = useServerFn(getMyChannel);
  const deleteFn = useServerFn(deleteMyChannel);

  async function load() {
    setLoading(true);
    try {
      const row = await getFn({});
      setMe(row as MyChannel | null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAnalyze(e?: React.FormEvent) {
    e?.preventDefault();
    if (!input.trim()) return;
    setWorking(true);
    try {
      const row = await analyzeFn({ data: { input: input.trim() } });
      setMe(row as MyChannel);
      setInput("");
      toast.success("Channel analysed");
      onChange?.();
    } catch (err: any) {
      toast.error(err.message || "Analysis failed");
    } finally {
      setWorking(false);
    }
  }

  async function handleReanalyze() {
    if (!me) return;
    setWorking(true);
    try {
      const row = await analyzeFn({ data: { input: me.channel_id } });
      setMe(row as MyChannel);
      toast.success("Re-analysed");
      onChange?.();
    } catch (err: any) {
      toast.error(err.message || "Analysis failed");
    } finally {
      setWorking(false);
    }
  }

  async function handleClear() {
    if (!confirm("Remove your channel and style profile?")) return;
    try {
      await deleteFn({});
      setMe(null);
      onChange?.();
    } catch (err: any) {
      toast.error(err.message || "Failed to clear");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">My channel</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex h-20 items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : me ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {me.thumbnail_url ? (
                <img src={me.thumbnail_url} alt="" className="h-10 w-10 rounded-full" />
              ) : (
                <div className="h-10 w-10 rounded-full bg-muted" />
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{me.title}</div>
                <div className="text-xs text-muted-foreground">
                  {me.videos_analyzed} video{me.videos_analyzed === 1 ? "" : "s"} analysed
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleReanalyze}
                disabled={working}
                title="Re-analyse"
              >
                {working ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleClear}
                title="Clear"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            {me.style_profile?.toneKeywords && me.style_profile.toneKeywords.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {me.style_profile.toneKeywords.slice(0, 6).map((k) => (
                  <Badge key={k} variant="secondary" className="text-[10px]">
                    {k}
                  </Badge>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Briefs will be auto-written in this voice.
            </p>
          </div>
        ) : (
          <form onSubmit={handleAnalyze} className="space-y-2">
            <Input
              placeholder="Your YouTube channel ID or URL"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={working}
            />
            <Button type="submit" className="w-full" disabled={working || !input.trim()}>
              {working ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Analyse my channel
            </Button>
            <p className="text-xs text-muted-foreground">
              We analyse your last 20 videos to learn your tone, then tailor every brief to your voice.
            </p>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
