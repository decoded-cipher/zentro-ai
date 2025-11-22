"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import * as Tabs from "@radix-ui/react-tabs";
import { EditorHeader } from "../components/editor-header";
import { ChatSidebar, type Message } from "../components/chat-sidebar";
import { EditorTabs } from "../components/editor-tabs";
import { IframePlaceholder } from "../components/iframe-placeholder";
import { AnimatedBackground } from "../components/animated-background";

export default function EditorPage() {
  const searchParams = useSearchParams();
  const initialPrompt = searchParams.get("prompt") || "";
  
  const [messages, setMessages] = React.useState<Message[]>(
    initialPrompt
      ? [
          {
            id: "1",
            role: "user",
            content: initialPrompt,
            timestamp: new Date(),
          },
        ]
      : []
  );
  const [input, setInput] = React.useState("");
  const [activeTab, setActiveTab] = React.useState("code");
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I'm working on your request. The code is being generated and will appear in the editor shortly.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="h-screen flex flex-col bg-background relative overflow-hidden">
      <AnimatedBackground variant="blur" />

      <EditorHeader />

      <div className="flex-1 flex overflow-hidden relative z-10">
        <ChatSidebar
          messages={messages}
          input={input}
          onInputChange={setInput}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
        />

        <main className="flex-1 flex flex-col overflow-hidden bg-background">
          <EditorTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            tabs={[
              { value: "code", label: "Code" },
              { value: "preview", label: "Preview" },
            ]}
          >
            <Tabs.Content
              value="code"
              className="flex-1 overflow-hidden data-[state=inactive]:hidden bg-background animate-in fade-in"
            >
              <IframePlaceholder
                src="https://github1s.com"
                title="Code Editor"
                placeholderTitle="VS Code Server will be embedded here"
                placeholderDescription="Replace the iframe src with your VS Code server URL"
              />
            </Tabs.Content>

            <Tabs.Content
              value="preview"
              className="flex-1 overflow-hidden data-[state=inactive]:hidden bg-background animate-in fade-in"
            >
              <IframePlaceholder
                src="https://example.com"
                title="Preview"
                placeholderTitle="Preview will be embedded here"
                placeholderDescription="Replace the iframe src with your preview URL"
                icon={
                  <svg
                    className="w-6 h-6 text-foreground/60"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                }
              />
            </Tabs.Content>
          </EditorTabs>
        </main>
      </div>
    </div>
  );
}

