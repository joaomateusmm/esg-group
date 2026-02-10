"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronLeft, Hammer, Image as ImageIcon, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { createServiceCategory } from "@/actions/services";
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
import { serviceCategorySchema } from "@/schemas/services"; // <--- MUDE ISSO

type ServiceFormValues = z.infer<typeof serviceCategorySchema>;

export default function NewServicePage() {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceCategorySchema),
    defaultValues: {
      name: "",
      description: "",
      image: "",
      isActive: true,
    },
    mode: "onChange",
  });

  const onSubmit: SubmitHandler<ServiceFormValues> = async (data) => {
    const result = await createServiceCategory(data);
    if (result.success) {
      toast.success(result.message);
      router.push("/admin/servicos");
    } else {
      toast.error(result.error || "Erro ao criar.");
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 pt-6 pb-20">
      <div className="flex items-center gap-4">
        <Link href="/admin/servicos">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 border-neutral-200 bg-white text-neutral-900"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="font-clash-display text-2xl font-bold text-neutral-900">
          Nova Categoria de Serviço
        </h1>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid gap-8 md:grid-cols-3"
        >
          <div className="space-y-8 md:col-span-2">
            <Card className="border-neutral-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hammer className="h-5 w-5 text-orange-600" /> Dados
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Serviço</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Encanador"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value)}
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
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="O que faz..."
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Imagem / Ícone */}
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
                      onClick={() => {
                        setUploadedImage(null);
                        form.setValue("image", "");
                      }}
                      className="absolute top-2 right-2 rounded-full bg-red-600 p-1.5 text-white transition-colors hover:bg-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  // --- ÁREA DE UPLOAD ESTILIZADA ---
                  <div className="flex w-full flex-col items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-8 transition-colors hover:bg-neutral-100">
                    <UploadButton
                      endpoint="imageUploader"
                      onUploadBegin={() => setIsUploading(true)}
                      onClientUploadComplete={(res) => {
                        setIsUploading(false);
                        if (res && res[0]) {
                          setUploadedImage(res[0].url);
                          form.setValue("image", res[0].url, {
                            shouldDirty: true,
                            shouldTouch: true,
                            shouldValidate: true,
                          });
                          toast.success("Imagem enviada!");
                        }
                      }}
                      onUploadError={(error) => {
                        setIsUploading(false);
                        toast.error(`Erro: ${error.message}`);
                      }}
                      // AQUI ESTÁ A CORREÇÃO VISUAL:
                      appearance={{
                        button:
                          "bg-orange-600 text-white hover:bg-orange-700 transition-all ut-uploading:cursor-not-allowed px-4 py-2 rounded-md font-medium",
                        container: "w-full flex flex-col items-center gap-2",
                        allowedContent: "text-neutral-500 text-sm mt-2",
                      }}
                      content={{
                        button({ ready }) {
                          if (ready) return "Selecionar Imagem";
                          return "Carregando...";
                        },
                        allowedContent: "Máx 4MB • JPG, PNG",
                      }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            <Card className="border-neutral-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle>Visibilidade</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={(val) => field.onChange(val === "true")}
                        value={field.value ? "true" : "false"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
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
              className="h-12 w-full bg-orange-600 text-white hover:bg-orange-700"
              disabled={form.formState.isSubmitting || isUploading}
            >
              {form.formState.isSubmitting ? "Salvando..." : "Criar Serviço"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
