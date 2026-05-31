import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";


export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — VVCLab" },
      { name: "description", content: "How VVCLab collects, uses, and protects your data." },
      { property: "og:title", content: "Privacy Policy — VVCLab" },
      { property: "og:description", content: "How VVCLab collects, uses, and protects your data." },
    ],
  }),
  component: PrivacyPage,
});

type Section = { heading: string; body: React.ReactNode };

const SECTIONS: Section[] = [
  {
    heading: "Who we are",
    body: `VVCLab ("we", "us", "our") is a YouTube competitor intelligence platform operated by Olayinka Olayokun. We help YouTube creators track competitor channels, detect viral outliers, and generate scripts. Contact: mrolayokun@gmail.com`,
  },
  {
    heading: "What data we collect",
    body: `Account data: your name, email address, and password (hashed — we never store plaintext passwords) when you sign up. Profile data: your brand blueprint responses (Ikigai answers, brand voice, content pillars) stored in our database. Channel data: YouTube channel IDs and video metadata (titles, view counts, published dates) fetched via the YouTube Data API for channels you choose to track. Usage data: scripts you generate, LinkedIn posts you generate, and actions taken in the app. We do not collect payment information directly — payments are handled by Stripe.`,
  },
  {
    heading: "How we use your data",
    body: `To provide the VVCLab service — generating scripts, detecting outliers, and building your brand blueprint. To improve the product based on usage patterns. To send you transactional emails (script generation confirmations, account notifications). We do not sell your data to third parties. We do not use your data to train AI models.`,
  },
  {
    heading: "Third-party services",
    body: `Supabase: database and authentication. YouTube Data API v3: fetching public channel and video data. Google AI (via Lovable gateway): generating scripts, blueprints, and LinkedIn posts. All third parties are GDPR-compliant processors.`,
  },
  {
    heading: "Data retention",
    body: `Your account data is retained until you delete your account. After deletion, all personal data is permanently removed within 30 days. Generated scripts and blueprints are deleted immediately on account deletion.`,
  },
  {
    heading: "Your rights",
    body: `You have the right to access, correct, or delete your personal data at any time. To exercise these rights, email mrolayokun@gmail.com or use the account deletion feature in Settings.`,
  },
  {
    heading: "Cookies",
    body: `We use only essential cookies required for authentication (session tokens). We do not use advertising or tracking cookies.`,
  },
  {
    heading: "Changes to this policy",
    body: `We will notify you by email of any material changes to this policy. Continued use of VVCLab after changes constitutes acceptance.`,
  },
];

function PrivacyPage() {
  return (
    <MarketingLayout>
      <section className="px-8 py-24">
        <div className="mx-auto max-w-[720px]">
          <h1 className="mt-6 text-[48px] font-bold leading-tight text-white">Privacy Policy</h1>
          <p className="mt-3 text-[15px]" style={{ color: "var(--m-text-secondary)" }}>
            Last updated: May 30, 2026
          </p>
          <div
            className="mt-12 space-y-10 text-[15px] leading-relaxed"
            style={{ color: "var(--m-text-secondary)" }}
          >
            {SECTIONS.map((s) => (
              <div key={s.heading}>
                <h2 className="mb-3 text-xl font-bold text-white">{s.heading}</h2>
                <p>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
