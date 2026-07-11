import { prisma } from "@/lib/prisma";
import type { DocumentRole } from "@/types/document";


export type DocumentCapability = "view" | "edit" | "manage";


const CAPABILITIES_BY_ROLE: Record<DocumentRole, Set<DocumentCapability>> = {
  VIEWER: new Set(["view"]),
  EDITOR: new Set(["view", "edit"]),
  OWNER: new Set(["view", "edit", "manage"]),
};


export type DocumentAccess = {
  role: DocumentRole;
  canView: boolean;
  canEdit: boolean;
  canManage: boolean;
};

export type AuthorizationDenialReason = "not-a-member" | "insufficient-role";

export class DocumentAuthorizationError extends Error {
  constructor(readonly reason: AuthorizationDenialReason) {
    super(
      reason === "not-a-member"
        ? "You do not have access to this document."
        : "You do not have permission to perform this action."
    );
    this.name = "DocumentAuthorizationError";
  }
}

function toAccess(role: DocumentRole): DocumentAccess {
  const capabilities = CAPABILITIES_BY_ROLE[role];
  return {
    role,
    canView: capabilities.has("view"),
    canEdit: capabilities.has("edit"),
    canManage: capabilities.has("manage"),
  };
}

export async function resolveDocumentAccess(
  documentId: string,
  userId: string
): Promise<DocumentAccess | null> {
  const membership = await prisma.documentMember.findUnique({
    where: { documentId_userId: { documentId, userId } },
    select: { role: true },
  });

  return membership ? toAccess(membership.role) : null;
}

const CAPABILITY_FLAG: Record<DocumentCapability, keyof DocumentAccess> = {
  view: "canView",
  edit: "canEdit",
  manage: "canManage",
};

export async function requireDocumentCapability(
  documentId: string,
  userId: string,
  capability: DocumentCapability
): Promise<DocumentAccess> {
  const access = await resolveDocumentAccess(documentId, userId);
  if (!access) {
    throw new DocumentAuthorizationError("not-a-member");
  }
  if (!access[CAPABILITY_FLAG[capability]]) {
    throw new DocumentAuthorizationError("insufficient-role");
  }
  return access;
}
