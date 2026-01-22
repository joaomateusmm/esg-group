"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { createCategory } from "./actions";
import { CategoryFormValues, categorySchema } from "./schema";

export function AddCategoryButton() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  function onSubmit(data: CategoryFormValues) {
    startTransition(async () => {
      try {
        await createCategory(data);
        toast.success("Categoria criada!");
        setOpen(false);
        form.reset();
      } catch {
        toast.error("Erro ao criar categoria.");
      }
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button className="gap-2 bg-neutral-900 text-white shadow-md transition-all hover:bg-neutral-800 hover:shadow-lg">
          Nova Categoria
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="border-neutral-200 bg-white text-neutral-900 shadow-lg sm:max-w-[425px]">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-neutral-900">
            Criar Categoria
          </AlertDialogTitle>
          <AlertDialogDescription className="text-neutral-500">
            Adicione uma nova categoria para organizar seus produtos.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-neutral-700">Nome</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Eletrodomésticos"
                      className="border-neutral-300 bg-white text-neutral-900 focus:border-orange-500 focus:ring-orange-500"
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
                  <FormLabel className="text-neutral-700">
                    Descrição (Opcional)
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Breve descrição..."
                      className="resize-none border-neutral-300 bg-white text-neutral-900 focus:border-orange-500 focus:ring-orange-500"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <AlertDialogFooter>
              <AlertDialogCancel className="border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900">
                Cancelar
              </AlertDialogCancel>
              <Button
                type="submit"
                className="bg-orange-600 text-white shadow-sm hover:bg-orange-700"
                disabled={isPending}
              >
                {isPending ? "Salvando..." : "Salvar Categoria"}
              </Button>
            </AlertDialogFooter>
          </form>
        </Form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
