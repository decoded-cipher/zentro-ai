"use client";

import * as React from "react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          ref={ref}
          className={[
            "w-full px-4 py-2.5 bg-muted border border-border rounded-lg text-sm",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
            "placeholder:text-foreground/40 transition-all duration-200",
            "focus:placeholder:text-foreground/20",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            error ? "border-red-500 focus:ring-red-500" : "",
            className || "",
          ].filter(Boolean).join(" ")}
          {...props}
        />
        {error && (
          <p className="mt-1 text-xs text-red-500">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

