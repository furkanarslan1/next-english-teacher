import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email zorunludur")
    .email("Geçerli bir email girin"),
  password: z
    .string()
    .min(1, "Şifre zorunludur"),
});

export const signupSchema = z
  .object({
    full_name: z
      .string()
      .min(2, "Ad Soyad en az 2 karakter olmalıdır")
      .max(100, "Ad Soyad en fazla 100 karakter olabilir"),
    email: z
      .string()
      .min(1, "Email zorunludur")
      .email("Geçerli bir email girin"),
    password: z
      .string()
      .min(8, "Şifre en az 8 karakter olmalıdır"),
    confirm_password: z
      .string()
      .min(1, "Şifre tekrarı zorunludur"),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Şifreler eşleşmiyor",
    path: ["confirm_password"],
  });

export type LoginFormValues  = z.infer<typeof loginSchema>;
export type SignupFormValues = z.infer<typeof signupSchema>;
