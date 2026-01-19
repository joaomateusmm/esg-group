"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronsUpDown,
  Package,
  Ruler,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

// Importe suas actions.
import {
  createProduct,
  ProductServerPayload,
  updateProduct,
} from "@/actions/create-product";
// Importe suas funções de fetch
import { getCategories } from "@/app/admin/produtos/new/get-categories";
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

const formSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  description: z.string().optional(),
  price: z.number().min(0.01, "O preço deve ser maior que R$ 0,00"),
  discountPrice: z.number().optional(),
  categories: z.array(z.string()),
  status: z.enum(["active", "inactive", "draft"]),
  stock: z.number().min(0),
  isStockUnlimited: z.boolean(),
  // Campos Físicos
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

// Interface compatível com o retorno do banco (sem campos legados)
export interface ProductData {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  discountPrice?: number | null;
  images?: string[] | null;
  categories?: string[] | null;
  status: string;
  stock?: number | null;
  isStockUnlimited?: boolean | null;
  // Campos Físicos
  sku?: string | null;
  weight?: number | null;
  width?: number | null;
  height?: number | null;
  length?: number | null;
  // Campos Opcionais (Legacy) para evitar erro se o banco retornar algo
  deliveryMode?: unknown;
  paymentMethods?: unknown;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

interface ProductFormProps {
  initialData?: ProductData | null;
}

export function ProductForm({ initialData }: ProductFormProps) {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);

  const [uploadedImages, setUploadedImages] = useState<string[]>(
    initialData?.images || [],
  );

