import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  Youtube,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { profileQueryOptions } from "./_onboarded";
import {
  getMyProfile,
  saveMyBlueprint,
  updateOnboardingStep,
  completeOnboarding,
} from "@/lib/profile.functions";
import { generateBrandBlueprint } from "@/lib/brandBlueprint.functions";
import { addChannel } from "@/lib/youtube.functions";
import { analyzeMyChannel, getMyChannel } from "@/lib/myChannel.functions";

export const Route = createFileRoute("/_authenticated/onboarding")({
  loader: ({ context }) => {
    // Skip during SSR — no auth header is available, the server fn would 401.
    if (typeof window === "undefined") return;
    return context.queryClient.ensureQueryData(profileQueryOptions);
  },
  head: () => ({ meta: [{ title: "Get started — VVCLab" }] }),
  component: OnboardingPage,
});

type Ikigai = { love: string; great: string; need: string; paid: string };

const IKIGAI = [
  { key: "love" as const, title: "What do you love?", hint: "Topics you could talk about for hours." },
  { key: "great" as const, title: "What are you great at?", hint: "Skills that come naturally to you." },
  { key: "need" as const, title: "What does the world need?", hint: "Problems you see that need solving." },
  { key: "paid" as const, title: "What can you be paid for?", hint: "What people would pay you to teach or do." },
];

function OnboardingPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const profileQuery = useQuery({ ...profileQueryOptions, queryFn: () => getMyProfile() });
  const profile = profileQuery.data;

  // Step 0 welcome, 1 blueprint, 2 channel, 3 competitors, 4 done
  const [step, setStep] = useState<number>(() => profile?.onboardingStep ?? 0);

  const saveBlueprintFn = useServerFn(saveMyBlueprint);
  const updateStepFn = useServerFn(updateOnboardingStep);
  const completeFn = useServerFn(completeOnboarding);

  async function advance(to: number) {
    setStep(to);
    try {
      await updateStepFn({ data: { step: to } });
      qc.invalidateQueries({ queryKey: ["my-profile"] });
    } catch {}
  }

  async function finish() {
    try {
      await completeFn({});
      qc.invalidateQueries({ queryKey: ["my-profile"] });
      navigate({ to: "/today", replace: true });
    } catch (e: any) {
      toast.error(e?.message || "Couldn't finish onboarding");
    }
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto w-full max-w-2xl">
        <ProgressBar step={step} />
        <Card className="mt-6 border-2">
          <CardContent className="p-6 sm:p-8">
            {step === 0 && (
              <StepWelcome
                name={profile.fullName}
                onNext={() => advance(1)}
              />
            )}
            {step === 1 && (
              <StepBlueprint
                profile={profile}
                onBack={() => advance(0)}
                onSaved={async (bp) => {
                  await saveBlueprintFn({ data: { blueprint: bp, advanceStep: 1 } });
                  qc.invalidateQueries({ queryKey: ["my-profile"] });
                  advance(2);
                }}
              />
            )}
            {step === 2 && (
              <StepMyChannel onBack={() => advance(1)} onNext={() => advance(3)} />
            )}
            {step === 3 && (
              <StepCompetitors onBack={() => advance(2)} onNext={finish} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className={`h-1.5 w-12 rounded-full transition-colors ${
            step >= i ? "bg-primary" : "bg-muted"
          }`}
        />
      ))}
    </div>
  );
}

function StepWelcome({ name, onNext }: { name: string; onNext: () => void }) {
  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
        <Sparkles className="h-6 w-6 text-primary" />
      </div>
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold">
          Welcome to VVCLab{name ? `, ${name.split(" ")[0]}` : ""}
        </h2>
        <p className="text-sm text-muted-foreground">
          We'll set up your brand, channel, and first competitors in a few minutes.
        </p>
      </div>
      <Button onClick={onNext} size="lg">
        Let's go <ArrowRight className="ml-1.5 h-4 w-4" />
      </Button>
    </div>
  );
}

