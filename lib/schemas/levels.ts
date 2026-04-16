import { z } from "zod";

export const levelSchema = z.object({
  label: z
    .string()
    .min(1, "Seviye adı zorunludur")
    .max(20, "Seviye adı en fazla 20 karakter olabilir"),
  sort_order: z.coerce.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
});

export type LevelFormValues = z.infer<typeof levelSchema>;
