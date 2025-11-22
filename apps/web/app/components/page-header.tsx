"use client";

import * as React from "react";
import Link from "next/link";
import { Logo } from "@repo/ui/logo";
import { Button } from "@repo/ui/button";
import { ThemeToggle } from "./theme-toggle";

export interface PageHeaderProps {
  showAuthButtons?: boolean;
  className?: string;
}

export function PageHeader({
  showAuthButtons = true,
  className = "",
}: PageHeaderProps) {
  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-lg border-b border-orange-100/50 dark:border-orange-900/50 animate-in fade-in-down ${className}`}
    >
      <div className="container mx-auto px-6 py-4 flex items-center justify-between max-w-7xl">
        <Link href="/">
          <div className="flex items-center gap-2">
            <div className="relative group">
              <div className="absolute inset-0 bg-orange-500 rounded-md blur-md opacity-50 group-hover:opacity-75 transition-opacity duration-300 animate-pulse-glow" />
              <div className="relative w-8 h-8 bg-gradient-to-br from-orange-500 via-red-500 to-rose-600 rounded-md flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 hover:rotate-3 hover:shadow-xl">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
            </div>
            <span className="font-heading font-bold text-lg tracking-tight bg-gradient-to-r from-orange-600 via-red-600 to-rose-600 bg-clip-text text-transparent">
              Zentro AI
            </span>
          </div>
        </Link>

        {showAuthButtons && (
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button variant="outline" size="sm">
              Log In
            </Button>
            <Button variant="gradient" size="sm">
              Sign Up
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}

