"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import * as documentService from "@/services/documentService";

// List/create concerns for the dashboard. Distinct from useDocument (singular),
// which wires a single already-open document into the Yjs/Tiptap editor.
export function useDocuments() {
  const router = useRouter();
  const [isCreatingDocument, setIsCreatingDocument] = useState(false);
  const [createDocumentError, setCreateDocumentError] = useState<
    string | null
  >(null);

  // Returns the created document on success (so callers like the create dialog
  // can close themselves) or null on failure (the error is exposed via state).
  const createDocument = useCallback(
    async (title: string) => {
      setIsCreatingDocument(true);
      setCreateDocumentError(null);
      try {
        const document = await documentService.createDocument({ title });
        router.push(`/documents/${document.id}`);
        return document;
      } catch (err) {
        setCreateDocumentError(
          err instanceof Error ? err.message : "Failed to create document"
        );
        return null;
      } finally {
        setIsCreatingDocument(false);
      }
    },
    [router]
  );

  return { createDocument, isCreatingDocument, createDocumentError };
}
