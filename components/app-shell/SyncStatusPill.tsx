import { Cloud } from "lucide-react";

// Placeholder sync indicator. The real online/offline/syncing state is wired in
// with the sync engine (phase 3); this shows the resting "synced" look.
export function SyncStatusPill() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground">
      <span className="size-1.5 rounded-full bg-emerald-400" />
      <Cloud className="size-3.5" />
      Synced
    </span>
  );
}
