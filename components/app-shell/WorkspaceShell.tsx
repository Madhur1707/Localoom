"use client";

import type { ReactNode } from "react";

import type { DocumentSummary } from "@/types/document";
import { AppSidebar } from "@/components/app-shell/AppSidebar";
import { AppTopBar } from "@/components/app-shell/AppTopBar";
import { AiAssistantPanel } from "@/components/app-shell/AiAssistantPanel";
import { ShareDialog } from "@/components/app-shell/ShareDialog";
import { WorkspaceUiProvider } from "@/components/app-shell/workspace-ui";

// The persistent app chrome: left file sidebar, top bar, scrollable main area,
// and the docked AI panel. Route content is passed in as `children`.
export function WorkspaceShell({
  documents,
  children,
}: {
  documents: DocumentSummary[];
  children: ReactNode;
}) {
  return (
    <WorkspaceUiProvider>
      <div className="flex h-screen overflow-hidden">
        <AppSidebar documents={documents} />
        <div className="flex min-w-0 flex-1 flex-col">
          <AppTopBar />
          <div className="flex min-h-0 flex-1">
            <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
            <AiAssistantPanel />
          </div>
        </div>
      </div>
      <ShareDialog />
    </WorkspaceUiProvider>
  );
}
