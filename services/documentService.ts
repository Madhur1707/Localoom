import { prisma } from "@/lib/prisma";
import type {
  AddDocumentMemberInput,
  CreateDocumentInput,
  UpdateDocumentMemberInput,
} from "@/lib/validators/documentSchema";
import {
  requireDocumentCapability,
  resolveDocumentAccess,
} from "@/lib/authorization/documentAccess";
import type {
  DocumentRole,
  DocumentMemberSummary,
  DocumentSharingState,
  DocumentSummary,
  DocumentVersionSnapshot,
  DocumentVersionSummary,
  InviteOutcome,
} from "@/types/document";


export class DocumentMembershipError extends Error {
  constructor(
    message: string,
    readonly status: 400 | 404 | 409
  ) {
    super(message);
    this.name = "DocumentMembershipError";
  }
}


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


export async function createDocumentForUser(title: string, ownerId: string) {
  return prisma.document.create({
    data: {
      title,
      members: { create: { userId: ownerId, role: "OWNER" } },
    },
  });
}



export async function getDocumentSharingState(
  documentId: string,
  requesterId: string
): Promise<DocumentSharingState> {
  const access = await requireDocumentCapability(documentId, requesterId, "view");
  const documentInvitation = prisma.documentInvitation;

  const members = await prisma.documentMember.findMany({
    where: { documentId },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
  });


  const invitations = access.canManage
    ? await documentInvitation.findMany({
        where: { documentId, status: "PENDING" },
        orderBy: { createdAt: "asc" },
      })
    : [];

  return {
    members: members.map(({ user, role }) => ({
      userId: user.id,
      name: user.name,
      email: user.email,
      role,
      isCurrentUser: user.id === requesterId,
    })),
    invitations: invitations.map((invitation: { id: string; email: string; role: DocumentRole }) => ({
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
    })),
  };
}

export async function inviteToDocument(
  documentId: string,
  requesterId: string,
  input: AddDocumentMemberInput
): Promise<InviteOutcome> {
  await requireDocumentCapability(documentId, requesterId, "manage");

  const invitee = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true, name: true, email: true },
  });

  if (invitee) {
    const alreadyMember = await prisma.documentMember.findUnique({
      where: { documentId_userId: { documentId, userId: invitee.id } },
      select: { id: true },
    });
    if (alreadyMember) {
      throw new DocumentMembershipError(
        "That person is already on this document.",
        409
      );
    }

    await prisma.documentMember.create({
      data: { documentId, userId: invitee.id, role: input.role },
    });

    return {
      kind: "member",
      member: {
        userId: invitee.id,
        name: invitee.name,
        email: invitee.email,
        role: input.role,
        isCurrentUser: invitee.id === requesterId,
      },
    };
  }

  const existingInvitation = await prisma.documentInvitation.findUnique({
    where: { documentId_email: { documentId, email: input.email } },
    select: { id: true, status: true },
  });
  if (existingInvitation?.status === "PENDING") {
    throw new DocumentMembershipError(
      "That email has already been invited.",
      409
    );
  }


  const invitation = await prisma.documentInvitation.upsert({
    where: { documentId_email: { documentId, email: input.email } },
    create: {
      documentId,
      email: input.email,
      role: input.role,
      invitedById: requesterId,
    },
    update: {
      role: input.role,
      status: "PENDING",
      invitedById: requesterId,
      acceptedAt: null,
    },
  });

  return {
    kind: "invitation",
    invitation: {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
    },
  };
}


export async function revokeDocumentInvitation(
  documentId: string,
  requesterId: string,
  invitationId: string
): Promise<void> {
  await requireDocumentCapability(documentId, requesterId, "manage");

  const invitation = await prisma.documentInvitation.findUnique({
    where: { id: invitationId },
    select: { documentId: true, status: true },
  });

  if (
    !invitation ||
    invitation.documentId !== documentId ||
    invitation.status !== "PENDING"
  ) {
    throw new DocumentMembershipError("That invitation no longer exists.", 404);
  }

  await prisma.documentInvitation.delete({ where: { id: invitationId } });
}


export async function redeemDocumentInvitations(
  userId: string,
  email: string
): Promise<void> {
  const invitations = await prisma.documentInvitation.findMany({
    where: { email, status: "PENDING" },
    select: { id: true, documentId: true, role: true },
  });
  if (invitations.length === 0) return;

  const acceptedAt = new Date();
  await prisma.$transaction([
    ...invitations.flatMap((invitation: { id: string; documentId: string; role: DocumentRole }) => [
      prisma.documentMember.upsert({
        where: {
          documentId_userId: { documentId: invitation.documentId, userId },
        },
        create: {
          documentId: invitation.documentId,
          userId,
          role: invitation.role,
        },
        update: {},
      }),
      prisma.documentInvitation.update({
        where: { id: invitation.id },
        data: { status: "ACCEPTED", acceptedAt },
      }),
    ]),
  ]);
}


