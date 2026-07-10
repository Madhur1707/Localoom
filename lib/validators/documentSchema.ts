import { z } from "zod";

export const createDocumentSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
});

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
