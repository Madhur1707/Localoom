import { requireSession } from "@/services/authService";
import { getDocumentsForUser } from "@/services/documentService";
import { DocumentList } from "@/components/home/DocumentList";

export default async function DashboardPage() {
  const session = await requireSession();
  const documents = await getDocumentsForUser(session.user.id);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <div>
        <h1 className="font-serif text-3xl font-medium tracking-tight">
          Welcome{session.user.name ? `, ${session.user.name}` : ""}
        </h1>
        <p className="text-muted-foreground">Pick up where you left off.</p>
      </div>
      <DocumentList documents={documents} />
    </div>
  );
}
