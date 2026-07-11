"use client";

import { useEffect } from "react";

import type { DocumentRole } from "@/types/document";
import { useWorkspaceUi } from "@/components/workspace/workspace-ui";


export function ActiveDocumentBridge({
  id,
  title,
  role,
}: {
  id: string;
  title: string;
  role: DocumentRole;
}) {
  const { setActiveDocument } = useWorkspaceUi();

  useEffect(() => {
    setActiveDocument({ id, title, role });
    return () => setActiveDocument(null);
  }, [id, title, role, setActiveDocument]);

  return null;
}
