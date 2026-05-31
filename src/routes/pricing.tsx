import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Check, X, ChevronRight } from "lucide-react";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { CTAButton } from "@/components/marketing/CTAButton";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — VVCLab" },
      {
        name: "description",
        content:
          "Start free with real features. Upgrade to Pro for unlimited scripts, AI pattern analysis, and unlimited LinkedIn posts.",
      },
      { property: "og:title", content: "Pricing — VVCLab" },
      {
        property: "og:description",
        content:
          "Free plan that actually works. Pro removes every limit. 7-day free trial, cancel anytime.",
      },
    ],
  }),
  component: PricingPage,
});

const FREE_FEATURES: Array<{ included: boolean; label: string }> = [
  { included: true, label: "3 competitor channels tracked" },
  { included: true, label: "Outlier detection across all tracked channels" },
  { included: true, label: "3 script generations per month" },
  { included: true, label: "7-step hook framework" },
  { included: true, label: "Personal brand blueprint" },
  { included: true, label: "5 LinkedIn posts per month" },
  { included: false, label: "AI pattern analysis" },
  { included: false, label: "Unlimited script generation" },
  { included: false, label: "Thumbnail spec generation" },
  { included: false, label: "Priority support" },
];

const PRO_FEATURES = [
  "Everything in Free",
  "Unlimited competitor channels",
  "Unlimited script generation",
  "AI pattern analysis on every outlier",
  "Thumbnail spec generation",
  "Unlimited LinkedIn posts",
  "AI image generation per LinkedIn post",
  "Blueprint PDF export and email",
  "Priority support",
];

