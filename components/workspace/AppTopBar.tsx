"use client";

import { ChevronRight, Menu, PanelLeft, Share2, Sparkles } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { CollaboratorStack } from "@/components/workspace/CollaboratorStack";
import { SyncStatusPill } from "@/components/workspace/SyncStatusPill";
import { useWorkspaceUi } from "@/components/workspace/workspace-ui";

export function AppTopBar() {
  const { user, logout } = useAuth();
  const {
    toggleAiPanel,
    isAiPanelOpen,
    setShareOpen,
    activeDocumentTitle,
    toggleSidebar,
    openMobileNav,
  } = useWorkspaceUi();

  const initial = (user?.name ?? user?.email ?? "?").charAt(0).toUpperCase();

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/80 px-3 backdrop-blur sm:gap-3 sm:px-4">
      {/* Sidebar controls: hamburger opens the drawer on mobile; the panel
          toggle collapses/expands the in-flow sidebar on desktop. */}
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Open navigation"
        className="lg:hidden"
        onClick={openMobileNav}
      >
        <Menu className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Toggle sidebar"
        className="hidden lg:inline-flex"
        onClick={toggleSidebar}
      >
        <PanelLeft className="size-4" />
      </Button>

      {/* Breadcrumb — the "Workspace" crumb is dropped on the smallest screens. */}
      <div className="flex min-w-0 items-center gap-1.5 text-sm">
        <span className="hidden text-muted-foreground sm:inline">Workspace</span>
        <ChevronRight className="hidden size-3.5 shrink-0 text-muted-foreground/60 sm:inline" />
        <span className="truncate font-medium">
          {activeDocumentTitle ?? "Dashboard"}
        </span>
      </div>

      <div className="mx-auto hidden md:block">
        <CollaboratorStack />
      </div>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        <SyncStatusPill />
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-pressed={isAiPanelOpen}
          aria-label="AI Toolkit"
          className={cn(isAiPanelOpen && "border-primary/50 text-primary")}
          onClick={toggleAiPanel}
        >
          <Sparkles className="size-4" />
          <span className="hidden sm:inline">AI Toolkit</span>
        </Button>
        <Button
          type="button"
          size="sm"
          aria-label="Share"
          onClick={() => setShareOpen(true)}
        >
          <Share2 className="size-4" />
          <span className="hidden sm:inline">Share</span>
        </Button>
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Account menu"
              />
            }
          >
            <Avatar className="size-8">
              <AvatarFallback>{initial}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem disabled className="opacity-100">
              {user?.email}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => logout()}>
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
