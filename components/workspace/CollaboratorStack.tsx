"use client";

import { initialsFor } from "@/lib/collaboration/presence";
import { useCollaborationSessionContext } from "@/components/workspace/collaboration-session";

// How many avatars to render before collapsing the rest into a "+N" chip.
const MAX_VISIBLE_AVATARS = 4;

// Live presence avatars, driven by Yjs awareness via the collaboration session
// context. Renders nothing outside an open document (no active session).
export function CollaboratorStack() {
  const { connectionStatus, collaborators } = useCollaborationSessionContext();

  if (connectionStatus === null || collaborators.length === 0) return null;

  const visible = collaborators.slice(0, MAX_VISIBLE_AVATARS);
  const overflow = collaborators.length - visible.length;

  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {visible.map((collaborator) => (
          <span
            key={collaborator.clientId}
            title={
              collaborator.isSelf
                ? `${collaborator.name} (you)`
                : collaborator.name
            }
            style={{ backgroundColor: collaborator.color }}
            className="flex size-7 items-center justify-center rounded-full text-[0.65rem] font-semibold text-white ring-2 ring-background"
          >
            {initialsFor(collaborator.name)}
          </span>
        ))}
        {overflow > 0 && (
          <span className="flex size-7 items-center justify-center rounded-full bg-secondary text-[0.65rem] font-semibold text-secondary-foreground ring-2 ring-background">
            +{overflow}
          </span>
        )}
      </div>
      <span className="hidden text-xs text-muted-foreground sm:inline">
        {collaborators.length === 1
          ? "Only you"
          : `${collaborators.length} collaborators`}
      </span>
    </div>
  );
}
