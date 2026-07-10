"use client";

import { ChevronRight, Share2, Sparkles } from "lucide-react";

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
import { CollaboratorStack } from "@/components/app-shell/CollaboratorStack";
import { SyncStatusPill } from "@/components/app-shell/SyncStatusPill";
import { useWorkspaceUi } from "@/components/app-shell/workspace-ui";

export function AppTopBar() {
  const { user, logout } = useAuth();
  const { toggleAiPanel, isAiPanelOpen, setShareOpen, activeDocumentTitle } =
    useWorkspaceUi();

  const initial = (user?.name ?? user?.email ?? "?").charAt(0).toUpperCase();

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur">
      {/* Breadcrumb */}
      <div className="flex min-w-0 items-center gap-1.5 text-sm">
        <span className="text-muted-foreground">Workspace</span>
        <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/60" />
        <span className="truncate font-medium">
          {activeDocumentTitle ?? "Dashboard"}
        </span>
      </div>

      <div className="mx-auto hidden md:block">
        <CollaboratorStack />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <SyncStatusPill />
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-pressed={isAiPanelOpen}
          className={cn(isAiPanelOpen && "border-primary/50 text-primary")}
          onClick={toggleAiPanel}
        >
          <Sparkles className="size-4" />
          AI Toolkit
        </Button>
        <Button type="button" size="sm" onClick={() => setShareOpen(true)}>
          <Share2 className="size-4" />
          Share
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
