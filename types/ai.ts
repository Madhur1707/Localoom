// The assistant supports three one-shot transforms plus free-form chat. Transforms
// operate on the selection (or whole document) and return replacement text; chat
// is conversational and grounded in the document.
export type AiAction = "summarize" | "fix-grammar" | "improve-writing" | "chat";

export type AiChatRole = "user" | "assistant";

export type AiChatMessage = {
  role: AiChatRole;
  content: string;
};
