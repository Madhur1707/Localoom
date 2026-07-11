"use client";

import { useEffect, useState } from "react";
import type { Editor } from "@tiptap/react";
import { RotateCcw } from "lucide-react";

import * as documentService from "@/services/documentService";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { VersionSnapshotView } from "@/components/versions/VersionSnapshotView";
import { useDocumentActions } from "@/components/workspace/document-actions";
import { formatRelativeTime } from "@/lib/formatRelativeTime";
import type { DocumentVersionSummary } from "@/types/document";

// Previews a saved version read-only and, for writers, restores it. Restore reads
// the preview editor's JSON and pushes it into the live document via the
// document-actions context, which replays it forward as a collaborative edit.
export function VersionPreviewDialog({
  documentId,
  version,
  onClose,
}: {
  documentId: string;
  version: DocumentVersionSummary | null;
  onClose: () => void;
}) {
  const { actions } = useDocumentActions();
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [previewEditor, setPreviewEditor] = useState<Editor | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!version) return;

    let isCancelled = false;
    const load = async () => {
      setSnapshot(null);
      setPreviewEditor(null);
      setLoadError(null);
      try {
        const data = await documentService.fetchDocumentVersionSnapshot(
          documentId,
          version.id
        );
        if (!isCancelled) setSnapshot(data.snapshot);
      } catch (err) {
        if (!isCancelled) {
          setLoadError(
            err instanceof Error ? err.message : "Failed to load version"
          );
        }
      }
    };

    void load();

    return () => {
      isCancelled = true;
    };
  }, [documentId, version]);

  const canRestore = Boolean(actions?.canEdit);

  const handleRestore = () => {
    if (!previewEditor || !actions) return;
    actions.restoreContent(previewEditor.getJSON());
    onClose();
  };

  const author = version?.createdBy?.name;

  return (
    <Dialog
      open={version !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{version?.name ?? "Version"}</DialogTitle>
          <DialogDescription>
            {version
              ? `Saved ${formatRelativeTime(version.createdAt)}${
                  author ? ` by ${author}` : ""
                }`
              : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[50vh] overflow-y-auto rounded-lg border bg-background">
          {loadError ? (
            <p className="p-4 text-sm text-destructive">{loadError}</p>
          ) : snapshot ? (
            <VersionSnapshotView
              snapshot={snapshot}
              onEditorReady={setPreviewEditor}
            />
          ) : (
            <div className="flex min-h-40 items-center justify-center gap-2 text-sm text-muted-foreground">
              <LoadingSpinner />
              Loading version…
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Close
          </Button>
          {canRestore ? (
            <Button
              type="button"
              onClick={handleRestore}
              disabled={!previewEditor}
            >
              <RotateCcw className="size-4" />
              Restore this version
            </Button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
