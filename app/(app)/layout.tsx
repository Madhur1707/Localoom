import type { ReactNode } from "react";

import { requireSession } from "@/services/authService";
import { getDocumentsForUser } from "@/services/documentService";
import { WorkspaceShell } from "@/components/app-shell/WorkspaceShell";

export default async function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requireSession();
  const documents = await getDocumentsForUser(session.user.id);

  return <WorkspaceShell documents={documents}>{children}</WorkspaceShell>;
}
