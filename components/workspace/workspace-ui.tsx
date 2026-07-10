"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

// Cross-component UI state for the workspace shell: the top bar triggers the AI
// panel, Share dialog, and sidebar (which live elsewhere in the tree), and the
// editor page publishes the active document title for the breadcrumb.
//
// The sidebar uses two independent states so each viewport has a sensible
// default with no hydration guesswork: `isSidebarOpen` collapses the in-flow
// desktop sidebar (default open), while `isMobileNavOpen` drives the off-canvas
// drawer on small screens (default closed).
type WorkspaceUiValue = {
  isAiPanelOpen: boolean;
  toggleAiPanel: () => void;
  closeAiPanel: () => void;
  isShareOpen: boolean;
  setShareOpen: (open: boolean) => void;
  isCreateDocumentOpen: boolean;
  setCreateDocumentOpen: (open: boolean) => void;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  isMobileNavOpen: boolean;
  openMobileNav: () => void;
  closeMobileNav: () => void;
  // Closes whichever sidebar is showing: collapses on desktop, shuts the drawer
  // on mobile. Used by the sidebar's own close button.
  closeSidebar: () => void;
  activeDocumentTitle: string | null;
  setActiveDocumentTitle: (title: string | null) => void;
};

const WorkspaceUiContext = createContext<WorkspaceUiValue | null>(null);

export function WorkspaceUiProvider({ children }: { children: ReactNode }) {
  const [isAiPanelOpen, setAiPanelOpen] = useState(false);
  const [isShareOpen, setShareOpen] = useState(false);
  const [isCreateDocumentOpen, setCreateDocumentOpen] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isMobileNavOpen, setMobileNavOpen] = useState(false);
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
      isCreateDocumentOpen,
      setCreateDocumentOpen,
      isSidebarOpen,
      toggleSidebar: () => setSidebarOpen((open) => !open),
      isMobileNavOpen,
      openMobileNav: () => setMobileNavOpen(true),
      closeMobileNav: () => setMobileNavOpen(false),
      closeSidebar: () => {
        setSidebarOpen(false);
        setMobileNavOpen(false);
      },
      activeDocumentTitle,
      setActiveDocumentTitle,
    }),
    [isAiPanelOpen, isShareOpen, isCreateDocumentOpen, isSidebarOpen, isMobileNavOpen, activeDocumentTitle]
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
