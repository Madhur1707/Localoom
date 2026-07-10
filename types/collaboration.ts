// The identity a client publishes into Yjs awareness. CollaborationCaret reads
// `name`/`color` to render the remote cursor; `id` lets us dedupe the same
// person across tabs/reconnects in the collaborator list.
export type PresenceUser = {
  id: string;
  name: string;
  color: string;
};

// A participant as surfaced to the UI (avatar stack, cursors), derived from the
// awareness states of everyone currently in the room.
export type CollaboratorPresence = {
  clientId: number;
  userId: string;
  name: string;
  color: string;
  isSelf: boolean;
};

// Realtime link state, mirrored from the y-websocket provider's `status` events.
export type SyncConnectionStatus = "connecting" | "connected" | "disconnected";
