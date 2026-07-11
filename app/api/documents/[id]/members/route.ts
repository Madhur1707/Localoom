import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { documentErrorResponse } from "@/lib/api/documentApiError";
import { addDocumentMemberSchema } from "@/lib/validators/documentSchema";
import {
  getDocumentSharingState,
  inviteToDocument,
} from "@/services/documentService";

// GET  /api/documents/:id/members  — roster for the share dialog (any member)
// POST /api/documents/:id/members  — invite by email (owners only)
// Authorization lives in the service layer; here we only translate failures.

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  try {
    const sharing = await getDocumentSharingState(id, session.user.id);
    return NextResponse.json(sharing);
  } catch (error) {
    return documentErrorResponse(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = addDocumentMemberSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { id } = await params;
  try {
    const outcome = await inviteToDocument(id, session.user.id, parsed.data);
    return NextResponse.json(outcome, { status: 201 });
  } catch (error) {
    return documentErrorResponse(error);
  }
}
