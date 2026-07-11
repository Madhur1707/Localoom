"use client";

import { useEffect, useMemo } from "react";
import Collaboration from "@tiptap/extension-collaboration";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import TextAlign from "@tiptap/extension-text-align";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

import { decodeSnapshotToDoc } from "@/lib/yjs/snapshot";

// Renders a saved version read-only by decoding its snapshot into a throwaway
// Y.Doc and binding a Tiptap editor to it — the same extension set as the live
// EditorCanvas minus the realtime provider/caret, so previews look identical to
// the real document. The mounted editor is also the source of truth for restore:
// its getJSON() feeds the live editor's setContent.
export function VersionSnapshotView({
  snapshot,
  onEditorReady,
}: {
  snapshot: string;
  onEditorReady?: (editor: Editor) => void;
}) {
  const yDoc = useMemo(() => decodeSnapshotToDoc(snapshot), [snapshot]);

  const editor = useEditor(
    {
      immediatelyRender: false,
      editable: false,
      extensions: [
        StarterKit.configure({ undoRedo: false }),
        Collaboration.configure({ document: yDoc }),
        Highlight.configure({ multicolor: true }),
        Superscript,
        Subscript,
        TextAlign.configure({ types: ["heading", "paragraph"] }),
        Image,
      ],
      editorProps: {
        attributes: {
          class: "tiptap-content min-h-40 px-4 py-4 focus:outline-none",
        },
      },
    },
    [yDoc]
  );

  useEffect(() => {
    return () => yDoc.destroy();
  }, [yDoc]);

  useEffect(() => {
    if (editor && onEditorReady) onEditorReady(editor);
  }, [editor, onEditorReady]);

  return <EditorContent editor={editor} />;
}
