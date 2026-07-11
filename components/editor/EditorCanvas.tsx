"use client";
import { useCallback, useEffect, useMemo } from "react";
import { Eye } from "lucide-react";
import type { JSONContent } from "@tiptap/core";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCaret from "@tiptap/extension-collaboration-caret";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import TextAlign from "@tiptap/extension-text-align";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useAuth } from "@/hooks/useAuth";
import { useDocument } from "@/hooks/useDocument";
import { useCollaborationSession } from "@/hooks/useCollaborationSession";
import { buildLocalPresenceUser } from "@/lib/collaboration/presence";
import { EditorToolbar } from "@/components/editor/EditorToolbar";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { useCollaborationSessionContext } from "@/components/workspace/collaboration-session";
import { useDocumentActions } from "@/components/workspace/document-actions";
import { encodeDocSnapshot } from "@/lib/yjs/snapshot";


export function EditorCanvas({
  documentId,
  canEdit,
}: {
  documentId: string;
  canEdit: boolean;
}) {
  const { user } = useAuth();
  const { yDoc, isLocalSnapshotLoaded } = useDocument(documentId);
  const { provider, connectionStatus, collaborators } = useCollaborationSession(
    documentId,
    yDoc
  );
  const { publishSession, resetSession } = useCollaborationSessionContext();
  const { publishActions, resetActions } = useDocumentActions();

  const userId = user?.id ?? null;
  const userName = user?.name ?? null;
  const userEmail = user?.email ?? null;
  const presenceUser = useMemo(
    () => buildLocalPresenceUser({ id: userId, name: userName, email: userEmail }),
    [userId, userName, userEmail]
  );

  const editor = useEditor(
    {
      immediatelyRender: false,
      editable: false,
      extensions: [
        StarterKit.configure({ undoRedo: false }),
        Collaboration.configure({ document: yDoc }),
        ...(provider
          ? [CollaborationCaret.configure({ provider, user: presenceUser })]
          : []),
        Highlight.configure({ multicolor: true }),
        Superscript,
        Subscript,
        TextAlign.configure({ types: ["heading", "paragraph"] }),
        Image,
      ],
      editorProps: {
        attributes: {
          class: "tiptap-content min-h-[60vh] px-4 py-6 focus:outline-none",
        },
      },
    },
    [yDoc, provider]
  );

  useEffect(() => {
    editor?.setEditable(isLocalSnapshotLoaded && canEdit);
  }, [editor, isLocalSnapshotLoaded, canEdit]);


  useEffect(() => {
    provider?.awareness.setLocalStateField("user", presenceUser);
  }, [provider, presenceUser]);
  useEffect(() => {
    publishSession({ connectionStatus, collaborators });
  }, [connectionStatus, collaborators, publishSession]);

  useEffect(() => resetSession, [resetSession]);

  // Expose snapshot/restore to the version-history panel in the sidebar. Snapshot
  // reads the live doc; restore replays past content forward as a collaborative
  // edit (see document-actions). Guarded on the local copy being loaded so we
  // never snapshot an empty doc mid-hydration.
  const encodeSnapshot = useCallback(
    () => (isLocalSnapshotLoaded ? encodeDocSnapshot(yDoc) : null),
    [yDoc, isLocalSnapshotLoaded]
  );
  const restoreContent = useCallback(
    (content: JSONContent) => {
      editor?.commands.setContent(content, { emitUpdate: true });
    },
    [editor]
  );

  // AI assistant context + insertion. Selection text is null when the cursor is
  // collapsed; insertion replaces a non-empty selection or inserts at the cursor.
  const getDocumentText = useCallback(() => editor?.getText() ?? "", [editor]);
  const getSelectionText = useCallback(() => {
    if (!editor) return null;
    const { from, to, empty } = editor.state.selection;
    if (empty) return null;
    return editor.state.doc.textBetween(from, to, "\n");
  }, [editor]);
  const insertAiResult = useCallback(
    (text: string) => {
      if (!editor) return;
      const { from, to, empty } = editor.state.selection;
      const chain = editor.chain().focus();
      if (empty) chain.insertContent(text);
      else chain.insertContentAt({ from, to }, text);
      chain.run();
    },
    [editor]
  );

  useEffect(() => {
    publishActions({
      canEdit,
      encodeSnapshot,
      restoreContent,
      getDocumentText,
      getSelectionText,
      insertAiResult,
    });
  }, [
    canEdit,
    encodeSnapshot,
    restoreContent,
    getDocumentText,
    getSelectionText,
    insertAiResult,
    publishActions,
  ]);

  useEffect(() => resetActions, [resetActions]);

  return (
    <div className="flex flex-col gap-2">
      {canEdit ? (
        <EditorToolbar editor={editor} />
      ) : (
        <div className="flex items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-sm text-muted-foreground">
          <Eye className="size-4" />
          View only — you don&apos;t have permission to edit this document.
        </div>
      )}
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
