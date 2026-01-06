import { z } from "zod";

export const streamingSchema = z.object({
  name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres."),
});

export type StreamingSchema = z.infer<typeof streamingSchema>;
