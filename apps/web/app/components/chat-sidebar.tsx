"use client";

import * as React from "react";
import { MessageList } from "./message-list";
import { ChatInput } from "./chat-input";
import type { Message } from "./message-item";

export interface ChatSidebarProps {
  messages: Message[];
  input: string;
  onInputChange: (value: string) => void;
  onSendMessage: (e: React.FormEvent) => void;
  isLoading?: boolean;
  title?: string;
  description?: string;
}

export function ChatSidebar({
  messages,
  input,
  onInputChange,
  onSendMessage,
  isLoading = false,
  title = "Chat",
  description = "Refine your app through conversation",
}: ChatSidebarProps) {
  return (
    <aside className="w-80 border-r border-border bg-card flex flex-col animate-in slide-in-right relative">
      <div className="p-5 border-b border-border">
        <h2 className="font-semibold text-base mb-1">{title}</h2>
        <p className="text-sm text-foreground/50">{description}</p>
      </div>

      <MessageList messages={messages} isLoading={isLoading} />

      <ChatInput
        value={input}
        onChange={onInputChange}
        onSubmit={onSendMessage}
        isLoading={isLoading}
      />
    </aside>
  );
}

