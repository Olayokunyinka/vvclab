import { cn } from "@/lib/utils";

export type PasswordStrength = {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  hint: string;
};

export function scorePassword(pw: string): PasswordStrength {
  const checks = {
    len8: pw.length >= 8,
    len12: pw.length >= 12,
    lower: /[a-z]/.test(pw),
    upper: /[A-Z]/.test(pw),
    digit: /\d/.test(pw),
    symbol: /[^A-Za-z0-9]/.test(pw),
  };
  let raw = 0;
  if (checks.len8) raw++;
  if (checks.len12) raw++;
  if (checks.lower && checks.upper) raw++;
  if (checks.digit) raw++;
  if (checks.symbol) raw++;

  let score: PasswordStrength["score"] = 0;
  if (pw.length === 0) score = 0;
  else if (raw <= 1) score = 1;
  else if (raw === 2) score = 2;
  else if (raw === 3 || raw === 4) score = 3;
  else score = 4;

  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  let hint = "";
  if (!checks.len8) hint = "Use at least 8 characters";
  else if (!(checks.lower && checks.upper)) hint = "Mix upper and lowercase letters";
  else if (!checks.digit) hint = "Add a number";
  else if (!checks.symbol) hint = "Add a symbol";
  else if (!checks.len12) hint = "12+ characters is even stronger";

  return { score, label: labels[score], hint };
}

const segColors = [
  "bg-muted",
  "bg-red-500",
  "bg-orange-500",
  "bg-yellow-500",
  "bg-green-500",
];

export function PasswordStrengthMeter({ password }: { password: string }) {
  const { score, label, hint } = scorePassword(password);
  if (!password) return null;
  return (
    <div className="space-y-1.5 pt-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              i <= score ? segColors[score] : "bg-muted",
            )}
          />
        ))}
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-foreground">{label}</span>
        {hint && <span className="text-muted-foreground">{hint}</span>}
      </div>
    </div>
  );
}
