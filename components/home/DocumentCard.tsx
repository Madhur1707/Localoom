import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardHeader, CardTitle } from "@/components/ui/card";
import type { DocumentSummary } from "@/types/document";

const ROLE_BADGE_LABEL: Record<DocumentSummary["role"], string> = {
  OWNER: "Owner",
  EDITOR: "Editor",
  VIEWER: "Viewer",
};

export function DocumentCard({ document }: { document: DocumentSummary }) {
  return (
    <Link href={`/documents/${document.id}`}>
      <Card className="transition-colors hover:bg-muted/50">
        <CardHeader>
          <CardTitle className="truncate">{document.title}</CardTitle>
          <CardAction>
            <Badge variant="secondary">
              {ROLE_BADGE_LABEL[document.role]}
            </Badge>
          </CardAction>
        </CardHeader>
      </Card>
    </Link>
  );
}
