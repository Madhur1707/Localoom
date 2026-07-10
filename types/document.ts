import type { DocumentRole } from "@prisma/client";

export type { DocumentRole };

export type DocumentSummary = {
  id: string;
  title: string;
  role: DocumentRole;
  createdAt: Date;
  updatedAt: Date;
};
