"use client";

import * as React from "react";
import { Badge } from "@repo/ui/badge";

export interface HeroSectionProps {
  badge?: {
    icon?: string;
    text: string;
  };
  title: React.ReactNode;
  description?: string;
  children?: React.ReactNode;
}

export function HeroSection({
  badge,
  title,
  description,
  children,
}: HeroSectionProps) {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-6 m-auto relative">
      <div className="w-full max-w-4xl mx-auto space-y-8">
        {badge && (
          <div className="flex justify-center">
            <div className="relative group">
              <div className="absolute inset-0 bg-orange-400/30 rounded-lg blur-lg group-hover:blur-xl transition-all duration-300" />
              <Badge
                variant="outline"
                className="relative inline-flex items-center gap-2 px-5 py-2.5 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-orange-200/50 dark:border-orange-800/50 text-orange-700 dark:text-orange-300 hover:scale-105 hover:border-orange-300 dark:hover:border-orange-700 transition-all duration-300 shadow-md hover:shadow-lg"
              >
                {badge.icon && <span className="text-lg">{badge.icon}</span>}
                <span>{badge.text}</span>
              </Badge>
            </div>
          </div>
        )}

        <div
          className="text-center space-y-4 animate-in fade-in-up"
          style={{ animationDelay: "0.2s" }}
        >
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground leading-tight">
            {title}
          </h1>
          {description && (
            <p
              className="text-lg md:text-xl text-foreground/70 max-w-2xl mx-auto font-normal animate-in fade-in-up"
              style={{ animationDelay: "0.4s" }}
            >
              {description}
            </p>
          )}
        </div>

        {children}
      </div>
    </main>
  );
}

