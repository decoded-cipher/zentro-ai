"use client";

import * as React from "react";
import Link from "next/link";

export interface PageFooterProps {
  className?: string;
}

export function PageFooter({ className = "" }: PageFooterProps) {
  return (
    <footer
      className={`h-14 border-t border-neutral-200/80 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl py-4 px-6 ${className}`}
    >
      <div className="h-full flex items-center justify-center gap-3">
        <span className="text-xs text-neutral-500 dark:text-neutral-400">© Copyright {new Date().getFullYear()}</span>
        <span className="mx-2 text-xs text-neutral-500 dark:text-neutral-400">|</span>
        <Link href="/" target="_blank" rel="noopener noreferrer" className="text-xs text-neutral-500 dark:text-neutral-400 hover:underline">
          Zentro AI
        </Link>
        <span className="mx-2 text-xs text-neutral-500 dark:text-neutral-400">|</span>
        <span className="mx-2 text-xs text-neutral-500 dark:text-neutral-400">All rights reserved.</span>
      </div>
    </footer>
  );
}

