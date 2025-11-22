"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "./components/page-header";
import { PageFooter } from "./components/page-footer";
import { HeroSection } from "./components/hero-section";
import { PromptInput } from "./components/prompt-input";
import { AnimatedBackground } from "./components/animated-background";

export default function Home() {
  const router = useRouter();
  const [prompt, setPrompt] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isSubmitting) return;

    setIsSubmitting(true);
    router.push(`/editor?prompt=${encodeURIComponent(prompt)}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/50 via-white to-white dark:from-orange-950/20 dark:via-gray-950 dark:to-gray-950 relative overflow-hidden">
      <AnimatedBackground variant="dots" />

      {/* <PageHeader /> */}

      <HeroSection
        badge={{ icon: "✨", text: "AI website builder" }}
        title={
          <>
            Bring Your{" "}
            <span className="relative inline-block">
              <span className="relative z-10 bg-gradient-to-r from-orange-600 via-red-600 to-rose-600 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                Vision to Life
              </span>
              <span className="absolute inset-0 bg-orange-400/20 blur-2xl animate-pulse-glow" />
            </span>
            <br />
            <span className="animate-in fade-in-up" style={{ animationDelay: "0.3s" }}>
              with Just Words
            </span>
          </>
        }
        description="Create websites effortlessly by describing your ideas in natural language."
      >
        <PromptInput
          value={prompt}
          onChange={setPrompt}
          onSubmit={handleSubmit}
          isLoading={isSubmitting}
        />
      </HeroSection>

      {/* <PageFooter /> */}
    </div>
  );
}
