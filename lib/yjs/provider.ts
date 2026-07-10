import { IndexeddbPersistence } from "y-indexeddb";
import { WebsocketProvider } from "y-websocket";
import type * as Y from "yjs";

const INDEXEDDB_NAME_PREFIX = "scriptum-document";

// The standalone sync server (see server/sync). Overridable per environment;
// falls back to the local dev server so `npm run dev` + `npm run sync` just work.
const SYNC_SERVER_URL =
  process.env.NEXT_PUBLIC_SYNC_SERVER_URL ?? "ws://localhost:1234";

// One IndexedDB-backed store per document id, so each document's local
// history is isolated and survives full offline use with zero network
// calls blocking the UI.
export function createLocalDocumentPersistence(
  documentId: string,
  yDoc: Y.Doc
): IndexeddbPersistence {
  return new IndexeddbPersistence(`${INDEXEDDB_NAME_PREFIX}-${documentId}`, yDoc);
}

// Bind the same Y.Doc to the realtime relay. The document id is the room name,
// so every client that opens this document joins the same room and exchanges
// edits + awareness (presence). Runs alongside the IndexedDB persistence above:
// local-first for durability, this for collaboration.
export function createDocumentSyncProvider(
  documentId: string,
  yDoc: Y.Doc
): WebsocketProvider {
  return new WebsocketProvider(SYNC_SERVER_URL, documentId, yDoc, {
    connect: true,
  });
}
