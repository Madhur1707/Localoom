import * as encoding from "lib0/encoding";

// Top-level message discriminator that wraps every frame on the wire. The body
// after this tag is either a Yjs sync message (y-protocols/sync) or an awareness
// update (y-protocols/awareness). This mirrors the framing used by the client's
// y-websocket provider, so the two speak the same protocol.
export const MESSAGE_SYNC = 0;
export const MESSAGE_AWARENESS = 1;

// Serialize an encoder into the bytes we hand to `ws.send`. Kept in one place so
// every send path frames messages identically.
export function toMessage(encoder: encoding.Encoder): Uint8Array {
  return encoding.toUint8Array(encoder);
}
