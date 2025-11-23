"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import * as Tabs from "@radix-ui/react-tabs";
import { ArrowUpIcon } from "@radix-ui/react-icons";
import { Button } from "@repo/ui/button";
import { IframePlaceholder } from "../../components/iframe-placeholder";
import { AnimatedBackground } from "../../components/animated-background";
import { PageHeader } from "../../components/page-header";
import { apiClient, API_ENDPOINTS } from "../../config/api";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function ChatPage() {
  const params = useParams();
  const chatId = params.chat_id as string;
  
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [input, setInput] = React.useState("");
  const [activeTab, setActiveTab] = React.useState("code");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isLoadingChat, setIsLoadingChat] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const [isMaxHeight, setIsMaxHeight] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Auto-resize textarea
  React.useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    const lineHeight = parseInt(getComputedStyle(textarea).lineHeight) || 24;
    const maxHeight = lineHeight * 4;
    
    if (textarea.scrollHeight <= maxHeight) {
      textarea.style.height = `${textarea.scrollHeight}px`;
      textarea.style.overflowY = "hidden";
      setIsMaxHeight(false);
    } else {
      textarea.style.height = `${maxHeight}px`;
      textarea.style.overflowY = "auto";
      setIsMaxHeight(true);
    }
  }, [input]);

  // Scroll to bottom when new messages arrive
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Fetch chat data when component mounts
  React.useEffect(() => {
    const fetchChat = async () => {
      if (!chatId) return;

      try {
        setIsLoadingChat(true);
        setError(null);

        const response = await apiClient.get(API_ENDPOINTS.chats.get(chatId));
        const data = response.data;
        
        if (data.messages && Array.isArray(data.messages)) {
          const formattedMessages: Message[] = data.messages.map((msg: any, index: number) => ({
            id: msg.id || `msg-${chatId}-${index}-${Math.random().toString(36).substr(2, 9)}`,
            role: msg.role || "user",
            content: msg.content || "",
            timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
          }));
          setMessages(formattedMessages);
        }
      } catch (err: any) {
        console.error("Error fetching chat:", err);
        const errorMessage =
          err.response?.data?.message ||
          err.message ||
          "Failed to load chat. Please try again.";
        setError(errorMessage);
      } finally {
        setIsLoadingChat(false);
      }
    };

    fetchChat();
  }, [chatId]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        handleSendMessage(e as any);
      }
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !chatId) return;

    const messageContent = input.trim();
    setInput("");
    setIsLoading(true);

    const userMessage: Message = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      role: "user",
      content: messageContent,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      const response = await apiClient.post(
        API_ENDPOINTS.chats.sendMessage(chatId),
        { content: messageContent }
      );

      const data = response.data;
      
      if (data.response || data.message || data.content) {
        const assistantMessage: Message = {
          id: data.id || `assistant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          role: "assistant",
          content: data.response || data.message || data.content || "",
          timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error: any) {
      console.error("Error sending message:", error);
      setMessages((prev) => prev.filter((msg) => msg.id !== userMessage.id));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-neutral-50 dark:bg-neutral-950 relative overflow-hidden">
      {/* Subtle mesh gradient background */}
      <div className="absolute inset-0 opacity-40 dark:opacity-20">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_50%,rgba(255,119,89,0.15),transparent_50%)]" />
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_50%,rgba(239,68,68,0.15),transparent_50%)]" />
        <div className="absolute bottom-0 left-1/2 w-full h-full bg-[radial-gradient(circle_at_50%_80%,rgba(251,113,133,0.1),transparent_50%)]" />
      </div>

      <PageHeader />

      {/* Main workspace */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        {/* Main content area - Full width with horizontal tabs */}
        <main className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-neutral-950 border-r border-neutral-200/80 dark:border-neutral-800/80">
          <Tabs.Root
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex-1 flex flex-col"
          >
            {/* Horizontal tabs at the top */}
            <div className="border-b border-neutral-200/80 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl">
              <Tabs.List className="flex gap-1 px-6 pt-3">
                {[
                  { value: "code", label: "Code Editor", icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  )},
                  { value: "preview", label: "Preview", icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )},
                ].map((tab) => (
                  <Tabs.Trigger
                    key={tab.value}
                    value={tab.value}
                    className="group relative px-5 py-2.5 text-sm font-medium transition-all duration-200 flex items-center gap-2
                      text-neutral-600 dark:text-neutral-400
                      data-[state=active]:text-neutral-900 dark:data-[state=active]:text-white
                      data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500/10 data-[state=active]:via-red-500/10 data-[state=active]:to-rose-500/10
                      data-[state=active]:rounded-t-lg
                      hover:text-neutral-900 dark:hover:text-white
                      hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50
                      hover:rounded-t-lg"
                  >
                    <span className="opacity-60 group-data-[state=active]:opacity-100 transition-opacity">
                      {tab.icon}
                    </span>
                    <span>{tab.label}</span>
                    {activeTab === tab.value && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 via-red-500 to-rose-500 rounded-full" />
                    )}
                  </Tabs.Trigger>
                ))}
              </Tabs.List>
            </div>

            {/* Tab content - Full width */}
            <Tabs.Content
              value="code"
              className="flex-1 overflow-hidden data-[state=inactive]:hidden relative"
            >
              <div className="absolute inset-0 bg-[#1e1e1e] dark:bg-black">
                <IframePlaceholder
                  src="https://github1s.com"
                  title="Code Editor"
                  placeholderTitle="Code Editor"
                  placeholderDescription="VS Code Server will load here"
                />
              </div>
            </Tabs.Content>

            <Tabs.Content
              value="preview"
              className="flex-1 overflow-hidden data-[state=inactive]:hidden relative bg-white dark:bg-neutral-950"
            >
              <IframePlaceholder
                src="https://example.com"
                title="Preview"
                placeholderTitle="Live Preview"
                placeholderDescription="Your application preview will appear here"
                icon={
                  <svg className="w-12 h-12 text-neutral-300 dark:text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                }
              />
            </Tabs.Content>
          </Tabs.Root>
        </main>

        {/* Right panel - Chat */}
        <aside className="w-[400px] flex flex-col bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl shadow-[0_0_30px_rgba(0,0,0,0.05)] dark:shadow-[0_0_30px_rgba(0,0,0,0.3)]">
          
          {/* Chat header */}
          {/* <div className="px-6 py-4 border-b border-neutral-200/80 dark:border-neutral-800/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 via-red-500 to-rose-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-base font-semibold text-neutral-900 dark:text-white">AI Assistant</h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {messages.length > 0 ? `${messages.length} messages` : "Ready to help"}
                </p>
              </div>
            </div>
          </div> */}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5 custom-scrollbar">
            {isLoadingChat ? (
              <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-10 h-10 border-3 border-neutral-200 dark:border-neutral-800 border-t-orange-500 rounded-full animate-spin" />
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">Loading...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                  <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-center max-w-xs">
                  <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">Error</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">{error}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.reload()}
                    className="h-9 px-4 text-sm border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                  >
                    Retry
                  </Button>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-100 to-rose-100 dark:from-orange-900/20 dark:to-rose-900/20 flex items-center justify-center">
                    <svg className="w-8 h-8 text-orange-500 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                </div>
                <div className="text-center max-w-xs">
                  <p className="text-sm font-medium text-neutral-900 dark:text-white mb-1">Start a conversation</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Ask me anything to build your application
                  </p>
                </div>
              </div>
            ) : (
              <>
                {messages.map((message, index) => {
                  const isUser = message.role === "user";
                  return (
                    <div
                      key={message.id}
                      className={`flex gap-3 animate-in fade-in-up ${
                        isUser ? "flex-row-reverse" : ""
                      }`}
                      style={{ animationDelay: `${index * 0.03}s` }}
                    >
                      <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                        isUser
                          ? "bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-md shadow-orange-500/30"
                          : "bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300"
                      }`}>
                        {isUser ? "U" : "AI"}
                      </div>
                      <div className={`flex-1 max-w-[80%] flex flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}>
                        <div className={`rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
                          isUser
                            ? "bg-gradient-to-br from-orange-500 via-red-500 to-rose-500 text-white shadow-md shadow-orange-500/20"
                            : "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border border-neutral-200 dark:border-neutral-700"
                        }`}>
                          {message.content}
                        </div>
                        <span className={`text-[10px] text-neutral-400 dark:text-neutral-600 px-1 ${isUser ? "text-right" : ""}`}>
                          {new Intl.DateTimeFormat("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          }).format(message.timestamp)}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {isLoading && (
                  <div className="flex gap-3 animate-in fade-in">
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-xs font-bold text-neutral-600 dark:text-neutral-300">
                      AI
                    </div>
                    <div className="bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-3">
                      <div className="flex gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-orange-500 animate-bounce" style={{ animationDelay: "0s" }} />
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-bounce" style={{ animationDelay: "0.15s" }} />
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-bounce" style={{ animationDelay: "0.3s" }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input */}
          <div className="px-6 py-4 border-t border-neutral-200/80 dark:border-neutral-800/80 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-xl">
            <form onSubmit={handleSendMessage} className="relative">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 via-red-500 to-rose-500 rounded-xl opacity-0 group-focus-within:opacity-10 blur-md transition-opacity duration-300" />
                <div className="relative bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl transition-all duration-300 group-focus-within:border-orange-400 dark:group-focus-within:border-orange-500 group-focus-within:shadow-lg group-focus-within:shadow-orange-500/10">
                  <div className={`flex gap-2 p-3 ${isMaxHeight ? "items-end" : "items-center"}`}>
                    <textarea
                      ref={textareaRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type your message..."
                      disabled={isLoading}
                      rows={1}
                      className="flex-1 bg-transparent border-none outline-none text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:ring-0 resize-none overflow-hidden min-h-[20px] leading-5"
                      style={{ height: "20px" }}
                    />
                    <Button
                      type="submit"
                      disabled={!input.trim() || isLoading}
                      variant="gradient"
                      size="sm"
                      className="flex-shrink-0 rounded-lg w-9 h-9 p-0 flex items-center justify-center disabled:opacity-30 transition-all shadow-md hover:shadow-lg"
                    >
                      <ArrowUpIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </aside>
      </div>
    </div>
  );
}

