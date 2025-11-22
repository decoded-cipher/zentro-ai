"use client";

import * as React from "react";
import * as Tabs from "@radix-ui/react-tabs";

export interface EditorTabsProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  tabs: Array<{ value: string; label: string }>;
  children: React.ReactNode;
}

export function EditorTabs({
  activeTab,
  onTabChange,
  tabs,
  children,
}: EditorTabsProps) {
  return (
    <Tabs.Root
      value={activeTab}
      onValueChange={onTabChange}
      className="flex-1 flex flex-col"
    >
      <div className="border-b border-border bg-card">
        <Tabs.List className="flex gap-1 px-4">
          {tabs.map((tab) => (
            <Tabs.Trigger
              key={tab.value}
              value={tab.value}
              className="px-4 py-2.5 text-sm font-medium text-foreground/60 data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-foreground transition-all duration-300 hover:text-foreground/80 hover:bg-muted/50 rounded-t-lg relative group"
            >
              {tab.label}
              <span className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
            </Tabs.Trigger>
          ))}
        </Tabs.List>
      </div>
      {children}
    </Tabs.Root>
  );
}