function StepBlueprint({
  profile,
  onBack,
  onSaved,
}: {
  profile: { brandBlueprint: any };
  onBack: () => void;
  onSaved: (bp: any) => Promise<void>;
}) {
  const generateFn = useServerFn(generateBrandBlueprint);
  const existing = (profile.brandBlueprint || {}) as any;
  const [ikigai, setIkigai] = useState<Ikigai>(
    existing.ikigai || { love: "", great: "", need: "", paid: "" },
  );
  const [sub, setSub] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<any>(
    existing.youtubeNiche ? existing : null,
  );
  const [saving, setSaving] = useState(false);

  function canAdvance(i: 0 | 1 | 2 | 3) {
    return ikigai[IKIGAI[i].key].trim().length >= 10;
  }

  async function handleGenerate() {
    setGenerating(true);
    try {
      const r = await generateFn({
        data: { name: existing.name || "", path: "starting", ikigai },
      });
      setResult({ ...r, ikigai });
      setSub(4);
    } catch (e: any) {
      toast.error(e?.message || "Failed to generate");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave() {
    if (!result) return;
    setSaving(true);
    try {
      await onSaved({ ...result, ikigai });
    } catch (e: any) {
      toast.error(e?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (sub === 4) {
    return (
      <div className="space-y-5">
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Step 1 · Brand blueprint</div>
          <h2 className="text-2xl font-semibold">Your blueprint</h2>
        </div>
        <BlueprintField label="Niche" value={result?.youtubeNiche} onChange={(v) => setResult({ ...result, youtubeNiche: v })} />
        <BlueprintField label="Target audience" value={result?.targetAudience} onChange={(v) => setResult({ ...result, targetAudience: v })} />
        <BlueprintField label="Brand voice" value={result?.brandVoice} onChange={(v) => setResult({ ...result, brandVoice: v })} multiline />
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Content pillars</div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {(result?.contentPillars || []).map((p: string) => (
              <Badge key={p} variant="secondary">{p}</Badge>
            ))}
          </div>
        </div>
        <div className="flex justify-between gap-2 pt-2">
          <Button variant="ghost" onClick={() => setSub(0)}>
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Edit answers
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-1.5 h-4 w-4" />}
            This looks right
          </Button>
        </div>
      </div>
    );
  }

  const cur = IKIGAI[sub];
  return (
    <div className="space-y-5">
      <div>
        <div className="text-xs uppercase tracking-wide text-muted-foreground">
          Step 1 · Brand blueprint · {sub + 1}/4
        </div>
        <h2 className="text-2xl font-semibold">{cur.title}</h2>
        <p className="text-sm text-muted-foreground">{cur.hint}</p>
      </div>
      <Textarea
        rows={6}
        value={ikigai[cur.key]}
        onChange={(e) => setIkigai({ ...ikigai, [cur.key]: e.target.value })}
        placeholder="A sentence or two — the more specific, the sharper your blueprint."
        autoFocus
      />
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" onClick={() => (sub === 0 ? onBack() : setSub((sub - 1) as any))}>
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
        </Button>
        {sub < 3 ? (
          <Button disabled={!canAdvance(sub)} onClick={() => setSub((sub + 1) as any)}>
            Next <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        ) : (
          <Button disabled={!canAdvance(3) || generating} onClick={handleGenerate}>
            {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1.5 h-4 w-4" />}
            Generate blueprint
          </Button>
        )}
      </div>
    </div>
  );
}

function BlueprintField({
  label,
  value,
  onChange,
  multiline,
}: {
  label: string;
  value?: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      {multiline ? (
        <Textarea rows={3} value={value || ""} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <Input value={value || ""} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );
}

function StepMyChannel({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  const analyzeFn = useServerFn(analyzeMyChannel);
  const getFn = useServerFn(getMyChannel);
  const existing = useQuery({ queryKey: ["my-channel"], queryFn: () => getFn({}) });

  const [input, setInput] = useState("");
  const [working, setWorking] = useState(false);

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    setWorking(true);
    try {
      await analyzeFn({ data: { input: input.trim() } });
      existing.refetch();
      toast.success("Channel analysed");
    } catch (err: any) {
      toast.error(err.message || "Analysis failed");
    } finally {
      setWorking(false);
    }
  }

  const me = existing.data as any;

  return (
    <div className="space-y-5">
      <div>
        <div className="text-xs uppercase tracking-wide text-muted-foreground">Step 2 · Your YouTube channel</div>
        <h2 className="text-2xl font-semibold">Connect your channel (optional)</h2>
        <p className="text-sm text-muted-foreground">
          We'll analyse your last 20 videos to learn your tone, then write every brief in your voice.
        </p>
      </div>
      {me ? (
        <div className="rounded-md border bg-card p-4">
          <div className="flex items-center gap-3">
            {me.thumbnail_url ? (
              <img src={me.thumbnail_url} alt="" className="h-10 w-10 rounded-full" />
            ) : (
              <div className="h-10 w-10 rounded-full bg-muted" />
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{me.title}</div>
              <div className="text-xs text-muted-foreground">
                {me.videos_analyzed} videos analysed
              </div>
            </div>
          </div>
          {me.style_profile?.toneKeywords?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {me.style_profile.toneKeywords.slice(0, 6).map((k: string) => (
                <Badge key={k} variant="secondary" className="text-[10px]">{k}</Badge>
              ))}
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleAnalyze} className="space-y-2">
          <Input
            placeholder="@handle, channel URL, or UC… ID"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={working}
          />
          <Button type="submit" disabled={working || !input.trim()} className="w-full">
            {working ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Analyse my channel
          </Button>
        </form>
      )}
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
        </Button>
        <Button onClick={onNext} variant={me ? "default" : "outline"}>
          {me ? "Continue" : "Skip for now"}
          <ArrowRight className="ml-1.5 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function StepCompetitors({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  const addFn = useServerFn(addChannel);
  const [input, setInput] = useState("");
  const [working, setWorking] = useState(false);
  const [added, setAdded] = useState<Array<{ id: string; title: string }>>([]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || added.length >= 3) return;
    setWorking(true);
    try {
      const ch = await addFn({ data: { input: input.trim() } });
      if ("ownChannel" in ch) {
        toast.error(ch.message);
        return;
      }
      setAdded([...added, { id: ch.id, title: ch.title }]);
      setInput("");
      toast.success(`Added ${ch.title}`);
    } catch (e: any) {
      toast.error(e?.message || "Failed");
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="text-xs uppercase tracking-wide text-muted-foreground">Step 3 · Competitors</div>
        <h2 className="text-2xl font-semibold">Add your first competitor (optional)</h2>
        <p className="text-sm text-muted-foreground">
          Add up to 3 channels you want to beat. You can add more later.
        </p>
      </div>
      <form onSubmit={handleAdd} className="flex gap-2">
        <Input
          placeholder="@handle, channel URL, or UC… ID"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={working || added.length >= 3}
        />
        <Button type="submit" disabled={working || !input.trim() || added.length >= 3}>
          {working ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        </Button>
      </form>
      {added.length > 0 && (
        <div className="space-y-1.5">
          {added.map((c) => (
            <div key={c.id} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
              <Youtube className="h-3.5 w-3.5 text-destructive" />
              <span className="flex-1 truncate">{c.title}</span>
              <Check className="h-3.5 w-3.5 text-primary" />
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between gap-2 pt-2">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
        </Button>
        <Button onClick={onNext}>
          {added.length > 0 ? "Finish" : "Skip for now"}
          <ArrowRight className="ml-1.5 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
