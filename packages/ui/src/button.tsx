"use client";

import * as React from "react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "gradient";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "md",
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: "px-3 py-1.5 text-xs",
      md: "px-4 py-2.5 text-sm",
      lg: "px-6 py-3 text-base",
    };

    const variantClasses = {
      default:
        "bg-foreground text-background hover:opacity-90 shadow-sm hover:scale-[1.02] active:scale-[0.98]",
      outline:
        "bg-transparent text-foreground border border-border hover:bg-muted",
      ghost: "bg-transparent text-foreground hover:bg-muted",
      gradient:
        "bg-gradient-to-r from-orange-500 via-red-500 to-rose-600 text-white hover:opacity-90 shadow-lg hover:shadow-xl hover:scale-110 active:scale-95",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={[
          "inline-flex items-center justify-center gap-2 rounded font-medium",
          "transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none",
          sizeClasses[size],
          variantClasses[variant],
          className || "",
        ].filter(Boolean).join(" ")}
        {...props}
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span>Loading...</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
