"use client";

import { CheckCheck, PenLine, Send, Sparkles, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWorkspaceUi } from "@/components/app-shell/workspace-ui";

const QUICK_ACTIONS = [
  { icon: Sparkles, label: "Summarize" },
  { icon: CheckCheck, label: "Fix Grammar" },
  { icon: PenLine, label: "Improve Writing" },
] as const;

// Placeholder AI panel. The real assistant (Groq via AI-SDK) is phase 6; this is
// the docked layout with non-functional controls so the shell is complete.
export function AiAssistantPanel() {
  const { isAiPanelOpen, closeAiPanel } = useWorkspaceUi();

  if (!isAiPanelOpen) return null;

  return (
    <aside className="flex h-full w-80 shrink-0 flex-col border-l border-border bg-card">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
        <span className="flex items-center gap-2 font-medium">
          <Sparkles className="size-4 text-primary" />
          AI Assistant
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Close AI assistant"
          onClick={closeAiPanel}
        >
          <X className="size-4" />
        </Button>
      </div>

      <div className="flex flex-col gap-2 p-3">
        {QUICK_ACTIONS.map(({ icon: Icon, label }) => (
          <Button
            key={label}
            type="button"
            variant="outline"
            className="w-full justify-start"
          >
            <Icon className="size-4 text-primary" />
            {label}
          </Button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-3">
        <div className="rounded-xl bg-muted/60 p-3 text-sm text-muted-foreground">
          Hi! I&apos;m your AI writing assistant. I can help you summarize, fix
          grammar, rewrite sections, or answer questions about your document.
        </div>
      </div>

      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2">
          <Input placeholder="Ask anything about your doc…" disabled />
          <Button type="button" size="icon-sm" aria-label="Send" disabled>
            <Send className="size-4" />
          </Button>
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Coming in the AI phase
        </p>
      </div>
    </aside>
  );
}
