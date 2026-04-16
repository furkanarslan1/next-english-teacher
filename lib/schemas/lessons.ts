import { z } from "zod";

export const lessonTopicSchema = z.object({
  title: z
    .string()
    .min(2, "Konu başlığı en az 2 karakter olmalıdır")
    .max(150, "Konu başlığı en fazla 150 karakter olabilir"),
  level_id: z.string().uuid("Geçerli bir seviye seçin"),
  sort_order: z.coerce.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
});

export const lessonSectionSchema = z.object({
  title: z
    .string()
    .min(2, "Başlık en az 2 karakter olmalıdır")
    .max(150, "Başlık en fazla 150 karakter olabilir"),
  content: z.string().min(1, "İçerik boş olamaz"),
  sort_order: z.coerce.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
});

export type LessonTopicFormValues = z.infer<typeof lessonTopicSchema>;
export type LessonSectionFormValues = z.infer<typeof lessonSectionSchema>;