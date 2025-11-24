"use client";

import * as React from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import {
  SignInButton,
  SignUpButton,
  UserButton,
  SignedIn,
  SignedOut,
} from "@clerk/nextjs";
import { Logo } from "@repo/ui/logo";
import { Button } from "@repo/ui/button";
import { ThemeToggle } from "./theme-toggle";

export interface PageHeaderProps {
  className?: string;
}

export function PageHeader({ className = "" }: PageHeaderProps) {
  const { theme } = useTheme();

  return (
    <header
      className={`relative z-30 h-14 border-b border-neutral-200/80 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl ${className}`}
    >
      <div className="h-full px-6 flex items-center justify-between">
        <Logo as={Link} href="/" theme={theme} />

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <SignedOut>
            <SignInButton mode="modal">
              <Button variant="outline" size="sm" className="h-9 px-4 text-sm">
                Log In
              </Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button variant="gradient" size="sm" className="h-9 px-4 text-sm">
                Sign Up
              </Button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>
      </div>
    </header>
  );
}

