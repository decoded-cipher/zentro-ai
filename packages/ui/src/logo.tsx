"use client";

import * as React from "react";

export interface LogoProps {
  className?: string;
  as?: React.ElementType;
  href?: string;
  theme?: "light" | "dark" | "system" | string | null;
}

export const Logo = React.forwardRef<HTMLDivElement, LogoProps>(
  ({ className = "", as: Component = "div", href, theme }, ref) => {
    const [resolvedTheme, setResolvedTheme] = React.useState<"light" | "dark">("light");
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
      setMounted(true);
    }, []);

    React.useEffect(() => {
      if (!mounted) return;

      if (theme === "system") {
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        const updateTheme = () => {
          setResolvedTheme(mediaQuery.matches ? "dark" : "light");
        };
        updateTheme();
        mediaQuery.addEventListener("change", updateTheme);
        return () => mediaQuery.removeEventListener("change", updateTheme);
      } else if (theme === "dark") {
        setResolvedTheme("dark");
      } else {
        setResolvedTheme("light");
      }
    }, [theme, mounted]);

    const isDark = resolvedTheme === "dark";

    const content = (
      <div
        ref={ref}
        className={`h-9 w-auto min-w-[100px] flex-shrink-0 ${className}`}
      >
        {isDark ? (
          <img
            src="/logo_white.png"
            alt="Zentro AI Logo"
            className="h-full w-full object-contain object-left"
          />
        ) : (
          <img
            src="/logo_black.png"
            alt="Zentro AI Logo"
            className="h-full w-full object-contain object-left"
          />
        )}
      </div>
    );

    if (Component === "div" || !href) {
      return content;
    }

    return <Component href={href}>{content}</Component>;
  }
);

Logo.displayName = "Logo";

