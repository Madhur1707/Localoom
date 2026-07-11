"use client";

import { useCallback, useEffect, useState } from "react";

import * as documentService from "@/services/documentService";
import type { AssignableDocumentRole } from "@/lib/validators/documentSchema";
import type {
  DocumentInvitationSummary,
  DocumentMemberSummary,
} from "@/types/document";



export function useDocumentSharing(documentId: string | null) {
  const [members, setMembers] = useState<DocumentMemberSummary[]>([]);
  const [invitations, setInvitations] = useState<DocumentInvitationSummary[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isMutating, setIsMutating] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  useEffect(() => {
    if (!documentId) return;

    let isCancelled = false;
    const load = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const sharing = await documentService.fetchDocumentSharing(documentId);
        if (!isCancelled) {
          setMembers(sharing.members);
          setInvitations(sharing.invitations);
        }
      } catch (err) {
        if (!isCancelled) {
          setLoadError(
            err instanceof Error ? err.message : "Failed to load sharing"
          );
        }
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    void load();

    return () => {
      isCancelled = true;
    };
  }, [documentId]);


  const runMutation = useCallback(
    async (mutate: () => Promise<void>): Promise<boolean> => {
      setIsMutating(true);
      setMutationError(null);
      try {
        await mutate();
        return true;
      } catch (err) {
        setMutationError(
          err instanceof Error ? err.message : "Something went wrong"
        );
        return false;
      } finally {
        setIsMutating(false);
      }
    },
    []
  );


  const invite = useCallback(
    (email: string, role: AssignableDocumentRole) => {
      if (!documentId) return Promise.resolve(false);
      return runMutation(async () => {
        const outcome = await documentService.inviteDocumentMember(documentId, {
          email,
          role,
        });
        if (outcome.kind === "member") {
          setMembers((current) => [...current, outcome.member]);
        } else {
          setInvitations((current) => [...current, outcome.invitation]);
        }
      });
    },
    [documentId, runMutation]
  );

  const updateMemberRole = useCallback(
    (userId: string, role: AssignableDocumentRole) => {
      if (!documentId) return Promise.resolve(false);
      return runMutation(async () => {
        const updated = await documentService.changeDocumentMemberRole(
          documentId,
          userId,
          { role }
        );
        setMembers((current) =>
          current.map((member) =>
            member.userId === userId ? updated : member
          )
        );
      });
    },
    [documentId, runMutation]
  );

  const removeMember = useCallback(
    (userId: string) => {
      if (!documentId) return Promise.resolve(false);
      return runMutation(async () => {
        await documentService.deleteDocumentMember(documentId, userId);
        setMembers((current) =>
          current.filter((member) => member.userId !== userId)
        );
      });
    },
    [documentId, runMutation]
  );

  const revokeInvitation = useCallback(
    (invitationId: string) => {
      if (!documentId) return Promise.resolve(false);
      return runMutation(async () => {
        await documentService.deleteDocumentInvitation(documentId, invitationId);
        setInvitations((current) =>
          current.filter((invitation) => invitation.id !== invitationId)
        );
      });
    },
    [documentId, runMutation]
  );

  return {
    members,
    invitations,
    isLoading,
    loadError,
    isMutating,
    mutationError,
    invite,
    updateMemberRole,
    removeMember,
    revokeInvitation,
  };
}
