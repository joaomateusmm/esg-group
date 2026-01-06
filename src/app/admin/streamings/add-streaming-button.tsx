"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

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
import { ShinyButton } from "@/components/ui/shiny-button";

import { createStreaming } from "./actions";
import { StreamingSchema, streamingSchema } from "./schema";

export function AddStreamingButton() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<StreamingSchema>({
    resolver: zodResolver(streamingSchema),
    defaultValues: { name: "" },
  });

  function onSubmit(data: StreamingSchema) {
    startTransition(async () => {
      try {
        const result = await createStreaming(data);
        if (result.success) {
          toast.success(result.message);
          setOpen(false);
          form.reset();
        } else {
          toast.error(result.message);
        }
      } catch {
        toast.error("Erro desconhecido.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <ShinyButton className="bg-white text-black hover:bg-neutral-200">
          Novo Streaming
        </ShinyButton>
      </DialogTrigger>
      <DialogContent className="border-white/10 bg-[#111] text-white sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Streaming</DialogTitle>
          <DialogDescription className="text-neutral-400">
            Ex: Netflix, Disney+, Prime Video.
          </DialogDescription>
        </DialogHeader>
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
                      placeholder="Ex: Netflix"
                      className="border-white/10 bg-white/5 text-white"
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
                {isPending ? "Criando..." : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
