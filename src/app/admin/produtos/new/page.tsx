"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronsUpDown,
  Loader2,
  Package,
  Ruler,
  Star,
  Trash,
  Truck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { UploadButton } from "@/lib/uploadthing";
import { cn } from "@/lib/utils";

import {
  createProduct,
  ProductServerPayload,
} from "../../../../actions/create-product";
import { getCategories } from "./get-categories";

// --- SCHEMA ATUALIZADO ---
const formSchema = z.object({
  // 1. CAMPO NOVO: ID PERSONALIZADO (OPCIONAL)
  customId: z
    .string()
    .max(50, "O código não pode ser muito longo")
    .optional()
    .or(z.literal("")), // Aceita string vazia

  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  description: z.string().optional(),

  price: z.number().min(0, "O preço não pode ser negativo"),
  discountPrice: z.number().optional(),

  currency: z.enum(["GBP", "USD", "EUR", "BRL"]),

  categories: z.array(z.string()),

  status: z.enum(["active", "inactive", "draft"]),

  stock: z.number().min(0, "O estoque não pode ser negativo"),
  isStockUnlimited: z.boolean(),

  shippingType: z.enum(["calculated", "fixed", "free"]),
  fixedShippingPrice: z.number().min(0).optional(),

  sku: z.string().optional(),
  weight: z.number().min(0, "Peso obrigatório"),
  width: z.number().int().min(0, "Largura obrigatória"),
  height: z.number().int().min(0, "Altura obrigatória"),
  length: z.number().int().min(0, "Comprimento obrigatório"),
});

type ProductFormValues = z.infer<typeof formSchema>;

interface OptionData {
  id: string;
  name: string;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  GBP: "£",
  USD: "$",
  EUR: "€",
  BRL: "R$",
};

const formatCurrency = (
  value: number,
  currencyCode: "GBP" | "USD" | "EUR" | "BRL",
) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: currencyCode,
  }).format(value);
};

