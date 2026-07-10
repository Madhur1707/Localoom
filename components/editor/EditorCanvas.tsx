"use client";
import { useEffect, useMemo } from "react";
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

export function EditorCanvas({ documentId }: { documentId: string }) {
  const { user } = useAuth();
  const { yDoc, isLocalSnapshotLoaded } = useDocument(documentId);
  const { provider, connectionStatus, collaborators } = useCollaborationSession(
    documentId,
    yDoc
  );
  const { publishSession, resetSession } = useCollaborationSessionContext();

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
    editor?.setEditable(isLocalSnapshotLoaded);
  }, [editor, isLocalSnapshotLoaded]);


  useEffect(() => {
    provider?.awareness.setLocalStateField("user", presenceUser);
  }, [provider, presenceUser]);
  useEffect(() => {
    publishSession({ connectionStatus, collaborators });
  }, [connectionStatus, collaborators, publishSession]);

  useEffect(() => resetSession, [resetSession]);

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
