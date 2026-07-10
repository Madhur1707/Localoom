"use client";

import { Cloud, CloudOff, RefreshCw } from "lucide-react";

import { cn } from "@/lib/utils";
import type { SyncConnectionStatus } from "@/types/collaboration";
import { useCollaborationSessionContext } from "@/components/workspace/collaboration-session";

// Visual mapping for each realtime link state, mirrored from the y-websocket
// provider status the editor publishes.
const STATUS_PRESENTATION: Record<
  SyncConnectionStatus,
  { label: string; dotClass: string; Icon: typeof Cloud; spin?: boolean }
> = {
  connected: { label: "Synced", dotClass: "bg-emerald-400", Icon: Cloud },
  connecting: {
    label: "Connecting…",
    dotClass: "bg-amber-400",
    Icon: RefreshCw,
    spin: true,
  },
  disconnected: { label: "Offline", dotClass: "bg-muted-foreground", Icon: CloudOff },
};

// Real online/offline/syncing indicator. Hidden when no document is open, so the
// dashboard doesn't show a sync state for nothing.
export function SyncStatusPill() {
  const { connectionStatus } = useCollaborationSessionContext();
  if (connectionStatus === null) return null;

  const { label, dotClass, Icon, spin } = STATUS_PRESENTATION[connectionStatus];

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground">
      <span className={cn("size-1.5 rounded-full", dotClass)} />
      <Icon className={cn("size-3.5", spin && "animate-spin")} />
      {label}
    </span>
  );
}