export default function NewProductPage() {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  const [categoriesList, setCategoriesList] = useState<OptionData[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const cats = await getCategories();
        setCategoriesList(cats);
      } catch {
        toast.error("Erro ao carregar categorias.");
      } finally {
        setIsLoadingData(false);
      }
    }
    loadData();
  }, []);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customId: "", // Valor inicial vazio
      name: "",
      description: "",
      status: "active",
      currency: "GBP",

      stock: 0,
      isStockUnlimited: false,

      shippingType: "free",
      fixedShippingPrice: 0,

      sku: "",
      weight: 0,
      width: 0,
      height: 0,
      length: 0,

      price: 0,
      discountPrice: 0,
      categories: [],
    },
    mode: "onChange",
  });

  const handleSetMainImage = (indexToPromote: number) => {
    if (indexToPromote === 0) return; // Já é a capa

    const newImages = [...uploadedImages];
    const imageToMove = newImages[indexToPromote];

    // Remove a imagem da posição atual
    newImages.splice(indexToPromote, 1);
    // Adiciona no início do array
    newImages.unshift(imageToMove);

    setUploadedImages(newImages);
    toast.success("Imagem de capa atualizada!");
  };

  const watchPrice = form.watch("price");
  const watchDiscountPrice = form.watch("discountPrice");
  const watchIsStockUnlimited = form.watch("isStockUnlimited");
  const watchCurrency = form.watch("currency");
  const watchShippingType = form.watch("shippingType");

  const handlePriceChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    onChange: (value: number) => void,
  ) => {
    const rawValue = e.target.value.replace(/\D/g, "");
    const numericValue = Number(rawValue) / 100;
    onChange(numericValue);
  };

  const onSubmit: SubmitHandler<ProductFormValues> = async (data) => {
    if (uploadedImages.length === 0) {
      toast.error("Adicione pelo menos uma imagem do produto");
      return;
    }

    if (
      data.discountPrice !== undefined &&
      data.discountPrice > 0 &&
      data.discountPrice >= data.price
    ) {
      toast.error("O preço promocional deve ser menor que o preço original.");
      return;
    }

    // Função para mover a imagem selecionada para o índice 0

    try {
      const formattedData = {
        // 2. LÓGICA DO ID PERSONALIZADO
        // Se o usuário digitou algo, enviamos como 'id'. Se não, enviamos undefined (o banco gera).
        id:
          data.customId && data.customId.trim() !== ""
            ? data.customId
            : undefined,

        name: data.name,
        description: data.description,

        price: Math.round(data.price * 100),
        discountPrice:
          data.discountPrice && data.discountPrice > 0
            ? Math.round(data.discountPrice * 100)
            : undefined,

        currency: data.currency,

        categories: data.categories,
        status: data.status,

        stock: data.stock,
        isStockUnlimited: data.isStockUnlimited,

        shippingType: data.shippingType,
        fixedShippingPrice: data.fixedShippingPrice
          ? Math.round(data.fixedShippingPrice * 100)
          : 0,

        sku: data.sku,
        weight: data.weight,
        width: data.width,
        height: data.height,
        length: data.length,

        images: uploadedImages,
      } as ProductServerPayload;

      await createProduct(formattedData);

      toast.success("Produto criado com sucesso!");
      router.push("/admin/produtos");
    } catch (error) {
      // Tratamento para ID Duplicado
      if (
        error instanceof Error &&
        error.message.includes("Unique constraint")
      ) {
        toast.error("Erro: Já existe um produto com este ID/Código.");
        form.setError("customId", { message: "ID já está em uso" });
        return;
      }

      if (error instanceof Error && error.message.includes("NEXT_REDIRECT"))
        return;

      console.error(error);
      toast.error("Erro ao criar produto.");
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setUploadedImages(
      uploadedImages.filter((_, index) => index !== indexToRemove),
    );
  };

  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-orange-600" />
        </div>
      }
    >
      <div className="mx-auto max-w-5xl space-y-8 pb-20">
        <div className="flex items-center gap-4">
          <Link href="/admin/produtos">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-neutral-200 bg-white text-neutral-900 hover:bg-neutral-100"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="font-montserrat text-2xl font-bold text-neutral-900">
            Adicionar Novo Produto Físico
          </h1>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid gap-8 md:grid-cols-3"
          >
            <div className="space-y-8 md:col-span-2">
              {/* Detalhes Gerais */}
              <Card className="border-neutral-200 bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="text-neutral-900">
                    Detalhes do Produto
                  </CardTitle>
                  <CardDescription className="text-neutral-500">
                    Informações básicas de exibição.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* CAMPO DE ID PERSONALIZADO */}
                  <FormField
                    control={form.control}
                    name="customId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-neutral-900">
                          Código do Produto (ID Personalizado)
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: 001, PROD-A, CADEIRA-01..."
                            className="border-neutral-200 bg-white text-neutral-900 placeholder:text-neutral-400 focus:border-orange-500 focus:ring-orange-500"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="text-xs text-neutral-500">
                          Opcional. Se vazio, um ID aleatório será gerado. Deve
                          ser único.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-neutral-900">
                          Nome do Produto
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: Cadeira Gamer Ergonômica"
                            className="border-neutral-200 bg-white text-neutral-900 placeholder:text-neutral-400 focus:border-orange-500 focus:ring-orange-500"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* ... Resto dos campos (description, etc.) ... */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-neutral-900">
                          Descrição
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Descreva as características do produto..."
                            className="min-h-[150px] resize-none border-neutral-200 bg-white text-neutral-900 placeholder:text-neutral-400 focus:border-orange-500 focus:ring-orange-500"
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* ... Resto do formulário (Frete, Imagens, Organização, Preços) MANTIDO IGUAL ... */}
              {/* Vou incluir apenas os blocos principais para não estourar o limite de caracteres, 
                  mas o código abaixo contém todo o resto da estrutura original */}

              {/* --- CONFIGURAÇÃO DE FRETE --- */}
              <Card className="border-neutral-200 bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-neutral-900">
                    <Truck className="h-5 w-5 text-orange-600" /> Configuração
                    de Frete
                  </CardTitle>
                  <CardDescription className="text-neutral-500">
                    Defina como o frete será cobrado para este produto.
                    Independente da opção escolhida, o frete será grátis para
                    moradores de Londres.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="shippingType"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="text-neutral-900">
                          Tipo de Cobrança
                        </FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-1"
                          >
                            {/* OPÇÃO 1: FRETE GRÁTIS */}
                            <FormItem
                              className={cn(
                                "flex items-center space-y-0 rounded-md border p-4 transition-all hover:bg-neutral-50",
                                field.value === "free"
                                  ? "border-orange-600 bg-orange-50/10"
                                  : "border-neutral-200",
                              )}
                            >
                              <FormControl>
                                <RadioGroupItem
                                  value="free"
                                  className="border-neutral-400 text-orange-600"
                                />
                              </FormControl>
                              <FormLabel className="ml-3 w-full cursor-pointer font-normal">
                                <span className="block font-medium text-neutral-900">
                                  Frete Grátis
                                </span>
                                <span className="block text-xs text-neutral-500">
                                  O cliente não pagará nada pelo envio deste
                                  produto.
                                </span>
                              </FormLabel>
                            </FormItem>

                            {/* OPÇÃO 2: VALOR FIXO */}
                            <FormItem
                              className={cn(
                                "flex items-center space-y-0 rounded-md border p-4 transition-all hover:bg-neutral-50",
                                field.value === "fixed"
                                  ? "border-orange-600 bg-orange-50/10"
                                  : "border-neutral-200",
                              )}
                            >
                              <FormControl>
                                <RadioGroupItem
                                  value="fixed"
                                  className="border-neutral-400 text-orange-600"
                                />
                              </FormControl>
                              <FormLabel className="ml-3 w-full cursor-pointer font-normal">
                                <span className="block font-medium text-neutral-900">
                                  Valor Fixo
                                </span>
                                <span className="block text-xs text-neutral-500">
                                  Você define um valor único de entrega para
                                  qualquer região.
                                </span>
                              </FormLabel>
                            </FormItem>

                            {/* OPÇÃO 3: CALCULADO */}
                            <FormItem
                              className={cn(
                                "flex items-center space-y-0 rounded-md border p-4 transition-all hover:bg-neutral-50",
                                field.value === "calculated"
                                  ? "border-orange-600 bg-orange-50/10"
                                  : "border-neutral-200",
                              )}
                            >
                              <FormControl>
                                <RadioGroupItem
                                  value="calculated"
                                  className="border-neutral-400 text-orange-600"
                                />
                              </FormControl>
                              <FormLabel className="ml-3 w-full cursor-pointer font-normal">
                                <span className="block font-medium text-neutral-900">
                                  Calculado (Peso e Medidas)
                                </span>
                                <span className="block text-xs text-neutral-500">
                                  O valor será calculado automaticamente no
                                  checkout baseado nas dimensões.
                                </span>
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* CAMPO CONDICIONAL: VALOR DO FRETE FIXO */}
                  {watchShippingType === "fixed" && (
                    <FormField
                      control={form.control}
                      name="fixedShippingPrice"
                      render={({ field }) => (
                        <FormItem className="animate-in fade-in slide-in-from-top-2">
                          <FormLabel className="text-neutral-900">
                            Valor do Frete ({CURRENCY_SYMBOLS[watchCurrency]})
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder={`${CURRENCY_SYMBOLS[watchCurrency]} 0,00`}
                              className="border-neutral-200 bg-white font-mono text-lg text-neutral-900 placeholder:text-neutral-400 focus:border-orange-500 focus:ring-orange-500"
                              value={formatCurrency(
                                field.value || 0,
                                watchCurrency,
                              )}
                              onChange={(e) =>
                                handlePriceChange(e, field.onChange)
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </CardContent>
              </Card>

              {/* --- INFORMAÇÕES LOGÍSTICAS --- */}
              {watchShippingType === "calculated" && (
                <Card className="animate-in fade-in slide-in-from-top-4 border-neutral-200 bg-white shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-neutral-900">
                      <Package className="h-5 w-5 text-orange-600" /> Dimensões
                      do Pacote
                    </CardTitle>
                    <CardDescription className="text-neutral-500">
                      Obrigatório para cálculo automático de frete.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="sku"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-neutral-900">
                            SKU (Código Interno/Opcional)
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ex: CAD-2024-BLK"
                              className="border-neutral-200 bg-white text-neutral-900 placeholder:text-neutral-400 focus:border-orange-500 focus:ring-orange-500"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="weight"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-neutral-900">
                              Peso (kg)
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.001"
                                placeholder="0.500"
                                className="border-neutral-200 bg-white text-neutral-900 placeholder:text-neutral-400 focus:border-orange-500 focus:ring-orange-500"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseFloat(e.target.value))
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="width"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-1 text-neutral-900">
                              <Ruler className="h-3 w-3 text-neutral-500" />{" "}
                              Largura (cm)
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                className="border-neutral-200 bg-white text-neutral-900 placeholder:text-neutral-400 focus:border-orange-500 focus:ring-orange-500"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseInt(e.target.value))
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="height"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-1 text-neutral-900">
                              <Ruler className="h-3 w-3 rotate-90 text-neutral-500" />{" "}
                              Altura (cm)
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                className="border-neutral-200 bg-white text-neutral-900 placeholder:text-neutral-400 focus:border-orange-500 focus:ring-orange-500"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseInt(e.target.value))
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="length"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-1 text-neutral-900">
                              <Ruler className="h-3 w-3 text-neutral-500" />{" "}
                              Comp. (cm)
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                className="border-neutral-200 bg-white text-neutral-900 placeholder:text-neutral-400 focus:border-orange-500 focus:ring-orange-500"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseInt(e.target.value))
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Galeria de Imagens */}
              <Card className="border-neutral-200 bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="text-neutral-900">
                    Galeria de Imagens
                  </CardTitle>
                  <CardDescription className="text-neutral-500">
                    A primeira imagem será usada como capa do produto.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Área de Upload */}
                  <div className="flex w-full flex-col items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-6">
                    <UploadButton
                      endpoint="imageUploader"
                      onUploadBegin={() => setIsUploading(true)}
                      onClientUploadComplete={(res) => {
                        setIsUploading(false);
                        if (res) {
                          const newUrls = res.map((file) => file.url);
                          setUploadedImages((prev) => [...prev, ...newUrls]);
                          toast.success("Imagem enviada com sucesso!");
                        }
                      }}
                      onUploadError={(error: Error) => {
                        setIsUploading(false);
                        toast.error(`Erro: ${error.message}`);
                      }}
                      appearance={{
                        button:
                          "bg-orange-600 text-white hover:bg-orange-700 transition-all ut-uploading:cursor-not-allowed w-full max-w-[200px]",
                        container: "w-full flex flex-col items-center gap-2",
                        allowedContent: "text-neutral-500 text-sm",
                      }}
                      content={{
                        button({ ready }) {
                          if (ready)
                            return (
                              <div className="flex items-center gap-2">
                                Escolher Arquivos
                              </div>
                            );
                          return "Carregando...";
                        },
                        allowedContent({ isUploading }) {
                          if (isUploading) return "Enviando...";
                          return "Imagens até 4MB (JPG, PNG)";
                        },
                      }}
                    />
                  </div>

                  {/* Lista de Imagens */}
                  {uploadedImages.length > 0 && (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                      {uploadedImages.map((url, index) => {
                        const isCover = index === 0;

                        return (
                          <div
                            key={url}
                            className={cn(
                              "group relative aspect-square overflow-hidden rounded-md border bg-neutral-50 transition-all",
                              isCover
                                ? "ring-2 ring-orange-500"
                                : "border-neutral-200 hover:border-orange-300",
                            )}
                          >
                            <Image
                              src={url}
                              alt={`Imagem do produto ${index + 1}`}
                              fill
                              className="object-cover"
                            />

                            {/* Badge de CAPA (Visível apenas na primeira imagem) */}
                            {isCover && (
                              <div className="absolute top-2 left-2 z-10 flex items-center gap-1 rounded bg-orange-600 px-2 py-1 text-xs font-semibold text-white shadow-sm">
                                <Star className="h-3 w-3" />
                                Capa
                              </div>
                            )}

                            {/* Botão para DEFINIR COMO CAPA (Visível no hover das outras imagens) */}
                            {!isCover && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                                <button
                                  type="button"
                                  onClick={() => handleSetMainImage(index)}
                                  className="flex cursor-pointer items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-neutral-900 shadow-md duration-300 hover:bg-orange-500"
                                >
                                  <Star className="h-4 w-4" />
                                  Definir Capa
                                </button>
                              </div>
                            )}

                            {/* Botão de Remover */}
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(index)}
                              className="absolute top-2 right-2 z-20 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-red-500 text-white opacity-0 shadow-sm duration-300 group-hover:opacity-100 hover:bg-red-700"
                              title="Remover imagem"
                            >
                              <Trash className="h-3 w-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-8">
              {/* Organização */}
              <Card className="border-neutral-200 bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="text-neutral-900">
                    Organização
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-neutral-900">
                          Status
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
                            <SelectItem value="active">Ativo</SelectItem>
                            <SelectItem value="draft">Rascunho</SelectItem>
                            <SelectItem value="inactive">Inativo</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Categorias */}
                  <FormField
                    control={form.control}
                    name="categories"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="text-neutral-900">
                          Categorias
                        </FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                disabled={isLoadingData}
                                className={cn(
                                  "justify-between border-neutral-200 bg-white text-left font-normal text-neutral-900 hover:bg-neutral-50 hover:text-neutral-900 focus:border-orange-500 focus:ring-orange-500",
                                  !field.value || field.value.length === 0
                                    ? "text-neutral-500"
                                    : "text-neutral-900",
                                )}
                              >
                                {field.value && field.value.length > 0
                                  ? `${field.value.length} selecionada(s)`
                                  : "Selecione categorias..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[300px] border-neutral-200 bg-white p-0 text-neutral-900">
                            <Command className="bg-white text-neutral-900">
                              <CommandInput
                                placeholder="Buscar..."
                                className="border-none focus:ring-0"
                              />
                              <CommandList>
                                <CommandEmpty>Nada encontrado.</CommandEmpty>
                                <CommandGroup>
                                  {categoriesList.map((category) => (
                                    <CommandItem
                                      key={category.id}
                                      value={category.name}
                                      onSelect={() => {
                                        const current = field.value || [];
                                        const isSelected = current.includes(
                                          category.id,
                                        );
                                        form.setValue(
                                          "categories",
                                          isSelected
                                            ? current.filter(
                                                (id) => id !== category.id,
                                              )
                                            : [...current, category.id],
                                        );
                                      }}
                                      className="cursor-pointer text-neutral-900 hover:bg-neutral-100 aria-selected:bg-neutral-100 aria-selected:text-neutral-900"
                                    >
                                      <div
                                        className={cn(
                                          "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-neutral-300",
                                          field.value?.includes(category.id)
                                            ? "border-orange-600 bg-orange-600"
                                            : "opacity-50",
                                        )}
                                      >
                                        {field.value?.includes(category.id) && (
                                          <Check className="h-3 w-3 text-white" />
                                        )}
                                      </div>
                                      {category.name}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* ESTOQUE */}
              <Card className="border-neutral-200 bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="text-neutral-900">Estoque</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="isStockUnlimited"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-y-0 space-x-3 rounded-md border border-neutral-200 p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="border-neutral-400 text-white data-[state=checked]:border-orange-600 data-[state=checked]:bg-orange-600"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-neutral-900">
                            Estoque Ilimitado
                          </FormLabel>
                          <FormDescription className="text-xs text-neutral-500">
                            O produto é &quot;infinito&quot;.
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  {!watchIsStockUnlimited && (
                    <FormField
                      control={form.control}
                      name="stock"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-neutral-900">
                            Quantidade
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="0"
                              className="border-neutral-200 bg-white text-neutral-900 placeholder:text-neutral-400 focus:border-orange-500 focus:ring-orange-500 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                              {...field}
                              value={field.value === 0 ? "" : field.value}
                              onKeyDown={(e) => {
                                if (
                                  ["e", "E", "+", "-", ",", "."].includes(e.key)
                                ) {
                                  e.preventDefault();
                                }
                              }}
                              onChange={(e) => {
                                const rawValue = e.target.value.replace(
                                  /\D/g,
                                  "",
                                );
                                field.onChange(
                                  rawValue === "" ? 0 : Number(rawValue),
                                );
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </CardContent>
              </Card>

              {/* Preços */}
              <Card className="border-neutral-200 bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="text-neutral-900">Preços</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 3. CAMPO SELEÇÃO DE MOEDA (UI) */}
                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-neutral-900">
                          Moeda
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="border-neutral-200 bg-white text-neutral-900 focus:border-orange-500 focus:ring-orange-500">
                              <SelectValue placeholder="Selecione a moeda" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="border-neutral-200 bg-white text-neutral-900">
                            <SelectItem value="GBP">
                              Libra Esterlina (£)
                            </SelectItem>
                            <SelectItem value="USD">
                              Dólar Americano ($)
                            </SelectItem>
                            <SelectItem value="EUR">Euro (€)</SelectItem>
                            <SelectItem value="BRL">
                              Real Brasileiro (R$)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-neutral-900">
                          Preço ({CURRENCY_SYMBOLS[watchCurrency]})
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={`${CURRENCY_SYMBOLS[watchCurrency]} 0,00`}
                            className="border-neutral-200 bg-white font-mono text-lg text-neutral-900 placeholder:text-neutral-400 focus:border-orange-500 focus:ring-orange-500"
                            value={formatCurrency(field.value, watchCurrency)}
                            onChange={(e) =>
                              handlePriceChange(e, field.onChange)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="discountPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-neutral-900">
                          Preço Promocional
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={`${CURRENCY_SYMBOLS[watchCurrency]} 0,00`}
                            className="border-neutral-200 bg-white font-mono text-neutral-900 placeholder:text-neutral-400 focus:border-orange-500 focus:ring-orange-500"
                            value={formatCurrency(
                              field.value || 0,
                              watchCurrency,
                            )}
                            onChange={(e) =>
                              handlePriceChange(e, field.onChange)
                            }
                          />
                        </FormControl>
                        {watchDiscountPrice !== undefined &&
                        watchDiscountPrice > 0 &&
                        (watchDiscountPrice as number) >=
                          (watchPrice as number) ? (
                          <div className="mt-1 flex items-center gap-2 text-xs text-red-500">
                            <AlertCircle className="h-3 w-3" />
                            <span>
                              Preço promocional deve ser menor que o original.
                            </span>
                          </div>
                        ) : (
                          <FormDescription className="text-xs text-neutral-500">
                            Opcional.
                          </FormDescription>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Button
                type="submit"
                className="h-12 w-full cursor-pointer bg-orange-600 font-medium text-white shadow-md duration-300 hover:bg-orange-700"
                disabled={form.formState.isSubmitting || isUploading}
              >
                {form.formState.isSubmitting
                  ? "Salvando..."
                  : isUploading
                    ? "Enviando imagens..."
                    : "Criar Produto Físico"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </Suspense>
  );
}
