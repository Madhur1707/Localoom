import * as Y from "yjs";
import * as encoding from "lib0/encoding";
import * as syncProtocol from "y-protocols/sync";
import {
  Awareness,
  encodeAwarenessUpdate,
  removeAwarenessStates,
} from "y-protocols/awareness";
import type { WebSocket } from "ws";

import { MESSAGE_AWARENESS, MESSAGE_SYNC, toMessage } from "./protocol";
import {
  compactDocumentUpdates,
  loadDocumentUpdates,
  persistDocumentUpdates,
  type PersistableUpdate,
} from "./persistence";


export type RoomConnection = {
  socket: WebSocket;
  userId: string;
  controlledClientIds: Set<number>;
  isAlive: boolean;
};

const HYDRATION_ORIGIN = Symbol("hydration");

const PERSIST_FLUSH_MS = 2000;

export class CollaborationRoom {
  readonly name: string;
  readonly doc: Y.Doc;
  readonly awareness: Awareness;
  readonly connections = new Map<WebSocket, RoomConnection>();

  // Resolves once the initial replay from storage has been applied. Callers wait
  // on this before sending their first sync so clients see server-side content.
  readonly whenReady: Promise<void>;

  // Edits awaiting their next flush, tagged with the author that produced them.
  private pendingWrites: { userId: string | null; update: Uint8Array }[] = [];
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  // Guards against overlapping compaction runs (fired fire-and-forget per flush).
  private isCompacting = false;

  constructor(name: string) {
    this.name = name;
    this.doc = new Y.Doc();
    this.awareness = new Awareness(this.doc);
    // The server never owns a presence entry of its own.
    this.awareness.setLocalState(null);

    this.doc.on("update", this.handleDocumentUpdate);
    this.awareness.on("update", this.broadcastAwarenessUpdate);

    this.whenReady = this.hydrateFromStorage();
  }



  private async hydrateFromStorage(): Promise<void> {
    try {
      const updates = await loadDocumentUpdates(this.name);
      if (updates.length > 0) {
        Y.applyUpdate(this.doc, Y.mergeUpdates(updates), HYDRATION_ORIGIN);
      }
    } catch (error) {
      console.error(`Failed to hydrate document ${this.name} from storage:`, error);
    }
  }


  private handleDocumentUpdate = (update: Uint8Array, origin: unknown) => {
    this.broadcastDocumentUpdate(update, origin);

    if (origin === HYDRATION_ORIGIN) return;
    const author =
      origin instanceof Object
        ? this.connections.get(origin as WebSocket)?.userId ?? null
        : null;
    this.pendingWrites.push({ userId: author, update });
    this.scheduleFlush();
  };

  private broadcastDocumentUpdate(update: Uint8Array, origin: unknown) {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MESSAGE_SYNC);
    syncProtocol.writeUpdate(encoder, update);
    const message = toMessage(encoder);
    // Skip the socket that produced the change — it already has it applied.
    this.connections.forEach((_conn, socket) => {
      if (socket !== origin) this.send(socket, message);
    });
  }

  private scheduleFlush() {
    if (this.flushTimer) return;
    this.flushTimer = setTimeout(() => {
      this.flushTimer = null;
      void this.flushPendingWrites();
    }, PERSIST_FLUSH_MS);
  }

  // Write buffered edits to the log, one merged row per author. On failure the
  // batch is re-queued so nothing is lost — the relay must never crash on a
  // transient DB error.
  async flushPendingWrites(): Promise<void> {
    if (this.pendingWrites.length === 0) return;
    const batch = this.pendingWrites;
    this.pendingWrites = [];

    const updatesByAuthor = new Map<string | null, Uint8Array[]>();
    for (const { userId, update } of batch) {
      const existing = updatesByAuthor.get(userId);
      if (existing) existing.push(update);
      else updatesByAuthor.set(userId, [update]);
    }

    const entries: PersistableUpdate[] = [...updatesByAuthor.entries()].map(
      ([userId, updates]) => ({
        userId,
        merged: updates.length === 1 ? updates[0] : Y.mergeUpdates(updates),
      })
    );

    try {
      await persistDocumentUpdates(this.name, entries);
      this.maybeCompact();
    } catch (error) {
      console.error(`Failed to persist updates for ${this.name}:`, error);
      this.pendingWrites.unshift(...batch);
      this.scheduleFlush();
    }
  }

  private maybeCompact() {
    if (this.isCompacting) return;
    this.isCompacting = true;
    compactDocumentUpdates(this.name)
      .then((compacted) => {
        if (compacted) console.log(`Compacted update log for ${this.name}`);
      })
      .catch((error) =>
        console.error(`Compaction failed for ${this.name}:`, error)
      )
      .finally(() => {
        this.isCompacting = false;
      });
  }

  // Presence changes (cursor, name, colour) are relayed to every socket. We also
  // record which client-ids each socket introduced so we can clean them up later.
  private broadcastAwarenessUpdate = (
    changes: { added: number[]; updated: number[]; removed: number[] },
    origin: unknown
  ) => {
    const changedClientIds = [
      ...changes.added,
      ...changes.updated,
      ...changes.removed,
    ];

    const originConnection =
      origin instanceof Object ? this.connections.get(origin as WebSocket) : undefined;
    if (originConnection) {
      changes.added.forEach((id) => originConnection.controlledClientIds.add(id));
      changes.removed.forEach((id) =>
        originConnection.controlledClientIds.delete(id)
      );
    }

    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MESSAGE_AWARENESS);
    encoding.writeVarUint8Array(
      encoder,
      encodeAwarenessUpdate(this.awareness, changedClientIds)
    );
    const message = toMessage(encoder);
    this.connections.forEach((_conn, socket) => this.send(socket, message));
  };

  send(socket: WebSocket, message: Uint8Array) {
    // readyState 1 === OPEN; guard against sockets mid-close.
    if (socket.readyState !== socket.OPEN) return;
    socket.send(message, (error) => {
      if (error) this.removeConnection(socket);
    });
  }

  addConnection(socket: WebSocket, userId: string): RoomConnection {
    const connection: RoomConnection = {
      socket,
      userId,
      controlledClientIds: new Set<number>(),
      isAlive: true,
    };
    this.connections.set(socket, connection);
    return connection;
  }

  removeConnection(socket: WebSocket) {
    const connection = this.connections.get(socket);
    if (!connection) return;
    this.connections.delete(socket);
    // Retract this client's presence so peers see them leave immediately.
    removeAwarenessStates(
      this.awareness,
      [...connection.controlledClientIds],
      null
    );
    disposeRoomIfEmpty(this);
  }

  destroy() {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    // Best-effort final flush; the buffer was captured synchronously so this
    // completes even as the doc is torn down.
    void this.flushPendingWrites();
    this.awareness.destroy();
    this.doc.destroy();
  }
}

// Registry: one room per document name, created on demand and torn down the
// moment its last socket disconnects, so idle documents cost nothing.
const rooms = new Map<string, CollaborationRoom>();

export function getOrCreateRoom(name: string): CollaborationRoom {
  let room = rooms.get(name);
  if (!room) {
    room = new CollaborationRoom(name);
    rooms.set(name, room);
  }
  return room;
}

// Flush every live room's buffered edits — used on graceful shutdown so a clean
// stop never drops the last few seconds of changes.
export async function flushAllRooms(): Promise<void> {
  await Promise.all([...rooms.values()].map((room) => room.flushPendingWrites()));
}

function disposeRoomIfEmpty(room: CollaborationRoom) {
  if (room.connections.size > 0) return;
  rooms.delete(room.name);
  room.destroy();
}
