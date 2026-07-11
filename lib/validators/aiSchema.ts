import { z } from "zod";

// Caps keep a request inside the model's context window and bound token spend —
// a single edit's worth of text, not an entire book.
const MAX_TEXT_LENGTH = 24000;

export const aiChatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(MAX_TEXT_LENGTH),
});

export const aiAssistantRequestSchema = z.object({
  action: z.enum(["summarize", "fix-grammar", "improve-writing", "chat"]),
  documentText: z.string().max(MAX_TEXT_LENGTH),
  selectionText: z.string().max(MAX_TEXT_LENGTH).optional(),
  messages: z.array(aiChatMessageSchema).max(50).optional(),
});

export type AiAssistantRequestInput = z.infer<typeof aiAssistantRequestSchema>;
