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
