import { z } from "zod";

export const quizSchema = z.object({
  title: z
    .string()
    .min(2, "Test adı en az 2 karakter olmalıdır")
    .max(200, "Test adı en fazla 200 karakter olabilir"),
  description: z.string().max(500).optional().or(z.literal("")),
  time_per_question: z.coerce.number().int().min(5).max(300).default(30),
  is_active: z.boolean().default(true),
  level_ids: z.array(z.string().uuid()).default([]),
  category_ids: z.array(z.string().uuid()).default([]),
});

export type QuizFormValues = z.infer<typeof quizSchema>;
