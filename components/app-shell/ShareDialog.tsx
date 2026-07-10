"use client";

import { Check, ChevronDown, Copy, Link2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useWorkspaceUi } from "@/components/app-shell/workspace-ui";

// Placeholder share dialog. Real membership + role management is phase 4; this
// shows the intended layout with static members and a copyable link.
const MEMBERS = [
  { name: "Aria Chen", initials: "AC", role: "Owner" },
  { name: "Devon Park", initials: "DP", role: "Editor" },
  { name: "Sam Liu", initials: "SL", role: "Viewer" },
] as const;

const ROLES = ["Owner", "Editor", "Viewer"] as const;

export function ShareDialog() {
  const { isShareOpen, setShareOpen } = useWorkspaceUi();
  const [copied, setCopied] = useState(false);
  const shareLink = "https://scriptum.app/doc/shared-link";

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard may be unavailable; ignore in this placeholder.
    }
  };

  return (
    <Dialog open={isShareOpen} onOpenChange={setShareOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share document</DialogTitle>
          <DialogDescription>
            Invite people and choose what they can do. Role management arrives in
            a later phase.
          </DialogDescription>
        </DialogHeader>

        <ul className="flex flex-col gap-3">
          {MEMBERS.map(({ name, initials, role }) => (
            <li key={name} className="flex items-center gap-3">
              <Avatar className="size-8">
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <span className="flex-1 text-sm font-medium">{name}</span>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button type="button" variant="outline" size="sm" />
                  }
                >
                  {role}
                  <ChevronDown className="size-3.5 opacity-60" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {ROLES.map((option) => (
                    <DropdownMenuItem key={option} disabled={option === role}>
                      {option}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </li>
          ))}
        </ul>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            Share link
          </span>
          <div className="flex items-center gap-2">
            <div className="flex flex-1 items-center gap-2 rounded-lg border border-input bg-muted/40 px-2.5">
              <Link2 className="size-4 shrink-0 text-muted-foreground" />
              <Input
                readOnly
                value={shareLink}
                className="border-0 bg-transparent px-0 focus-visible:ring-0"
              />
            </div>
            <Button type="button" onClick={copyLink}>
              {copied ? (
                <Check className="size-4" />
              ) : (
                <Copy className="size-4" />
              )}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
