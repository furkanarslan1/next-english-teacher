"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { signupSchema, type SignupFormValues } from "@/lib/schemas/auth";
import { signupAction } from "@/app/actions/auth";

export function SignupForm({ ...props }: React.ComponentProps<typeof Card>) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  });

  async function onSubmit(values: SignupFormValues) {
    setServerError(null);
    const result = await signupAction(values);
    if (result?.error) {
      setServerError(result.error);
    }
  }

  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>Hesap oluştur</CardTitle>
        <CardDescription>
          Kayıt olmak için bilgilerini aşağıya gir
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            {serverError && (
              <FieldError>{serverError}</FieldError>
            )}
            <Field>
              <FieldLabel htmlFor="full_name">Ad Soyad</FieldLabel>
              <Input
                id="full_name"
                type="text"
                placeholder="Adın Soyadın"
                {...register("full_name")}
              />
              {errors.full_name && (
                <FieldError>{errors.full_name.message}</FieldError>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder="ornek@email.com"
                {...register("email")}
              />
              {errors.email && (
                <FieldError>{errors.email.message}</FieldError>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Şifre</FieldLabel>
              <Input
                id="password"
                type="password"
                {...register("password")}
              />
              {errors.password ? (
                <FieldError>{errors.password.message}</FieldError>
              ) : (
                <FieldDescription>En az 8 karakter olmalıdır.</FieldDescription>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="confirm_password">Şifre Tekrar</FieldLabel>
              <Input
                id="confirm_password"
                type="password"
                {...register("confirm_password")}
              />
              {errors.confirm_password && (
                <FieldError>{errors.confirm_password.message}</FieldError>
              )}
            </Field>
            <Field>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Kayıt olunuyor…" : "Kayıt Ol"}
              </Button>
              <FieldDescription className="text-center">
                Zaten hesabın var mı?{" "}
                <a href="/login" className="underline underline-offset-4 hover:text-primary">
                  Giriş yap
                </a>
              </FieldDescription>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}