"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react"; // Removidos Ticket e Switch não usados
import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form"; // Importado SubmitHandler
import { toast } from "sonner";
import { z } from "zod";

import { createCouponAction } from "@/actions/coupons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// --- SCHEMA CORRIGIDO (Igual ao padrão que funciona) ---
// Removemos z.coerce.number() e usamos z.number() puro para controle total
const formSchema = z.object({
  code: z.string().min(3, "Mínimo 3 letras").toUpperCase().trim(),
  type: z.enum(["percent", "fixed"]),
  value: z.number().min(1, "Valor obrigatório"),
  minValue: z.number().optional(),
  maxUses: z.number().optional(),
  expiresAt: z.string().optional(),
});

// Inferência do tipo
type CouponFormValues = z.infer<typeof formSchema>;

export function NewCouponDialog() {
  const [open, setOpen] = useState(false);

  // Inicialização correta com todos os valores padrão
  const form = useForm<CouponFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
      type: "percent",
      value: 0,
      minValue: 0,
      maxUses: 0,
      expiresAt: "",
    },
    mode: "onChange",
  });

  // Submit Handler Tipado
  const onSubmit: SubmitHandler<CouponFormValues> = async (data) => {
    // Se for valor fixo, converte input (reais) para centavos
    // Se for percent, mantem o numero (ex: 10)
    const payload = {
      ...data,
      value: data.type === "fixed" ? Math.round(data.value * 100) : data.value,
      minValue: data.minValue ? Math.round(data.minValue * 100) : 0,
      // Se maxUses for 0, enviamos undefined para ser ilimitado
      maxUses: data.maxUses && data.maxUses > 0 ? data.maxUses : undefined,
    };

    const res = await createCouponAction(payload);

    if (res.success) {
      toast.success(res.message);
      setOpen(false);
      form.reset();
    } else {
      toast.error(res.message);
    }
  };

  const watchType = form.watch("type");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-[#D00000] text-white hover:bg-[#a00000]">
          <Plus className="h-4 w-4" /> Novo Cupom
        </Button>
      </DialogTrigger>
      <DialogContent className="border-white/10 bg-[#0A0A0A] text-white sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Criar Novo Cupom</DialogTitle>
          <DialogDescription className="text-neutral-400">
            Configure as regras do desconto abaixo.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 pt-4"
          >
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código do Cupom</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="EX: NATAL10"
                      className="border-white/10 bg-white/5 text-white uppercase"
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
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="border-white/10 bg-white/5 text-white">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="border-white/10 bg-[#111] text-white">
                        <SelectItem value="percent">Porcentagem (%)</SelectItem>
                        <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {watchType === "percent"
                        ? "Porcentagem (%)"
                        : "Valor (R$)"}
                    </FormLabel>
                    <FormControl>
                      {/* Conversão manual no onChange para satisfazer z.number() */}
                      <Input
                        type="number"
                        placeholder={watchType === "percent" ? "10" : "20.00"}
                        className="border-white/10 bg-white/5 text-white"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="minValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor Mínimo do Pedido (R$)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0.00"
                      className="border-white/10 bg-white/5 text-white"
                      {...field}
                      value={field.value === 0 ? "" : field.value}
                      onChange={(e) => {
                        const val = e.target.value;
                        field.onChange(val === "" ? 0 : Number(val));
                      }}
                    />
                  </FormControl>
                  <FormDescription className="text-xs text-neutral-500">
                    Opcional. Deixe vazio para qualquer valor.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="maxUses"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Limite de Usos</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Ilimitado"
                        className="border-white/10 bg-white/5 text-white"
                        {...field}
                        value={field.value === 0 ? "" : field.value}
                        onChange={(e) => {
                          const val = e.target.value;
                          field.onChange(val === "" ? 0 : Number(val));
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expiresAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Validade (Opcional)</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        className="block w-full border-white/10 bg-white/5 text-white"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-[#D00000] font-bold text-white hover:bg-[#a00000]"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Criar Cupom"
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
