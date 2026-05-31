import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { CTAButton } from "@/components/marketing/CTAButton";
import { AppMockup } from "@/components/marketing/AppMockup";

export const Route = createFileRoute("/")({
  beforeLoad: ({ context }) => {
    if (context.auth.get().status === "signedIn") {
      throw redirect({ to: "/today" });
    }
  },
  head: () => ({
    meta: [
      { title: "VVCLab — Beat your YouTube competitors on every upload" },
      {
        name: "description",
        content:
          "Find competitor outlier videos, reverse-engineer why they went viral, and generate teleprompter-ready scripts in your voice in 60 seconds.",
      },
      { property: "og:title", content: "VVCLab — Beat your YouTube competitors" },
      {
        property: "og:description",
        content:
          "Spot outliers performing far above their channel average and generate scripts in your voice.",
      },
    ],
  }),
  component: LandingPage,
});

const TICKER = [
  { name: "Metics Media", score: "4.1x" },
  { name: "Kevin Stratvert", score: "3.8x" },
  { name: "Santrel Media", score: "4.0x" },
  { name: "MrBeast", score: "65x" },
  { name: "Ali Abdaal", score: "8.2x" },
  { name: "MKBHD", score: "12x" },
  { name: "Nate Herk", score: "170x" },
];

function DashBullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3 text-base lg:text-lg" style={{ color: "var(--m-text-secondary)" }}>
      <span aria-hidden style={{ color: "var(--m-gold)" }}>—</span>
      <span>{children}</span>
    </li>
  );
}

type Row = { feature: string; manual: string; chatgpt: string; vvclab: string | "yes" };
const ROWS: Row[] = [
  { feature: "Finds competitor outliers automatically", manual: "✗", chatgpt: "✗", vvclab: "yes" },
  { feature: "Knows why a video went viral", manual: "Hours of guessing", chatgpt: "Generic guess", vvclab: "yes" },
  { feature: "Generates a script in your voice", manual: "Write from scratch", chatgpt: "Sounds nothing like you", vvclab: "yes" },
  { feature: "7-step hook framework", manual: "✗", chatgpt: "Only if prompted", vvclab: "yes" },
  { feature: "Real YouTube view data", manual: "Manual lookup", chatgpt: "✗", vvclab: "yes" },
  { feature: "LinkedIn posts from a video", manual: "Hours of work", chatgpt: "No images", vvclab: "yes" },
  { feature: "Time from idea to script", manual: "3–5 hours", chatgpt: "45–60 min", vvclab: "yes" },
];

