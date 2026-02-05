"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronsUpDown,
  Package,
  Ruler,
  Truck,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

// Nota: Certifique-se que o caminho dessa importação está correto no seu projeto
import { updateProduct } from "@/actions/create-product";
import { getAllCategories } from "@/actions/get-all-categories";
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

// --- 1. SCHEMA ---
const formSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  description: z.string().optional(),

  price: z.number().min(0, "O preço não pode ser negativo"),
  discountPrice: z.number().optional(),

  currency: z.enum(["GBP", "USD", "EUR", "BRL"]),

  categories: z.array(z.string()),

  status: z.enum(["active", "inactive", "draft"]),

  // --- CAMPOS DE ESTOQUE ---
  stock: z.number().min(0, "O estoque não pode ser negativo"),
  isStockUnlimited: z.boolean(),

  // --- CAMPOS DE FRETE ---
  shippingType: z.enum(["calculated", "fixed", "free"]),
  fixedShippingPrice: z.number().min(0).optional(),

  // --- CAMPOS DE LOGÍSTICA ---
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

// Interface para os dados iniciais do produto
interface ProductData {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  discountPrice?: number | null;
  currency: string;
  categories: string[] | null;
  status: string;
  stock: number | null;
  isStockUnlimited: boolean;
  shippingType: string;
  fixedShippingPrice?: number | null;
  sku?: string | null;
  weight?: number | null;
  width?: number | null;
  height?: number | null;
  length?: number | null;
  images: string[] | null;
}

interface EditProductFormProps {
  initialData: ProductData;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  GBP: "£",
  USD: "$",
  EUR: "€",
  BRL: "R$",
};

const formatCurrency = (
  value: number,
  currencyCode: "GBP" | "USD" | "EUR" | "BRL" | string,
) => {
  const validCurrency = ["GBP", "USD", "EUR", "BRL"].includes(currencyCode)
    ? currencyCode
    : "GBP";

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: validCurrency,
  }).format(value);
};

