import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres."),
  description: z.string().optional(),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;
