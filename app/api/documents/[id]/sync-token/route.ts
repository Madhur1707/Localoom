import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { documentErrorResponse } from "@/lib/api/documentApiError";
import { requireDocumentCapability } from "@/lib/authorization/documentAccess";
import { signSyncToken } from "@/lib/collaboration/syncToken";


export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  try {
    const access = await requireDocumentCapability(id, session.user.id, "view");
    const token = await signSyncToken({
      documentId: id,
      userId: session.user.id,
      name: session.user.name ?? null,
      role: access.role,
    });
    return NextResponse.json({ token });
  } catch (error) {
    return documentErrorResponse(error);
  }
}