  const [categoriesList, setCategoriesList] = useState<OptionData[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const pageTitle = initialData ? "Editar Produto" : "Adicionar Novo Produto";
  const buttonText = initialData ? "Salvar Alterações" : "Criar Produto";

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

  const defaultValues: ProductFormValues = initialData
    ? {
        name: initialData.name,
        description: initialData.description || undefined,
        status:
          (initialData.status as "active" | "inactive" | "draft") || "active",
        stock: initialData.stock || 0,
        isStockUnlimited: initialData.isStockUnlimited || false,
        // Conversão de centavos para reais no formulário
        price: initialData.price ? initialData.price / 100 : 0,
        discountPrice: initialData.discountPrice
          ? initialData.discountPrice / 100
          : undefined,
        categories: initialData.categories || [],

        // Físicos
        sku: initialData.sku || "",
        weight: initialData.weight || 0,
        width: initialData.width || 0,
        height: initialData.height || 0,
        length: initialData.length || 0,
      }
    : {
        name: "",
        description: undefined,
        status: "active",
        stock: 0,
        isStockUnlimited: false,
        price: 0,
        discountPrice: undefined,
        categories: [],
        sku: "",
        weight: 0,
        width: 0,
        height: 0,
        length: 0,
      };

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
    mode: "onChange",
  });

  const watchPrice = form.watch("price");
  const watchDiscountPrice = form.watch("discountPrice");
  const watchIsStockUnlimited = form.watch("isStockUnlimited");

  const handlePriceChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    onChange: (value: number) => void,
  ) => {
    const rawValue = e.target.value.replace(/\D/g, "");
    const numericValue = Number(rawValue) / 100;
    onChange(numericValue);
  };

  async function onSubmit(data: ProductFormValues) {
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
      const formattedData: ProductServerPayload = {
        name: data.name,
        description: data.description,
        price: Math.round(data.price * 100),
        discountPrice:
          data.discountPrice && data.discountPrice > 0
            ? Math.round(data.discountPrice * 100)
            : undefined,
        images: uploadedImages,
        categories: data.categories,
        status: data.status,
        stock: data.stock,
        isStockUnlimited: data.isStockUnlimited,

        // Físicos
        sku: data.sku,
        weight: data.weight,
        width: data.width,
        height: data.height,
        length: data.length,
      };

      if (initialData) {
        const res = await updateProduct(initialData.id, formattedData);
        if (res.success) {
          toast.success("Produto atualizado com sucesso!");
          router.push("/admin/produtos");
          router.refresh();
        } else {
          const errorMsg =
            typeof res.message === "string"
              ? res.message
              : "Erro ao atualizar.";
          toast.error(errorMsg);
          console.error("Erro update:", res);
        }
      } else {
        await createProduct(formattedData);
        toast.success("Produto criado com sucesso!");
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes("NEXT_REDIRECT"))
        return;
      console.error(error);
      toast.error("Erro ao salvar produto.");
    }
  }

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
            className="h-8 w-8 border-white/10 bg-transparent text-white hover:bg-white/10"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="font-clash-display text-2xl font-medium text-white">
          {pageTitle}
        </h1>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid gap-8 md:grid-cols-3"
        >
          <div className="space-y-8 md:col-span-2">
            {/* Detalhes Gerais */}
            <Card className="border-white/10 bg-[#0A0A0A]">
              <CardHeader>
                <CardTitle className="text-white">
                  Detalhes do Produto
                </CardTitle>
                <CardDescription>
                  Informações básicas de exibição.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">
                        Nome do Produto
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Cadeira Gamer"
                          className="border-white/10 bg-white/5 text-white"
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
                      <FormLabel className="text-white">Descrição</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descreva as características do produto..."
                          className="min-h-[150px] resize-none border-white/10 bg-white/5 text-white"
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

            {/* Informações Logísticas */}
            <Card className="border-white/10 bg-[#0A0A0A]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Package className="h-5 w-5" /> Informações Logísticas
                </CardTitle>
                <CardDescription>
                  Necessário para o cálculo de frete.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">SKU (Código)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: PROD-001"
                          className="border-white/10 bg-white/5 text-white"
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
                        <FormLabel className="text-white">Peso (kg)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.001"
                            placeholder="0.000"
                            className="border-white/10 bg-white/5 text-white"
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
                        <FormLabel className="flex items-center gap-1 text-white">
                          <Ruler className="h-3 w-3" /> Largura (cm)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            className="border-white/10 bg-white/5 text-white"
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
                        <FormLabel className="flex items-center gap-1 text-white">
                          <Ruler className="h-3 w-3 rotate-90" /> Altura (cm)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            className="border-white/10 bg-white/5 text-white"
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
                        <FormLabel className="flex items-center gap-1 text-white">
                          <Ruler className="h-3 w-3" /> Comp. (cm)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            className="border-white/10 bg-white/5 text-white"
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

            {/* Galeria de Imagens */}
            <Card className="border-white/10 bg-[#0A0A0A]">
              <CardHeader>
                <CardTitle className="text-white">Galeria de Imagens</CardTitle>
                <CardDescription>
                  Adicione as imagens do seu produto. Máximo 4MB.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex w-full flex-col items-center justify-center rounded-lg border border-dashed border-white/20 bg-white/5 p-6">
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
                        "bg-[#D00000] text-white hover:bg-[#a00000] transition-all ut-uploading:cursor-not-allowed w-full max-w-[200px]",
                      container: "w-full flex flex-col items-center gap-2",
                      allowedContent: "text-neutral-400 text-sm",
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
                        className="group relative aspect-square overflow-hidden rounded-md border border-white/10"
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
            <Card className="border-white/10 bg-[#0A0A0A]">
              <CardHeader>
                <CardTitle className="text-white">Organização</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="border-white/10 bg-white/5 text-white">
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="border-white/10 bg-[#111] text-white">
                          <SelectItem value="active">Ativo</SelectItem>
                          <SelectItem value="draft">Rascunho</SelectItem>
                          <SelectItem value="inactive">Inativo</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="categories"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-white">Categorias</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              disabled={isLoadingData}
                              className={cn(
                                "justify-between border-white/10 bg-white/5 text-left font-normal text-white hover:bg-white/10 hover:text-white",
                                !field.value || field.value.length === 0
                                  ? "text-neutral-400"
                                  : "text-white",
                              )}
                            >
                              {field.value && field.value.length > 0
                                ? `${field.value.length} selecionada(s)`
                                : "Selecione categorias..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] border-white/10 bg-[#111] p-0 text-white">
                          <Command className="bg-[#111] text-white">
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
                                    className="cursor-pointer hover:bg-white/10 aria-selected:bg-white/10"
                                  >
                                    <div
                                      className={cn(
                                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-white/30",
                                        field.value?.includes(category.id)
                                          ? "border-[#D00000] bg-[#D00000]"
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
            <Card className="border-white/10 bg-[#0A0A0A]">
              <CardHeader>
                <CardTitle className="text-white">Estoque</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="isStockUnlimited"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-y-0 space-x-3 rounded-md border border-white/10 p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="border-white/50 data-[state=checked]:border-[#D00000] data-[state=checked]:bg-[#D00000]"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-white">
                          Estoque Ilimitado
                        </FormLabel>
                        <FormDescription className="text-xs text-neutral-400">
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
                        <FormLabel className="text-white">Quantidade</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            className="border-white/10 bg-white/5 text-white [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
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
            <Card className="border-white/10 bg-[#0A0A0A]">
              <CardHeader>
                <CardTitle className="text-white">Preços</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Preço (R$)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="R$ 0,00"
                          className="border-white/10 bg-white/5 font-mono text-lg text-white"
                          value={formatCurrency(field.value)}
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
                      <FormLabel className="text-white">
                        Preço Promocional
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="R$ 0,00"
                          className="border-white/10 bg-white/5 font-mono text-white"
                          value={formatCurrency(field.value || 0)}
                          onChange={(e) => handlePriceChange(e, field.onChange)}
                        />
                      </FormControl>
                      {watchDiscountPrice !== undefined &&
                      watchDiscountPrice > 0 &&
                      watchDiscountPrice >= watchPrice ? (
                        <div className="mt-1 flex items-center gap-2 text-xs text-red-400">
                          <AlertCircle className="h-3 w-3" />
                          <span>
                            Preço promocional deve ser menor que o original.
                          </span>
                        </div>
                      ) : (
                        <FormDescription className="text-xs">
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
              className="h-12 w-full bg-[#D00000] font-medium text-white hover:bg-[#a00000]"
              disabled={form.formState.isSubmitting || isUploading}
            >
              {form.formState.isSubmitting
                ? "Salvando..."
                : isUploading
                  ? "Enviando imagens..."
                  : buttonText}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