function LandingPage() {
  return (
    <MarketingLayout>
      <style>{`
        @keyframes vvclab-marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .vvclab-marquee { animation: vvclab-marquee 45s linear infinite; }
      `}</style>

      {/* HERO */}
      <section
        className="px-6 py-40 lg:py-48 text-center"
        style={{ backgroundColor: "var(--m-bg)" }}
      >
        <div className="mx-auto max-w-[1100px]">
          <h1
            className="mx-auto max-w-4xl text-5xl font-bold leading-[1.05] tracking-tight lg:text-7xl"
            style={{ color: "var(--m-text-primary)" }}
          >
            Beat your competitors on every upload.
          </h1>
          <p
            className="mx-auto mt-8 max-w-xl text-lg leading-relaxed"
            style={{ color: "var(--m-text-secondary)" }}
          >
            VVCLab finds the videos crushing your competitors' averages, reverse-engineers why they went viral, and writes your script in 60 seconds.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6">
            <CTAButton to="/signup" className="px-6 py-3">Get started free →</CTAButton>
            <Link
              to="/login"
              className="text-[15px] hover:underline"
              style={{ color: "var(--m-text-secondary)" }}
            >
              Sign in
            </Link>
          </div>
          <div className="mt-6 text-sm" style={{ color: "var(--m-text-tertiary)" }}>
            Used by creators tracking channels like MrBeast, Ali Abdaal, and Marques Brownlee
          </div>

          <div className="mx-auto mt-20 max-w-[1000px]">
            <AppMockup imageSrc="/mockups/mockup-outliers.png" alt="VVCLab outlier feed" />
          </div>
        </div>
      </section>

      {/* LIVE SCORES TICKER */}
      <div
        className="flex items-center gap-6 overflow-hidden py-4"
        style={{
          backgroundColor: "var(--m-bg-subtle)",
          borderTop: "1px solid var(--m-border)",
          borderBottom: "1px solid var(--m-border)",
        }}
      >
        <div
          className="shrink-0 pl-6 text-[10px] uppercase tracking-[0.2em]"
          style={{ color: "var(--m-text-tertiary)" }}
        >
          Live scores
        </div>
        <div className="relative flex-1 overflow-hidden">
          <div className="vvclab-marquee flex w-max gap-10 whitespace-nowrap">
            {[...TICKER, ...TICKER, ...TICKER, ...TICKER].map((t, i) => (
              <span key={i} className="flex items-center gap-3 text-sm">
                <span className="font-medium" style={{ color: "var(--m-text-primary)" }}>{t.name}</span>
                <span style={{ color: "var(--m-border)" }}>·</span>
                <span className="font-bold" style={{ color: "var(--m-gold)" }}>{t.score}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* FEATURE 1 — OUTLIER DETECTION */}
      <section className="px-6 py-32" style={{ backgroundColor: "var(--m-bg)" }}>
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-16 lg:grid-cols-2">
          <div>
            <h2
              className="max-w-[600px] text-4xl font-bold tracking-tight lg:text-5xl"
              style={{ color: "var(--m-text-primary)" }}
            >
              Find the videos your competitors wish you hadn't seen.
            </h2>
            <p
              className="mt-6 max-w-[640px] text-base leading-relaxed lg:text-lg"
              style={{ color: "var(--m-text-secondary)" }}
            >
              VVCLab scores every video on every channel you track against that channel's own average. A 4x score means 4x more views than usual. That's your next video idea.
            </p>
            <ul className="mt-8 space-y-3">
              <DashBullet>Tracks unlimited competitor channels</DashBullet>
              <DashBullet>Scores every upload automatically</DashBullet>
              <DashBullet>Flags outliers the moment they break out</DashBullet>
            </ul>
            <div className="mt-10">
              <CTAButton to="/signup" className="px-6 py-3">Start tracking free →</CTAButton>
            </div>
          </div>
          <AppMockup imageSrc="/mockups/mockup-outliers.png" alt="Outlier feed" />
        </div>
      </section>

      {/* FEATURE 2 — PATTERN ANALYSIS */}
      <section className="px-6 py-32" style={{ backgroundColor: "var(--m-bg)" }}>
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-16 lg:grid-cols-2">
          <div className="lg:order-2">
            <h2
              className="max-w-[600px] text-4xl font-bold tracking-tight lg:text-5xl"
              style={{ color: "var(--m-text-primary)" }}
            >
              Not just what performed. Exactly why.
            </h2>
            <p
              className="mt-6 max-w-[640px] text-base leading-relaxed lg:text-lg"
              style={{ color: "var(--m-text-secondary)" }}
            >
              Every outlier gets an AI breakdown — the psychological hook that drove clicks, the title formula you can steal, and a plain-English explanation of what emotion or curiosity made it go viral.
            </p>
            <ul className="mt-8 space-y-3">
              <DashBullet>Hook type with explanation</DashBullet>
              <DashBullet>Reusable title pattern</DashBullet>
              <DashBullet>Viral reason in plain English</DashBullet>
            </ul>
          </div>
          <div className="lg:order-1">
            <AppMockup imageSrc="/mockups/mockup-outliers.png" alt="Pattern breakdown" />
          </div>
        </div>
      </section>

      {/* FEATURE 3 — SCRIPT GENERATION */}
      <section className="px-6 py-32" style={{ backgroundColor: "var(--m-bg)" }}>
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-16 lg:grid-cols-2">
          <div>
            <h2
              className="max-w-[600px] text-4xl font-bold tracking-tight lg:text-5xl"
              style={{ color: "var(--m-text-primary)" }}
            >
              From outlier to script. One click.
            </h2>
            <p
              className="mt-6 max-w-[640px] text-base leading-relaxed lg:text-lg"
              style={{ color: "var(--m-text-secondary)" }}
            >
              VVCLab generates a complete teleprompter-ready script using your brand voice, your audience profile, and the exact viral pattern from the outlier. Not a generic script. Yours.
            </p>
            <ul className="mt-8 space-y-3">
              <DashBullet>7-step hook framework, word for word</DashBullet>
              <DashBullet>Custom acronym body framework per video</DashBullet>
              <DashBullet>Thumbnail spec included</DashBullet>
            </ul>
            <div className="mt-10">
              <CTAButton to="/signup" className="px-6 py-3">Generate your first script free →</CTAButton>
            </div>
          </div>
          <AppMockup imageSrc="/mockups/mockup-script.png" alt="Generated script" />
        </div>
      </section>

      {/* STATS IN PROSE */}
      <section
        className="px-6 py-24"
        style={{
          backgroundColor: "var(--m-bg-subtle)",
          borderTop: "1px solid var(--m-border)",
          borderBottom: "1px solid var(--m-border)",
        }}
      >
        <p
          className="mx-auto max-w-2xl text-center text-xl"
          style={{ color: "var(--m-text-secondary)", lineHeight: 1.8 }}
        >
          VVCLab has detected outliers scoring{" "}
          <span className="text-2xl font-bold" style={{ color: "var(--m-gold)" }}>10x</span>{" "}
          above channel averages, generated scripts in under{" "}
          <span className="text-2xl font-bold" style={{ color: "var(--m-gold)" }}>60 seconds</span>
          , and turned single YouTube videos into{" "}
          <span className="text-2xl font-bold" style={{ color: "var(--m-gold)" }}>6 LinkedIn posts</span>{" "}
          with AI images — all from one dashboard.
        </p>
      </section>

      {/* COMPARISON */}
      <section className="px-6 py-32" style={{ backgroundColor: "var(--m-bg)" }}>
        <div className="mx-auto max-w-[900px]">
          <div className="text-center">
            <h2
              className="text-4xl font-bold tracking-tight lg:text-5xl"
              style={{ color: "var(--m-text-primary)" }}
            >
              How does it compare?
            </h2>
            <div className="mt-3 text-sm" style={{ color: "var(--m-text-tertiary)" }}>
              vs doing it manually · vs using ChatGPT
            </div>
          </div>
          <div
            className="mt-12 overflow-hidden rounded-xl"
            style={{ border: "1px solid var(--m-border)" }}
          >
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--m-border)" }}>
                  <th className="px-5 py-4 text-left font-medium" style={{ color: "var(--m-text-secondary)" }}></th>
                  <th className="px-5 py-4 text-left font-medium" style={{ color: "var(--m-text-secondary)" }}>Manual</th>
                  <th className="px-5 py-4 text-left font-medium" style={{ color: "var(--m-text-secondary)" }}>ChatGPT</th>
                  <th className="px-5 py-4 text-left font-semibold" style={{ color: "var(--m-text-primary)" }}>VVCLab</th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map((r, i) => (
                  <tr key={r.feature} style={i < ROWS.length - 1 ? { borderBottom: "1px solid var(--m-border)" } : undefined}>
                    <td className="px-5 py-4" style={{ color: "var(--m-text-primary)" }}>{r.feature}</td>
                    <td className="px-5 py-4" style={{ color: "var(--m-text-tertiary)" }}>{r.manual}</td>
                    <td className="px-5 py-4" style={{ color: "var(--m-text-tertiary)" }}>{r.chatgpt}</td>
                    <td className="px-5 py-4 font-semibold" style={{ color: "var(--m-gold)" }}>
                      {r.vvclab === "yes" ? "✓" : r.vvclab}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-10 flex justify-center">
            <CTAButton to="/signup" className="px-6 py-3">Start free →</CTAButton>
          </div>
        </div>
      </section>

      {/* WHO THIS IS FOR — prose */}
      <section className="px-6 py-32" style={{ backgroundColor: "var(--m-bg)" }}>
        <div className="mx-auto max-w-2xl text-center">
          <h2
            className="text-4xl font-bold tracking-tight lg:text-5xl"
            style={{ color: "var(--m-text-primary)" }}
          >
            Built for creators who show up. Not for those who want magic.
          </h2>
          <div className="mx-auto mt-10 max-w-xl space-y-6 text-lg leading-relaxed" style={{ color: "var(--m-text-secondary)" }}>
            <p>
              VVCLab works best for creators who upload consistently, have at least one competitor channel in mind, and are willing to spend 10 minutes building their brand blueprint.
            </p>
            <p>
              If you're looking for a tool that does everything without any input from you, this isn't it. The blueprint is what makes every script sound like you. Without it, you get generic AI.
            </p>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="px-6 py-40 text-center" style={{ backgroundColor: "var(--m-bg)" }}>
        <div className="mx-auto max-w-2xl">
          <h2
            className="text-4xl font-bold tracking-tight lg:text-5xl"
            style={{ color: "var(--m-text-primary)" }}
          >
            Your competitors uploaded while you read this.
          </h2>
          <p className="mt-6 text-lg" style={{ color: "var(--m-text-secondary)" }}>
            The free plan takes 2 minutes to set up.
          </p>
          <div className="mt-10 flex justify-center">
            <CTAButton to="/signup" className="px-6 py-3">Get started free →</CTAButton>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
