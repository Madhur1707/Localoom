"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { streamAiAssistant } from "@/services/aiService";
import { useWorkspaceUi } from "@/components/workspace/workspace-ui";
import { useDocumentActions } from "@/components/workspace/document-actions";
import type { AiAction, AiChatMessage } from "@/types/ai";

// The label shown as the user's "turn" when a quick action runs; the real context
// (selection/document) travels server-side, not in the visible message.
const ACTION_LABEL: Record<Exclude<AiAction, "chat">, string> = {
  summarize: "Summarize",
  "fix-grammar": "Fix grammar",
  "improve-writing": "Improve writing",
};

// Drives the AI panel: owns the conversation, streams responses token-by-token,
// and pulls document context + insertion from the document-actions surface.
export function useAiAssistant() {
  const { activeDocument } = useWorkspaceUi();
  const { actions } = useDocumentActions();
  const documentId = activeDocument?.id ?? null;

  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const run = useCallback(
    async (
      action: AiAction,
      userMessage: AiChatMessage,
      requestMessages?: AiChatMessage[]
    ) => {
      if (!documentId || !actions) return;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setError(null);
      setIsStreaming(true);
      // Show the user's turn immediately, plus an empty assistant bubble to fill.
      setMessages((current) => [
        ...current,
        userMessage,
        { role: "assistant", content: "" },
      ]);

      try {
        const response = await streamAiAssistant(
          documentId,
          {
            action,
            documentText: actions.getDocumentText(),
            selectionText: actions.getSelectionText() ?? undefined,
            messages: requestMessages,
          },
          controller.signal
        );

        if (!response.body) return;
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          setMessages((current) => {
            const next = [...current];
            const last = next[next.length - 1];
            next[next.length - 1] = { ...last, content: last.content + chunk };
            return next;
          });
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(
          err instanceof Error
            ? err.message
            : "The assistant is unavailable right now."
        );
        // Drop the empty assistant placeholder so a failed turn leaves no ghost.
        setMessages((current) => {
          const last = current[current.length - 1];
          if (last?.role === "assistant" && last.content === "") {
            return current.slice(0, -1);
          }
          return current;
        });
      } finally {
        setIsStreaming(false);
      }
    },
    [documentId, actions]
  );

  const runAction = useCallback(
    (action: Exclude<AiAction, "chat">) =>
      run(action, { role: "user", content: ACTION_LABEL[action] }),
    [run]
  );

  const sendMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const userMessage: AiChatMessage = { role: "user", content: trimmed };
      // Chat needs the running conversation, including this new turn, as context.
      run("chat", userMessage, [...messages, userMessage]);
    },
    [run, messages]
  );

  const clear = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isStreaming,
    error,
    hasDocument: documentId !== null,
    canEdit: actions?.canEdit ?? false,
    insertResult: actions?.insertAiResult ?? null,
    runAction,
    sendMessage,
    clear,
  };
}
