"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, MessageSquareText } from "lucide-react";
import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
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

const formSchema = z.object({
  code: z.string().min(3, "Mínimo 3 letras").toUpperCase().trim(),
  type: z.enum(["percent", "fixed"]),
  value: z.number().min(1, "Valor obrigatório"),
  minValue: z.number().optional(),
  maxUses: z.number().optional(),
  expiresAt: z.string().optional(),
  popupTitle: z.string().optional(),
  popupDescription: z.string().optional(),
});

type CouponFormValues = z.infer<typeof formSchema>;

export function NewCouponDialog() {
  const [open, setOpen] = useState(false);

  const form = useForm<CouponFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
      type: "percent",
      value: 0,
      minValue: 0,
      maxUses: 0,
      expiresAt: "",
      popupTitle: "",
      popupDescription: "",
    },
    mode: "onChange",
  });

  const formatCurrency = (value: number | undefined) => {
    if (!value) return "R$ 0,00";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
    }).format(value);
  };

  const handlePriceChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    onChange: (value: number) => void,
  ) => {
    const rawValue = e.target.value.replace(/\D/g, "");
    const numericValue = Number(rawValue) / 100;
    onChange(numericValue);
  };

  const onSubmit: SubmitHandler<CouponFormValues> = async (data) => {
    const payload = {
      ...data,
      value: data.type === "fixed" ? Math.round(data.value * 100) : data.value,
      minValue: data.minValue ? Math.round(data.minValue * 100) : 0,
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
        <Button className="px-4 py-2 font-medium">Novo Cupom</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-neutral-200 bg-white text-neutral-900 shadow-lg sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-neutral-900">
            Criar Novo Cupom
          </DialogTitle>
          <DialogDescription className="text-neutral-500">
            Configure as regras e a divulgação do desconto.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-5 pt-4"
          >
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium text-neutral-700">
                    Código do Cupom
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="EX: NATAL10"
                      className="border-neutral-300 bg-white text-neutral-900 uppercase placeholder:text-neutral-400 focus:border-orange-500 focus:ring-orange-500"
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
                    <FormLabel className="font-medium text-neutral-700">
                      Tipo
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="border-neutral-300 bg-white text-neutral-900 focus:ring-orange-500">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="border-neutral-200 bg-white text-neutral-900 shadow-md">
                        <SelectItem
                          value="percent"
                          className="cursor-pointer hover:bg-neutral-50"
                        >
                          Porcentagem (%)
                        </SelectItem>
                        <SelectItem
                          value="fixed"
                          className="cursor-pointer hover:bg-neutral-50"
                        >
                          Valor Fixo (R$)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium text-neutral-700">
                      {watchType === "percent"
                        ? "Porcentagem (%)"
                        : "Valor (R$)"}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder={
                          watchType === "percent" ? "Ex: 10" : "Ex: 20.00"
                        }
                        className="border-neutral-300 bg-white text-neutral-900 focus:border-orange-500 focus:ring-orange-500 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        {...field}
                        value={field.value === 0 ? "" : field.value}
                        onKeyDown={(e) => {
                          if (
                            ["e", "E", "+", "-", ",", "."].includes(e.key) &&
                            watchType === "percent"
                          ) {
                            if (
                              ["e", "E", "+", "-", ",", "."].includes(e.key)
                            ) {
                              e.preventDefault();
                            }
                          }
                        }}
                        onChange={(e) => {
                          const rawValue = e.target.value.replace(/\D/g, "");
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
            </div>

            <FormField
              control={form.control}
              name="minValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium text-neutral-700">
                    Valor Mínimo do Pedido (R$)
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="R$ 0,00"
                      className="border-neutral-300 bg-white font-mono text-neutral-900 focus:border-orange-500 focus:ring-orange-500"
                      value={formatCurrency(field.value)}
                      onChange={(e) => handlePriceChange(e, field.onChange)}
                    />
                  </FormControl>
                  <FormDescription className="text-xs text-neutral-500">
                    Opcional. Deixe zerado para qualquer valor.
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
                    <FormLabel className="font-medium text-neutral-700">
                      Limite de Usos
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Ilimitado"
                        className="border-neutral-300 bg-white text-neutral-900 focus:border-orange-500 focus:ring-orange-500"
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
                    <FormLabel className="font-medium text-neutral-700">
                      Validade (Opcional)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        className="block w-full border-neutral-300 bg-white text-neutral-900 focus:border-orange-500 focus:ring-orange-500"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="mt-6 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-neutral-800">
                <MessageSquareText className="h-4 w-4 text-orange-600" />
                Personalização do Pop-up (Divulgação)
              </div>

              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="popupTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-neutral-700">
                        Título do Pop-up
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Oferta Relâmpago! ⚡"
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
                  name="popupDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-neutral-700">
                        Descrição / Texto de Apoio
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Use este cupom e garanta o melhor preço."
                          className="border-neutral-300 bg-white text-neutral-900 focus:border-orange-500 focus:ring-orange-500"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="mt-4 w-full bg-orange-600 font-bold text-white shadow-sm hover:bg-orange-700"
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
