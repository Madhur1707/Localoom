"use client";

import { useEffect } from "react";

import { useWorkspaceUi } from "@/components/app-shell/workspace-ui";

// Publishes the open document's title to the workspace breadcrumb, and clears it
// on unmount (e.g. navigating back to the dashboard).
export function ActiveDocumentTitle({ title }: { title: string }) {
  const { setActiveDocumentTitle } = useWorkspaceUi();

  useEffect(() => {
    setActiveDocumentTitle(title);
    return () => setActiveDocumentTitle(null);
  }, [title, setActiveDocumentTitle]);

  return null;
}
