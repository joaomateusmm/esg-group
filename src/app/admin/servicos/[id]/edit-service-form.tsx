"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronLeft, Hammer, Image as ImageIcon, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

// CORREÇÃO: Importar a Action do local correto (actions/services)
import { updateServiceCategory } from "@/actions/services";
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

// --- DEFINIÇÃO DO SCHEMA LOCAL (Para evitar conflitos de tipo) ---
const editServiceSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres."),
  description: z.string().optional(),
  image: z.string().optional(),
  isActive: z.boolean(),
});

// Inferência do tipo
type ServiceFormValues = z.infer<typeof editServiceSchema>;

interface EditServiceFormProps {
  initialData: {
    id: string;
    name: string;
    description: string | null;
    image: string | null;
    isActive: boolean;
  };
}

export function EditServiceForm({ initialData }: EditServiceFormProps) {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(
    initialData.image,
  );

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(editServiceSchema),
    defaultValues: {
      name: initialData.name,
      description: initialData.description || "", // Garante string vazia se null
      image: initialData.image || "",
      isActive: initialData.isActive,
    },
    mode: "onChange",
  });

  const onSubmit = async (data: ServiceFormValues) => {
    try {
      const payload = {
        name: data.name,
        description: data.description,
        image: uploadedImage || "",
        isActive: data.isActive,
      };

      // Chama a action de UPDATE importada de @/actions/services
      const result = await updateServiceCategory(initialData.id, payload);

      if (result.success) {
        toast.success(result.message);
        router.push("/admin/servicos");
        router.refresh();
      } else {
        toast.error(result.error || "Erro ao atualizar serviço.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro interno ao atualizar serviço.");
    }
  };

  const handleRemoveImage = () => {
    setUploadedImage(null);
    form.setValue("image", "");
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 pt-6 pb-20">
      {/* Cabeçalho */}
      <div className="flex items-center gap-4">
        <Link href="/admin/servicos">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 border-neutral-200 bg-white text-neutral-900 hover:bg-neutral-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex flex-col">
          <h1 className="font-clash-display text-2xl font-medium text-neutral-900">
            Editar Serviço: {initialData.name}
          </h1>
          <p className="text-sm text-neutral-500">
            Atualize as informações desta categoria.
          </p>
        </div>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid gap-8 md:grid-cols-3"
        >
          {/* Coluna Principal */}
          <div className="space-y-8 md:col-span-2">
            <Card className="border-neutral-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-neutral-900">
                  <Hammer className="h-5 w-5 text-orange-600" /> Dados do
                  Serviço
                </CardTitle>
                <CardDescription className="text-neutral-500">
                  Informações gerais da categoria.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-neutral-900">
                        Nome do Serviço
                      </FormLabel>
                      <FormControl>
                        <Input
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
                          className="min-h-[120px] resize-none border-neutral-200 bg-white text-neutral-900 placeholder:text-neutral-400 focus:border-orange-500 focus:ring-orange-500"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card className="border-neutral-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-neutral-900">
                  <ImageIcon className="h-5 w-5 text-orange-600" /> Imagem de
                  Capa{" "}
                  <span className="text-xs text-neutral-500">(opicional)</span>
                </CardTitle>
                <CardDescription className="text-neutral-500">
                  Uma imagem representativa para a categoria.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {uploadedImage ? (
                  <div className="relative aspect-video w-full overflow-hidden rounded-md border border-neutral-200 bg-neutral-50 sm:w-[300px]">
                    <Image
                      src={uploadedImage}
                      alt="Capa do serviço"
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 rounded-full bg-red-600 p-1.5 text-white transition-colors hover:bg-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex w-full flex-col items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-8">
                    <UploadButton
                      endpoint="imageUploader"
                      onUploadBegin={() => setIsUploading(true)}
                      onClientUploadComplete={(res) => {
                        setIsUploading(false);
                        if (res && res[0]) {
                          setUploadedImage(res[0].url);
                          toast.success("Imagem enviada!");
                        }
                      }}
                      onUploadError={(error: Error) => {
                        setIsUploading(false);
                        toast.error(`Erro: ${error.message}`);
                      }}
                      appearance={{
                        button:
                          "bg-orange-600 text-white px-4 hover:bg-orange-700 transition-all ut-uploading:cursor-not-allowed",
                        container: "w-full flex flex-col items-center gap-2",
                        allowedContent: "text-neutral-500 text-sm",
                      }}
                      content={{
                        button({ ready }) {
                          if (ready) return "Selecionar Imagem";
                          return "Carregando...";
                        },
                        allowedContent: "Imagens até 4MB",
                      }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Coluna Lateral */}
          <div className="space-y-8">
            <Card className="border-neutral-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-neutral-900">Visibilidade</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-neutral-900">Status</FormLabel>
                      <Select
                        onValueChange={(val) => field.onChange(val === "true")}
                        value={field.value ? "true" : "false"}
                      >
                        <FormControl>
                          <SelectTrigger className="border-neutral-200 bg-white text-neutral-900 focus:border-orange-500 focus:ring-orange-500">
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="border-neutral-200 bg-white text-neutral-900">
                          <SelectItem value="true">Ativo</SelectItem>
                          <SelectItem value="false">Inativo</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Button
              type="submit"
              className="h-12 w-full bg-orange-600 font-medium text-white shadow-md transition-all hover:bg-orange-700 disabled:bg-neutral-300"
              disabled={form.formState.isSubmitting || isUploading}
            >
              {form.formState.isSubmitting
                ? "Salvando..."
                : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
