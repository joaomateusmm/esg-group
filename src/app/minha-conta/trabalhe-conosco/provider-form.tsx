"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Briefcase, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { registerProvider } from "@/actions/providers";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

// --- 1. DEFINIÇÃO DO SCHEMA LOCAL ---
// Isso evita o erro "not a Zod schema" vindo de importação
const localProviderSchema = z.object({
  categoryId: z.string().min(1, "Selecione uma categoria."),
  bio: z
    .string()
    .min(
      20,
      "Conte um pouco mais sobre sua experiência (mínimo 20 caracteres).",
    ),
  experienceYears: z.number().min(0, "Experiência inválida."),
  phone: z.string().min(10, "Telefone inválido."),
  location: z.string().min(3, "Informe sua cidade ou região de atuação."),
  portfolioUrl: z.string().optional(),
});

// --- 2. INFERÊNCIA DO TIPO ---
type ProviderFormValues = z.infer<typeof localProviderSchema>;

interface ProviderFormProps {
  categories: { id: string; name: string }[];
}

export function ProviderForm({ categories }: ProviderFormProps) {
  const router = useRouter();
  const [isSuccess, setIsSuccess] = useState(false);

  // --- 3. USE FORM CONFIGURADO CORRETAMENTE ---
  const form = useForm<ProviderFormValues>({
    resolver: zodResolver(localProviderSchema),
    defaultValues: {
      categoryId: "",
      bio: "",
      experienceYears: 0,
      phone: "",
      location: "",
      portfolioUrl: "", // Garante string vazia para optional
    },
    mode: "onChange",
  });

  const onSubmit = async (data: ProviderFormValues) => {
    try {
      const res = await registerProvider(data);

      if (res.success) {
        toast.success(res.message);
        setIsSuccess(true);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    } catch {
      toast.error("Erro ao enviar formulário.");
    }
  };

  if (isSuccess) {
    return (
      <Card className="border-neutral-100 bg-white shadow-sm">
        <CardContent className="flex flex-col items-center justify-center p-10 text-center">
          <div className="mb-4 rounded-full bg-emerald-100 p-3 text-emerald-600">
            <CheckCircle2 className="h-12 w-12" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-emerald-900">
            Candidatura Enviada!
          </h2>
          <p className="max-w-md text-emerald-700">
            Nossa equipe vai analisar seu perfil. Você receberá uma notificação
            assim que seu cadastro for aprovado para começar a aceitar serviços.
          </p>
          <Button
            variant="outline"
            className="mt-6 border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50"
            onClick={() => router.push("/minha-conta")} // Ajustado para rota correta
          >
            Voltar para Minha Conta
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-neutral-200 bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl font-bold text-neutral-900">
          <Briefcase className="h-6 w-6 text-orange-600" /> Trabalhe Conosco
        </CardTitle>
        <CardDescription className="text-neutral-500">
          Preencha o formulário abaixo para se tornar um parceiro do ESG Group.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Seleção de Categoria */}
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-neutral-900">
                    Qual serviço você presta?
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="border-neutral-200 bg-white text-neutral-900 focus:border-orange-500 focus:ring-orange-500">
                        <SelectValue placeholder="Selecione uma categoria..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="border-neutral-200 bg-white text-neutral-900">
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-6 md:grid-cols-2">
              {/* Telefone */}
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-neutral-900">
                      Telefone / WhatsApp
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="+44 7911 123456"
                        className="border-neutral-200 bg-white text-neutral-900 focus:border-orange-500 focus:ring-orange-500"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Localização */}
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-neutral-900">
                      Cidade / Região de Atuação
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Londres, Zona Norte"
                        className="border-neutral-200 bg-white text-neutral-900 focus:border-orange-500 focus:ring-orange-500"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Anos de Experiência */}
              <FormField
                control={form.control}
                name="experienceYears"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-neutral-900">
                      Anos de Experiência
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: 3"
                        type="number"
                        min={0}
                        className="border-neutral-200 bg-white text-neutral-900 focus:border-orange-500 focus:ring-orange-500"
                        {...field}
                        onChange={(e) => {
                          const val = e.target.value;
                          field.onChange(val === "" ? 0 : Number(val));
                        }}
                        value={field.value === 0 ? "" : field.value}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Portfólio (Opcional) */}
              <FormField
                control={form.control}
                name="portfolioUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-neutral-900">
                      Link do Portfólio (Opcional)
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Instagram, Site ou LinkedIn"
                        className="border-neutral-200 bg-white text-neutral-900 focus:border-orange-500 focus:ring-orange-500"
                        {...field}
                        value={field.value || ""} // Proteção contra undefined
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Bio / Apresentação */}
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-neutral-900">Sobre Você</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva suas habilidades, ferramentas que possui e diferenciais..."
                      className="min-h-[120px] resize-none border-neutral-200 bg-white text-neutral-900 focus:border-orange-500 focus:ring-orange-500"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs text-neutral-500">
                    Isso aparecerá para os clientes na hora da contratação.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="h-12 w-full bg-orange-600 font-bold text-white shadow-md transition-all hover:bg-orange-700 disabled:bg-neutral-300"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting
                ? "Enviando..."
                : "Enviar Candidatura"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
