import { cn } from "@/lib/utils";

// Placeholder presence avatars. Live presence arrives with the sync engine
// (phase 3); until then this shows the intended look with static collaborators.
const COLLABORATORS = [
  { initials: "AC", ring: "ring-violet-400" },
  { initials: "DP", ring: "ring-emerald-400" },
  { initials: "SL", ring: "ring-sky-400" },
  { initials: "MT", ring: "ring-pink-400" },
] as const;

export function CollaboratorStack() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {COLLABORATORS.map(({ initials, ring }) => (
          <span
            key={initials}
            title={initials}
            className={cn(
              "flex size-7 items-center justify-center rounded-full bg-secondary text-[0.65rem] font-semibold text-secondary-foreground ring-2 ring-offset-1 ring-offset-background",
              ring
            )}
          >
            {initials}
          </span>
        ))}
      </div>
      <span className="hidden text-xs text-muted-foreground sm:inline">
        {COLLABORATORS.length} collaborators
      </span>
    </div>
  );
}
