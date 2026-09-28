"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  window.localStorage.setItem("db-theme", theme);
}

export function ThemeToggle({
  className = "",
  variant = "onLight",
}: {
  className?: string;
  /** Use "onDark" when placing the toggle on a permanently dark-ground
   * surface (the sidebar, the portal header) so it stays legible. */
  variant?: "onLight" | "onDark";
}) {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    // Read the value the pre-hydration bootstrap script (layout.tsx) already
    // set on <html>, so this render can't disagree with what the browser is
    // showing. Rendering a placeholder until then (see below) is what keeps
    // this from being a hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light");
  }, []);

  if (!theme) {
    // Avoid a hydration mismatch: render nothing until we've read the
    // attribute the inline bootstrap script (see layout.tsx) already set.
    return <span className={`inline-block w-[68px] h-[30px] ${className}`} aria-hidden />;
  }

  const next: Theme = theme === "dark" ? "light" : "dark";
  const style =
    variant === "onDark"
      ? "border-[var(--db-hair-3)] bg-[var(--db-card-dark)] text-[var(--db-ink-2)] hover:border-[var(--db-link-dark)] hover:text-[var(--db-ink-head)]"
      : "border-[var(--db-line)] bg-[var(--db-tint-blue)] text-[var(--db-ink-soft)] hover:border-[var(--db-primary)]";

  return (
    <button
      type="button"
      onClick={() => {
        applyTheme(next);
        setTheme(next);
      }}
      aria-label={`Switch to ${next} mode`}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold ${style} ${className}`}
    >
      <span aria-hidden>{theme === "dark" ? "☀️" : "🌙"}</span>
      {theme === "dark" ? "Light" : "Dark"}
    </button>
  );
}

/**
 * Inline, blocking bootstrap script — sets `data-theme` on <html> before
 * first paint so there's no flash of the wrong theme. Reads an explicit
 * choice from localStorage first, falling back to the OS preference.
 */
export const THEME_BOOTSTRAP_SCRIPT = `
(function () {
  try {
    var stored = window.localStorage.getItem("db-theme");
    var theme = stored === "light" || stored === "dark"
      ? stored
      : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", theme);
  } catch (e) {}
})();
`;
