"use client";

import { useEffect } from "react";

import { useWorkspaceUi } from "@/components/workspace/workspace-ui";

export function ActiveDocumentTitle({ title }: { title: string }) {
  const { setActiveDocumentTitle } = useWorkspaceUi();

  useEffect(() => {
    setActiveDocumentTitle(title);
    return () => setActiveDocumentTitle(null);
  }, [title, setActiveDocumentTitle]);

  return null;
}
