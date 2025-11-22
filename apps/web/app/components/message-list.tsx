"use client";

import * as React from "react";
import { MessageItem, type Message } from "./message-item";
import { EmptyState } from "./empty-state";

export interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
}

export function MessageList({ messages, isLoading = false }: MessageListProps) {
  const chatIcon = (
    <svg
      className="w-6 h-6 text-foreground/40"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    </svg>
  );

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.length === 0 ? (
        <EmptyState
          icon={chatIcon}
          description="Start a conversation to build your app"
        />
      ) : (
        <>
          {messages.map((message, index) => (
            <MessageItem key={message.id} message={message} index={index} />
          ))}
          {isLoading && <LoadingIndicator />}
        </>
      )}
    </div>
  );
}

function LoadingIndicator() {
  return (
    <div className="flex items-start gap-2 animate-in fade-in">
      <div className="bg-muted rounded-xl px-4 py-2.5 text-sm">
        <div className="flex gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-bounce" />
          <span
            className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-bounce"
            style={{ animationDelay: "0.1s" }}
          />
          <span
            className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-bounce"
            style={{ animationDelay: "0.2s" }}
          />
        </div>
      </div>
    </div>
  );
}

