"use client";

import { useEffect, useMemo, useState } from "react";
import * as Y from "yjs";

import { createLocalDocumentPersistence } from "@/lib/yjs/provider";

// Wires a single open document into Yjs + y-indexeddb. This is intentionally
// local-only for now — the WebSocket sync provider is added in Phase 3, on
// top of the same Y.Doc this hook creates.
//
// Callers must remount this hook per document (e.g. `key={documentId}` on
// the component that calls it): the Y.Doc below is created once per mount
// and never swapped out, so reusing one instance across different document
// ids would bleed one document's content into another.
export function useDocument(documentId: string) {
  // Created synchronously (not in an effect) so it's never null: Tiptap's
  // Collaboration extension needs a real Y.Doc on its very first render.
  const yDoc = useMemo(() => new Y.Doc(), []);
  const [isLocalSnapshotLoaded, setIsLocalSnapshotLoaded] = useState(false);

  useEffect(() => {
    const persistence = createLocalDocumentPersistence(documentId, yDoc);
    let cancelled = false;

    persistence.whenSynced.then(() => {
      if (!cancelled) setIsLocalSnapshotLoaded(true);
    });

    return () => {
      cancelled = true;
      persistence.destroy();
    };
  }, [documentId, yDoc]);

  useEffect(() => {
    return () => yDoc.destroy();
  }, [yDoc]);

  return { yDoc, isLocalSnapshotLoaded };
}
