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
import { ShinyButton } from "@/components/ui/shiny-button";
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
        // CORREÇÃO: Removi o (error) já que não estava sendo usado.
        // Se quiser usar no futuro para logar, use: catch (error) { console.error(error); ... }
        toast.error("Erro ao criar categoria.");
      }
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <ShinyButton className="gap-2 bg-[#D00000] text-white hover:bg-[#a00000]">
          Nova Categoria
        </ShinyButton>
      </AlertDialogTrigger>
      <AlertDialogContent className="border-white/10 bg-[#111] text-white sm:max-w-[425px]">
        <AlertDialogHeader>
          <AlertDialogTitle>Criar Categoria</AlertDialogTitle>
          <AlertDialogDescription className="text-neutral-400">
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
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Mod Gráfico"
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
                  <FormLabel>Descrição (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Breve descrição..."
                      className="resize-none border-white/10 bg-white/5 text-white"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <AlertDialogFooter>
              <AlertDialogCancel className="border-white/10 bg-transparent text-white hover:bg-white/10 hover:text-white">
                Cancelar
              </AlertDialogCancel>
              <Button
                type="submit"
                className="bg-[#D00000] text-white hover:bg-[#a00000]"
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
