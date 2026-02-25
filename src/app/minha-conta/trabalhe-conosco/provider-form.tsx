"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Briefcase, CheckCircle2, FileImage, Trash2 } from "lucide-react";
import Image from "next/image";
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
import { UploadButton } from "@/lib/uploadthing";

// --- 1. DEFINIÇÃO DO SCHEMA LOCAL ---
const localProviderSchema = z
  .object({
    categoryId: z.string().min(1, "Selecione uma categoria."),
    bio: z
      .string()
      .min(
        20,
        "Conte um pouco mais sobre sua experiência (mínimo 20 caracteres).",
      ),
    experienceYears: z.number().min(0, "Experiência inválida."),
    phone: z.string().min(10, "Telefone inválido."),

    // Localização detalhada
    location: z.string().min(3, "Informe sua cidade ou região base."),
    detailedAddress: z.string().min(5, "Informe seu endereço completo."),

    // Novos campos
    educationLevel: z.string().min(1, "Selecione sua escolaridade."),
    howDidYouHear: z.string().min(1, "Informe como nos conheceu."),
    referralName: z.string().optional(),
    localContacts: z
      .string()
      .min(3, "Informe o nome de pelo menos um contato na região."),

    // --- MUDANÇA: Agora são dois campos distintos para o documento ---
    documentUrlFront: z
      .string()
      .min(1, "É necessário enviar a FRENTE do documento."),
    documentUrlBack: z
      .string()
      .min(1, "É necessário enviar o VERSO do documento."),

    portfolioUrl: z.string().optional(),
  })
  .refine(
    (data) => {
      if (
        data.howDidYouHear === "Indicacao" &&
        (!data.referralName || data.referralName.trim() === "")
      ) {
        return false;
      }
      return true;
    },
    {
      message: "Por favor, informe o nome de quem te indicou.",
      path: ["referralName"],
    },
  );

type ProviderFormValues = z.infer<typeof localProviderSchema>;

interface ProviderFormProps {
  categories: { id: string; name: string }[];
}

