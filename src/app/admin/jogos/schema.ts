import { z } from "zod";

export const gameSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
});

export type GameSchema = z.infer<typeof gameSchema>;
