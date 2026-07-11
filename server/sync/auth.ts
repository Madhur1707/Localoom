import crypto from "node:crypto";
import { jwtVerify } from "jose";
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
  const rawToken = url.searchParams.get("token");
  const secret = process.env.SYNC_TOKEN_SECRET ?? "";
  const secretFp = crypto
    .createHash("sha256")
    .update(secret)
    .digest("hex")
    .slice(0, 8);
  console.log(
    `[sync-auth] room=${roomName} tokenLen=${rawToken?.length ?? 0} ` +
      `secretLen=${secret.length} secretFp=${secretFp} ` +
      `serverTime=${new Date().toISOString()}`
  );

  if (rawToken) {
    try {
      await jwtVerify(rawToken, new TextEncoder().encode(secret));
      console.log("[sync-auth] direct jwtVerify: PASSED");
    } catch (e) {
      const err = e as { code?: string; message?: string };
      console.warn(
        `[sync-auth] direct jwtVerify FAILED code=${err.code} msg=${err.message}`
      );
    }
  }

  if (!roomName) {
    console.warn("[sync-auth] reject: empty room");
    return null;
  }

  const claims = await verifySyncToken(rawToken);
  if (!claims) {
    console.warn("[sync-auth] reject: verifySyncToken returned null");
    return null;
  }
  if (claims.documentId !== roomName) {
    console.warn(`[sync-auth] reject: doc ${claims.documentId} != room ${roomName}`);
    return null;
  }

  console.log(`[sync-auth] OK room=${roomName} role=${claims.role}`);
  return {
    roomName,
    userId: claims.userId,
    role: claims.role,
    canWrite: claims.role === "OWNER" || claims.role === "EDITOR",
  };
}
