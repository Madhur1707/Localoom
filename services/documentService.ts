import { prisma } from "@/lib/prisma";
import type { CreateDocumentInput } from "@/lib/validators/documentSchema";
import type { DocumentSummary } from "@/types/document";

// Server-side calls only — for use in Server Components and Route Handlers.
// Every read goes through DocumentMember, so a user can only ever see
// documents they've actually been added to (tenant isolation).
export async function getDocumentsForUser(
  userId: string
): Promise<DocumentSummary[]> {
  const memberships = await prisma.documentMember.findMany({
    where: { userId },
    include: { document: true },
    orderBy: { document: { updatedAt: "desc" } },
  });

  return memberships.map(({ document, role }) => ({
    id: document.id,
    title: document.title,
    role,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
  }));
}

export async function getDocumentById(
  documentId: string,
  userId: string
): Promise<DocumentSummary | null> {
  const membership = await prisma.documentMember.findUnique({
    where: { documentId_userId: { documentId, userId } },
    include: { document: true },
  });

  if (!membership) return null;

  return {
    id: membership.document.id,
    title: membership.document.title,
    role: membership.role,
    createdAt: membership.document.createdAt,
    updatedAt: membership.document.updatedAt,
  };
}

// Creates the Document and its OWNER membership row together in one
// transaction, so a document can never briefly exist without an owner.
export async function createDocumentForUser(title: string, ownerId: string) {
  return prisma.document.create({
    data: {
      title,
      members: { create: { userId: ownerId, role: "OWNER" } },
    },
  });
}

// Client-side call — the only place a component/hook is allowed to fetch().
export async function createDocument(input: CreateDocumentInput) {
  const response = await fetch("/api/documents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const body = await response.json();
  if (!response.ok) {
    throw new Error(body.error ?? "Failed to create document");
  }

  return body.document as { id: string; title: string };
}
