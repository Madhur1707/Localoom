import { z } from "zod";

export const createDocumentSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
});

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;

export const assignableDocumentRoleSchema = z.enum(["EDITOR", "VIEWER"]);

export const addDocumentMemberSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  role: assignableDocumentRoleSchema,
});

export const updateDocumentMemberSchema = z.object({
  role: assignableDocumentRoleSchema,
});

// The client encodes the live Y.Doc as a base64 Yjs state update and names the
// version; the server stores those bytes verbatim as the snapshot.
export const createDocumentVersionSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  snapshot: z
    .string()
    .min(1, "Snapshot is required")
    .regex(/^[A-Za-z0-9+/]+={0,2}$/, "Invalid snapshot encoding"),
});

export type CreateDocumentVersionInput = z.infer<
  typeof createDocumentVersionSchema
>;

export type AddDocumentMemberInput = z.infer<typeof addDocumentMemberSchema>;
export type UpdateDocumentMemberInput = z.infer<
  typeof updateDocumentMemberSchema
>;
export type AssignableDocumentRole = z.infer<
  typeof assignableDocumentRoleSchema
>;
