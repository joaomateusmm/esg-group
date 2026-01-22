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
              <span className="relative bg-white px-2 text-xs text-neutral-500 uppercase">
                Ou continue com
              </span>
              <div className="w-full border-t border-neutral-200"></div>
            </div>

            <div className="grid w-full grid-cols-2 gap-3">
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

              <Button
                type="button"
                onClick={handleSignInWithDiscord}
                disabled={isLoading || isGoogleLoading || isDiscordLoading}
                className="group h-12 w-full border border-neutral-200 bg-white text-neutral-600 transition-all duration-300 hover:border-[#5865F2] hover:bg-[#5865F2]/10 hover:text-[#5865F2]"
              >
                {isDiscordLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <svg
                      role="img"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                      className="mr-2 h-5 w-5 fill-[#5865F2]"
                    >
                      <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1568 2.419zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1568 2.419z" />
                    </svg>
                    Discord
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
