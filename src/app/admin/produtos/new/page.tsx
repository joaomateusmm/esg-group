"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronsUpDown,
  Link as LinkIcon,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { UploadButton } from "@/lib/uploadthing";
import { cn } from "@/lib/utils";

import {
  createProduct,
  ProductServerPayload,
} from "../../../../actions/create-product";
import { getCategories } from "./get-categories";
import { getGames } from "./get-games";
import { getStreamings } from "./get-streamings";

// --- CONSTANTES ---
const PAYMENT_METHODS_OPTIONS = [
  { id: "pix", label: "Pix" },
  { id: "credit_card", label: "Cartão de Crédito" },
  { id: "debit_card", label: "Cartão de Débito" },
  { id: "boleto", label: "Boleto" },
];

// --- SCHEMA ---
const formSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  description: z.string().optional(),

  paymentLink: z
    .union([z.literal(""), z.string().url("URL inválida. Inclua https://")])
    .optional(),
  downloadUrl: z
    .union([z.literal(""), z.string().url("URL inválida. Inclua https://")])
    .optional(),

  price: z.number().min(0, "O preço não pode ser negativo"),
  discountPrice: z.number().optional(),

  categories: z.array(z.string()),
  streamings: z.array(z.string()),

  gameId: z.string().optional(),

  status: z.enum(["active", "inactive", "draft"]),
  deliveryMode: z.enum(["email", "none"]),
  paymentMethods: z.array(z.string()).refine((value) => value.length > 0, {
    message: "Selecione pelo menos uma forma de pagamento.",
  }),

  // --- NOVOS CAMPOS DE ESTOQUE ---
  stock: z.number().min(0, "O estoque não pode ser negativo"),
  isStockUnlimited: z.boolean(),
});

type ProductFormValues = z.infer<typeof formSchema>;