const OBJECTIONS = [
  {
    q: "Will it actually sound like me or will it sound like ChatGPT?",
    a: "This is the right question to ask and most AI tools can't answer it honestly. VVCLab sounds like you because it uses two things most tools don't have: your Personal Brand Blueprint (built from your Ikigai answers — your actual positioning, voice, and audience) and your Channel Style Profile (built from analysing your last 20 videos — your real tone, sentence style, and hook patterns). Without both of those, you get generic AI. With them, you get something that sounds like you wrote it on a good day.",
  },
  {
    q: "I've tried AI script tools before and they were useless.",
    a: "Most AI script tools give you a generic script based on a title you paste in. They don't know who you are, who your audience is, how you speak, or why the video you're referencing actually went viral. VVCLab starts with real YouTube data — a video that's already proven to beat the channel average — and writes a script that adapts the exact viral pattern to your voice and audience. It's a different starting point entirely.",
  },
  {
    q: "What if my niche is too small for this to work?",
    a: "VVCLab works with any public YouTube channel. If your competitors are uploading — even one channel with 1,000 subscribers — VVCLab can score their videos and find what's working. Small niches often have clearer patterns because there's less noise.",
  },
  {
    q: "I'm not technical. Is this complicated to set up?",
    a: "Sign up. Answer four Ikigai questions (takes about 5 minutes). Add a competitor channel by pasting their @handle. Click on any outlier video. Click Generate. That's it. If you can use YouTube, you can use VVCLab.",
  },
  {
    q: "What if the scripts need a lot of editing?",
    a: "They will need some editing — that's normal. The script gives you a complete structure, a word-for-word hook, and detailed talking points. Most creators edit about 20% of the script. That's still 80% less work than starting from scratch.",
  },
  {
    q: "Is my YouTube data safe?",
    a: "VVCLab only accesses publicly available YouTube data — the same data anyone can see by visiting a channel page. We never ask for access to your YouTube account, your YouTube Studio, your private analytics, or your Google account.",
  },
  {
    q: "Why not just use ChatGPT for free?",
    a: "You can. But ChatGPT has no access to YouTube data, no idea which videos are actually beating their channel average, no model of your voice, and no built-in script framework. VVCLab does all of that automatically. The free plan costs nothing — try it and compare.",
  },
  {
    q: "What happens when I hit the free plan limits?",
    a: "You'll see a clear message telling you you've reached the limit for the month. Nothing breaks, no surprise charges. We don't throttle you or make the free plan worse over time.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="mb-2 rounded-xl"
      style={{ backgroundColor: "var(--m-bg-card)", border: "1px solid var(--m-border)" }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="text-[16px] font-medium" style={{ color: "var(--m-text-primary)" }}>{q}</span>
        <ChevronRight
          size={18}
          className="shrink-0 transition-transform"
          style={{
            color: "var(--m-gold)",
            transform: open ? "rotate(90deg)" : "rotate(0deg)",
          }}
        />
      </button>
      {open && (
        <div
          className="px-5 pb-5 text-[15px]"
          style={{ color: "var(--m-text-secondary)", lineHeight: 1.7 }}
        >
          {a}
        </div>
      )}
    </div>
  );
}

function PricingPage() {
  return (
    <MarketingLayout>
      {/* HERO */}
      <section className="px-6 py-40 lg:py-48 text-center" style={{ backgroundColor: "var(--m-bg)" }}>
        <div className="mx-auto max-w-[900px]">
          <h1
            className="mx-auto text-5xl font-bold leading-[1.05] tracking-tight lg:text-7xl"
            style={{ color: "var(--m-text-primary)" }}
          >
            Simple pricing.
            <br />
            Start free.
          </h1>
          <p
            className="mx-auto mt-8 max-w-xl text-lg leading-relaxed"
            style={{ color: "var(--m-text-secondary)" }}
          >
            VVCLab has a free plan that actually does things. When you're ready to go deeper, the paid plan removes every limit.
          </p>
        </div>
      </section>

      {/* PRICING CARDS */}
      <section className="px-6 pb-16" style={{ backgroundColor: "var(--m-bg)" }}>
        <div className="mx-auto grid max-w-[820px] grid-cols-1 items-start gap-6 md:grid-cols-2">
          {/* FREE */}
          <div
            className="rounded-2xl p-8"
            style={{ backgroundColor: "var(--m-bg-card)", border: "1px solid var(--m-border)" }}
          >
            <div className="text-[12px] font-semibold uppercase tracking-widest" style={{ color: "var(--m-gold)" }}>
              FREE
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-[48px] font-bold leading-none" style={{ color: "var(--m-text-primary)" }}>$0</span>
              <span className="text-[16px]" style={{ color: "var(--m-text-secondary)" }}>/month</span>
            </div>
            <div className="mt-2 text-[13px]" style={{ color: "var(--m-text-tertiary)" }}>
              No credit card required
            </div>
            <div className="my-6 h-px" style={{ backgroundColor: "var(--m-border)" }} />
            <ul className="space-y-3">
              {FREE_FEATURES.map((f) => (
                <li key={f.label} className="flex items-start gap-3 text-[14px]">
                  {f.included ? (
                    <Check size={18} className="mt-0.5 shrink-0" style={{ color: "var(--m-gold)" }} />
                  ) : (
                    <X size={18} className="mt-0.5 shrink-0" style={{ color: "var(--m-text-tertiary)" }} />
                  )}
                  <span
                    style={{
                      color: f.included ? "var(--m-text-primary)" : "var(--m-text-tertiary)",
                      textDecoration: f.included ? "none" : "line-through",
                    }}
                  >
                    {f.label}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <a
                href="/signup"
                className="block w-full cursor-pointer rounded-lg py-3 text-center text-[14px] font-semibold"
                style={{
                  backgroundColor: "var(--m-bg-elevated)",
                  border: "1px solid var(--m-border)",
                  color: "var(--m-text-primary)",
                }}
              >
                Get started free
              </a>
            </div>
          </div>

          {/* PRO */}
          <div
            className="rounded-2xl p-8"
            style={{
              backgroundColor: "var(--m-bg-card)",
              border: "2px solid var(--m-gold)",
            }}
          >
            <div className="text-[12px] font-semibold uppercase tracking-widest" style={{ color: "var(--m-gold)" }}>
              PRO
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-[48px] font-bold leading-none" style={{ color: "var(--m-text-primary)" }}>$29</span>
              <span className="text-[16px]" style={{ color: "var(--m-text-secondary)" }}>/month</span>
            </div>
            <div className="mt-2 text-[13px]" style={{ color: "var(--m-text-tertiary)" }}>
              Billed monthly · Cancel anytime
            </div>
            <div className="my-6 h-px" style={{ backgroundColor: "var(--m-border)" }} />
            <ul className="space-y-3">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-3 text-[14px]">
                  <Check size={18} className="mt-0.5 shrink-0" style={{ color: "var(--m-gold)" }} />
                  <span style={{ color: "var(--m-text-primary)" }}>{f}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <a
                href="/signup"
                className="block w-full cursor-pointer rounded-lg py-3 text-center text-[14px] font-semibold"
                style={{ backgroundColor: "var(--m-gold)", color: "#ffffff" }}
              >
                Start Pro free for 7 days
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ — no heading */}
      <section className="px-6 pt-16 pb-32" style={{ backgroundColor: "var(--m-bg)" }}>
        <div className="mx-auto max-w-[820px]">
          {OBJECTIONS.map((f) => (
            <FaqItem key={f.q} q={f.q} a={f.a} />
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="px-6 py-40 text-center" style={{ backgroundColor: "var(--m-bg)" }}>
        <div className="mx-auto max-w-2xl">
          <h2 className="text-4xl font-bold tracking-tight lg:text-5xl" style={{ color: "var(--m-text-primary)" }}>
            The free plan is waiting.
          </h2>
          <p className="mt-6 text-lg" style={{ color: "var(--m-text-secondary)" }}>
            Two minutes to set up. No credit card.
          </p>
          <div className="mt-10 flex justify-center">
            <CTAButton to="/signup" className="px-6 py-3">Get started free →</CTAButton>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
