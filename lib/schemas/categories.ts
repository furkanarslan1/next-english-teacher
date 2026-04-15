import { z } from "zod";

export const categorySchema = z.object({
  label: z
    .string()
    .min(2, "Kategori adı en az 2 karakter olmalıdır")
    .max(100, "Kategori adı en fazla 100 karakter olabilir"),
  level_id: z.string().uuid("Geçerli bir seviye seçin"),
  sort_order: z.coerce.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;