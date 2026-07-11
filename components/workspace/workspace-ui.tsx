"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { DocumentRole } from "@/types/document";


export type ActiveDocument = {
  id: string;
  title: string;
  role: DocumentRole;
};


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
  closeSidebar: () => void;
  activeDocument: ActiveDocument | null;
  setActiveDocument: (document: ActiveDocument | null) => void;
};

const WorkspaceUiContext = createContext<WorkspaceUiValue | null>(null);

export function WorkspaceUiProvider({ children }: { children: ReactNode }) {
  const [isAiPanelOpen, setAiPanelOpen] = useState(false);
  const [isShareOpen, setShareOpen] = useState(false);
  const [isCreateDocumentOpen, setCreateDocumentOpen] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isMobileNavOpen, setMobileNavOpen] = useState(false);
  const [activeDocument, setActiveDocument] = useState<ActiveDocument | null>(
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
      activeDocument,
      setActiveDocument,
    }),
    [isAiPanelOpen, isShareOpen, isCreateDocumentOpen, isSidebarOpen, isMobileNavOpen, activeDocument]
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
