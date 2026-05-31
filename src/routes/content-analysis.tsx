import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { CTAButton } from "@/components/marketing/CTAButton";
import { AppMockup } from "@/components/marketing/AppMockup";

export const Route = createFileRoute("/content-analysis")({
  head: () => ({
    meta: [
      { title: "Content Analysis — VVCLab" },
      {
        name: "description",
        content:
          "Deep analysis of your YouTube channel: tone, sentence style, title patterns, topics, hooks, and audience language — all in one profile.",
      },
      { property: "og:title", content: "Content Analysis — VVCLab" },
      {
        property: "og:description",
        content:
          "Your channel, fully understood. Six dimensions of style analysis that power every script VVCLab writes for you.",
      },
    ],
  }),
  component: ContentAnalysisPage,
});

function Dash({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3 text-base lg:text-lg" style={{ color: "var(--m-text-secondary)" }}>
      <span aria-hidden style={{ color: "var(--m-gold)" }}>—</span>
      <span>{children}</span>
    </li>
  );
}

function ContentAnalysisPage() {
  return (
    <MarketingLayout>
      {/* HERO */}
      <section className="px-6 py-40 lg:py-48 text-center" style={{ backgroundColor: "var(--m-bg)" }}>
        <div className="mx-auto max-w-[1100px]">
          <h1
            className="mx-auto max-w-4xl text-5xl font-bold leading-[1.05] tracking-tight lg:text-7xl"
            style={{ color: "var(--m-text-primary)" }}
          >
            Scripts that sound like you because they are you.
          </h1>
          <p
            className="mx-auto mt-8 max-w-xl text-lg leading-relaxed"
            style={{ color: "var(--m-text-secondary)" }}
          >
            Connect your channel. VVCLab analyses your last 20 videos and builds a complete voice profile. Every script generated after that is written in your exact tone, rhythm, and language.
          </p>
          <div className="mt-10 flex justify-center">
            <CTAButton to="/signup" className="px-6 py-3">Connect my channel free →</CTAButton>
          </div>
          <div className="mx-auto mt-20 max-w-[1000px]">
            <AppMockup imageSrc="/mockups/mockup-competitors.png" alt="Content Analysis" />
          </div>
        </div>
      </section>

      {/* WHAT GETS ANALYZED */}
      <section className="px-6 py-32" style={{ backgroundColor: "var(--m-bg)" }}>
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-16 lg:grid-cols-2">
          <div>
            <h2 className="max-w-[600px] text-4xl font-bold tracking-tight lg:text-5xl" style={{ color: "var(--m-text-primary)" }}>
              Twenty videos. Everything we need.
            </h2>
            <p className="mt-6 max-w-[640px] text-base leading-relaxed lg:text-lg" style={{ color: "var(--m-text-secondary)" }}>
              VVCLab pulls your last 20 uploads and models the patterns that make your channel sound like your channel — not a generic AI version of it.
            </p>
            <ul className="mt-8 space-y-3">
              <Dash>Tone keywords pulled from your actual videos</Dash>
              <Dash>Sentence rhythm modelled to your delivery</Dash>
              <Dash>Title patterns your audience already responds to</Dash>
              <Dash>Hook style — how you open and grab attention</Dash>
              <Dash>Audience language and complexity level</Dash>
            </ul>
          </div>
          <AppMockup imageSrc="/mockups/mockup-competitors.png" alt="Channel profile" />
        </div>
      </section>

      {/* WHY IT MATTERS */}
      <section className="px-6 py-32" style={{ backgroundColor: "var(--m-bg)" }}>
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-16 lg:grid-cols-2">
          <div className="lg:order-2">
            <h2 className="max-w-[600px] text-4xl font-bold tracking-tight lg:text-5xl" style={{ color: "var(--m-text-primary)" }}>
              Scripts that sound like you convert better. Always.
            </h2>
            <p className="mt-6 max-w-[640px] text-base leading-relaxed lg:text-lg" style={{ color: "var(--m-text-secondary)" }}>
              Audiences can hear when a script wasn't written by the person on camera. That's the first 30 seconds gone. With your voice profile, every word feels like yours.
            </p>
            <ul className="mt-8 space-y-3">
              <Dash>Hooks that match how you naturally start videos</Dash>
              <Dash>Sentences that feel natural to deliver out loud</Dash>
              <Dash>Vocabulary your audience already recognises</Dash>
            </ul>
          </div>
          <div className="lg:order-1">
            <AppMockup imageSrc="/mockups/mockup-script.png" alt="Voice-matched script" />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-40 text-center" style={{ backgroundColor: "var(--m-bg)" }}>
        <div className="mx-auto max-w-2xl">
          <h2 className="text-4xl font-bold tracking-tight lg:text-5xl" style={{ color: "var(--m-text-primary)" }}>
            Your voice is your biggest competitive advantage.
          </h2>
          <div className="mt-10 flex justify-center">
            <CTAButton to="/signup" className="px-6 py-3">Connect my channel free →</CTAButton>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
