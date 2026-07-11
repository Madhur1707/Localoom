"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  CheckCheck,
  CornerDownLeft,
  PenLine,
  Sparkles,
  Trash2,
  WandSparkles,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Markdown } from "@/components/shared/Markdown";
import { useWorkspaceUi } from "@/components/workspace/workspace-ui";
import { useAiAssistant } from "@/hooks/useAiAssistant";
import type { AiAction, AiChatMessage } from "@/types/ai";

const QUICK_ACTIONS: {
  action: Exclude<AiAction, "chat">;
  icon: typeof Sparkles;
  label: string;
}[] = [
  { action: "summarize", icon: Sparkles, label: "Summarize" },
  { action: "fix-grammar", icon: CheckCheck, label: "Fix grammar" },
  { action: "improve-writing", icon: PenLine, label: "Improve writing" },
];

export function AiAssistantPanel() {
  const { isAiPanelOpen, closeAiPanel } = useWorkspaceUi();
  const {
    messages,
    isStreaming,
    error,
    hasDocument,
    canEdit,
    insertResult,
    runAction,
    sendMessage,
    clear,
  } = useAiAssistant();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Keep the newest message in view as tokens stream in.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  if (!isAiPanelOpen) return null;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!input.trim() || isStreaming) return;
    sendMessage(input);
    setInput("");
  };

  const controlsDisabled = !hasDocument || isStreaming;
  const hasConversation = messages.length > 0;

  return (
    <>
      {/* Mobile-only backdrop so the panel reads as an overlay, not a squeeze. */}
      <button
        type="button"
        aria-label="Close AI assistant"
        onClick={closeAiPanel}
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
      />
      <aside className="fixed inset-y-0 right-0 z-50 flex h-full w-[24rem] max-w-[88vw] shrink-0 flex-col border-l border-border bg-card lg:static lg:z-auto lg:w-[25rem] lg:max-w-none">
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
          <span className="flex items-center gap-2 font-medium">
            <Sparkles className="size-4 text-primary" />
            AI Assistant
          </span>
          <div className="flex items-center gap-1">
            {hasConversation ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clear}
              >
                <Trash2 className="size-3.5" />
                Clear
              </Button>
            ) : null}
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
        </div>

        {/* Quick actions live only on the empty state — once a conversation is
            going, the panel is all chat. */}
        {!hasConversation ? (
          <div className="flex flex-col gap-2 border-b border-border p-3">
            {QUICK_ACTIONS.map(({ action, icon: Icon, label }) => (
              <Button
                key={action}
                type="button"
                variant="outline"
                className="w-full justify-start"
                disabled={controlsDisabled}
                onClick={() => runAction(action)}
              >
                <Icon className="size-4 text-primary" />
                {label}
              </Button>
            ))}
          </div>
        ) : null}

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3">
          {!hasDocument ? (
            <EmptyState>Open a document to use the assistant.</EmptyState>
          ) : !hasConversation ? (
            <div className="border border-border bg-background/40 p-3 text-sm text-muted-foreground">
              Hi! I&apos;m your writing assistant. Use a quick action above, or
              ask me anything about your document.
            </div>
          ) : (
            <ul className="flex flex-col gap-4">
              {messages.map((message, index) => (
                <MessageBubble
                  key={index}
                  message={message}
                  isStreamingLast={isStreaming && index === messages.length - 1}
                  canInsert={
                    canEdit &&
                    message.role === "assistant" &&
                    !(isStreaming && index === messages.length - 1)
                  }
                  onInsert={
                    insertResult
                      ? () => insertResult(message.content)
                      : undefined
                  }
                />
              ))}
            </ul>
          )}

          {error ? (
            <p className="mt-3 text-sm text-destructive">{error}</p>
          ) : null}
        </div>

        <div className="border-t border-border p-3">
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <Input
              value={input}
              placeholder="Ask anything about your doc…"
              disabled={controlsDisabled}
              onChange={(event) => setInput(event.target.value)}
            />
            <Button
              type="submit"
              size="icon"
              straight
              aria-label="Send"
              disabled={controlsDisabled || !input.trim()}
            >
              {isStreaming ? (
                <LoadingSpinner className="text-current" />
              ) : (
                <CornerDownLeft className="size-4" />
              )}
            </Button>
          </form>
        </div>
      </aside>
    </>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full items-center justify-center px-4 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}

function MessageBubble({
  message,
  isStreamingLast,
  canInsert,
  onInsert,
}: {
  message: AiChatMessage;
  isStreamingLast: boolean;
  canInsert: boolean;
  onInsert?: () => void;
}) {
  const isUser = message.role === "user";

  return (
    <li
      className={cn("flex flex-col gap-1.5", isUser ? "items-end" : "items-start")}
    >
      <div
        className={cn(
          "max-w-[92%] px-3 py-2 text-sm",
          isUser
            ? "bg-primary/15 whitespace-pre-wrap text-foreground"
            : "bg-background/50 text-foreground"
        )}
      >
        {isUser ? (
          message.content
        ) : message.content ? (
          <Markdown>{message.content}</Markdown>
        ) : isStreamingLast ? (
          <LoadingSpinner />
        ) : null}
      </div>
      {canInsert && message.content.trim() && onInsert ? (
        <Button type="button" variant="outline" size="sm" onClick={onInsert}>
          <WandSparkles className="size-3.5 text-primary" />
          Insert into document
        </Button>
      ) : null}
    </li>
  );
}
