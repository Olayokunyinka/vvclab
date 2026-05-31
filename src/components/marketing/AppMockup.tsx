import { cn } from "@/lib/utils";

export function AppMockup({
  imageSrc,
  alt = "App screenshot",
  className,
}: {
  imageSrc?: string;
  alt?: string;
  className?: string;
}) {
  return (
    <div
      className={cn("overflow-hidden rounded-2xl", className)}
      style={{ backgroundColor: "var(--m-bg-card)", border: "1px solid var(--m-border)" }}
    >
      {/* Browser chrome */}
      <div
        className="flex items-center gap-2 px-4 py-3"
        style={{ backgroundColor: "var(--m-bg-elevated)", borderBottom: "1px solid var(--m-border)" }}
      >
        <span
          className="block rounded-full"
          style={{ width: 8, height: 8, backgroundColor: "#e53e3e" }}
        />
        <span
          className="block rounded-full"
          style={{ width: 8, height: 8, backgroundColor: "#f59e0b" }}
        />
        <span
          className="block rounded-full"
          style={{ width: 8, height: 8, backgroundColor: "#22c55e" }}
        />

      </div>

      {imageSrc ? (
        <img src={imageSrc} alt={alt} className="block w-full" />
      ) : (
        <div
          className="flex min-h-[300px] items-center justify-center"
          style={{
            backgroundColor: "var(--m-bg-elevated)",
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        >
          <span className="text-[13px]" style={{ color: "var(--m-text-tertiary)" }}>
            Screenshot coming soon
          </span>
        </div>
      )}
    </div>
  );
}

export default AppMockup;