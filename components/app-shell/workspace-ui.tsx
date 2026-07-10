"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

// Cross-component UI state for the workspace shell: the top bar triggers the AI
// panel and Share dialog, which live elsewhere in the tree, and the editor page
// publishes the active document title for the breadcrumb.
type WorkspaceUiValue = {
  isAiPanelOpen: boolean;
  toggleAiPanel: () => void;
  closeAiPanel: () => void;
  isShareOpen: boolean;
  setShareOpen: (open: boolean) => void;
  activeDocumentTitle: string | null;
  setActiveDocumentTitle: (title: string | null) => void;
};

const WorkspaceUiContext = createContext<WorkspaceUiValue | null>(null);

export function WorkspaceUiProvider({ children }: { children: ReactNode }) {
  const [isAiPanelOpen, setAiPanelOpen] = useState(false);
  const [isShareOpen, setShareOpen] = useState(false);
  const [activeDocumentTitle, setActiveDocumentTitle] = useState<string | null>(
    null
  );

  const value = useMemo<WorkspaceUiValue>(
    () => ({
      isAiPanelOpen,
      toggleAiPanel: () => setAiPanelOpen((open) => !open),
      closeAiPanel: () => setAiPanelOpen(false),
      isShareOpen,
      setShareOpen,
      activeDocumentTitle,
      setActiveDocumentTitle,
    }),
    [isAiPanelOpen, isShareOpen, activeDocumentTitle]
  );

  return (
    <WorkspaceUiContext.Provider value={value}>
      {children}
    </WorkspaceUiContext.Provider>
  );
}

export function useWorkspaceUi() {
  const context = useContext(WorkspaceUiContext);
  if (!context) {
    throw new Error("useWorkspaceUi must be used within a WorkspaceUiProvider");
  }
  return context;
}
