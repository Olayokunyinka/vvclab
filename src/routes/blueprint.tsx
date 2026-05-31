import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { CTAButton } from "@/components/marketing/CTAButton";
import { AppMockup } from "@/components/marketing/AppMockup";

export const Route = createFileRoute("/blueprint")({
  head: () => ({
    meta: [
      { title: "Personal Brand Blueprint — VVCLab" },
      {
        name: "description",
        content:
          "Build your creator brand from the Ikigai framework. Discover your niche, pillars, voice, and audience in one AI-powered system.",
      },
      { property: "og:title", content: "Personal Brand Blueprint — VVCLab" },
      {
        property: "og:description",
        content:
          "Four questions, one complete brand system. Niche, pillars, voice, and audience — built from who you actually are.",
      },
    ],
  }),
  component: BlueprintPage,
});

function Dash({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3 text-base lg:text-lg" style={{ color: "var(--m-text-secondary)" }}>
      <span aria-hidden style={{ color: "var(--m-gold)" }}>—</span>
      <span>{children}</span>
    </li>
  );
}

function BlueprintPage() {
  return (
    <MarketingLayout>
      {/* HERO */}
      <section className="px-6 py-40 lg:py-48 text-center" style={{ backgroundColor: "var(--m-bg)" }}>
        <div className="mx-auto max-w-[1100px]">
          <h1
            className="mx-auto max-w-4xl text-5xl font-bold leading-[1.05] tracking-tight lg:text-7xl"
            style={{ color: "var(--m-text-primary)" }}
          >
            Know who you are before you touch the camera.
          </h1>
          <p
            className="mx-auto mt-8 max-w-xl text-lg leading-relaxed"
            style={{ color: "var(--m-text-secondary)" }}
          >
            Most creators copy whoever is trending. VVCLab builds your complete brand system — positioning, content pillars, and voice — using the Ikigai framework. Then uses it in every script it writes for you.
          </p>
          <div className="mt-10 flex justify-center">
            <CTAButton to="/signup" className="px-6 py-3">Build my blueprint free →</CTAButton>
          </div>
          <div className="mx-auto mt-20 max-w-[1000px]">
            <AppMockup imageSrc="/mockups/mockup-blueprint.png" alt="Brand Blueprint" />
          </div>
        </div>
      </section>

      {/* IKIGAI */}
      <section className="px-6 py-32" style={{ backgroundColor: "var(--m-bg)" }}>
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-16 lg:grid-cols-2">
          <div>
            <h2 className="max-w-[600px] text-4xl font-bold tracking-tight lg:text-5xl" style={{ color: "var(--m-text-primary)" }}>
              Four questions. Your entire brand.
            </h2>
            <p className="mt-6 max-w-[640px] text-base leading-relaxed lg:text-lg" style={{ color: "var(--m-text-secondary)" }}>
              The Ikigai framework finds the intersection of what you love, what you're great at, what the world needs, and what you can be paid for. That intersection is your brand.
            </p>
            <ul className="mt-8 space-y-3">
              <Dash>What do you love?</Dash>
              <Dash>What are you great at?</Dash>
              <Dash>What does the world need?</Dash>
              <Dash>What can you be paid for?</Dash>
            </ul>
          </div>
          <AppMockup imageSrc="/mockups/mockup-blueprint.png" alt="Ikigai inputs" />
        </div>
      </section>

      {/* WHAT YOU GET */}
      <section className="px-6 py-32" style={{ backgroundColor: "var(--m-bg)" }}>
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-16 lg:grid-cols-2">
          <div className="lg:order-2">
            <h2 className="max-w-[600px] text-4xl font-bold tracking-tight lg:text-5xl" style={{ color: "var(--m-text-primary)" }}>
              Not a mission statement. A real brand system.
            </h2>
            <p className="mt-6 max-w-[640px] text-base leading-relaxed lg:text-lg" style={{ color: "var(--m-text-secondary)" }}>
              VVCLab translates your four answers into a working system that drives every script it writes — niche, pillars, and voice you actually own.
            </p>
            <ul className="mt-8 space-y-3">
              <Dash>Your exact YouTube niche and positioning</Dash>
              <Dash>3 to 5 content pillars you actually own</Dash>
              <Dash>A brand voice profile injected into every script</Dash>
            </ul>
          </div>
          <div className="lg:order-1">
            <AppMockup imageSrc="/mockups/mockup-blueprint.png" alt="Brand system output" />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-40 text-center" style={{ backgroundColor: "var(--m-bg)" }}>
        <div className="mx-auto max-w-2xl">
          <h2 className="text-4xl font-bold tracking-tight lg:text-5xl" style={{ color: "var(--m-text-primary)" }}>
            Your brand blueprint is four questions away.
          </h2>
          <div className="mt-10 flex justify-center">
            <CTAButton to="/signup" className="px-6 py-3">Build mine free →</CTAButton>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
