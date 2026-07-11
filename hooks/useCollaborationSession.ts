"use client";

import { useEffect, useState } from "react";
import type { Awareness } from "y-protocols/awareness";
import type { WebsocketProvider } from "y-websocket";
import type * as Y from "yjs";

import { createDocumentSyncProvider } from "@/lib/yjs/provider";
import { fetchSyncAccessToken } from "@/services/documentService";
import type {
  CollaboratorPresence,
  PresenceUser,
  SyncConnectionStatus,
} from "@/types/collaboration";


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


export function useCollaborationSession(documentId: string, yDoc: Y.Doc) {
  const [provider, setProvider] = useState<WebsocketProvider | null>(null);
  const [connectionStatus, setConnectionStatus] =
    useState<SyncConnectionStatus>("connecting");
  const [collaborators, setCollaborators] = useState<CollaboratorPresence[]>(
    []
  );


  useEffect(() => {
    let isCancelled = false;
    let wsProvider: WebsocketProvider | null = null;

    const connect = async () => {
      let accessToken: string;
      try {
        accessToken = await fetchSyncAccessToken(documentId);
      } catch {
        if (!isCancelled) setConnectionStatus("disconnected");
        return;
      }
      if (isCancelled) return;

      const provider = createDocumentSyncProvider(documentId, yDoc, accessToken);
      wsProvider = provider;
      const { awareness } = provider;

      provider.on("status", (event: { status: SyncConnectionStatus }) =>
        setConnectionStatus(event.status)
      );
      awareness.on("change", () =>
        setCollaborators(collectCollaborators(awareness))
      );
      setProvider(provider);
    };

    void connect();

    return () => {
      isCancelled = true;
      if (wsProvider) {
        wsProvider.destroy();
      }
      setProvider(null);
      setConnectionStatus("connecting");
      setCollaborators([]);
    };
  }, [documentId, yDoc]);

  return { provider, connectionStatus, collaborators };
}
