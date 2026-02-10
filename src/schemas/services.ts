import { z } from "zod";

export const serviceCategorySchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres."),
  description: z.string().optional().or(z.literal("")),
  image: z.string().optional().or(z.literal("")),
  isActive: z.boolean(),
});

export type ServiceFormValues = z.infer<typeof serviceCategorySchema>;