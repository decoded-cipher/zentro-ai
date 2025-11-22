"use client";

import * as React from "react";

export interface AnimatedBackgroundProps {
  variant?: "gradient" | "dots" | "blur";
  className?: string;
}

export function AnimatedBackground({
  variant = "blur",
  className = "",
}: AnimatedBackgroundProps) {
  if (variant === "blur") {
    return (
      <div
        className={`absolute inset-0 overflow-hidden pointer-events-none opacity-30 ${className}`}
      >
        <div
          className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "0s" }}
        />
        <div
          className="absolute bottom-0 left-0 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "3s" }}
        />
      </div>
    );
  }

  if (variant === "dots") {
    return (
      <div
        className={`absolute inset-0 bg-[linear-gradient(to_right,#80808020_1px,transparent_1px),linear-gradient(to_bottom,#80808020_1px,transparent_1px)] bg-[size:40px_40px] opacity-60 ${className}`}
      />
    );
  }

  return null;
}

