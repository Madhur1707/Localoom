"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { JSONContent } from "@tiptap/core";

// The version history panel lives in the sidebar, but the live Y.Doc/editor lives
// down in the editor canvas. The canvas publishes a small action surface up here
// so the panel can snapshot the current state and restore a past one — the same
// upward-publishing pattern used by collaboration-session for presence.
export type DocumentActions = {
  // Whether the current user may write (owners/editors). Viewers can still browse
  // and preview history, so save/restore controls key off this.
  canEdit: boolean;
  // Encodes the current live document as a base64 snapshot, or null before the
  // local copy has loaded.
  encodeSnapshot: () => string | null;
  // Applies past content to the live document as a new collaborative edit — it
  // broadcasts to every peer and persists forward, never destroying history.
  restoreContent: (content: JSONContent) => void;
};

type DocumentActionsValue = {
  // null when no editor is mounted (e.g. on the dashboard).
  actions: DocumentActions | null;
  publishActions: (actions: DocumentActions) => void;
  resetActions: () => void;
};

const DocumentActionsContext = createContext<DocumentActionsValue | null>(null);

export function DocumentActionsProvider({ children }: { children: ReactNode }) {
  const [actions, setActions] = useState<DocumentActions | null>(null);

  const publishActions = useCallback(
    (next: DocumentActions) => setActions(next),
    []
  );
  const resetActions = useCallback(() => setActions(null), []);

  const value = useMemo<DocumentActionsValue>(
    () => ({ actions, publishActions, resetActions }),
    [actions, publishActions, resetActions]
  );

  return (
    <DocumentActionsContext.Provider value={value}>
      {children}
    </DocumentActionsContext.Provider>
  );
}

export function useDocumentActions() {
  const context = useContext(DocumentActionsContext);
  if (!context) {
    throw new Error(
      "useDocumentActions must be used within a DocumentActionsProvider"
    );
  }
  return context;
}
