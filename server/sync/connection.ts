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

// Normalise whatever `ws` hands us (Buffer, ArrayBuffer, or a fragment list)
// into the single Uint8Array the lib0 decoder expects.
function toBytes(data: RawData): Uint8Array {
  if (Array.isArray(data)) return new Uint8Array(Buffer.concat(data));
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  return new Uint8Array(data as Buffer);
}

// Wire a freshly accepted socket into a room: kick off the sync handshake, relay
// its messages into the shared doc/awareness, and keep the link alive with pings.
export function setupCollaborationConnection(
  socket: WebSocket,
  room: CollaborationRoom
) {
  socket.binaryType = "arraybuffer";
  const connection = room.addConnection(socket);

  socket.on("message", (data) => handleMessage(socket, room, toBytes(data)));

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
  bytes: Uint8Array
) {
  const decoder = decoding.createDecoder(bytes);
  const messageType = decoding.readVarUint(decoder);

  switch (messageType) {
    case MESSAGE_SYNC: {
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, MESSAGE_SYNC);
      // `socket` is the transaction origin, so the doc's update handler knows
      // not to echo this change straight back to its author.
      syncProtocol.readSyncMessage(decoder, encoder, room.doc, socket);
      // Only reply when readSyncMessage actually wrote a response (e.g. the
      // SyncStep2 answer to a SyncStep1) — length 1 means just the tag.
      if (encoding.length(encoder) > 1) room.send(socket, toMessage(encoder));
      break;
    }
    case MESSAGE_AWARENESS: {
      applyAwarenessUpdate(
        room.awareness,
        decoding.readVarUint8Array(decoder),
        socket
      );
      break;
    }
    default:
      // Unknown frame types are ignored so a newer client can't crash the relay.
      break;
  }
}
