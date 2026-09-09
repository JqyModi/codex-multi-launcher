export type ThemePreference = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

const THEME_STORAGE_KEY = "profile-manager.theme";
const DARK_MODE_QUERY = "(prefers-color-scheme: dark)";

export function loadThemePreference(): ThemePreference {
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
}

export function saveThemePreference(theme: ThemePreference): void {
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
}

export function resolveTheme(theme: ThemePreference, prefersDark = window.matchMedia(DARK_MODE_QUERY).matches): ResolvedTheme {
  return theme === "system" ? (prefersDark ? "dark" : "light") : theme;
}

export function applyTheme(theme: ThemePreference): void {
  const resolved = resolveTheme(theme);
  document.documentElement.dataset.theme = resolved;
  document.documentElement.style.colorScheme = resolved;
}

export function watchSystemTheme(theme: ThemePreference, onChange: () => void): () => void {
  if (theme !== "system") return () => undefined;
  const mediaQuery = window.matchMedia(DARK_MODE_QUERY);
  mediaQuery.addEventListener("change", onChange);
  return () => mediaQuery.removeEventListener("change", onChange);
}
