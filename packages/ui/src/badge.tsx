"use client";

import * as React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "outline" | "gradient";
  size?: "sm" | "md" | "lg";
}

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = "default", size = "md", children, ...props }, ref) => {
    const sizeClasses = {
      sm: "px-3 py-1 text-xs",
      md: "px-5 py-2.5 text-sm",
      lg: "px-6 py-3 text-base",
    };

    const variantClasses = {
      default: "bg-muted text-foreground border border-border",
      outline: "bg-transparent text-foreground border border-border",
      gradient: "bg-gradient-to-r from-orange-500 to-red-500 text-white border-0",
    };

    return (
      <div
        ref={ref}
        className={[
          "inline-flex items-center gap-2 rounded-lg font-semibold transition-all duration-300",
          sizeClasses[size],
          variantClasses[variant],
          className || "",
        ].filter(Boolean).join(" ")}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Badge.displayName = "Badge";

