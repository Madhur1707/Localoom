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

export type AddDocumentMemberInput = z.infer<typeof addDocumentMemberSchema>;
export type UpdateDocumentMemberInput = z.infer<
  typeof updateDocumentMemberSchema
>;
export type AssignableDocumentRole = z.infer<
  typeof assignableDocumentRoleSchema
>;
