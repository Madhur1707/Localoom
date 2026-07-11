import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { documentErrorResponse } from "@/lib/api/documentApiError";
import { revokeDocumentInvitation } from "@/services/documentService";

// DELETE /api/documents/:id/invitations/:invitationId
// Revokes a pending invitation (owners only). Authorization + scoping to the
// document live in the service; here we only translate failures.
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; invitationId: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, invitationId } = await params;
  try {
    await revokeDocumentInvitation(id, session.user.id, invitationId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return documentErrorResponse(error);
  }
}
