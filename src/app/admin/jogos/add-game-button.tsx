"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { createGame } from "@/app/admin/moveis/actions";
import { GameSchema, gameSchema } from "@/app/admin/moveis/schema";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import { ShinyButton } from "../../../components/ui/shiny-button";

export function AddGameButton() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<GameSchema>({
    resolver: zodResolver(gameSchema),
    defaultValues: {
      name: "",
    },
  });

  function onSubmit(data: GameSchema) {
    startTransition(async () => {
      try {
        const result = await createGame(data);

        if (result.success) {
          toast.success(result.message);
          setOpen(false);
          form.reset();
        } else {
          toast.error(result.message);
        }
      } catch {
        toast.error("Erro desconhecido ao criar jogo.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <ShinyButton className="bg-white text-black hover:bg-neutral-200">
          Novo Jogo
        </ShinyButton>
      </DialogTrigger>
      <DialogContent className="border-white/10 bg-[#111] text-white sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Jogo</DialogTitle>
          <DialogDescription className="text-neutral-400">
            Crie um novo jogo para agrupar seus produtos (Ex: Valorant, CS:GO).
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Jogo</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: FiveM"
                      className="border-white/10 bg-white/5 text-white focus:border-white/20"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="submit"
                disabled={isPending}
                className="bg-white text-black hover:bg-neutral-200"
              >
                {isPending ? "Criando..." : "Criar Jogo"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
