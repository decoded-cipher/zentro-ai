"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRightIcon } from "@radix-ui/react-icons";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { AnimatedBackground } from "./components/animated-background";
import { PageHeader } from "./components/page-header";
import { PageFooter } from "./components/page-footer";
import { apiClient, API_ENDPOINTS } from "./config/api";

export default function Home() {
  const router = useRouter();
  const [prompt, setPrompt] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const [isMaxHeight, setIsMaxHeight] = React.useState(false);

  // Auto-resize textarea: 1 line default, max 3 lines, then scroll
  React.useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to calculate scroll height
    textarea.style.height = "auto";
    
    // Calculate the height for one line
    const lineHeight = parseInt(getComputedStyle(textarea).lineHeight) || 24;
    const maxHeight = lineHeight * 3; // 3 lines max
    
    // Set height based on content, but cap at maxHeight
    if (textarea.scrollHeight <= maxHeight) {
      textarea.style.height = `${textarea.scrollHeight}px`;
      textarea.style.overflowY = "hidden";
      setIsMaxHeight(false);
    } else {
      textarea.style.height = `${maxHeight}px`;
      textarea.style.overflowY = "auto";
      setIsMaxHeight(true);
    }
  }, [prompt]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Allow Enter to submit, but Shift+Enter for new line
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (prompt.trim() && !isSubmitting) {
        handleSubmit(e as any);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isSubmitting) return;

    setIsSubmitting(true);
    
    try {
      // Send prompt to external backend REST API and get chat ID
      const response = await apiClient.post(API_ENDPOINTS.chats.create, {
        prompt: prompt.trim(),
      });

      const chatId = response.data.chat_id || response.data.id;

      if (!chatId) {
        throw new Error("No chat ID returned from backend");
      }

      // Navigate to chat page with the ID from backend
      router.push(`/chat/${chatId}`);
    } catch (error: any) {
      console.error("Error creating chat:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to create chat";
      // TODO: Show error message to user
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-gradient-to-b from-white/50 via-white to-white/50 dark:from-neutral-900/50 dark:via-neutral-900 dark:to-neutral-900 space-between">
      <AnimatedBackground variant="dots" />

      <PageHeader />

      <main className="flex flex-col items-center justify-center m-auto p-6 w-full flex-1 z-10">
        <div className="w-full max-w-4xl mx-auto space-y-8">
          <div className="flex justify-center">
            <div className="relative group">
              <div className="absolute inset-0 bg-orange-400/30 rounded-lg blur-lg group-hover:blur-xl transition-all duration-300" />
              <Badge
                variant="outline"
                className="relative inline-flex items-center gap-2 px-5 py-2.5 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm border border-orange-200/50 dark:border-orange-800/50 text-orange-700 dark:text-orange-300 hover:scale-105 hover:border-orange-300 dark:hover:border-orange-700 transition-all duration-300 shadow-md hover:shadow-lg"
              >
                <span className="text-lg">✨</span>
                <span>AI website builder</span>
              </Badge>
            </div>
          </div>

          <div
            className="text-center space-y-4 animate-in fade-in-up"
            style={{ animationDelay: "0.2s" }}
          >
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground leading-tight">
              Bring Your{" "}
              <span className="relative inline-block">
                <span className="relative z-10 bg-gradient-to-r from-orange-400 via-red-600 to-rose-600 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                  Vision to Life
                </span>
                <span className="absolute inset-0 bg-orange-400/20 blur-2xl animate-pulse-glow" />
              </span>
              <br />
              <span className="animate-in fade-in-up" style={{ animationDelay: "0.3s" }}>
                with Just Words
              </span>
            </h1>
            <p
              className="text-lg md:text-xl text-foreground/70 max-w-2xl mx-auto font-normal animate-in fade-in-up"
              style={{ animationDelay: "0.4s" }}
            >
              Create websites effortlessly by describing your ideas in natural language.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="w-full animate-in fade-in-up">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-orange-600 via-red-600 to-rose-600 rounded-lg opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500 group-focus-within:opacity-30 animate-pulse-glow" />
              <div className="relative bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm border-2 border-orange-200/60 dark:border-orange-800/60 rounded-lg shadow-lg p-4 transition-all duration-300 hover:shadow-2xl hover:scale-[1.01] focus-within:border-orange-400 dark:focus-within:border-orange-500 focus-within:shadow-orange-500/20">
                <div className={`flex gap-3 ${isMaxHeight ? "items-end justify-end" : "items-center"}`}>
                  <textarea
                    ref={textareaRef}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="What would you like to build?"
                    disabled={isSubmitting}
                    rows={1}
                    className="flex-1 bg-transparent border-none outline-none text-base text-foreground placeholder:text-foreground/50 focus:ring-0 focus:border-none resize-none overflow-hidden min-h-[24px] leading-6"
                    style={{ height: "24px" }}
                  />
                  <Button
                    type="submit"
                    disabled={!prompt.trim() || isSubmitting}
                    variant="gradient"
                    size="md"
                    className="relative overflow-hidden group flex-shrink-0 rounded-full p-3"
                  >
                    {prompt.trim() && !isSubmitting && (
                      <>
                        <span className="absolute inset-0 bg-gradient-to-r from-orange-400 via-red-400 to-rose-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-shimmer" />
                        <span className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                      </>
                    )}
                    <span className="relative z-10 font-semibold hidden sm:inline">Generate</span>
                    <ArrowRightIcon className="w-4 h-4 relative group-hover:translate-x-1 transition-transform duration-300" />
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </main>

      <PageFooter />

    </div>
  );
}