export async function updateDocumentMemberRole(
  documentId: string,
  requesterId: string,
  targetUserId: string,
  input: UpdateDocumentMemberInput
): Promise<DocumentMemberSummary> {
  await requireDocumentCapability(documentId, requesterId, "manage");

  const target = await prisma.documentMember.findUnique({
    where: { documentId_userId: { documentId, userId: targetUserId } },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  if (!target) {
    throw new DocumentMembershipError("That person is not a member.", 404);
  }
  if (target.role === "OWNER") {
    throw new DocumentMembershipError(
      "The document owner's role cannot be changed.",
      400
    );
  }

  await prisma.documentMember.update({
    where: { documentId_userId: { documentId, userId: targetUserId } },
    data: { role: input.role },
  });

  return {
    userId: target.user.id,
    name: target.user.name,
    email: target.user.email,
    role: input.role,
    isCurrentUser: target.user.id === requesterId,
  };
}


export async function removeDocumentMember(
  documentId: string,
  requesterId: string,
  targetUserId: string
): Promise<void> {
  const isSelfRemoval = targetUserId === requesterId;
  if (!isSelfRemoval) {
    await requireDocumentCapability(documentId, requesterId, "manage");
  } else if (!(await resolveDocumentAccess(documentId, requesterId))) {
    // Leaving still requires being a member in the first place.
    throw new DocumentMembershipError("That person is not a member.", 404);
  }

  const target = await prisma.documentMember.findUnique({
    where: { documentId_userId: { documentId, userId: targetUserId } },
    select: { role: true },
  });
  if (!target) {
    throw new DocumentMembershipError("That person is not a member.", 404);
  }
  if (target.role === "OWNER") {
    throw new DocumentMembershipError(
      "The document owner cannot be removed.",
      400
    );
  }

  await prisma.documentMember.delete({
    where: { documentId_userId: { documentId, userId: targetUserId } },
  });
}


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


async function parseJsonOrThrow<T>(
  response: Response,
  fallbackMessage: string
): Promise<T> {
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(body?.error ?? fallbackMessage);
  }
  return body as T;
}

export async function fetchDocumentSharing(documentId: string) {
  const response = await fetch(`/api/documents/${documentId}/members`);
  return parseJsonOrThrow<DocumentSharingState>(
    response,
    "Failed to load sharing settings"
  );
}

export async function inviteDocumentMember(
  documentId: string,
  input: AddDocumentMemberInput
): Promise<InviteOutcome> {
  const response = await fetch(`/api/documents/${documentId}/members`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseJsonOrThrow<InviteOutcome>(response, "Failed to send invite");
}

export async function deleteDocumentInvitation(
  documentId: string,
  invitationId: string
) {
  const response = await fetch(
    `/api/documents/${documentId}/invitations/${invitationId}`,
    { method: "DELETE" }
  );
  if (!response.ok) {
    await parseJsonOrThrow(response, "Failed to revoke invitation");
  }
}

export async function changeDocumentMemberRole(
  documentId: string,
  userId: string,
  input: UpdateDocumentMemberInput
) {
  const response = await fetch(
    `/api/documents/${documentId}/members/${userId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }
  );
  const body = await parseJsonOrThrow<{ member: DocumentMemberSummary }>(
    response,
    "Failed to update role"
  );
  return body.member;
}

export async function deleteDocumentMember(documentId: string, userId: string) {
  const response = await fetch(
    `/api/documents/${documentId}/members/${userId}`,
    { method: "DELETE" }
  );
  if (!response.ok) {
    await parseJsonOrThrow(response, "Failed to remove member");
  }
}

export async function fetchDocumentVersions(
  documentId: string
): Promise<DocumentVersionSummary[]> {
  const response = await fetch(`/api/documents/${documentId}/versions`);
  const body = await parseJsonOrThrow<{ versions: DocumentVersionSummary[] }>(
    response,
    "Failed to load version history"
  );
  return body.versions;
}

export async function createDocumentVersionSnapshot(
  documentId: string,
  name: string,
  snapshot: string
): Promise<DocumentVersionSummary> {
  const response = await fetch(`/api/documents/${documentId}/versions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, snapshot }),
  });
  const body = await parseJsonOrThrow<{ version: DocumentVersionSummary }>(
    response,
    "Failed to save version"
  );
  return body.version;
}

export async function fetchDocumentVersionSnapshot(
  documentId: string,
  versionId: string
): Promise<DocumentVersionSnapshot> {
  const response = await fetch(
    `/api/documents/${documentId}/versions/${versionId}`
  );
  return parseJsonOrThrow<DocumentVersionSnapshot>(
    response,
    "Failed to load version"
  );
}

export async function deleteDocumentVersion(
  documentId: string,
  versionId: string
): Promise<void> {
  const response = await fetch(
    `/api/documents/${documentId}/versions/${versionId}`,
    { method: "DELETE" }
  );
  if (!response.ok) {
    await parseJsonOrThrow(response, "Failed to delete version");
  }
}

export async function fetchSyncAccessToken(documentId: string) {
  const response = await fetch(`/api/documents/${documentId}/sync-token`, {
    method: "POST",
  });
  const body = await parseJsonOrThrow<{ token: string }>(
    response,
    "Failed to authorize realtime sync"
  );
  return body.token;
}
