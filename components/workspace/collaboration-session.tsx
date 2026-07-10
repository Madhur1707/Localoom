"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type {
  CollaboratorPresence,
  SyncConnectionStatus,
} from "@/types/collaboration";

// The realtime session lives inside the editor, but the top bar (which renders
// the collaborator stack + sync pill) sits *above* the editor in the tree. The
// editor publishes its live session here so the top bar can read it — the same
// upward-publishing pattern used for the active document title in workspace-ui.
type SessionSnapshot = {
  connectionStatus: SyncConnectionStatus;
  collaborators: CollaboratorPresence[];
};

type CollaborationSessionValue = {
  // null when no document is open (e.g. the dashboard) — the top bar then hides
  // its presence UI instead of showing a stale "Synced".
  connectionStatus: SyncConnectionStatus | null;
  collaborators: CollaboratorPresence[];
  publishSession: (snapshot: SessionSnapshot) => void;
  resetSession: () => void;
};

const CollaborationSessionContext =
  createContext<CollaborationSessionValue | null>(null);

export function CollaborationSessionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [snapshot, setSnapshot] = useState<SessionSnapshot | null>(null);

  const publishSession = useCallback(
    (next: SessionSnapshot) => setSnapshot(next),
    []
  );
  const resetSession = useCallback(() => setSnapshot(null), []);

  const value = useMemo<CollaborationSessionValue>(
    () => ({
      connectionStatus: snapshot?.connectionStatus ?? null,
      collaborators: snapshot?.collaborators ?? [],
      publishSession,
      resetSession,
    }),
    [snapshot, publishSession, resetSession]
  );

  return (
    <CollaborationSessionContext.Provider value={value}>
      {children}
    </CollaborationSessionContext.Provider>
  );
}

export function useCollaborationSessionContext() {
  const context = useContext(CollaborationSessionContext);
  if (!context) {
    throw new Error(
      "useCollaborationSessionContext must be used within a CollaborationSessionProvider"
    );
  }
  return context;
}
