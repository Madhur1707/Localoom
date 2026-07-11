"use client";

import { useCallback, useEffect, useState } from "react";

import * as documentService from "@/services/documentService";
import type { DocumentVersionSummary } from "@/types/document";

// Loads and mutates the saved-version list for one document. The snapshot bytes
// for save/restore are produced by the editor (via document-actions) and passed
// in — this hook owns only the list + the network calls around it.
export function useDocumentVersions(documentId: string | null) {
  const [versions, setVersions] = useState<DocumentVersionSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!documentId) return;

    let isCancelled = false;
    const load = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const list = await documentService.fetchDocumentVersions(documentId);
        if (!isCancelled) setVersions(list);
      } catch (err) {
        if (!isCancelled) {
          setLoadError(
            err instanceof Error ? err.message : "Failed to load version history"
          );
        }
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    void load();

    return () => {
      isCancelled = true;
    };
  }, [documentId]);

  const saveVersion = useCallback(
    async (name: string, snapshot: string) => {
      if (!documentId) return;
      const version = await documentService.createDocumentVersionSnapshot(
        documentId,
        name,
        snapshot
      );
      setVersions((current) => [version, ...current]);
    },
    [documentId]
  );

  const deleteVersion = useCallback(
    async (versionId: string) => {
      if (!documentId) return;
      await documentService.deleteDocumentVersion(documentId, versionId);
      setVersions((current) =>
        current.filter((version) => version.id !== versionId)
      );
    },
    [documentId]
  );

  return { versions, isLoading, loadError, saveVersion, deleteVersion };
}
