"use client";

import * as React from "react";
import Link from "next/link";
import { Logo } from "@repo/ui/logo";
import { ThemeToggle } from "./theme-toggle";

export interface EditorHeaderProps {
  onLogoClick?: () => void;
}

export function EditorHeader({ onLogoClick }: EditorHeaderProps) {
  return (
    <header className="border-b border-border bg-background/95 backdrop-blur-md z-10 animate-in fade-in-down relative">
      <div className="px-6 py-3 flex items-center justify-between">
        {onLogoClick ? (
          <Logo onClick={onLogoClick} />
        ) : (
          <Logo as={Link} href="/" />
        )}
        <div className="flex items-center gap-3">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

