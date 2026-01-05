import { z } from "zod";

export const productServerSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  price: z.coerce.number().min(1, "Preço deve ser maior que 0"),
  discountPrice: z.coerce.number().nullable().optional(),

  // MUDANÇA AQUI: Array de strings opcional
  categories: z.array(z.string()).optional(),

  status: z.enum(["active", "inactive", "draft"]),
  deliveryMode: z.enum(["automatic", "manual"]),
  stock: z.coerce.number().default(0),
  isStockUnlimited: z.boolean().default(false),
  images: z.array(z.string()).optional(),
});

export type ProductServerPayload = z.infer<typeof productServerSchema>;
