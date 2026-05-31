import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Sparkles, Pencil } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useBrandBlueprint } from "@/hooks/useBrandBlueprint";
import { OnboardingFlow } from "@/components/OnboardingFlow";
import { MyChannelCard } from "@/components/MyChannelCard";

export const Route = createFileRoute("/_authenticated/_onboarded/brand")({
  head: () => ({ meta: [{ title: "My Brand — VVCLab" }] }),
  component: BrandPage,
});

function BrandPage() {
  const { blueprint, ready } = useBrandBlueprint();
  const [editing, setEditing] = useState(false);

  if (!ready) return null;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 lg:px-10 lg:py-10">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight lg:text-[28px]">My Brand</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your Personal Brand Blueprint powers every script.
          </p>
        </div>
        {blueprint && (
          <Button variant="outline" onClick={() => setEditing(true)} className="w-full sm:w-auto">
            <Pencil className="mr-2 h-4 w-4" />
            Edit blueprint
          </Button>
        )}
      </div>

      {!blueprint ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Sparkles className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="mb-4 text-sm text-muted-foreground">
              No blueprint yet — let's build one.
            </p>
            <Button onClick={() => setEditing(true)}>Build my blueprint</Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[18px] font-bold">
                <Sparkles className="h-4 w-4 text-accent-amber" />
                {blueprint.name}
              </CardTitle>
              <p className="text-sm font-medium text-accent-amber">
                {blueprint.youtubeNiche}
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <Section label="Brand summary" body={blueprint.brandSummary} />
              <div className="space-y-2">
                <SectionLabel>Content pillars</SectionLabel>
                <div className="flex flex-wrap gap-1.5">
                  {blueprint.contentPillars.map((p) => (
                    <Badge key={p} variant="secondary" className="font-normal">
                      {p}
                    </Badge>
                  ))}
                </div>
              </div>
              <Section label="Brand voice" body={blueprint.brandVoice} />
              <Section label="Target audience" body={blueprint.targetAudience} />
              <Section
                label="Monetisation angle"
                body={blueprint.monetisationAngle}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Your Ikigai</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Section label="What you love" body={blueprint.ikigai.love} />
              <Section
                label="What you're great at"
                body={blueprint.ikigai.great}
              />
              <Section
                label="What the world needs"
                body={blueprint.ikigai.need}
              />
              <Section
                label="What you can be paid for"
                body={blueprint.ikigai.paid}
              />
            </CardContent>
          </Card>

          <MyChannelCard />
        </>
      )}

      {editing && (
        <OnboardingFlow
          initial={blueprint}
          onComplete={() => setEditing(false)}
          onCancel={() => setEditing(false)}
        />
      )}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
      {children}
    </div>
  );
}

function Section({ label, body }: { label: string; body?: string }) {
  return (
    <div className="space-y-1">
      <SectionLabel>{label}</SectionLabel>
      <p className="text-sm text-foreground/90 whitespace-pre-wrap">
        {body?.trim() || "—"}
      </p>
    </div>
  );
}
