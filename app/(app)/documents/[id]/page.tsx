import { notFound } from "next/navigation";

import { requireSession } from "@/services/authService";
import { getDocumentById } from "@/services/documentService";
import { EditorCanvas } from "@/components/editor/EditorCanvas";
import { ActiveDocumentTitle } from "@/components/app-shell/ActiveDocumentTitle";

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

  const lastEdited = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(document.updatedAt);

  return (
    <div className="mx-auto w-full max-w-4xl px-8 py-8">
      <ActiveDocumentTitle title={document.title} />
      <header className="mb-5">
        <h1 className="text-3xl font-semibold tracking-tight">
          {document.title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Last edited {lastEdited}
        </p>
      </header>
      <EditorCanvas key={document.id} documentId={document.id} />
    </div>
  );
}
