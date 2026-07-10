import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { createDocumentSchema } from "@/lib/validators/documentSchema";
import {
  createDocumentForUser,
  getDocumentsForUser,
} from "@/services/documentService";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const documents = await getDocumentsForUser(session.user.id);
  return NextResponse.json({ documents });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createDocumentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const document = await createDocumentForUser(
    parsed.data.title,
    session.user.id
  );

  return NextResponse.json(
    { document: { id: document.id, title: document.title } },
    { status: 201 }
  );
}
