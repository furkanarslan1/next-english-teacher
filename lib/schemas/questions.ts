import { z } from "zod";

const optionSchema = z.object({
  label: z.string().min(1),
  is_correct: z.boolean(),
});

export const questionSchema = z.discriminatedUnion("type", [
  // Doğru / Yanlış
  z.object({
    type: z.literal("true_false"),
    question_text: z.string().min(3, "Soru metni zorunludur"),
    points: z.coerce.number().int().min(1).default(10),
    sort_order: z.coerce.number().int().min(0).default(0),
    word_card_id: z.string().uuid().optional().or(z.literal("")),
    question_direction: z.enum(["en_to_tr", "tr_to_en"]).optional(),
  }),
  // Çoktan seçmeli — kelime bazlı
  z.object({
    type: z.literal("multiple_choice"),
    mode: z.literal("word"),
    word_card_id: z.string().uuid("Kelime seçin"),
    question_direction: z.enum(["en_to_tr", "tr_to_en"]),
    points: z.coerce.number().int().min(1).default(10),
    sort_order: z.coerce.number().int().min(0).default(0),
  }),
  // Çoktan seçmeli — manuel
  z.object({
    type: z.literal("multiple_choice"),
    mode: z.literal("manual"),
    question_text: z.string().min(3, "Soru metni zorunludur"),
    options: z
      .array(optionSchema)
      .min(2, "En az 2 şık gerekli")
      .max(6)
      .refine(
        (opts) => opts.some((o) => o.is_correct),
        "En az bir doğru şık işaretleyin",
      ),
    points: z.coerce.number().int().min(1).default(10),
    sort_order: z.coerce.number().int().min(0).default(0),
    word_card_id: z.undefined().optional(),
    question_direction: z.undefined().optional(),
  }),
]);

export type QuestionFormValues = z.infer<typeof questionSchema>;
