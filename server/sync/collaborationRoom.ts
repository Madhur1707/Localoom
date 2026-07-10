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

// A connection tracks which awareness client-ids it "controls" so that when the
// socket drops we can retract exactly those presence states (and nothing else).
export type RoomConnection = {
  socket: WebSocket;
  controlledClientIds: Set<number>;
  isAlive: boolean;
};

// One CollaborationRoom == one document being edited. It owns the authoritative
// in-memory Y.Doc and Awareness for that document and fans every local change
// out to all connected sockets. Nothing here is persisted: the room lives only
// while at least one client is connected (see the registry below), and clients
// re-seed it from their own IndexedDB copy on reconnect.
export class CollaborationRoom {
  readonly name: string;
  readonly doc: Y.Doc;
  readonly awareness: Awareness;
  readonly connections = new Map<WebSocket, RoomConnection>();

  constructor(name: string) {
    this.name = name;
    this.doc = new Y.Doc();
    this.awareness = new Awareness(this.doc);
    // The server never owns a presence entry of its own.
    this.awareness.setLocalState(null);

    this.doc.on("update", this.broadcastDocumentUpdate);
    this.awareness.on("update", this.broadcastAwarenessUpdate);
  }

  // A document edit anywhere becomes a sync `update` message for everyone.
  private broadcastDocumentUpdate = (update: Uint8Array, origin: unknown) => {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MESSAGE_SYNC);
    syncProtocol.writeUpdate(encoder, update);
    const message = toMessage(encoder);
    // Skip the socket that produced the change — it already has it applied.
    this.connections.forEach((_conn, socket) => {
      if (socket !== origin) this.send(socket, message);
    });
  };

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

  addConnection(socket: WebSocket): RoomConnection {
    const connection: RoomConnection = {
      socket,
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

function disposeRoomIfEmpty(room: CollaborationRoom) {
  if (room.connections.size > 0) return;
  rooms.delete(room.name);
  room.destroy();
}
