import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { CTAButton } from "@/components/marketing/CTAButton";
import { AppMockup } from "@/components/marketing/AppMockup";

export const Route = createFileRoute("/content-studio")({
  head: () => ({
    meta: [
      { title: "Content Studio — VVCLab" },
      {
        name: "description",
        content:
          "Real-time outlier detection across competitor YouTube channels. Spot the videos beating the baseline and generate your version in one click.",
      },
      { property: "og:title", content: "Content Studio — VVCLab" },
      {
        property: "og:description",
        content:
          "Find competitor outliers, understand exactly why they worked, and generate a teleprompter-ready script in your voice.",
      },
    ],
  }),
  component: ContentStudioPage,
});

function Dash({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3 text-base lg:text-lg" style={{ color: "var(--m-text-secondary)" }}>
      <span aria-hidden style={{ color: "var(--m-gold)" }}>—</span>
      <span>{children}</span>
    </li>
  );
}

function ContentStudioPage() {
  return (
    <MarketingLayout>
      {/* HERO */}
      <section className="px-6 py-40 lg:py-48 text-center" style={{ backgroundColor: "var(--m-bg)" }}>
        <div className="mx-auto max-w-[1100px]">
          <h1
            className="mx-auto max-w-4xl text-5xl font-bold leading-[1.05] tracking-tight lg:text-7xl"
            style={{ color: "var(--m-text-primary)" }}
          >
            Your competitor just uploaded something that'll get 10x their average views.
          </h1>
          <p
            className="mx-auto mt-8 max-w-xl text-lg leading-relaxed"
            style={{ color: "var(--m-text-secondary)" }}
          >
            You won't find out for weeks. VVCLab tells you in real time — and gives you the script to beat them before anyone else capitalises on it.
          </p>
          <div className="mt-10 flex justify-center">
            <CTAButton to="/signup" className="px-6 py-3">Start tracking free →</CTAButton>
          </div>
          <div className="mx-auto mt-20 max-w-[1000px]">
            <AppMockup imageSrc="/mockups/mockup-outliers.png" alt="Content Studio outlier feed" />
          </div>
        </div>
      </section>

      {/* OUTLIER DETECTION */}
      <section className="px-6 py-32" style={{ backgroundColor: "var(--m-bg)" }}>
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-16 lg:grid-cols-2">
          <div>
            <h2 className="max-w-[600px] text-4xl font-bold tracking-tight lg:text-5xl" style={{ color: "var(--m-text-primary)" }}>
              Not views. Views vs their own baseline.
            </h2>
            <p className="mt-6 max-w-[640px] text-base leading-relaxed lg:text-lg" style={{ color: "var(--m-text-secondary)" }}>
              A million views means nothing on its own. A video pulling 10x what that channel normally gets — that's the signal. VVCLab tracks every channel you care about and scores every upload against its own average.
            </p>
            <ul className="mt-8 space-y-3">
              <Dash>Live YouTube data on every tracked channel</Dash>
              <Dash>Per-channel baseline, not generic view counts</Dash>
              <Dash>Outliers flagged the moment they emerge</Dash>
            </ul>
          </div>
          <AppMockup imageSrc="/mockups/mockup-outliers.png" alt="Outlier scoring" />
        </div>
      </section>

      {/* PATTERN ANALYSIS */}
      <section className="px-6 py-32" style={{ backgroundColor: "var(--m-bg)" }}>
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-16 lg:grid-cols-2">
          <div className="lg:order-2">
            <h2 className="max-w-[600px] text-4xl font-bold tracking-tight lg:text-5xl" style={{ color: "var(--m-text-primary)" }}>
              Not just what performed. Exactly why.
            </h2>
            <p className="mt-6 max-w-[640px] text-base leading-relaxed lg:text-lg" style={{ color: "var(--m-text-secondary)" }}>
              Every outlier is broken down by the psychological hook, the reusable title formula, and a plain-English explanation of the curiosity or emotion that made it land.
            </p>
            <ul className="mt-8 space-y-3">
              <Dash>Hook type with explanation</Dash>
              <Dash>Reusable title pattern</Dash>
              <Dash>Viral reason in plain English</Dash>
            </ul>
          </div>
          <div className="lg:order-1">
            <AppMockup imageSrc="/mockups/mockup-outliers.png" alt="Pattern breakdown" />
          </div>
        </div>
      </section>

      {/* SCRIPT GENERATION */}
      <section className="px-6 py-32" style={{ backgroundColor: "var(--m-bg)" }}>
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-16 lg:grid-cols-2">
          <div>
            <h2 className="max-w-[600px] text-4xl font-bold tracking-tight lg:text-5xl" style={{ color: "var(--m-text-primary)" }}>
              One click. Full script. In your voice.
            </h2>
            <p className="mt-6 max-w-[640px] text-base leading-relaxed lg:text-lg" style={{ color: "var(--m-text-secondary)" }}>
              VVCLab generates a teleprompter-ready script using your brand blueprint, the viral pattern, and a 7-step hook framework — in under 60 seconds.
            </p>
            <ul className="mt-8 space-y-3">
              <Dash>7-step hook framework written out word for word</Dash>
              <Dash>Custom body framework per video</Dash>
              <Dash>Thumbnail spec included</Dash>
            </ul>
          </div>
          <AppMockup imageSrc="/mockups/mockup-script.png" alt="Script panel" />
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-40 text-center" style={{ backgroundColor: "var(--m-bg)" }}>
        <div className="mx-auto max-w-2xl">
          <h2 className="text-4xl font-bold tracking-tight lg:text-5xl" style={{ color: "var(--m-text-primary)" }}>
            Your competitors are uploading right now.
          </h2>
          <div className="mt-10 flex justify-center">
            <CTAButton to="/signup" className="px-6 py-3">Start tracking free →</CTAButton>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
