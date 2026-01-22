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
    name: z.string().min(1, "Nome é obrigatório."),
    email: z.email("E-mail inválido."),
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

  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isDiscordLoading, setIsDiscordLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    try {
      await authClient.signUp.email({
        name: values.name,
        email: values.email,
        password: values.password,
        phoneNumber: values.phoneNumber,
        fetchOptions: {
          onSuccess: () => router.push("/"),
          // 1. Corrigimos o erro do 'ctx' definindo o tipo dele manualmente
          onError: (ctx: { error: { message: string } }) => {
            toast.error(ctx.error.message || "Erro ao criar conta.");
          },
        },
        // 2. Adicionamos este comentário para o ESLint ignorar o erro do 'any' nesta linha específica
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
    } finally {
      setIsLoading(false);
    }
  }

  const handleSignInWithGoogle = async () => {
    setIsGoogleLoading(true);
    try {
      await authClient.signIn.social({ provider: "google" });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSignInWithDiscord = async () => {
    setIsDiscordLoading(true);
    try {
      await authClient.signIn.social({ provider: "discord" });
    } finally {
      setIsDiscordLoading(false);
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
            {/* NOME */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      className="h-12 border-neutral-200 bg-white text-neutral-900 placeholder:text-neutral-400 focus:border-orange-500 focus:ring-orange-500"
                      placeholder="Seu nome"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />

            {/* TELEFONE */}
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <PhoneInput
                      className="placeholder:text-neutral-300"
                      placeholder="(11) 1234-5678"
                      defaultCountry="BR"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />

            {/* EMAIL */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      className="h-12 border-neutral-200 bg-white text-neutral-900 placeholder:text-neutral-400 focus:border-orange-500 focus:ring-orange-500"
                      placeholder="seu@email.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />

            {/* SENHAS */}
            <div className="flex w-full flex-col gap-4 sm:flex-row">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormControl>
                      <div className="relative">
                        <Input
                          className="h-12 border-neutral-200 bg-white pr-10 text-neutral-900 placeholder:text-neutral-400 focus:border-orange-500 focus:ring-orange-500"
                          placeholder="Senha"
                          type={showPassword ? "text" : "password"}
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute top-0 right-0 h-full px-3 text-neutral-400 hover:bg-transparent hover:text-neutral-600"
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
                    <FormMessage className="text-red-500" />
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
                        className="h-12 border-neutral-200 bg-white text-neutral-900 placeholder:text-neutral-400 focus:border-orange-500 focus:ring-orange-500"
                        placeholder="Confirme a senha"
                        type={showPassword ? "text" : "password"}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4 px-0">
            <Button
              type="submit"
              className="h-12 w-full bg-orange-600 font-bold text-white transition-transform hover:scale-[1.01] hover:bg-orange-700"
              disabled={isLoading || isGoogleLoading || isDiscordLoading}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Criar Conta"
              )}
            </Button>

            <div className="relative flex w-full items-center justify-center">
              <div className="w-full border-t border-neutral-200"></div>
              <span className="relative w-full bg-white px-2 text-xs text-neutral-500 uppercase">
                Ou continue com
              </span>
              <div className="w-full border-t border-neutral-200"></div>
            </div>

            <div className="w-full">
              <Button
                type="button"
                onClick={handleSignInWithGoogle}
                disabled={isLoading || isGoogleLoading || isDiscordLoading}
                className="group h-12 w-full border border-neutral-200 bg-white text-neutral-600 transition-all duration-300 hover:bg-neutral-50 hover:text-neutral-900"
              >
                {isGoogleLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" className="mr-2 h-5 w-5">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.04-3.71 1.04-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    Google
                  </>
                )}
              </Button>
            </div>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};

export default SignUpForm;
