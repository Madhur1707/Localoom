"use client";

import { useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FileText, PanelLeftClose, Plus, RefreshCw } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { WordmarkLogo } from "@/components/shared/WordmarkLogo";
import { useWorkspaceUi } from "@/components/workspace/workspace-ui";
import { VersionHistoryPanel } from "@/components/workspace/VersionHistoryPanel";
import type { DocumentSummary } from "@/types/document";

export function AppSidebar({ documents }: { documents: DocumentSummary[] }) {
  const pathname = usePathname();
  const router = useRouter();
  // The document list is server-rendered; router.refresh() re-runs the server
  // component to pull a fresh list without a full page reload.
  const [isRefreshing, startRefresh] = useTransition();
  const {
    isSidebarOpen,
    isMobileNavOpen,
    closeSidebar,
    closeMobileNav,
    setCreateDocumentOpen,
  } = useWorkspaceUi();

  return (
    <aside
      className={cn(
        // Mobile: fixed off-canvas drawer driven by isMobileNavOpen.
        "fixed inset-y-0 left-0 z-50 flex h-full w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-200",
        // Desktop: in-flow panel, no transform animation; collapsed via display.
        "lg:static lg:z-auto lg:transition-none",
        isMobileNavOpen ? "translate-x-0" : "-translate-x-full",
        isSidebarOpen ? "lg:flex lg:translate-x-0" : "lg:hidden"
      )}
    >
      <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-4">
        <WordmarkLogo href="/dashboard" />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Close sidebar"
          onClick={closeSidebar}
        >
          <PanelLeftClose className="size-4" />
        </Button>
      </div>

      <div className="flex items-center justify-between px-4 pt-5 pb-2">
        <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Files
        </span>
        <div className="flex items-center gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label="Refresh documents"
            disabled={isRefreshing}
            onClick={() => startRefresh(() => router.refresh())}
          >
            <RefreshCw
              className={cn("size-3.5", isRefreshing && "animate-spin")}
            />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label="New document"
            onClick={() => setCreateDocumentOpen(true)}
          >
            <Plus className="size-3.5" />
          </Button>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-4">
        {documents.length === 0 ? (
          <p className="px-2 py-2 text-sm text-muted-foreground">
            No documents yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {documents.map((document) => {
              const href = `/documents/${document.id}`;
              const isActive = pathname === href;
              return (
                <li key={document.id}>
                  <Link
                    href={href}
                    onClick={closeMobileNav}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors",
                      isActive
                        ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                        : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
                    )}
                  >
                    <FileText className="size-4 shrink-0" />
                    <span className="truncate">{document.title}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </nav>

      <VersionHistoryPanel />
    </aside>
  );
}
