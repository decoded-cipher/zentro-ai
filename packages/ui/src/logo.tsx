"use client";

import * as React from "react";

export interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
  onClick?: () => void;
  as?: React.ElementType;
  href?: string;
}

export const Logo = React.forwardRef<HTMLDivElement, LogoProps>(
  ({ size = "md", showText = true, className = "", onClick, as: Component = "div", href }, ref) => {
    const sizeClasses = {
      sm: "w-6 h-6 text-xs",
      md: "w-7 h-7 text-xs",
      lg: "w-8 h-8 text-sm",
    };

    const textSizeClasses = {
      sm: "text-sm",
      md: "text-base",
      lg: "text-lg",
    };

    const content = (
      <div
        ref={ref}
        className={`flex items-center gap-2.5 hover:opacity-80 transition-all duration-200 group ${className}`}
        onClick={onClick}
      >
        <div
          className={`bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-lg group-hover:scale-110 transition-all duration-200 animate-pulse-glow ${sizeClasses[size]}`}
        >
          <span className="text-white font-semibold">Z</span>
        </div>
        {showText && (
          <span className={`font-semibold tracking-tight ${textSizeClasses[size]}`}>
            Zentro AI
          </span>
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

