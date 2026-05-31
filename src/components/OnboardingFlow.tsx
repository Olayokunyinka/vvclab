import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Sparkles, Rocket, Youtube, ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { generateBrandBlueprint } from "@/lib/brandBlueprint.functions";
import { addChannel, refreshChannelVideos } from "@/lib/youtube.functions";
import {
  saveBlueprint,
  type BlueprintPath,
  type BrandBlueprint,
  type Ikigai,
} from "@/lib/brandBlueprint";

type Props = {
  initial?: BrandBlueprint | null;
  onComplete: () => void;
  onCancel?: () => void;
};

type Step = 0 | 1 | 2 | 3 | 4 | 5;

const IKIGAI_STEPS: Array<{
  key: keyof Ikigai;
  title: string;
  hint: string;
  placeholder: string;
}> = [
  {
    key: "love",
    title: "What do you love?",
    hint: "Topics you could talk about for hours.",
    placeholder: "I could talk for hours about…",
  },
  {
    key: "great",
    title: "What are you great at?",
    hint: "Skills that come naturally to you.",
    placeholder: "People come to me when they need help with…",
  },
  {
    key: "need",
    title: "What does the world need?",
    hint: "Problems you see that need solving.",
    placeholder: "The thing I keep seeing people get wrong is…",
  },
  {
    key: "paid",
    title: "What can you be paid for?",
    hint: "What people would pay you to teach or do.",
    placeholder: "People already pay me (or would pay me) to…",
  },
];

