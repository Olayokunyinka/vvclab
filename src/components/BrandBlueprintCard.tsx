import { useState } from "react";
import { Sparkles, Pencil, Download, Mail } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { BrandBlueprint } from "@/lib/brandBlueprint";
import { OnboardingFlow } from "@/components/OnboardingFlow";
import {
  generateBlueprintPdf,
  buildBlueprintEmail,
} from "@/lib/blueprintExport";
import { useAuth } from "@/components/AuthProvider";

type Props = {
  blueprint: BrandBlueprint;
};

export function BrandBlueprintCard({ blueprint }: Props) {
  const auth = useAuth();
  const [refining, setRefining] = useState(false);

  const userName = auth.fullName || blueprint.name || "Creator";

  const handleExportPdf = () => {
    if (!blueprint) {
      toast("Generate your blueprint first.");
      return;
    }
    try {
      generateBlueprintPdf(blueprint, userName);
      toast.success("PDF downloaded");
    } catch (e) {
      toast.error("Could not generate PDF");
    }
  };

  const handleEmailMe = () => {
    if (!blueprint) {
      toast("Generate your blueprint first.");
      return;
    }
    if (!auth.email) {
      toast.error("No email found on your account");
      return;
    }
    const { subject, body } = buildBlueprintEmail(blueprint, userName);
    const href = `mailto:${encodeURIComponent(auth.email)}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;
    window.location.href = href;
    toast.success(`Opening email to ${auth.email}`);
  };

  const [voiceExpanded, setVoiceExpanded] = useState(false);



  return (
    <>
      <Card id="brand-blueprint" className="scroll-mt-6">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="truncate">{blueprint.name}</span>
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {blueprint.youtubeNiche}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Content pillars
            </div>
            <div className="flex flex-wrap gap-1.5">
              {blueprint.contentPillars.map((p) => (
                <Badge key={p} variant="secondary" className="font-normal">
                  {p}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Brand voice
            </div>
            <p
              className={`text-xs text-foreground/80 ${
                voiceExpanded ? "" : "line-clamp-2"
              }`}
            >
              {blueprint.brandVoice}
            </p>
            {blueprint.brandVoice.length > 100 && (
              <button
                type="button"
                onClick={() => setVoiceExpanded((v) => !v)}
                className="text-xs text-primary hover:underline"
              >
                {voiceExpanded ? "Show less" : "Show more"}
              </button>
            )}
          </div>

          <div className="space-y-1">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Target audience
            </div>
            <p className="text-xs text-foreground/80">
              {blueprint.targetAudience}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPdf}
            >
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Export as PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleEmailMe}
            >
              <Mail className="mr-1.5 h-3.5 w-3.5" />
              Email to myself
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRefining(true)}
            >
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              Refine my blueprint
            </Button>
          </div>
        </CardContent>
      </Card>


      {refining && (
        <OnboardingFlow
          initial={blueprint}
          onComplete={() => setRefining(false)}
          onCancel={() => setRefining(false)}
        />
      )}
    </>
  );
}
