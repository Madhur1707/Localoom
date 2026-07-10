"use client";

import { useEffect, useMemo, useState } from "react";
import * as Y from "yjs";

import { createLocalDocumentPersistence } from "@/lib/yjs/provider";


export function useDocument(documentId: string) {

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