export function OnboardingFlow({ initial, onComplete, onCancel }: Props) {
  const generateFn = useServerFn(generateBrandBlueprint);
  const addChannelFn = useServerFn(addChannel);
  const refreshFn = useServerFn(refreshChannelVideos);

  const [step, setStep] = useState<Step>(0);
  const [name, setName] = useState(initial?.name ?? "");
  const [path, setPath] = useState<BlueprintPath | null>(initial?.path ?? null);
  const [youtubeUrl, setYoutubeUrl] = useState(initial?.youtubeUrl ?? "");
  const [ikigai, setIkigai] = useState<Ikigai>(
    initial?.ikigai ?? { love: "", great: "", need: "", paid: "" },
  );
  const [submitting, setSubmitting] = useState(false);

  const isRefine = !!initial;

  function next() {
    setStep((s) => (Math.min(5, s + 1) as Step));
  }
  function back() {
    setStep((s) => (Math.max(0, s - 1) as Step));
  }

  function canAdvanceWelcome(): boolean {
    if (!name.trim()) return false;
    if (!path) return false;
    if (path === "existing" && !youtubeUrl.trim()) return false;
    return true;
  }

  function canAdvanceIkigai(stepIndex: 1 | 2 | 3 | 4): boolean {
    const ikStep = IKIGAI_STEPS[stepIndex - 1];
    return ikigai[ikStep.key].trim().length >= 10;
  }

  async function handleSubmit() {
    if (!path) return;
    setSubmitting(true);
    setStep(5);
    try {
      const result = await generateFn({
        data: {
          name: name.trim(),
          path,
          youtubeUrl: youtubeUrl.trim() || undefined,
          ikigai,
        },
      });

      const now = new Date().toISOString();
      const blueprint: BrandBlueprint = {
        name: name.trim(),
        path,
        youtubeUrl: youtubeUrl.trim() || undefined,
        ikigai,
        ...result,
        createdAt: initial?.createdAt ?? now,
        updatedAt: now,
      };
      saveBlueprint(blueprint);

      // Fire-and-forget: import their channel if they have one and we haven't yet
      if (path === "existing" && youtubeUrl.trim() && !isRefine) {
        (async () => {
          try {
            const ch = await addChannelFn({
              data: { input: youtubeUrl.trim() },
            });
            if ("ownChannel" in ch) {
              toast.message(ch.message);
            } else {
              await refreshFn({ data: { channelUuid: ch.id } });
              toast.success(`Imported your channel: ${ch.title}`);
            }
          } catch (err: any) {
            toast.error(
              err?.message || "Couldn't import your YouTube channel",
            );
          }
        })();
      }

      toast.success(isRefine ? "Blueprint updated" : "Blueprint ready");
      onComplete();
    } catch (e: any) {
      toast.error(e?.message || "Failed to generate blueprint");
      setStep(4);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-background/95 px-4 py-8 backdrop-blur">
      <div className="w-full max-w-2xl">
        {/* Progress */}
        <div className="mb-6 flex items-center justify-center gap-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`h-1.5 w-10 rounded-full transition-colors ${
                step >= i ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        <Card className="border-2">
          <CardContent className="p-6 sm:p-8">
            {step === 0 && (
              <div className="space-y-6">
                <div className="space-y-2 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <h2 className="text-2xl font-semibold">
                    {isRefine
                      ? "Refine your blueprint"
                      : "Build your Personal Brand Blueprint"}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    A 4-question Ikigai exercise that anchors every video
                    you'll ever make on this channel.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Your name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Rivera"
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <Label>Where are you today?</Label>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setPath("starting")}
                      className={`flex flex-col items-start gap-2 rounded-lg border-2 p-4 text-left transition-colors ${
                        path === "starting"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-muted-foreground/30"
                      }`}
                    >
                      <Rocket className="h-5 w-5 text-primary" />
                      <div className="font-medium">I'm just starting out</div>
                      <div className="text-xs text-muted-foreground">
                        No channel yet — help me figure out what to make.
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPath("existing")}
                      className={`flex flex-col items-start gap-2 rounded-lg border-2 p-4 text-left transition-colors ${
                        path === "existing"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-muted-foreground/30"
                      }`}
                    >
                      <Youtube className="h-5 w-5 text-destructive" />
                      <div className="font-medium">I already have a channel</div>
                      <div className="text-xs text-muted-foreground">
                        Analyse my existing videos and sharpen my direction.
                      </div>
                    </button>
                  </div>
                </div>

                {path === "existing" && (
                  <div className="space-y-2">
                    <Label htmlFor="yt">Your YouTube channel</Label>
                    <Input
                      id="yt"
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      placeholder="@handle, channel URL, or UC… ID"
                    />
                    <p className="text-xs text-muted-foreground">
                      We'll fetch your latest videos so the blueprint can
                      match your current style.
                    </p>
                  </div>
                )}
              </div>
            )}

            {step >= 1 && step <= 4 && (
              <div className="space-y-5">
                <div className="space-y-1">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">
                    Ikigai · Step {step} of 4
                  </div>
                  <h2 className="text-2xl font-semibold">
                    {IKIGAI_STEPS[step - 1].title}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {IKIGAI_STEPS[step - 1].hint}
                  </p>
                </div>

                <Textarea
                  rows={7}
                  value={ikigai[IKIGAI_STEPS[step - 1].key]}
                  onChange={(e) =>
                    setIkigai({
                      ...ikigai,
                      [IKIGAI_STEPS[step - 1].key]: e.target.value,
                    })
                  }
                  placeholder={IKIGAI_STEPS[step - 1].placeholder}
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  At least a sentence or two — the more specific, the sharper
                  your blueprint.
                </p>
              </div>
            )}

            {step === 5 && (
              <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
                {submitting ? (
                  <>
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <div className="space-y-1">
                      <h2 className="text-lg font-semibold">
                        Crafting your blueprint…
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Turning your Ikigai into pillars, voice, and a niche.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <Check className="h-10 w-10 text-primary" />
                    <h2 className="text-lg font-semibold">Done!</h2>
                  </>
                )}
              </div>
            )}

            {/* Footer */}
            {step !== 5 && (
              <div className="mt-8 flex items-center justify-between gap-3">
                <div>
                  {step > 0 ? (
                    <Button variant="ghost" onClick={back}>
                      <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
                    </Button>
                  ) : isRefine && onCancel ? (
                    <Button variant="ghost" onClick={onCancel}>
                      Cancel
                    </Button>
                  ) : (
                    <span />
                  )}
                </div>
                {step < 4 ? (
                  <Button
                    onClick={next}
                    disabled={
                      step === 0
                        ? !canAdvanceWelcome()
                        : !canAdvanceIkigai(step as 1 | 2 | 3 | 4)
                    }
                  >
                    Next <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={!canAdvanceIkigai(4)}
                  >
                    <Sparkles className="mr-1.5 h-4 w-4" />
                    Generate blueprint
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
