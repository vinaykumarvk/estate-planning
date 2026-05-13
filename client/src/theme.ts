import { useEffect, useMemo, useState } from "react";

export const CUSTOM_THEMES = [
  "rolex",
  "nord",
  "dracula",
  "solarized",
  "monokai",
  "catppuccin",
  "gruvbox",
  "onedark",
  "tokyonight",
  "rosepine",
  "ayu",
  "github",
  "sunset",
] as const;

export type CustomTheme = (typeof CUSTOM_THEMES)[number];
export type ThemePreference = "light" | "dark" | "system" | CustomTheme;
export type ResolvedTheme = "light" | "dark" | CustomTheme;

export const THEME_LABELS: Record<string, string> = {
  light: "Light",
  dark: "Dark",
  system: "System (auto)",
  rolex: "Rolex",
  nord: "Nord",
  dracula: "Dracula",
  solarized: "Solarized",
  monokai: "Monokai",
  catppuccin: "Catppuccin",
  gruvbox: "Gruvbox",
  onedark: "One Dark",
  tokyonight: "Tokyo Night",
  rosepine: "Rosé Pine",
  ayu: "Ayu",
  github: "GitHub Dark",
  sunset: "Sunset",
};

const VALID_STORED = new Set<string>(["light", "dark", "system", ...CUSTOM_THEMES]);

function getStoredTheme(storageKey: string): ThemePreference {
  const stored = localStorage.getItem(storageKey);
  if (stored && VALID_STORED.has(stored)) {
    return stored as ThemePreference;
  }
  return "system";
}

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference === "system") {
    return getSystemTheme();
  }
  return preference;
}

export function useTheme(storageKey: string) {
  const [theme, setTheme] = useState<ThemePreference>(() => getStoredTheme(storageKey));
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => resolveTheme(getStoredTheme(storageKey)));

  useEffect(() => {
    const nextResolved = resolveTheme(theme);
    setResolvedTheme(nextResolved);
    document.documentElement.dataset.theme = nextResolved;
    localStorage.setItem(storageKey, theme);
  }, [theme, storageKey]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const applySystemTheme = () => {
      if (theme === "system") {
        const next = getSystemTheme();
        setResolvedTheme(next);
        document.documentElement.dataset.theme = next;
      }
    };

    media.addEventListener("change", applySystemTheme);
    return () => media.removeEventListener("change", applySystemTheme);
  }, [theme]);

  return useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme]
  );
}
