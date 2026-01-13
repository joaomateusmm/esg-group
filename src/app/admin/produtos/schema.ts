import { z } from "zod";

export const productServerSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "O preço não pode ser negativo"),
  discountPrice: z.coerce.number().nullable().optional(),
  categories: z.array(z.string()).optional(),
  status: z.enum(["active", "inactive", "draft"]),
  deliveryMode: z.enum(["automatic", "manual"]),
  stock: z.coerce.number().default(0),
  isStockUnlimited: z.boolean().default(false),
  images: z.array(z.string()).optional(),
});

export type ProductServerPayload = z.infer<typeof productServerSchema>;