export default function EditProductForm({ initialData }: EditProductFormProps) {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);

  const [uploadedImages, setUploadedImages] = useState<string[]>(
    initialData.images || [],
  );

  const [categoriesList, setCategoriesList] = useState<OptionData[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // --- CORREÇÃO 1: Mapeamento dos dados de categoria ---
  // --- DEBUG DE DADOS BRUTOS ---
  useEffect(() => {
    async function loadData() {
      try {
        const result = await getAllCategories();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const formattedCats: OptionData[] = (result as any[]).map((item) => {
          return {
            id: String(item.id || item._id || item.uuid || item.href),
            name: item.name || item.label,
          };
        });

        setCategoriesList(formattedCats);
      } catch (error) {
        console.error(error);
        toast.error("Erro ao carregar categorias.");
      } finally {
        setIsLoadingData(false);
      }
    }
    loadData();
  }, []);

  // --- CORREÇÃO NO FORMULÁRIO ---
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData.name,
      description: initialData.description || "",
      status:
        (initialData.status as "active" | "inactive" | "draft") || "draft",
      currency:
        (initialData.currency as "GBP" | "USD" | "EUR" | "BRL") || "GBP",
      price: initialData.price / 100,
      discountPrice: initialData.discountPrice
        ? initialData.discountPrice / 100
        : 0,
      stock: initialData.stock || 0,
      isStockUnlimited: initialData.isStockUnlimited,
      shippingType:
        (initialData.shippingType as "calculated" | "fixed" | "free") ||
        "calculated",
      fixedShippingPrice: initialData.fixedShippingPrice
        ? initialData.fixedShippingPrice / 100
        : 0,
      sku: initialData.sku || "",
      weight: initialData.weight || 0,
      width: initialData.width || 0,
      height: initialData.height || 0,
      length: initialData.length || 0,
      categories: initialData.categories
        ? initialData.categories.map((cat) => {
            const val =
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              typeof cat === "object" && cat !== null ? (cat as any).id : cat;
            return String(val);
          })
        : [],
    },
    mode: "onChange",
  });

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

    try {
      const formattedData = {
        // ID REMOVIDO DAQUI para ser passado como argumento separado
        // id: initialData.id,

        name: data.name,
        description: data.description,
        price: Math.round(data.price * 100),
        discountPrice:
          data.discountPrice && data.discountPrice > 0
            ? Math.round(data.discountPrice * 100)
            : null,
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
      };

      // --- CORREÇÃO 2: Passando 2 argumentos ---
      // A função updateProduct espera (id, dados) e não apenas (dados)
      // O type 'any' aqui é apenas para garantir que o payload passe se a tipagem da server action estiver ligeiramente diferente
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await updateProduct(initialData.id, formattedData as any);

      toast.success("Produto atualizado com sucesso!");
      router.push("/admin/produtos");
      router.refresh();
    } catch (error) {
      if (error instanceof Error && error.message.includes("NEXT_REDIRECT"))
        return;
      console.error(error);
      toast.error("Erro ao atualizar produto.");
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setUploadedImages(
      uploadedImages.filter((_, index) => index !== indexToRemove),
    );
  };

  return (
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
          Editar Produto: {initialData.name}
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
                  Edite as informações básicas.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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

            {/* Configuração de Frete */}
            <Card className="border-neutral-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-neutral-900">
                  <Truck className="h-5 w-5 text-orange-600" /> Configuração de
                  Frete
                </CardTitle>
                <CardDescription className="text-neutral-500">
                  Defina como o Frete será cobrado.
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
                                O cliente não pagará nada pelo envio.
                              </span>
                            </FormLabel>
                          </FormItem>

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
                                Valor único de entrega para qualquer região.
                              </span>
                            </FormLabel>
                          </FormItem>

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
                                Calculado automaticamente baseado nas dimensões.
                              </span>
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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

            {/* Informações Logísticas */}
            {watchShippingType === "calculated" && (
              <Card className="animate-in fade-in slide-in-from-top-4 border-neutral-200 bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-neutral-900">
                    <Package className="h-5 w-5 text-orange-600" /> Dimensões do
                    Pacote
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
                          SKU (Código)
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: CAD-2024-BLK"
                            className="border-neutral-200 bg-white text-neutral-900 placeholder:text-neutral-400 focus:border-orange-500 focus:ring-orange-500"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="text-xs text-neutral-500">
                          Código único para controle de estoque.
                        </FormDescription>
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
                            <Ruler className="h-3 w-3 text-neutral-500" /> Comp.
                            (cm)
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
                  Adicione ou remova imagens do produto.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
                {uploadedImages.length > 0 && (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    {uploadedImages.map((url, index) => (
                      <div
                        key={url}
                        className="group relative aspect-square overflow-hidden rounded-md border border-neutral-200 bg-neutral-50"
                      >
                        <Image
                          src={url}
                          alt={`Preview ${index}`}
                          fill
                          className="object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-600/90 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-700"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            {/* Organização */}
            <Card className="border-neutral-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-neutral-900">Organização</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-neutral-900">Status</FormLabel>
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
                                {categoriesList.map((category) => {
                                  // LÓGICA DE COMPARAÇÃO SEGURA
                                  // Verifica se algum valor no array field.value, convertido para string,
                                  // é igual ao id da categoria atual (também convertido para string).
                                  const isSelected = field.value?.some(
                                    (val: string | number) =>
                                      String(val) === String(category.id),
                                  );

                                  return (
                                    <CommandItem
                                      key={category.id}
                                      value={category.name}
                                      onSelect={() => {
                                        const current = field.value || [];

                                        // Reutilizamos a lógica segura para saber se já estava selecionado
                                        if (isSelected) {
                                          // REMOVER: Filtra removendo o ID que corresponde (em string)
                                          form.setValue(
                                            "categories",
                                            current.filter(
                                              (id) =>
                                                String(id) !==
                                                String(category.id),
                                            ),
                                          );
                                        } else {
                                          // ADICIONAR
                                          form.setValue("categories", [
                                            ...current,
                                            category.id,
                                          ]);
                                        }
                                      }}
                                      className="cursor-pointer text-neutral-900 hover:bg-neutral-100 aria-selected:bg-neutral-100 aria-selected:text-neutral-900"
                                    >
                                      <div
                                        className={cn(
                                          "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-neutral-300",
                                          isSelected // Usamos a variável booleana calculada acima
                                            ? "border-orange-600 bg-orange-600"
                                            : "opacity-50",
                                        )}
                                      >
                                        {isSelected && (
                                          <Check className="h-3 w-3 text-white" />
                                        )}
                                      </div>
                                      {category.name}
                                    </CommandItem>
                                  );
                                })}
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
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-neutral-900">Moeda</FormLabel>
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
                          onChange={(e) => handlePriceChange(e, field.onChange)}
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
                          onChange={(e) => handlePriceChange(e, field.onChange)}
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
                ? "Atualizando..."
                : isUploading
                  ? "Enviando imagens..."
                  : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
