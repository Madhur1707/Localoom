import { NextResponse } from "next/server";
import { streamText } from "ai";

import { auth } from "@/lib/auth";
import { documentErrorResponse } from "@/lib/api/documentApiError";
import { requireDocumentCapability } from "@/lib/authorization/documentAccess";
import { getAssistantModel } from "@/lib/ai/groq";
import { buildAssistantRequest } from "@/lib/ai/prompts";
import { aiAssistantRequestSchema } from "@/lib/validators/aiSchema";

// POST /api/documents/:id/ai — stream an assistant response (transform or chat).
// Requires membership (view): the key stays server-side and usage is gated to
// people with access to the document. Returns a plain text token stream the panel
// reads incrementally.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = aiAssistantRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { id } = await params;

  // Access failures map to the standard 403/404; keep them separate from AI/config
  // errors so each gets an honest status and message.
  try {
    await requireDocumentCapability(id, session.user.id, "view");
  } catch (error) {
    return documentErrorResponse(error);
  }

  try {
    const { system, messages } = buildAssistantRequest(parsed.data);
    const result = streamText({
      model: getAssistantModel(),
      system,
      messages,
    });
    return result.toTextStreamResponse();
  } catch (error) {
    // Most commonly a missing GROQ_API_KEY (see lib/ai/groq).
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "AI request failed" },
      { status: 500 }
    );
  }
}
