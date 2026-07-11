import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { documentErrorResponse } from "@/lib/api/documentApiError";
import {
  deleteDocumentVersion,
  getDocumentVersionSnapshot,
} from "@/services/versionService";

// GET    /api/documents/:id/versions/:versionId — one version's snapshot bytes,
//                                                  base64-encoded (any member)
// DELETE /api/documents/:id/versions/:versionId — remove a saved version (owner)

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, versionId } = await params;
  try {
    const version = await getDocumentVersionSnapshot(
      id,
      session.user.id,
      versionId
    );
    return NextResponse.json(version);
  } catch (error) {
    return documentErrorResponse(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, versionId } = await params;
  try {
    await deleteDocumentVersion(id, session.user.id, versionId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return documentErrorResponse(error);
  }
}