export function ProviderForm({ categories }: ProviderFormProps) {
  const router = useRouter();
  const [isSuccess, setIsSuccess] = useState(false);
  const [isUploadingFront, setIsUploadingFront] = useState(false);
  const [isUploadingBack, setIsUploadingBack] = useState(false);

  const form = useForm<ProviderFormValues>({
    resolver: zodResolver(localProviderSchema),
    defaultValues: {
      categoryId: "",
      bio: "",
      experienceYears: 0,
      phone: "",
      location: "",
      detailedAddress: "",
      portfolioUrl: "",
      educationLevel: "",
      howDidYouHear: "",
      referralName: "",
      localContacts: "",
      documentUrlFront: "",
      documentUrlBack: "",
    },
    mode: "onChange",
  });

  const watchHowDidYouHear = form.watch("howDidYouHear");
  const watchDocumentUrlFront = form.watch("documentUrlFront");
  const watchDocumentUrlBack = form.watch("documentUrlBack");

  const onSubmit = async (data: ProviderFormValues) => {
    try {
      // Como alteramos no schema para Front e Back,
      // precisamos adaptar o payload final se sua action esperar algo diferente.
      // Vou assumir que você atualizará a action para receber documentUrlFront e documentUrlBack,
      // ou concatená-los em um array. Aqui estou passando como estão no schema.
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
            onClick={() => router.push("/minha-conta")}
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
          Preencha o formulário detalhado abaixo para se tornar um parceiro
          oficial do ESG Group.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* --- SEÇÃO 1: DADOS PROFISSIONAIS --- */}
            <div className="space-y-6">
              <h3 className="font-montserrat border-b border-neutral-100 pb-2 text-lg font-semibold text-neutral-800">
                Dados Profissionais
              </h3>

              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-neutral-900">
                        Qual serviço principal você presta?
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

                <FormField
                  control={form.control}
                  name="experienceYears"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-neutral-900">
                        Anos de Experiência na área
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
              </div>

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-neutral-900">
                      Sobre Você e Seu Trabalho
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva suas habilidades, ferramentas que possui e diferenciais..."
                        className="min-h-[120px] resize-none border-neutral-200 bg-white text-neutral-900 focus:border-orange-500 focus:ring-orange-500"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="portfolioUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-neutral-900">
                      Link do Portfólio ou Redes Sociais (Opcional)
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Instagram profissional, Site ou LinkedIn"
                        className="border-neutral-200 bg-white text-neutral-900 focus:border-orange-500 focus:ring-orange-500"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* --- SEÇÃO 2: DADOS PESSOAIS E CONTATO --- */}
            <div className="space-y-6">
              <h3 className="font-montserrat border-b border-neutral-100 pb-2 text-lg font-semibold text-neutral-800">
                Dados Pessoais e Contato
              </h3>

              <div className="grid gap-6 md:grid-cols-2">
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

                <FormField
                  control={form.control}
                  name="educationLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-neutral-900">
                        Nível de Escolaridade
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="border-neutral-200 bg-white text-neutral-900 focus:border-orange-500 focus:ring-orange-500">
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="border-neutral-200 bg-white text-neutral-900">
                          <SelectItem value="Fundamental Incompleto">
                            Fundamental Incompleto
                          </SelectItem>
                          <SelectItem value="Fundamental Completo">
                            Fundamental Completo
                          </SelectItem>
                          <SelectItem value="Médio Incompleto">
                            Médio Incompleto
                          </SelectItem>
                          <SelectItem value="Médio Completo">
                            Médio Completo
                          </SelectItem>
                          <SelectItem value="Superior Incompleto">
                            Superior Incompleto
                          </SelectItem>
                          <SelectItem value="Superior Completo">
                            Superior Completo
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-neutral-900">
                        Região de Atuação
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

                <FormField
                  control={form.control}
                  name="detailedAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-neutral-900">
                        Endereço Residencial Completo
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Rua, Número, Bairro, CEP"
                          className="border-neutral-200 bg-white text-neutral-900 focus:border-orange-500 focus:ring-orange-500"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-[10px]">
                        Apenas para fins de cadastro de segurança.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="localContacts"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-neutral-900">
                      Parentes ou Conhecidos Próximos na Região
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Nome e parentesco/relação de contatos que moram na área..."
                        className="min-h-[80px] resize-none border-neutral-200 bg-white text-neutral-900 focus:border-orange-500 focus:ring-orange-500"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* --- SEÇÃO 3: DOCUMENTAÇÃO E OUTROS --- */}
            <div className="space-y-6">
              <h3 className="font-montserrat border-b border-neutral-100 pb-2 text-lg font-semibold text-neutral-800">
                Documentação e Pesquisa
              </h3>

              <div className="space-y-2">
                <FormLabel className="text-neutral-900">
                  Envie um documento válido com foto (RG, CNH, Passaporte, etc)
                </FormLabel>
                <FormDescription className="text-xs text-neutral-500">
                  É obrigatório o envio de fotos legíveis da FRENTE e do VERSO
                  do documento. Seus dados estão protegidos.
                </FormDescription>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Upload de Documento: FRENTE */}
                <FormField
                  control={form.control}
                  name="documentUrlFront"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-neutral-700">
                        1. Frente do Documento
                      </FormLabel>
                      <FormControl>
                        <div className="mt-2">
                          {watchDocumentUrlFront ? (
                            <div className="relative h-40 w-full overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50 shadow-sm">
                              <Image
                                src={watchDocumentUrlFront}
                                alt="Frente do Documento"
                                fill
                                className="object-cover"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  form.setValue("documentUrlFront", "")
                                }
                                className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-600/90 text-white transition-all hover:bg-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex w-full flex-col items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-6 transition-all hover:bg-neutral-100">
                              <FileImage className="mb-2 h-8 w-8 text-neutral-400" />
                              <UploadButton
                                endpoint="imageUploader"
                                onUploadBegin={() => setIsUploadingFront(true)}
                                onClientUploadComplete={(res) => {
                                  setIsUploadingFront(false);
                                  if (res && res[0]) {
                                    field.onChange(res[0].url);
                                    toast.success(
                                      "Frente do documento enviada!",
                                    );
                                  }
                                }}
                                onUploadError={(error: Error) => {
                                  setIsUploadingFront(false);
                                  toast.error(`Erro: ${error.message}`);
                                }}
                                appearance={{
                                  button:
                                    "bg-orange-600 text-white text-sm hover:bg-orange-700 h-9 px-4",
                                  allowedContent:
                                    "text-xs text-neutral-500 mt-1",
                                }}
                                content={{
                                  button({ ready }) {
                                    if (ready) return "Upload Frente";
                                    return "Carregando...";
                                  },
                                  allowedContent() {
                                    return "JPG, PNG (Max 4MB)";
                                  },
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Upload de Documento: VERSO */}
                <FormField
                  control={form.control}
                  name="documentUrlBack"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-neutral-700">
                        2. Verso do Documento
                      </FormLabel>
                      <FormControl>
                        <div className="mt-2">
                          {watchDocumentUrlBack ? (
                            <div className="relative h-40 w-full overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50 shadow-sm">
                              <Image
                                src={watchDocumentUrlBack}
                                alt="Verso do Documento"
                                fill
                                className="object-cover"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  form.setValue("documentUrlBack", "")
                                }
                                className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-600/90 text-white transition-all hover:bg-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex w-full flex-col items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-6 transition-all hover:bg-neutral-100">
                              <FileImage className="mb-2 h-8 w-8 text-neutral-400" />
                              <UploadButton
                                endpoint="imageUploader"
                                onUploadBegin={() => setIsUploadingBack(true)}
                                onClientUploadComplete={(res) => {
                                  setIsUploadingBack(false);
                                  if (res && res[0]) {
                                    field.onChange(res[0].url);
                                    toast.success(
                                      "Verso do documento enviado!",
                                    );
                                  }
                                }}
                                onUploadError={(error: Error) => {
                                  setIsUploadingBack(false);
                                  toast.error(`Erro: ${error.message}`);
                                }}
                                appearance={{
                                  button:
                                    "bg-orange-600 text-white text-sm hover:bg-orange-700 h-9 px-4",
                                  allowedContent:
                                    "text-xs text-neutral-500 mt-1",
                                }}
                                content={{
                                  button({ ready }) {
                                    if (ready) return "Upload Verso";
                                    return "Carregando...";
                                  },
                                  allowedContent() {
                                    return "JPG, PNG (Max 4MB)";
                                  },
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-6 pt-4 md:grid-cols-2">
                {/* Como conheceu */}
                <FormField
                  control={form.control}
                  name="howDidYouHear"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-neutral-900">
                        Como ficou sabendo da ESG?
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="border-neutral-200 bg-white text-neutral-900 focus:border-orange-500 focus:ring-orange-500">
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="border-neutral-200 bg-white text-neutral-900">
                          <SelectItem value="Instagram">Instagram</SelectItem>
                          <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                          <SelectItem value="Boca a boca">
                            Boca a boca (Amigos/Conhecidos)
                          </SelectItem>
                          <SelectItem value="Email">Email</SelectItem>
                          <SelectItem value="Indicacao">
                            Fui Indicado(a) por alguém
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Nome de quem indicou (Condicional) */}
                {watchHowDidYouHear === "Indicacao" && (
                  <FormField
                    control={form.control}
                    name="referralName"
                    render={({ field }) => (
                      <FormItem className="animate-in fade-in slide-in-from-top-2">
                        <FormLabel className="text-neutral-900">
                          Quem te indicou?
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Nome da pessoa"
                            className="border-neutral-200 bg-white text-neutral-900 focus:border-orange-500 focus:ring-orange-500"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </div>

            <Button
              type="submit"
              className="h-12 w-full bg-orange-600 font-bold text-white shadow-md transition-all hover:bg-orange-700 disabled:bg-neutral-300 disabled:text-neutral-500"
              disabled={
                form.formState.isSubmitting ||
                isUploadingFront ||
                isUploadingBack
              }
            >
              {isUploadingFront || isUploadingBack
                ? "Aguarde o upload..."
                : form.formState.isSubmitting
                  ? "Enviando Candidatura..."
                  : "Enviar Candidatura Completa"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
