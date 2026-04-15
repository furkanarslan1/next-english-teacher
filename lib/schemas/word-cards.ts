import { z } from "zod";

export const wordCardSchema = z.object({
  word: z
    .string()
    .min(1, "Kelime zorunludur")
    .max(200, "Kelime en fazla 200 karakter olabilir"),
  level_id: z.string().uuid("Geçerli bir seviye seçin"),
  category_id: z.string().uuid().optional().or(z.literal("")),
  translation: z.string().max(200).optional().or(z.literal("")),
  example_sentence: z.string().max(500).optional().or(z.literal("")),
  description: z.string().max(500).optional().or(z.literal("")),
  sort_order: z.coerce.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
});

export type WordCardFormValues = z.infer<typeof wordCardSchema>;