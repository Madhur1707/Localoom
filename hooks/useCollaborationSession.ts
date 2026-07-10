"use client";

import { useEffect, useState } from "react";
import type { Awareness } from "y-protocols/awareness";
import type { WebsocketProvider } from "y-websocket";
import type * as Y from "yjs";

import { createDocumentSyncProvider } from "@/lib/yjs/provider";
import type {
  CollaboratorPresence,
  PresenceUser,
  SyncConnectionStatus,
} from "@/types/collaboration";

// Fold the raw awareness states (one per browser tab) into the participant list
// the UI wants: one entry per person, self flagged and sorted first, tabs with
// no published identity yet skipped.
function collectCollaborators(awareness: Awareness): CollaboratorPresence[] {
  const localClientId = awareness.clientID;
  const byUserId = new Map<string, CollaboratorPresence>();

  awareness.getStates().forEach((state, clientId) => {
    const user = state.user as PresenceUser | undefined;
    if (!user) return;

    const isSelf = clientId === localClientId;
    const existing = byUserId.get(user.id);
    if (existing && !isSelf) return;

    byUserId.set(user.id, {
      clientId,
      userId: user.id,
      name: user.name,
      color: user.color,
      isSelf: isSelf || Boolean(existing?.isSelf),
    });
  });

  return [...byUserId.values()].sort(
    (a, b) => Number(b.isSelf) - Number(a.isSelf)
  );
}

// Owns the realtime link for one open document: creates the WebSocket provider,
// tracks connection status, and derives the live collaborator list from
// awareness. The awareness `user` field itself is written by CollaborationCaret
// in the editor — this hook only reads it, so there is a single writer.
export function useCollaborationSession(documentId: string, yDoc: Y.Doc) {
  const [provider, setProvider] = useState<WebsocketProvider | null>(null);
  const [connectionStatus, setConnectionStatus] =
    useState<SyncConnectionStatus>("connecting");
  const [collaborators, setCollaborators] = useState<CollaboratorPresence[]>(
    []
  );

  // The provider is created *inside* the effect, not in a useMemo/useState
  // initializer, for two reasons:
  //   1. React StrictMode (dev) mounts → unmounts → remounts. A memoised
  //      provider would be destroyed by the first unmount and reused dead on the
  //      remount, leaving the socket permanently "connecting". Creating it here
  //      gives each mount a fresh, live provider.
  //   2. We attach the `status`/`change` listeners in the same synchronous block
  //      as construction, so a fast (localhost) connection can't fire `connected`
  //      before we're listening — which previously left navigations stuck on
  //      "Connecting…" while a slower cold refresh happened to win the race.
  useEffect(() => {
    const wsProvider = createDocumentSyncProvider(documentId, yDoc);
    const { awareness } = wsProvider;

    const handleStatus = (event: { status: SyncConnectionStatus }) =>
      setConnectionStatus(event.status);
    const handlePresenceChange = () =>
      setCollaborators(collectCollaborators(awareness));

    wsProvider.on("status", handleStatus);
    awareness.on("change", handlePresenceChange);
    // Publish the freshly created provider to render (the editor binds cursors to
    // it). This is a one-time resource hand-off, not a render loop — a useState
    // lazy initializer can't be used here because StrictMode would double-invoke
    // it and leak a second socket.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProvider(wsProvider);

    return () => {
      wsProvider.off("status", handleStatus);
      awareness.off("change", handlePresenceChange);
      // Destroying the provider disconnects the socket and clears our awareness
      // state, so peers see us leave. IndexedDB persistence is untouched.
      wsProvider.destroy();
      setProvider(null);
      setConnectionStatus("connecting");
      setCollaborators([]);
    };
  }, [documentId, yDoc]);

  return { provider, connectionStatus, collaborators };
}
