import type { AiAction, AiChatMessage } from "@/types/ai";

export type AiAssistantRequest = {
  action: AiAction;
  documentText: string;
  selectionText?: string;
  messages?: AiChatMessage[];
};


export async function streamAiAssistant(
  documentId: string,
  request: AiAssistantRequest,
  signal?: AbortSignal
): Promise<Response> {
  const response = await fetch(`/api/documents/${documentId}/ai`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
    signal,
  });

  if (!response.ok || !response.body) {
    let message = "The assistant is unavailable right now.";
    try {
      const body = await response.json();
      if (body?.error) message = body.error;
    } catch {
      // Non-JSON error body — keep the default message.
    }
    throw new Error(message);
  }

  return response;
}
