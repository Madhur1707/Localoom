"use client";

import { useState, type FormEvent } from "react";
import { Plus } from "lucide-react";

import { useDocuments } from "@/hooks/useDocuments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DocumentCard } from "@/components/home/DocumentCard";
import type { DocumentSummary } from "@/types/document";

export function DocumentList({ documents }: { documents: DocumentSummary[] }) {
  const { createDocument, isCreatingDocument, createDocumentError } =
    useDocuments();
  const [newDocumentTitle, setNewDocumentTitle] = useState("");

  const handleCreateSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const title = newDocumentTitle.trim();
    if (!title) return;
    await createDocument(title);
  };

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleCreateSubmit} className="flex gap-2">
        <Input
          placeholder="Untitled document"
          value={newDocumentTitle}
          onChange={(event) => setNewDocumentTitle(event.target.value)}
        />
        <Button type="submit" disabled={isCreatingDocument}>
          <Plus className="size-4" />
          {isCreatingDocument ? "Creating…" : "New document"}
        </Button>
      </form>
      {createDocumentError ? (
        <p role="alert" className="text-sm text-destructive">
          {createDocumentError}
        </p>
      ) : null}

      {documents.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No documents yet — create your first one above.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {documents.map((document) => (
            <DocumentCard key={document.id} document={document} />
          ))}
        </div>
      )}
    </div>
  );
}
