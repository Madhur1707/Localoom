import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { documentErrorResponse } from "@/lib/api/documentApiError";
import { updateDocumentMemberSchema } from "@/lib/validators/documentSchema";
import {
  removeDocumentMember,
  updateDocumentMemberRole,
} from "@/services/documentService";

// PATCH  /api/documents/:id/members/:userId  — change a member's role (owners)
// DELETE /api/documents/:id/members/:userId  — remove a member (owner or self)

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateDocumentMemberSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { id, userId } = await params;
  try {
    const member = await updateDocumentMemberRole(
      id,
      session.user.id,
      userId,
      parsed.data
    );
    return NextResponse.json({ member });
  } catch (error) {
    return documentErrorResponse(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, userId } = await params;
  try {
    await removeDocumentMember(id, session.user.id, userId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return documentErrorResponse(error);
  }
}
