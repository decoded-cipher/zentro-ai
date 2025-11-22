"use client";

import * as React from "react";
import { ArrowRightIcon } from "@radix-ui/react-icons";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";

export interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading?: boolean;
  placeholder?: string;
  buttonText?: string;
}

export function PromptInput({
  value,
  onChange,
  onSubmit,
  isLoading = false,
  placeholder = "What would you like to build?",
  buttonText = "Start building",
}: PromptInputProps) {
  return (
    <form onSubmit={onSubmit} className="w-full animate-in fade-in-up">
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-orange-600 via-red-600 to-rose-600 rounded-lg opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500 group-focus-within:opacity-30 animate-pulse-glow" />
        <div className="relative bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-2 border-orange-200/60 dark:border-orange-800/60 rounded-lg shadow-lg p-6 transition-all duration-300 hover:shadow-2xl hover:scale-[1.01] focus-within:border-orange-400 dark:focus-within:border-orange-500 focus-within:shadow-orange-500/20">
          <div className="flex items-center gap-3">
            <Input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              disabled={isLoading}
              className="flex-1 bg-transparent border-none outline-none text-base text-foreground placeholder:text-foreground/50 focus:ring-0 focus:border-none"
            />
            <Button
              type="submit"
              disabled={!value.trim() || isLoading}
              variant="gradient"
              size="md"
              className="relative overflow-hidden group"
            >
              {value.trim() && !isLoading && (
                <>
                  <span className="absolute inset-0 bg-gradient-to-r from-orange-400 via-red-400 to-rose-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-shimmer" />
                  <span className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                </>
              )}
              <span className="relative z-10 font-semibold">{buttonText}</span>
              <ArrowRightIcon className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform duration-300" />
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}

