import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hello, World — Welcome" },
      { name: "description", content: "A simple, modern hello world hero section to kick off your new app." },
      { property: "og:title", content: "Hello, World — Welcome" },
      { property: "og:description", content: "A simple, modern hello world hero section to kick off your new app." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* Background glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 0%, color-mix(in oklab, var(--primary) 18%, transparent), transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.15]"
        style={{
          backgroundImage:
            "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage:
            "radial-gradient(ellipse 70% 60% at 50% 30%, black, transparent 80%)",
        }}
      />

      <section className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-6 text-center">
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          New project — ready to build
        </span>

        <h1 className="text-balance text-5xl font-semibold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
          Hello,{" "}
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage:
                "linear-gradient(135deg, var(--primary), color-mix(in oklab, var(--primary) 50%, var(--foreground)))",
            }}
          >
            World
          </span>
        </h1>

        <p className="mt-6 max-w-xl text-pretty text-base text-muted-foreground sm:text-lg">
          Welcome to your new app. This is where the story begins — start
          shaping something people will love.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" className="px-6">
            Get started
          </Button>
          <Button size="lg" variant="ghost" className="px-6">
            Learn more
          </Button>
        </div>
      </section>
    </main>
  );
}
