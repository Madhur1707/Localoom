import type { ModelMessage } from "ai";

import type { AiAction, AiChatMessage } from "@/types/ai";

// Transform prompts deliberately demand "only the resulting text" so the reply can
// be inserted straight into the document without stripping preamble or quotes.
const TRANSFORM_INSTRUCTIONS: Record<Exclude<AiAction, "chat">, string> = {
  summarize:
    "Summarize the text below concisely while preserving its key points. Respond with only the summary.",
  "fix-grammar":
    "Correct the spelling, grammar, and punctuation of the text below. Preserve the original meaning and tone. Respond with only the corrected text.",
  "improve-writing":
    "Improve the clarity, flow, and word choice of the text below without changing its meaning. Respond with only the improved text.",
};

const TRANSFORM_SYSTEM =
  "You are a precise writing assistant. Follow the instruction exactly and reply with only the resulting text — no preamble, no explanation, no surrounding quotes.";

const CHAT_SYSTEM =
  "You are a helpful writing assistant embedded in a collaborative document editor. Answer the user's questions clearly and concisely, grounded in the document content provided as context.";

export type BuildAssistantRequestInput = {
  action: AiAction;
  documentText: string;
  selectionText?: string;
  messages?: AiChatMessage[];
};

// Turns a validated request into the { system, messages } pair streamText expects.
// Chat replays the conversation with the document as system context; transforms
// send a single instruction over the selection (or the whole document).
export function buildAssistantRequest({
  action,
  documentText,
  selectionText,
  messages = [],
}: BuildAssistantRequestInput): { system: string; messages: ModelMessage[] } {
  if (action === "chat") {
    const conversation: ModelMessage[] = messages.map((message) =>
      message.role === "assistant"
        ? { role: "assistant", content: message.content }
        : { role: "user", content: message.content }
    );
    return {
      system: `${CHAT_SYSTEM}\n\nDocument content:\n"""\n${
        documentText.trim() || "(the document is empty)"
      }\n"""`,
      messages: conversation,
    };
  }

  const target = (selectionText?.trim() || documentText).trim();
  return {
    system: TRANSFORM_SYSTEM,
    messages: [
      {
        role: "user",
        content: `${TRANSFORM_INSTRUCTIONS[action]}\n\n"""\n${target}\n"""`,
      },
    ],
  };
}
