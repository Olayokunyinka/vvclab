import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { CTAButton } from "@/components/marketing/CTAButton";
import { AppMockup } from "@/components/marketing/AppMockup";

export const Route = createFileRoute("/linkedin-engine")({
  head: () => ({
    meta: [
      { title: "LinkedIn Engine — VVCLab" },
      {
        name: "description",
        content:
          "Paste a YouTube URL. Get six LinkedIn posts on six different angles — story, framework, data, contrarian, quick win, and bold take.",
      },
      { property: "og:title", content: "LinkedIn Engine — VVCLab" },
      {
        property: "og:description",
        content:
          "Six angles. One video. Turn any YouTube upload into a week of LinkedIn content in seconds.",
      },
    ],
  }),
  component: LinkedInEnginePage,
});

function Dash({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3 text-base lg:text-lg" style={{ color: "var(--m-text-secondary)" }}>
      <span aria-hidden style={{ color: "var(--m-gold)" }}>—</span>
      <span>{children}</span>
    </li>
  );
}

function LinkedInEnginePage() {
  return (
    <MarketingLayout>
      {/* HERO */}
      <section className="px-6 py-40 lg:py-48 text-center" style={{ backgroundColor: "var(--m-bg)" }}>
        <div className="mx-auto max-w-[1100px]">
          <h1
            className="mx-auto max-w-4xl text-5xl font-bold leading-[1.05] tracking-tight lg:text-7xl"
            style={{ color: "var(--m-text-primary)" }}
          >
            Every video you make contains six LinkedIn posts you never wrote.
          </h1>
          <p
            className="mx-auto mt-8 max-w-xl text-lg leading-relaxed"
            style={{ color: "var(--m-text-secondary)" }}
          >
            Paste a YouTube URL. Get a story, a framework, a data insight, a contrarian take, a quick win, and a bold opinion — each with an AI image. In 30 seconds.
          </p>
          <div className="mt-10 flex justify-center">
            <CTAButton to="/signup" className="px-6 py-3">Generate my first posts free →</CTAButton>
          </div>
          <div className="mx-auto mt-20 max-w-[1000px]">
            <AppMockup imageSrc="/mockups/mockup-linkedin.png" alt="LinkedIn Engine" />
          </div>
        </div>
      </section>

      {/* SIX ANGLES */}
      <section className="px-6 py-32" style={{ backgroundColor: "var(--m-bg)" }}>
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-16 lg:grid-cols-2">
          <div>
            <h2 className="max-w-[600px] text-4xl font-bold tracking-tight lg:text-5xl" style={{ color: "var(--m-text-primary)" }}>
              Six angles from one upload.
            </h2>
            <p className="mt-6 max-w-[640px] text-base leading-relaxed lg:text-lg" style={{ color: "var(--m-text-secondary)" }}>
              The same video gives you six different posts — each written in your voice, each paired with an image sized for the LinkedIn feed.
            </p>
            <ul className="mt-8 space-y-3">
              <Dash>Story — the personal narrative behind the lesson</Dash>
              <Dash>Framework — a structured breakdown people save</Dash>
              <Dash>Data insight — a counterintuitive stat that stops scrolling</Dash>
              <Dash>Contrarian — an honest opposite take that drives debate</Dash>
              <Dash>Quick win — one tip someone can use today</Dash>
              <Dash>Bold take — a prediction that positions you as the voice</Dash>
            </ul>
          </div>
          <AppMockup imageSrc="/mockups/mockup-linkedin.png" alt="Six post angles" />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="px-6 py-32" style={{ backgroundColor: "var(--m-bg)" }}>
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-16 lg:grid-cols-2">
          <div className="lg:order-2">
            <h2 className="max-w-[600px] text-4xl font-bold tracking-tight lg:text-5xl" style={{ color: "var(--m-text-primary)" }}>
              Paste. Select. Post.
            </h2>
            <p className="mt-6 max-w-[640px] text-base leading-relaxed lg:text-lg" style={{ color: "var(--m-text-secondary)" }}>
              No copying transcripts. No Canva. No designer. Drop a URL and walk away with a week of LinkedIn content.
            </p>
            <ul className="mt-8 space-y-3">
              <Dash>Any YouTube URL — yours or anyone else's</Dash>
              <Dash>Pick the angles you want, deselect the rest</Dash>
              <Dash>Get posts plus AI-generated images, ready to publish</Dash>
            </ul>
          </div>
          <div className="lg:order-1">
            <AppMockup imageSrc="/mockups/mockup-linkedin.png" alt="LinkedIn workflow" />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-40 text-center" style={{ backgroundColor: "var(--m-bg)" }}>
        <div className="mx-auto max-w-2xl">
          <h2 className="text-4xl font-bold tracking-tight lg:text-5xl" style={{ color: "var(--m-text-primary)" }}>
            Your audience is on LinkedIn. Show up.
          </h2>
          <div className="mt-10 flex justify-center">
            <CTAButton to="/signup" className="px-6 py-3">Generate my first posts free →</CTAButton>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
