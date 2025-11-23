"use client";

import * as React from "react";

export interface IframePlaceholderProps {
  src: string;
  title: string;
  placeholderTitle: string;
  placeholderDescription: string;
  icon?: React.ReactNode;
  sandbox?: string;
}

export function IframePlaceholder({
  src,
  title,
  placeholderTitle,
  placeholderDescription,
  icon,
  sandbox = "allow-same-origin allow-scripts allow-popups allow-forms",
}: IframePlaceholderProps) {
  const defaultIcon = (
    <svg
      className="w-6 h-6 text-foreground/60"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
      />
    </svg>
  );

  return (
    <div className="h-full w-full relative">
      <iframe
        src={src}
        className="w-full h-full border-0 transition-opacity duration-300"
        title={title}
        sandbox={sandbox}
      />
      <div className="absolute inset-0 flex items-center justify-center bg-background/95 backdrop-blur-sm pointer-events-none">
        <div className="text-center space-y-2 pointer-events-auto animate-in fade-in-up">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center animate-pulse-glow">
            {icon || defaultIcon}
          </div>
          <p className="text-sm text-foreground/60 font-medium">
            {placeholderTitle}
          </p>
          <p className="text-xs text-foreground/40">{placeholderDescription}</p>
        </div>
      </div>
    </div>
  );
}

