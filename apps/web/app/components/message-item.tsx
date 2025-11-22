"use client";

import * as React from "react";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface MessageItemProps {
  message: Message;
  index?: number;
}

export function MessageItem({ message, index = 0 }: MessageItemProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex flex-col gap-1.5 animate-in fade-in-up ${
        isUser ? "items-end" : "items-start"
      }`}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div
        className={`rounded-xl px-4 py-2.5 max-w-[85%] text-sm leading-relaxed transition-all duration-200 ${
          isUser
            ? "bg-foreground text-background hover:opacity-90"
            : "bg-muted text-foreground hover:bg-muted/80"
        }`}
      >
        {message.content}
      </div>
      <span className="text-xs text-foreground/40 px-1">
        {message.timestamp.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </span>
    </div>
  );
}

