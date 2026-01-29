"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { isValidPhoneNumber } from "react-phone-number-input";
import { toast } from "sonner";
import z from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { authClient } from "@/lib/auth-client";

const formSchema = z
  .object({
    name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres."),
    email: z.string().email("E-mail inválido."),
    phoneNumber: z
      .string()
      .refine(isValidPhoneNumber, { message: "Número de telefone inválido." }),
    password: z.string().min(8, "Mínimo de 8 caracteres."),
    passwordConfirmation: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: "As senhas não coincidem.",
    path: ["passwordConfirmation"],
  });

type FormValues = z.infer<typeof formSchema>;

const SignUpForm = ({ switchToSignIn }: { switchToSignIn?: () => void }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phoneNumber: "",
      password: "",
      passwordConfirmation: "",
    },
  });

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    try {
      await authClient.signUp.email({
        name: values.name,
        email: values.email,
        password: values.password,
        // @ts-expect-error - phoneNumber pode ser um campo customizado no Better Auth
        phoneNumber: values.phoneNumber,
        fetchOptions: {
          onSuccess: () => {
            toast.success("Conta criada com sucesso!");
            router.push("/");
          },
          onError: (ctx) => {
            toast.error(ctx.error.message || "Erro ao criar conta.");
          },
        },
      });
    } catch {
      toast.error("Ocorreu um erro no cadastro.");
    } finally {
      setIsLoading(false);
    }
  }

  const handleSignInWithGoogle = async () => {
    setIsGoogleLoading(true);
    try {
      await authClient.signIn.social({ provider: "google" });
    } catch {
      toast.error("Erro ao conectar com Google.");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <Card className="w-full border-none bg-white shadow-none">
      <CardHeader className="px-0">
        <Link
          href="/"
          className="mb-4 inline-block text-xs font-medium text-neutral-500 transition-colors hover:text-orange-600"
        >
          ⟵ Voltar para Loja
        </Link>
        <CardTitle className="text-3xl font-bold tracking-tight text-neutral-900">
          Crie sua Conta
        </CardTitle>
        <CardDescription className="text-neutral-500">
          Já tem cadastro?{" "}
          <button
            type="button"
            onClick={switchToSignIn}
            className="font-medium text-orange-600 transition-colors hover:text-orange-700 hover:underline"
          >
            Faça login.
          </button>
        </CardDescription>
      </CardHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <CardContent className="grid gap-4 px-0">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      className="h-12 border-neutral-200 bg-white"
                      placeholder="Seu nome"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <PhoneInput
                      placeholder="(11) 1234-5678"
                      defaultCountry="BR"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      className="h-12 border-neutral-200 bg-white"
                      placeholder="seu@email.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col gap-4 sm:flex-row">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormControl>
                      <div className="relative">
                        <Input
                          className="h-12 border-neutral-200 bg-white pr-10"
                          placeholder="Senha"
                          type={showPassword ? "text" : "password"}
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute top-0 right-0 h-full text-neutral-400"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="passwordConfirmation"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormControl>
                      <Input
                        className="h-12 border-neutral-200 bg-white"
                        placeholder="Confirme a senha"
                        type={showPassword ? "text" : "password"}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4 px-0">
            <Button
              type="submit"
              className="h-12 w-full bg-orange-600 font-bold text-white hover:bg-orange-700"
              disabled={isLoading || isGoogleLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Criar Conta"
              )}
            </Button>

            <div className="relative flex w-full items-center justify-center">
              <div className="w-full border-t border-neutral-200"></div>
              <span className="relative bg-white px-2 text-xs text-neutral-500 uppercase">
                Ou continue com
              </span>
              <div className="w-full border-t border-neutral-200"></div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleSignInWithGoogle}
              disabled={isLoading || isGoogleLoading}
              className="h-12 w-full border-neutral-200"
            >
              {isGoogleLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Google"
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};

export default SignUpForm;
