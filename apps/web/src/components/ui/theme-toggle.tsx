"use client";

import { useTheme } from "next-themes";
import { MoonIcon, SunIcon } from "@phosphor-icons/react";
import { useEffect, useState } from "react";

type ViewTransition = {
  ready: Promise<void>;
};

type DocumentWithViewTransition = Document & {
  startViewTransition?: (callback: () => void) => ViewTransition;
};

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="h-8 w-8" />;

  const currentTheme = (theme === "system" ? resolvedTheme : theme) ?? resolvedTheme ?? "dark";
  const isDark = currentTheme === "dark";
  const nextTheme = isDark ? "light" : "dark";

  const toggleTheme = () => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const documentWithTransition = document as DocumentWithViewTransition;

    if (prefersReducedMotion || !documentWithTransition.startViewTransition) {
      setTheme(nextTheme);
      return;
    }

    const transition = documentWithTransition.startViewTransition(() => {
      setTheme(nextTheme);
    });

    transition.ready
      .then(() => {
        document.documentElement.animate(
          { clipPath: ["inset(0 0 100% 0)", "inset(0)"] },
          {
            duration: 600,
            easing: "cubic-bezier(0.22, 1, 0.36, 1)",
            pseudoElement: "::view-transition-new(root)",
          },
        );
      })
      .catch(() => {
        setTheme(nextTheme);
      });
  };

  return (
    <button
      type="button"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={isDark}
      onClick={toggleTheme}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={className}
    >
      {isDark ? (
        <SunIcon size={15} weight="regular" />
      ) : (
        <MoonIcon size={15} weight="regular" />
      )}
    </button>
  );
}
