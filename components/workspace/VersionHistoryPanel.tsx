"use client";

import { useState, type FormEvent } from "react";
import { History, Plus, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { useWorkspaceUi } from "@/components/workspace/workspace-ui";
import { useDocumentActions } from "@/components/workspace/document-actions";
import { useDocumentVersions } from "@/hooks/useDocumentVersions";
import { VersionPreviewDialog } from "@/components/versions/VersionPreviewDialog";
import { formatRelativeTime } from "@/lib/formatRelativeTime";
import type { DocumentVersionSummary } from "@/types/document";

// The sidebar's version-history section. Lists saved versions for the open
// document, lets writers save a new one, and opens a preview/restore dialog.
export function VersionHistoryPanel() {
  const { activeDocument } = useWorkspaceUi();
  const { actions } = useDocumentActions();
  const documentId = activeDocument?.id ?? null;

  const { versions, isLoading, loadError, saveVersion, deleteVersion } =
    useDocumentVersions(documentId);

  const [selectedVersion, setSelectedVersion] =
    useState<DocumentVersionSummary | null>(null);

  if (!activeDocument) {
    return (
      <Section>
        <p className="text-sm text-muted-foreground">
          Open a document to see its history.
        </p>
      </Section>
    );
  }

  const canEdit = activeDocument.role !== "VIEWER";
  const canManage = activeDocument.role === "OWNER";

  return (
    <Section>
      {canEdit ? (
        <SaveVersionForm
          canSnapshot={actions !== null}
          onSave={(name) => {
            const snapshot = actions?.encodeSnapshot() ?? null;
            if (!snapshot) {
              throw new Error("The document is still loading.");
            }
            return saveVersion(name, snapshot);
          }}
        />
      ) : null}

      {isLoading ? (
        <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground">
          <LoadingSpinner />
          Loading history…
        </div>
      ) : loadError ? (
        <p className="py-2 text-xs text-destructive">{loadError}</p>
      ) : versions.length === 0 ? (
        <p className="py-2 text-xs text-muted-foreground">
          No saved versions yet.
        </p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2.5">
          {versions.map((version, index) => (
            <VersionRow
              key={version.id}
              version={version}
              isLatest={index === 0}
              canManage={canManage}
              onOpen={() => setSelectedVersion(version)}
              onDelete={() => deleteVersion(version.id)}
            />
          ))}
        </ul>
      )}

      <VersionPreviewDialog
        documentId={activeDocument.id}
        version={selectedVersion}
        onClose={() => setSelectedVersion(null)}
      />
    </Section>
  );
}

function Section({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-t border-sidebar-border px-4 py-4">
      <span className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        <History className="size-3.5" />
        Version history
      </span>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function SaveVersionForm({
  canSnapshot,
  onSave,
}: {
  canSnapshot: boolean;
  onSave: (name: string) => Promise<void>;
}) {
  const [isNaming, setIsNaming] = useState(false);
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setIsSaving(true);
    setError(null);
    try {
      await onSave(trimmed);
      setName("");
      setIsNaming(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save version");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isNaming) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full"
        disabled={!canSnapshot}
        onClick={() => setIsNaming(true)}
      >
        <Plus className="size-3.5" />
        Save version
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <Input
        autoFocus
        value={name}
        maxLength={80}
        placeholder="Version name"
        onChange={(event) => setName(event.target.value)}
        disabled={isSaving}
      />
      <div className="flex items-center gap-2">
        <Button
          type="submit"
          size="sm"
          className="flex-1"
          disabled={isSaving || !name.trim()}
        >
          {isSaving ? "Saving…" : "Save"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={isSaving}
          onClick={() => {
            setIsNaming(false);
            setName("");
            setError(null);
          }}
        >
          Cancel
        </Button>
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </form>
  );
}

function VersionRow({
  version,
  isLatest,
  canManage,
  onOpen,
  onDelete,
}: {
  version: DocumentVersionSummary;
  isLatest: boolean;
  canManage: boolean;
  onOpen: () => void;
  onDelete: () => Promise<void>;
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (event: React.MouseEvent) => {
    event.stopPropagation();
    setIsDeleting(true);
    try {
      await onDelete();
    } catch {
      // The list simply won't change; a transient failure is non-fatal here.
      setIsDeleting(false);
    }
  };

  return (
    <li className="group/version flex items-start gap-2.5">
      <span
        className={cn(
          "mt-1.5 size-2 shrink-0 rounded-full",
          isLatest ? "bg-primary" : "border border-muted-foreground/40"
        )}
      />
      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 flex-col text-left"
      >
        <span className="truncate text-sm text-foreground group-hover/version:text-primary">
          {version.name}
        </span>
        <span className="text-xs text-muted-foreground">
          {formatRelativeTime(version.createdAt)}
          {version.createdBy?.name ? ` · ${version.createdBy.name}` : ""}
        </span>
      </button>
      {canManage ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label={`Delete version ${version.name}`}
          className="opacity-0 group-hover/version:opacity-100"
          disabled={isDeleting}
          onClick={handleDelete}
        >
          <Trash2 className="size-3.5" />
        </Button>
      ) : null}
    </li>
  );
}
