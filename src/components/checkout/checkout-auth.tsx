"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, LogIn, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { isValidPhoneNumber } from "react-phone-number-input";
import { toast } from "sonner";
import z from "zod";

import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";

// --- SCHEMAS ---

const signInSchema = z.object({
  email: z.string().email("E-mail inválido!"),
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres!"),
});

const signUpSchema = z
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

type SignInValues = z.infer<typeof signInSchema>;
type SignUpValues = z.infer<typeof signUpSchema>;

// --- COMPONENTE PRINCIPAL ---

export function CheckoutAuth() {
  const [mode, setMode] = useState<"login" | "register">("register");

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="mb-6 text-center">
        <h2 className="text-xl font-bold text-neutral-900">
          Identifique-se para finalizar
        </h2>
        <p className="text-sm text-neutral-500">
          Você precisa de uma conta para acompanhar seu pedido.
        </p>
      </div>

      {/* TABS DE ALTERNANCIA */}
      <div className="mb-6 flex rounded-lg bg-neutral-100 p-1">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={cn(
            "flex-1 rounded-md py-2 text-sm font-medium transition-all",
            mode === "login"
              ? "bg-white text-neutral-900 shadow-sm"
              : "text-neutral-500 hover:text-neutral-900"
          )}
        >
          Já tenho conta
        </button>
        <button
          type="button"
          onClick={() => setMode("register")}
          className={cn(
            "flex-1 rounded-md py-2 text-sm font-medium transition-all",
            mode === "register"
              ? "bg-white text-neutral-900 shadow-sm"
              : "text-neutral-500 hover:text-neutral-900"
          )}
        >
          Criar conta
        </button>
      </div>

      {mode === "login" ? <CheckoutLoginForm /> : <CheckoutRegisterForm />}
    </div>
  );
}

// --- SUB-COMPONENTE: LOGIN FORM ---

function CheckoutLoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: SignInValues) {
    setIsLoading(true);
    try {
      await authClient.signIn.email({
        email: values.email,
        password: values.password,
        fetchOptions: {
          onSuccess: () => {
            toast.success("Login realizado!");
            // Refresh recarrega a sessão sem sair da página /checkout
            router.refresh(); 
          },
          onError: (ctx) => {
            toast.error(ctx.error.message || "Credenciais inválidas.");
          },
        },
      });
    } catch {
      toast.error("Ocorreu um erro inesperado.");
    } finally {
      setIsLoading(false);
    }
  }

  const handleSignInWithGoogle = async () => {
    setIsGoogleLoading(true);
    try {
      await authClient.signIn.social({ 
        provider: "google",
        callbackURL: "/checkout" // Garante retorno ao checkout
      });
    } catch {
      toast.error("Erro ao conectar com Google.");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  className="h-11 bg-white focus:border-orange-500 focus:ring-orange-500"
                  placeholder="seu@email.com"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <div className="relative">
                  <Input
                    className="h-11 bg-white pr-10 focus:border-orange-500 focus:ring-orange-500"
                    placeholder="Sua senha"
                    type={showPassword ? "text" : "password"}
                    {...field}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute top-0 right-0 h-full px-3 text-neutral-400 hover:bg-transparent"
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

        <div className="flex flex-col gap-3 pt-2">
          <Button
            type="submit"
            className="h-11 w-full bg-orange-600 font-bold text-white hover:bg-orange-700"
            disabled={isLoading || isGoogleLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <>
                <LogIn className="mr-2 h-4 w-4" /> Entrar e Continuar
              </>
            )}
          </Button>

          <GoogleButton
            onClick={handleSignInWithGoogle}
            isLoading={isGoogleLoading || isLoading}
          />
        </div>
      </form>
    </Form>
  );
}

// --- SUB-COMPONENTE: REGISTER FORM ---

function CheckoutRegisterForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      phoneNumber: "",
      password: "",
      passwordConfirmation: "",
    },
  });

  async function onSubmit(values: SignUpValues) {
    setIsLoading(true);
    try {
      await authClient.signUp.email({
        name: values.name,
        email: values.email,
        password: values.password,
        // @ts-expect-error - phoneNumber no auth client
        phoneNumber: values.phoneNumber,
        fetchOptions: {
          onSuccess: () => {
            toast.success("Conta criada!");
            // Refresh recarrega a sessão sem sair da página /checkout
            router.refresh();
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
      await authClient.signIn.social({ 
        provider: "google",
        callbackURL: "/checkout" // Garante retorno ao checkout
      });
    } catch {
      toast.error("Erro ao conectar com Google.");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  className="h-11 bg-white focus:border-orange-500 focus:ring-orange-500"
                  placeholder="Seu nome completo"
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
                  placeholder="(11) 99999-9999"
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
                  className="h-11 bg-white focus:border-orange-500 focus:ring-orange-500"
                  placeholder="seu@email.com"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="relative">
                    <Input
                      className="h-11 bg-white pr-10 focus:border-orange-500 focus:ring-orange-500"
                      placeholder="Senha"
                      type={showPassword ? "text" : "password"}
                      {...field}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute top-0 right-0 h-full px-3 text-neutral-400 hover:bg-transparent"
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
              <FormItem>
                <FormControl>
                  <Input
                    className="h-11 bg-white focus:border-orange-500 focus:ring-orange-500"
                    placeholder="Confirmar"
                    type={showPassword ? "text" : "password"}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <Button
            type="submit"
            className="h-11 w-full bg-orange-600 font-bold text-white hover:bg-orange-700"
            disabled={isLoading || isGoogleLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" /> Criar Conta e Continuar
              </>
            )}
          </Button>

          <GoogleButton
            onClick={handleSignInWithGoogle}
            isLoading={isGoogleLoading || isLoading}
          />
        </div>
        
        <p className="text-center text-xs text-neutral-400">
          Seus dados estão seguros. Criptografia ponta a ponta.
        </p>
      </form>
    </Form>
  );
}

// --- BOTÃO GOOGLE REUTILIZÁVEL ---

function GoogleButton({
  onClick,
  isLoading,
}: {
  onClick: () => void;
  isLoading: boolean;
}) {
  return (
    <>
      <div className="relative flex w-full items-center justify-center">
        <div className="w-full border-t border-neutral-200"></div>
        <span className="relative w-full bg-white px-2 text-center text-xs text-neutral-500 uppercase">
          Ou continue com
        </span>
        <div className="w-full border-t border-neutral-200"></div>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={onClick}
        disabled={isLoading}
        className="h-11 w-full border-neutral-200 hover:bg-neutral-50"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <span className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="h-5 w-5">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
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
          </span>
        )}
      </Button>
    </>
  );
}