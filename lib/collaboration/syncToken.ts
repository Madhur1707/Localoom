import { SignJWT, jwtVerify } from "jose";

import type { DocumentRole } from "@/types/document";

export type SyncTokenClaims = {
  documentId: string;
  userId: string;
  name: string | null;
  role: DocumentRole;
};

const DEVELOPMENT_FALLBACK_SECRET = "scriptum-dev-sync-secret-do-not-use-in-prod";


const TOKEN_TTL = "12h";

function resolveSecret(): Uint8Array {
  const secret = process.env.SYNC_TOKEN_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "SYNC_TOKEN_SECRET is required in production to sign sync tokens."
      );
    }
    return new TextEncoder().encode(DEVELOPMENT_FALLBACK_SECRET);
  }
  return new TextEncoder().encode(secret);
}

export async function signSyncToken(claims: SyncTokenClaims): Promise<string> {
  return new SignJWT({
    userId: claims.userId,
    name: claims.name,
    role: claims.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.documentId)
    .setIssuedAt()
    .setExpirationTime(TOKEN_TTL)
    .sign(resolveSecret());
}

export async function verifySyncToken(
  token: string | undefined | null
): Promise<SyncTokenClaims | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, resolveSecret());
    if (
      typeof payload.sub !== "string" ||
      typeof payload.userId !== "string" ||
      typeof payload.role !== "string"
    ) {
      return null;
    }
    return {
      documentId: payload.sub,
      userId: payload.userId,
      name: (payload.name as string | null) ?? null,
      role: payload.role as DocumentRole,
    };
  } catch {
    return null;
  }
}
