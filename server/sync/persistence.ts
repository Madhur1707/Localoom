import { prisma } from "../../lib/prisma";

// Server-side durability for the CRDT. The sync server is a separate Node process
// from Next.js, but it can talk to the same Postgres directly via the shared
// Prisma singleton (imported by relative path since tsx doesn't resolve `@/`).
//
// The DocumentUpdate table is an append-only log of raw Yjs binary updates: on
// room start we replay it to rebuild the document, and as edits arrive we append
// to it. Nothing here is ever mutated or deleted, so history stays intact for the
// version/time-travel features layered on top.

// One row's worth of persistence: the merged binary update and who authored it.
export type PersistableUpdate = {
  userId: string | null;
  merged: Uint8Array;
};

// Every stored update for a document, oldest first — the exact order they must be
// replayed in to reconstruct the current Y.Doc state.
export async function loadDocumentUpdates(
  documentId: string
): Promise<Uint8Array[]> {
  const rows = await prisma.documentUpdate.findMany({
    where: { documentId },
    orderBy: { createdAt: "asc" },
    select: { data: true },
  });
  return rows.map((row) => new Uint8Array(row.data));
}

// Append a batch of updates in a single round-trip. Called from the room's
// debounced flush, so `entries` is already grouped/merged per author.
export async function persistDocumentUpdates(
  documentId: string,
  entries: PersistableUpdate[]
): Promise<void> {
  if (entries.length === 0) return;
  await prisma.documentUpdate.createMany({
    data: entries.map((entry) => ({
      documentId,
      data: Buffer.from(entry.merged),
      createdById: entry.userId,
    })),
  });
}
