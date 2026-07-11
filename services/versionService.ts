import { prisma } from "@/lib/prisma";
import { requireDocumentCapability } from "@/lib/authorization/documentAccess";
import type {
  DocumentVersionSnapshot,
  DocumentVersionSummary,
} from "@/types/document";

// Thrown when a version id doesn't resolve to a version of the given document.
// Mirrors the invitation-ownership guard in documentService: a 404 that hides
// whether the id exists on some other document.
export class DocumentVersionError extends Error {
  constructor(
    message: string,
    readonly status: 404
  ) {
    super(message);
    this.name = "DocumentVersionError";
  }
}

type VersionWithAuthor = {
  id: string;
  name: string;
  createdAt: Date;
  createdBy: { id: string; name: string | null } | null;
};

function toVersionSummary(version: VersionWithAuthor): DocumentVersionSummary {
  return {
    id: version.id,
    name: version.name,
    createdAt: version.createdAt.toISOString(),
    createdBy: version.createdBy,
  };
}

const AUTHOR_SELECT = { createdBy: { select: { id: true, name: true } } };

export async function listDocumentVersions(
  documentId: string,
  userId: string
): Promise<DocumentVersionSummary[]> {
  await requireDocumentCapability(documentId, userId, "view");

  const versions = await prisma.documentVersion.findMany({
    where: { documentId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      createdAt: true,
      ...AUTHOR_SELECT,
    },
  });

  return versions.map(toVersionSummary);
}

export async function createDocumentVersion(
  documentId: string,
  userId: string,
  name: string,
  snapshot: Uint8Array
): Promise<DocumentVersionSummary> {
  await requireDocumentCapability(documentId, userId, "edit");

  const version = await prisma.documentVersion.create({
    data: {
      documentId,
      name,
      snapshot: Buffer.from(snapshot),
      createdById: userId,
    },
    select: {
      id: true,
      name: true,
      createdAt: true,
      ...AUTHOR_SELECT,
    },
  });

  return toVersionSummary(version);
}

export async function getDocumentVersionSnapshot(
  documentId: string,
  userId: string,
  versionId: string
): Promise<DocumentVersionSnapshot> {
  await requireDocumentCapability(documentId, userId, "view");

  const version = await prisma.documentVersion.findUnique({
    where: { id: versionId },
    select: { id: true, name: true, documentId: true, snapshot: true },
  });
  if (!version || version.documentId !== documentId) {
    throw new DocumentVersionError("That version no longer exists.", 404);
  }

  return {
    id: version.id,
    name: version.name,
    snapshot: Buffer.from(version.snapshot).toString("base64"),
  };
}

export async function deleteDocumentVersion(
  documentId: string,
  userId: string,
  versionId: string
): Promise<void> {
  // Deleting history is an owner-level action.
  await requireDocumentCapability(documentId, userId, "manage");

  const version = await prisma.documentVersion.findUnique({
    where: { id: versionId },
    select: { documentId: true },
  });
  if (!version || version.documentId !== documentId) {
    throw new DocumentVersionError("That version no longer exists.", 404);
  }

  await prisma.documentVersion.delete({ where: { id: versionId } });
}
