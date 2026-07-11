import * as Y from "yjs";

import { prisma } from "../../lib/prisma";

// Once a document's log passes this many rows, it's collapsed into a single
// merged snapshot. Tunable; a few hundred keeps hydration fast without compacting
// on every edit.
const COMPACTION_THRESHOLD = Number(
  process.env.SYNC_COMPACTION_THRESHOLD ?? 500
);

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
  await prisma.document.update({
    where: { id: documentId },
    data: { updatedAt: new Date() },
  });
}

// Log compaction: merge the whole append-only log into one snapshot row and drop
// the originals, bounding storage and keeping hydration fast as a document is
// edited over time.
export async function compactDocumentUpdates(
  documentId: string
): Promise<boolean> {
  const count = await prisma.documentUpdate.count({ where: { documentId } });
  if (count < COMPACTION_THRESHOLD) return false;

  const rows = await prisma.documentUpdate.findMany({
    where: { documentId },
    orderBy: { createdAt: "asc" },
    select: { id: true, data: true },
  });
  if (rows.length < COMPACTION_THRESHOLD) return false;

  const merged = Y.mergeUpdates(rows.map((row) => new Uint8Array(row.data)));


  await prisma.$transaction([
    prisma.documentUpdate.create({
      data: { documentId, data: Buffer.from(merged) },
    }),
    prisma.documentUpdate.deleteMany({
      where: { id: { in: rows.map((row) => row.id) } },
    }),
  ]);
  return true;
}
