import type { DocumentRole } from "@prisma/client";

import { verifySyncToken } from "../../lib/collaboration/syncToken";

export type ConnectionAuthorization = {
  roomName: string;
  userId: string;
  role: DocumentRole;
  canWrite: boolean;
};


export async function authorizeConnection(
  requestUrl: string | undefined
): Promise<ConnectionAuthorization | null> {
  const url = new URL(requestUrl ?? "/", "http://sync.local");
  const roomName = decodeURIComponent(url.pathname.slice(1));
  if (!roomName) return null;

  const claims = await verifySyncToken(url.searchParams.get("token"));
  if (!claims || claims.documentId !== roomName) return null;

  return {
    roomName,
    userId: claims.userId,
    role: claims.role,
    canWrite: claims.role === "OWNER" || claims.role === "EDITOR",
  };
}
