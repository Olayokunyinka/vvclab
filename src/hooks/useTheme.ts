import { useState } from "react";

export function useTheme() {
  const [isDark, setIsDark] = useState(() => {
    try {
      return localStorage.getItem("viralLab.theme") === "dark";
    } catch {
      return false;
    }
  });

  const apply = (next: boolean) => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("dark", next);
    document.documentElement.classList.toggle("light", !next);
  };

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    try {
      localStorage.setItem("viralLab.theme", next ? "dark" : "light");
    } catch {
      /* ignore */
    }
    apply(next);
  };

  const setTheme = (theme: "dark" | "light") => {
    const next = theme === "dark";
    setIsDark(next);
    try {
      localStorage.setItem("viralLab.theme", theme);
    } catch {
      /* ignore */
    }
    apply(next);
  };

  return { isDark, toggleTheme, setTheme };
}
