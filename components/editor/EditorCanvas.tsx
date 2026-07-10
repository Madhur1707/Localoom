"use client";

import { useEffect } from "react";
import Collaboration from "@tiptap/extension-collaboration";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import TextAlign from "@tiptap/extension-text-align";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

import { useDocument } from "@/hooks/useDocument";
import { EditorToolbar } from "@/components/editor/EditorToolbar";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

export function EditorCanvas({ documentId }: { documentId: string }) {
  const { yDoc, isLocalSnapshotLoaded } = useDocument(documentId);

  const editor = useEditor(
    {
      immediatelyRender: false,
      editable: false,
      extensions: [
        // StarterKit's own undo/redo is disabled because Collaboration installs
        // Yjs-aware undo/redo (yUndoPlugin) — running both would fight over the
        // same history stack.
        StarterKit.configure({ undoRedo: false }),
        Collaboration.configure({ document: yDoc }),
        Highlight.configure({ multicolor: true }),
        Superscript,
        Subscript,
        // Alignment is a node attribute, so it only applies to the block nodes
        // listed here — not to every node in the schema.
        TextAlign.configure({ types: ["heading", "paragraph"] }),
        Image,
      ],
      editorProps: {
        attributes: {
          class: "tiptap-content min-h-[60vh] px-4 py-6 focus:outline-none",
        },
      },
    },
    [yDoc]
  );

  useEffect(() => {
    editor?.setEditable(isLocalSnapshotLoaded);
  }, [editor, isLocalSnapshotLoaded]);

  return (
    <div className="flex flex-col gap-2">
      <EditorToolbar editor={editor} />
      <div className="rounded-lg border">
        {isLocalSnapshotLoaded ? (
          <EditorContent editor={editor} />
        ) : (
          <div className="flex min-h-[60vh] items-center justify-center gap-2 text-sm text-muted-foreground">
            <LoadingSpinner />
            Loading your local copy…
          </div>
        )}
      </div>
    </div>
  );
}
