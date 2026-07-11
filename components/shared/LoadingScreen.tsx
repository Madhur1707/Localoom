import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

// Fills the available space with a centered spinner. Used by route-level
// loading.tsx boundaries so every navigation shows immediate feedback.
export function LoadingScreen({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex min-h-[60vh] w-full flex-1 flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
      <LoadingSpinner className="size-6 text-primary" />
      {label}
    </div>
  );
}
