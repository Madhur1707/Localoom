"use client";

import type { ReactNode } from "react";

import type { DocumentSummary } from "@/types/document";
import { AppSidebar } from "@/components/workspace/AppSidebar";
import { AppTopBar } from "@/components/workspace/AppTopBar";
import { AiAssistantPanel } from "@/components/workspace/AiAssistantPanel";
import { ShareDialog } from "@/components/workspace/ShareDialog";
import { CreateDocumentDialog } from "@/components/workspace/CreateDocumentDialog";
import {
  WorkspaceUiProvider,
  useWorkspaceUi,
} from "@/components/workspace/workspace-ui";
import { CollaborationSessionProvider } from "@/components/workspace/collaboration-session";

// Dims the content and closes the drawer on tap. Only meaningful on mobile, so
// it is hidden at the lg breakpoint where the sidebar is always in-flow.
function MobileNavBackdrop() {
  const { isMobileNavOpen, closeMobileNav } = useWorkspaceUi();
  if (!isMobileNavOpen) return null;
  return (
    <button
      type="button"
      aria-label="Close navigation"
      onClick={closeMobileNav}
      className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
    />
  );
}

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
      <CollaborationSessionProvider>
        <div className="flex h-screen overflow-hidden">
          <MobileNavBackdrop />
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
        <CreateDocumentDialog />
      </CollaborationSessionProvider>
    </WorkspaceUiProvider>
  );
}