interface OptionData {
  id: string;
  name: string;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

export default function NewProductPage() {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  const [categoriesList, setCategoriesList] = useState<OptionData[]>([]);
  const [gamesList, setGamesList] = useState<OptionData[]>([]);
  const [streamingsList, setStreamingsList] = useState<OptionData[]>([]);

  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [cats, gms, stms] = await Promise.all([
          getCategories(),
          getGames(),
          getStreamings(),
        ]);
        setCategoriesList(cats);
        setGamesList(gms);
        setStreamingsList(stms);
      } catch {
        toast.error("Erro ao carregar dados auxiliares.");
      } finally {
        setIsLoadingData(false);
      }
    }
    loadData();
  }, []);

  // --- INICIALIZAÇÃO ---
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      paymentLink: "",
      downloadUrl: "",
      status: "active",
      deliveryMode: "email",

      // Valores padrão de estoque
      stock: 0,
      isStockUnlimited: false,

      price: 0,
      discountPrice: 0,
      categories: [],
      streamings: [],
      gameId: "",
      paymentMethods: ["pix", "credit_card", "debit_card", "boleto"],
    },
    mode: "onChange",
  });

  // Watchers
  const watchPrice = form.watch("price");
  const watchDiscountPrice = form.watch("discountPrice");
  const watchDeliveryMode = form.watch("deliveryMode");
  // Watcher para controlar a exibição do input de estoque
  const watchIsStockUnlimited = form.watch("isStockUnlimited");

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

    if (data.deliveryMode === "email" && !data.downloadUrl) {
      form.setError("downloadUrl", {
        message: "Link de download é obrigatório para entrega por email.",
      });
      toast.error("Preencha o link do arquivo para entrega automática.");
      return;
    }

    try {
      const formattedData: ProductServerPayload = {
        name: data.name,
        description: data.description,

        gameId: data.gameId === "" ? undefined : data.gameId,
        paymentLink: data.paymentLink === "" ? undefined : data.paymentLink,
        downloadUrl: data.downloadUrl === "" ? undefined : data.downloadUrl,

        price: Math.round(data.price * 100),
        discountPrice:
          data.discountPrice && data.discountPrice > 0
            ? Math.round(data.discountPrice * 100)
            : undefined,

        categories: data.categories,
        streamings: data.streamings,

        status: data.status,
        deliveryMode: data.deliveryMode,
        paymentMethods: data.paymentMethods,

        // Dados de estoque
        stock: data.stock,
        isStockUnlimited: data.isStockUnlimited,

        images: uploadedImages,
      };

      await createProduct(formattedData);

      toast.success("Produto criado com sucesso!");
      router.push("/admin/produtos");
    } catch (error) {
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
          Adicionar Novo Produto
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
                          placeholder="Ex: Combo Netflix + Disney"
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

                {/* PAYMENT LINK */}
                <FormField
                  control={form.control}
                  name="paymentLink"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-white">
                        <LinkIcon className="h-4 w-4" /> Link de Pagamento
                        Externo (Opcional)
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: https://pag.seguro/..."
                          className="border-white/10 bg-white/5 text-white"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormDescription className="text-xs text-neutral-400">
                        Caso utilize um checkout externo.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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

            {/* Configurações de Venda */}
            <Card className="border-white/10 bg-[#0A0A0A]">
              <CardHeader>
                <CardTitle className="text-white">
                  Configurações de Venda
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="deliveryMode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">
                        Modo de Entrega
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-12 border-white/10 bg-white/5 text-white [&_.delivery-desc]:hidden">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="border-white/10 bg-[#111] text-white">
                          <SelectItem
                            value="email"
                            className="cursor-pointer py-3 focus:bg-white/10 focus:text-white"
                          >
                            <div className="flex flex-col gap-1 text-left">
                              <span className="font-medium">
                                Entrega por Email
                              </span>
                              <span className="delivery-desc text-xs text-neutral-400">
                                Receba o seu pacote por Email imediatamente após
                                o pagamento.
                              </span>
                            </div>
                          </SelectItem>
                          <SelectItem
                            value="none"
                            className="cursor-pointer py-3 focus:bg-white/10 focus:text-white"
                          >
                            <div className="flex flex-col gap-1 text-left">
                              <span className="font-medium">Não informar</span>
                              <span className="delivery-desc text-xs text-neutral-400">
                                Não exibe informações de entrega.
                              </span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {watchDeliveryMode === "email" && (
                  <FormField
                    control={form.control}
                    name="downloadUrl"
                    render={({ field }) => (
                      <FormItem className="animate-in fade-in slide-in-from-top-2">
                        <FormLabel className="flex items-center gap-2 text-white">
                          <LinkIcon className="h-4 w-4 text-[#D00000]" /> Link
                          do Arquivo (Download)
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: https://drive.google.com/..."
                            className="border-white/10 bg-white/5 text-white"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormDescription className="text-xs text-neutral-400">
                          Enviado automaticamente após a compra.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                <Separator className="bg-white/10" />
                <FormField
                  control={form.control}
                  name="paymentMethods"
                  render={() => (
                    <FormItem>
                      <div className="mb-4">
                        <FormLabel className="text-white">
                          Formas de Pagamento Aceitas
                        </FormLabel>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {PAYMENT_METHODS_OPTIONS.map((item) => (
                          <FormField
                            key={item.id}
                            control={form.control}
                            name="paymentMethods"
                            render={({ field }) => (
                              <FormItem
                                key={item.id}
                                className="flex flex-row items-start space-y-0 space-x-3 rounded-md border border-white/10 bg-white/5 p-4"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(item.id)}
                                    onCheckedChange={(checked) =>
                                      checked
                                        ? field.onChange([
                                            ...field.value,
                                            item.id,
                                          ])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== item.id,
                                            ),
                                          )
                                    }
                                    className="border-white/50 data-[state=checked]:border-[#D00000] data-[state=checked]:bg-[#D00000]"
                                  />
                                </FormControl>
                                <FormLabel className="w-full cursor-pointer text-sm font-normal text-white">
                                  {item.label}
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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

                {/* Categorias */}
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

                {/* Jogo */}
                <FormField
                  control={form.control}
                  name="gameId"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-white">
                        Jogo Relacionado (Opcional)
                      </FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              disabled={isLoadingData}
                              className={cn(
                                "justify-between border-white/10 bg-white/5 text-left font-normal text-white hover:bg-white/10 hover:text-white",
                                !field.value
                                  ? "text-neutral-400"
                                  : "text-white",
                              )}
                            >
                              {field.value
                                ? gamesList.find((g) => g.id === field.value)
                                    ?.name
                                : "Selecione um jogo..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] border-white/10 bg-[#111] p-0 text-white">
                          <Command className="bg-[#111] text-white">
                            <CommandInput
                              placeholder="Buscar jogo..."
                              className="border-none focus:ring-0"
                            />
                            <CommandList>
                              <CommandEmpty>
                                Nenhum jogo encontrado.
                              </CommandEmpty>
                              <CommandGroup>
                                <CommandItem
                                  value="none"
                                  onSelect={() => form.setValue("gameId", "")}
                                  className="cursor-pointer text-neutral-400 hover:bg-white/10"
                                >
                                  Nenhum (Limpar)
                                </CommandItem>
                                {gamesList.map((game) => (
                                  <CommandItem
                                    key={game.id}
                                    value={game.name}
                                    onSelect={() =>
                                      form.setValue("gameId", game.id)
                                    }
                                    className="cursor-pointer hover:bg-white/10 aria-selected:bg-white/10"
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        field.value === game.id
                                          ? "opacity-100"
                                          : "opacity-0",
                                      )}
                                    />
                                    {game.name}
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

                {/* Streamings */}
                <FormField
                  control={form.control}
                  name="streamings"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-white">
                        Streamings Relacionados (Opcional)
                      </FormLabel>
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
                                : "Selecione streamings..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] border-white/10 bg-[#111] p-0 text-white">
                          <Command className="bg-[#111] text-white">
                            <CommandInput
                              placeholder="Buscar streaming..."
                              className="border-none focus:ring-0"
                            />
                            <CommandList>
                              <CommandEmpty>
                                Nenhum streaming encontrado.
                              </CommandEmpty>
                              <CommandGroup>
                                {streamingsList.map((stream) => (
                                  <CommandItem
                                    key={stream.id}
                                    value={stream.name}
                                    onSelect={() => {
                                      const current = field.value || [];
                                      const isSelected = current.includes(
                                        stream.id,
                                      );
                                      form.setValue(
                                        "streamings",
                                        isSelected
                                          ? current.filter(
                                              (id) => id !== stream.id,
                                            )
                                          : [...current, stream.id],
                                      );
                                    }}
                                    className="cursor-pointer hover:bg-white/10 aria-selected:bg-white/10"
                                  >
                                    <div
                                      className={cn(
                                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-white/30",
                                        field.value?.includes(stream.id)
                                          ? "border-[#D00000] bg-[#D00000]"
                                          : "opacity-50",
                                      )}
                                    >
                                      {field.value?.includes(stream.id) && (
                                        <Check className="h-3 w-3 text-white" />
                                      )}
                                    </div>
                                    {stream.name}
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

            {/* ESTOQUE (NOVA CARD) */}
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
                      (watchDiscountPrice as number) >=
                        (watchPrice as number) ? (
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
                  : "Criar Produto"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
