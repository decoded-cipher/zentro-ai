"use client";

import * as React from "react";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

export function EmptyState({
  icon,
  title = "No items",
  description = "Get started by adding something",
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center h-full text-center px-4 animate-in fade-in ${className}`}
    >
      {icon && (
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3 transition-transform duration-200 hover:scale-110">
          {icon}
        </div>
      )}
      {title && (
        <p className="text-sm font-medium text-foreground/80 mb-1">{title}</p>
      )}
      {description && (
        <p className="text-sm text-foreground/50">{description}</p>
      )}
    </div>
  );
}

