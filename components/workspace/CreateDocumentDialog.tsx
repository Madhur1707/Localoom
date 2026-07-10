"use client";

import { useState, type FormEvent } from "react";

import { useDocuments } from "@/hooks/useDocuments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useWorkspaceUi } from "@/components/workspace/workspace-ui";

// Single shell-level dialog for naming and creating a document. Opened from the
// sidebar's "+" (which lives in both the desktop sidebar and the mobile drawer),
// so keeping one instance here avoids mounting duplicates.
export function CreateDocumentDialog() {
  const { isCreateDocumentOpen, setCreateDocumentOpen } = useWorkspaceUi();
  const { createDocument, isCreatingDocument, createDocumentError } =
    useDocuments();
  const [title, setTitle] = useState("");

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;

    const created = await createDocument(trimmed);
    if (created) {
      setTitle("");
      setCreateDocumentOpen(false);
    }
  };

  return (
    <Dialog open={isCreateDocumentOpen} onOpenChange={setCreateDocumentOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New document</DialogTitle>
          <DialogDescription>
            Give your document a name. You can change it later.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="new-document-title">Title</Label>
            <Input
              id="new-document-title"
              autoFocus
              placeholder="Untitled document"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
            {createDocumentError ? (
              <p role="alert" className="text-sm text-destructive">
                {createDocumentError}
              </p>
            ) : null}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setCreateDocumentOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isCreatingDocument || !title.trim()}>
              {isCreatingDocument ? "Creating…" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
