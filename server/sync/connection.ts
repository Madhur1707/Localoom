import * as encoding from "lib0/encoding";
import * as decoding from "lib0/decoding";
import * as syncProtocol from "y-protocols/sync";
import {
  applyAwarenessUpdate,
  encodeAwarenessUpdate,
} from "y-protocols/awareness";
import type { RawData, WebSocket } from "ws";

import { MESSAGE_AWARENESS, MESSAGE_SYNC, toMessage } from "./protocol";
import type { CollaborationRoom } from "./collaborationRoom";

const PING_INTERVAL_MS = 30_000;

function toBytes(data: RawData): Uint8Array {
  if (Array.isArray(data)) return new Uint8Array(Buffer.concat(data));
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  return new Uint8Array(data as Buffer);
}

export async function setupCollaborationConnection(
  socket: WebSocket,
  room: CollaborationRoom,
  canWrite: boolean,
  userId: string
) {
  socket.binaryType = "arraybuffer";
  const connection = room.addConnection(socket, userId);

  // Attach the message handler synchronously so no client frame sent during the
  // hydration await is dropped. Any edit that lands before the replay finishes is
  // simply merged — Yjs updates are commutative, so ordering doesn't matter.
  socket.on("message", (data) =>
    handleMessage(socket, room, canWrite, toBytes(data))
  );

  const pingTimer = setInterval(() => {
    if (!connection.isAlive) {
      socket.terminate();
      return;
    }
    connection.isAlive = false;
    if (socket.readyState === socket.OPEN) socket.ping();
  }, PING_INTERVAL_MS);

  socket.on("pong", () => {
    connection.isAlive = true;
  });

  socket.on("close", () => {
    clearInterval(pingTimer);
    room.removeConnection(socket);
  });

  // Wait for the DB replay so our SyncStep1 reflects durable server content, not
  // an empty doc. The socket may close during the await; bail if so.
  await room.whenReady;
  if (socket.readyState !== socket.OPEN) return;
  sendInitialSync(socket, room);
}

// Client-server handshake, server side: send SyncStep1 (our state vector) so the
// client can reply with everything we're missing, then push current presence.
function sendInitialSync(socket: WebSocket, room: CollaborationRoom) {
  const syncEncoder = encoding.createEncoder();
  encoding.writeVarUint(syncEncoder, MESSAGE_SYNC);
  syncProtocol.writeSyncStep1(syncEncoder, room.doc);
  room.send(socket, toMessage(syncEncoder));

  const states = room.awareness.getStates();
  if (states.size === 0) return;

  const awarenessEncoder = encoding.createEncoder();
  encoding.writeVarUint(awarenessEncoder, MESSAGE_AWARENESS);
  encoding.writeVarUint8Array(
    awarenessEncoder,
    encodeAwarenessUpdate(room.awareness, [...states.keys()])
  );
  room.send(socket, toMessage(awarenessEncoder));
}

function handleMessage(
  socket: WebSocket,
  room: CollaborationRoom,
  canWrite: boolean,
  bytes: Uint8Array
) {
  const decoder = decoding.createDecoder(bytes);
  const messageType = decoding.readVarUint(decoder);

  switch (messageType) {
    case MESSAGE_SYNC:
      handleSyncMessage(socket, room, canWrite, decoder);
      break;
    case MESSAGE_AWARENESS:
      // Presence (cursor/name/colour) is allowed from everyone, including
      // viewers — being read-only doesn't make you invisible to collaborators.
      applyAwarenessUpdate(
        room.awareness,
        decoding.readVarUint8Array(decoder),
        socket
      );
      break;
    default:
      // Unknown frame types are ignored so a newer client can't crash the relay.
      break;
  }
}

// Dispatch a sync frame by its sub-type so we can authorize reads and writes
// separately. We read the sub-type varUint ourselves (instead of using
// readSyncMessage) precisely so a viewer's write frames can be dropped before
// they touch the doc.
function handleSyncMessage(
  socket: WebSocket,
  room: CollaborationRoom,
  canWrite: boolean,
  decoder: decoding.Decoder
) {
  const syncMessageType = decoding.readVarUint(decoder);

  // SyncStep1 is a read request — the client asking for our state. Everyone,
  // viewers included, may ask; we answer with SyncStep2 so they receive the doc.
  if (syncMessageType === syncProtocol.messageYjsSyncStep1) {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MESSAGE_SYNC);
    syncProtocol.readSyncStep1(decoder, encoder, room.doc);
    if (encoding.length(encoder) > 1) room.send(socket, toMessage(encoder));
    return;
  }

  // SyncStep2 and Update carry the client's own edits. Viewers are receive-only,
  // so their writes are dropped here — read-only is enforced on the wire, not
  // just by a disabled editor that a crafted client could bypass. `socket` is the
  // transaction origin so the change isn't echoed straight back to its author.
  if (!canWrite) return;
  if (syncMessageType === syncProtocol.messageYjsSyncStep2) {
    syncProtocol.readSyncStep2(decoder, room.doc, socket);
  } else if (syncMessageType === syncProtocol.messageYjsUpdate) {
    syncProtocol.readUpdate(decoder, room.doc, socket);
  }
}
