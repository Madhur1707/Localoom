import { IndexeddbPersistence } from "y-indexeddb";
import type * as Y from "yjs";

const INDEXEDDB_NAME_PREFIX = "scriptum-document";

// One IndexedDB-backed store per document id, so each document's local
// history is isolated and survives full offline use with zero network
// calls blocking the UI.
export function createLocalDocumentPersistence(
  documentId: string,
  yDoc: Y.Doc
): IndexeddbPersistence {
  return new IndexeddbPersistence(`${INDEXEDDB_NAME_PREFIX}-${documentId}`, yDoc);
}
