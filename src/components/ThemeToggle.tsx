import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

export function ThemeToggle({ size = "default" }: { size?: "default" | "small" }) {
  const { isDark, toggleTheme } = useTheme();
  const iconSize = size === "small" ? 16 : 18;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={[
        "rounded-lg transition-colors cursor-pointer",
        size === "small" ? "p-1.5" : "p-2",
        isDark
          ? "text-amber-400 hover:bg-white/10"
          : "text-gray-600 hover:bg-black/10",
      ].join(" ")}
    >
      {isDark ? <Sun size={iconSize} /> : <Moon size={iconSize} />}
    </button>
  );
}

export default ThemeToggle;
