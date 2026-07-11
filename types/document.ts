import type { DocumentRole } from "@prisma/client";

export type { DocumentRole };

export type DocumentSummary = {
  id: string;
  title: string;
  role: DocumentRole;
  createdAt: Date;
  updatedAt: Date;
};

export type DocumentMemberSummary = {
  userId: string;
  name: string | null;
  email: string;
  role: DocumentRole;
  isCurrentUser: boolean;
};

export type DocumentInvitationSummary = {
  id: string;
  email: string;
  role: DocumentRole;
};

export type DocumentSharingState = {
  members: DocumentMemberSummary[];
  invitations: DocumentInvitationSummary[];
};

export type InviteOutcome =
  | { kind: "member"; member: DocumentMemberSummary }
  | { kind: "invitation"; invitation: DocumentInvitationSummary };

// A saved point-in-time version. Metadata only — the snapshot bytes are fetched
// separately (and only when previewing/restoring) so listing stays cheap.
// `createdAt` is an ISO string because this shape is JSON-transported to the client.
export type DocumentVersionSummary = {
  id: string;
  name: string;
  createdAt: string;
  createdBy: { id: string; name: string | null } | null;
};

// A single version's full Yjs state, base64-encoded for JSON transport. Decoded
// client-side into a throwaway Y.Doc to preview or restore its content.
export type DocumentVersionSnapshot = {
  id: string;
  name: string;
  snapshot: string;
};
