"use client";

import {
  Check,
  ChevronDown,
  Copy,
  Link2,
  Mail,
  Trash2,
  UserPlus,
} from "lucide-react";
import { useState, type FormEvent } from "react";

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
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { useWorkspaceUi } from "@/components/workspace/workspace-ui";
import { useDocumentSharing } from "@/hooks/useDocumentSharing";
import type { AssignableDocumentRole } from "@/lib/validators/documentSchema";
import type {
  DocumentInvitationSummary,
  DocumentMemberSummary,
  DocumentRole,
} from "@/types/document";

const ROLE_LABEL: Record<DocumentRole, string> = {
  OWNER: "Owner",
  EDITOR: "Editor",
  VIEWER: "Viewer",
};

const ASSIGNABLE_ROLES: { value: AssignableDocumentRole; label: string }[] = [
  { value: "EDITOR", label: "Editor" },
  { value: "VIEWER", label: "Viewer" },
];

function initialsOf(name: string | null, email: string): string {
  const source = name?.trim() || email;
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export function ShareDialog() {
  const { isShareOpen, setShareOpen, activeDocument } = useWorkspaceUi();
  const documentId = activeDocument?.id ?? null;
  const canManage = activeDocument?.role === "OWNER";

  const {
    members,
    invitations,
    isLoading,
    loadError,
    isMutating,
    mutationError,
    invite,
    updateMemberRole,
    removeMember,
    revokeInvitation,
  } = useDocumentSharing(isShareOpen ? documentId : null);

  return (
    <Dialog open={isShareOpen} onOpenChange={setShareOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Share “{activeDocument?.title ?? "document"}”
          </DialogTitle>
          <DialogDescription>
            {canManage
              ? "Invite people by email and choose what they can do."
              : "People with access to this document."}
          </DialogDescription>
        </DialogHeader>

        {canManage && (
          <InviteMemberForm
            onInvite={invite}
            isSubmitting={isMutating}
            error={mutationError}
          />
        )}

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
            <LoadingSpinner />
            Loading people…
          </div>
        ) : loadError ? (
          <p className="py-4 text-sm text-destructive">{loadError}</p>
        ) : (
          <div className="flex flex-col gap-3">
            <ul className="flex flex-col gap-1">
              {members.map((member) => (
                <MemberRow
                  key={member.userId}
                  member={member}
                  canManage={canManage}
                  isMutating={isMutating}
                  onChangeRole={updateMemberRole}
                  onRemove={removeMember}
                />
              ))}
            </ul>

            {invitations.length > 0 && (
              <div className="flex flex-col gap-1">
                <span className="px-1 text-xs font-medium text-muted-foreground">
                  Pending invitations
                </span>
                <ul className="flex flex-col gap-1">
                  {invitations.map((invitation) => (
                    <InvitationRow
                      key={invitation.id}
                      invitation={invitation}
                      isMutating={isMutating}
                      onRevoke={revokeInvitation}
                    />
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <ShareLink documentId={documentId} />
      </DialogContent>
    </Dialog>
  );
}

function InviteMemberForm({
  onInvite,
  isSubmitting,
  error,
}: {
  onInvite: (email: string, role: AssignableDocumentRole) => Promise<boolean>;
  isSubmitting: boolean;
  error: string | null;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AssignableDocumentRole>("EDITOR");

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!email.trim()) return;
    const succeeded = await onInvite(email.trim(), role);
    if (succeeded) setEmail("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Input
          type="email"
          required
          placeholder="Email address"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="flex-1"
        />
        <RolePicker value={role} onChange={setRole} disabled={isSubmitting} />
        <Button type="submit" disabled={isSubmitting || !email.trim()}>
          <UserPlus className="size-4" />
          <span className="hidden sm:inline">Invite</span>
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  );
}

function MemberRow({
  member,
  canManage,
  isMutating,
  onChangeRole,
  onRemove,
}: {
  member: DocumentMemberSummary;
  canManage: boolean;
  isMutating: boolean;
  onChangeRole: (
    userId: string,
    role: AssignableDocumentRole,
  ) => Promise<boolean>;
  onRemove: (userId: string) => Promise<boolean>;
}) {
  const displayName = member.name?.trim() || member.email;

  const isManageable =
    canManage && member.role !== "OWNER" && !member.isCurrentUser;

  return (
    <li className="flex items-center gap-3 rounded-lg px-1 py-1.5">
      <Avatar className="size-8">
        <AvatarFallback>{initialsOf(member.name, member.email)}</AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium">
          {displayName}
          {member.isCurrentUser && (
            <span className="text-muted-foreground"> (you)</span>
          )}
        </span>
        <span className="truncate text-xs text-muted-foreground">
          {member.email}
        </span>
      </div>

      {isManageable ? (
        <>
          <RolePicker
            value={member.role === "VIEWER" ? "VIEWER" : "EDITOR"}
            onChange={(role) => onChangeRole(member.userId, role)}
            disabled={isMutating}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Remove ${displayName}`}
            disabled={isMutating}
            onClick={() => onRemove(member.userId)}
          >
            <Trash2 className="size-4" />
          </Button>
        </>
      ) : (
        <span className="text-sm text-muted-foreground">
          {ROLE_LABEL[member.role]}
        </span>
      )}
    </li>
  );
}

function InvitationRow({
  invitation,
  isMutating,
  onRevoke,
}: {
  invitation: DocumentInvitationSummary;
  isMutating: boolean;
  onRevoke: (invitationId: string) => Promise<boolean>;
}) {
  return (
    <li className="flex items-center gap-3 rounded-lg px-1 py-1.5">
      <Avatar className="size-8">
        <AvatarFallback>
          <Mail className="size-4 text-muted-foreground" />
        </AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium">{invitation.email}</span>
        <span className="truncate text-xs text-muted-foreground">
          Invited as {ROLE_LABEL[invitation.role]} · awaiting sign-up
        </span>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={`Revoke invitation for ${invitation.email}`}
        disabled={isMutating}
        onClick={() => onRevoke(invitation.id)}
      >
        <Trash2 className="size-4" />
      </Button>
    </li>
  );
}

// Editor/Viewer picker shared by the invite form and each manageable member row.
function RolePicker({
  value,
  onChange,
  disabled,
}: {
  value: AssignableDocumentRole;
  onChange: (role: AssignableDocumentRole) => void;
  disabled?: boolean;
}) {
  const label = ASSIGNABLE_ROLES.find((role) => role.value === value)?.label;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
          />
        }
      >
        {label}
        <ChevronDown className="size-3.5 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {ASSIGNABLE_ROLES.map((role) => (
          <DropdownMenuItem
            key={role.value}
            disabled={role.value === value}
            onClick={() => onChange(role.value)}
          >
            {role.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ShareLink({ documentId }: { documentId: string | null }) {
  const [copied, setCopied] = useState(false);

  const shareLink =
    documentId && typeof window !== "undefined"
      ? `${window.location.origin}/documents/${documentId}`
      : "";

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard may be unavailable (insecure context); leave the field as-is.
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-medium text-muted-foreground">
        Document link
      </span>
      <p className="text-xs text-muted-foreground">
        Only people added above can open it — sharing the link doesn&apos;t
        grant access.
      </p>
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
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
    </div>
  );
}
