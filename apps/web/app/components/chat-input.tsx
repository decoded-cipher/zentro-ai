"use client";

import * as React from "react";
import { ArrowUpIcon } from "@radix-ui/react-icons";
import { Input } from "@repo/ui/input";
import { Button } from "@repo/ui/button";

export interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  isLoading = false,
  placeholder = "Type a message...",
  disabled = false,
}: ChatInputProps) {
  return (
    <div className="p-4 border-t border-border bg-background">
      <form onSubmit={onSubmit} className="space-y-2">
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled || isLoading}
        />
        <Button
          type="submit"
          disabled={!value.trim() || isLoading || disabled}
          className="w-full"
          variant="default"
        >
          Send
          <ArrowUpIcon className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}

