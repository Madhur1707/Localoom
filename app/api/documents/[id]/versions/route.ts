import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { documentErrorResponse } from "@/lib/api/documentApiError";
import { createDocumentVersionSchema } from "@/lib/validators/documentSchema";
import {
  createDocumentVersion,
  listDocumentVersions,
} from "@/services/versionService";

// GET  /api/documents/:id/versions  — saved version list (any member)
// POST /api/documents/:id/versions  — save the current state as a named version
//                                     (editors and owners)
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
    const versions = await listDocumentVersions(id, session.user.id);
    return NextResponse.json({ versions });
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
  const parsed = createDocumentVersionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { id } = await params;
  const snapshot = Buffer.from(parsed.data.snapshot, "base64");
  try {
    const version = await createDocumentVersion(
      id,
      session.user.id,
      parsed.data.name,
      snapshot
    );
    return NextResponse.json({ version }, { status: 201 });
  } catch (error) {
    return documentErrorResponse(error);
  }
}
