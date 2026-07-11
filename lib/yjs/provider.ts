import { IndexeddbPersistence } from "y-indexeddb";
import { WebsocketProvider } from "y-websocket";
import type * as Y from "yjs";

const INDEXEDDB_NAME_PREFIX = "localoom-document";


const SYNC_SERVER_URL =
  process.env.NEXT_PUBLIC_SYNC_SERVER_URL ?? "ws://localhost:1234";


export function createLocalDocumentPersistence(
  documentId: string,
  yDoc: Y.Doc
): IndexeddbPersistence {
  return new IndexeddbPersistence(`${INDEXEDDB_NAME_PREFIX}-${documentId}`, yDoc);
}


export function createDocumentSyncProvider(
  documentId: string,
  yDoc: Y.Doc,
  accessToken: string
): WebsocketProvider {
  return new WebsocketProvider(SYNC_SERVER_URL, documentId, yDoc, {
    connect: true,
    params: { token: accessToken },
  });
}
