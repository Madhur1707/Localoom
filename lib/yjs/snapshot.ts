import * as Y from "yjs";
import { fromBase64, toBase64 } from "lib0/buffer";

// A "snapshot" here is the full Yjs document state encoded as a single update and
// base64-wrapped so it survives JSON transport to and from the versions API.
// Encoding the whole state (rather than a diff) makes each saved version wholly
// self-contained: it can be decoded and rendered without any other history.

export function encodeDocSnapshot(yDoc: Y.Doc): string {
  return toBase64(Y.encodeStateAsUpdate(yDoc));
}

// Rebuilds a throwaway Y.Doc from a snapshot — used to preview or restore a past
// version without touching the live document.
export function decodeSnapshotToDoc(snapshot: string): Y.Doc {
  const yDoc = new Y.Doc();
  Y.applyUpdate(yDoc, fromBase64(snapshot));
  return yDoc;
}
