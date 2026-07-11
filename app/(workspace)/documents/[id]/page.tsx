import { notFound } from "next/navigation";

import { requireSession } from "@/services/authService";
import { getDocumentById } from "@/services/documentService";
import { EditorCanvas } from "@/components/editor/EditorCanvas";
import { ActiveDocumentBridge } from "@/components/workspace/ActiveDocumentBridge";
import { formatRelativeTime } from "@/lib/formatRelativeTime";

export default async function DocumentEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();
  const document = await getDocumentById(id, session.user.id);

  if (!document) {
    notFound();
  }

  const lastEdited = formatRelativeTime(document.updatedAt);

  // Viewers get a read-only editor; owners and editors can write. The sync server
  // independently enforces the same rule on the wire (see server/sync).
  const canEdit = document.role !== "VIEWER";

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-8 sm:py-8">
      <ActiveDocumentBridge
        id={document.id}
        title={document.title}
        role={document.role}
      />
      <header className="mb-5">
        <h1 className="font-serif text-4xl font-medium tracking-tight">
          {document.title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Last edited {lastEdited}
        </p>
      </header>
      <EditorCanvas key={document.id} documentId={document.id} canEdit={canEdit} />
    </div>
  );
}
