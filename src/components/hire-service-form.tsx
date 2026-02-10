"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Send } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { createServiceRequest } from "@/actions/requests";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";

// Schema local (igual ao da action, mas adaptado pro form)
const formSchema = z.object({
  description: z.string().min(10, "Descreva o problema com mais detalhes."),
  address: z.string().min(5, "Endereço obrigatório."),
  contactPhone: z.string().min(8, "Telefone obrigatório."),
  budgetType: z.enum(["negotiable", "range"]),
  minBudget: z.string().optional(),
  maxBudget: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface HireServiceFormProps {
  provider: {
    id: string;
    user: { name: string };
  };
  categoryId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function HireServiceForm({
  provider,
  categoryId,
  isOpen,
  onClose,
}: HireServiceFormProps) {
  const [budgetType, setBudgetType] = useState<"negotiable" | "range">(
    "negotiable",
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
      address: "",
      contactPhone: "",
      budgetType: "negotiable",
      minBudget: "",
      maxBudget: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      const payload = {
        ...data,
        providerId: provider.id,
        categoryId: categoryId,
      };

      const res = await createServiceRequest(payload);

      if (res.success) {
        toast.success(res.message);
        onClose();
        form.reset();
      } else {
        toast.error(res.error);
      }
    } catch {
      toast.error("Erro ao enviar solicitação.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg border-neutral-200 bg-white text-neutral-900">
        <DialogHeader>
          <DialogTitle className="font-clash-display text-xl">
            Solicitar Orçamento para{" "}
            <span className="text-orange-600">{provider.user.name}</span>
          </DialogTitle>
          <DialogDescription>
            Descreva o serviço e sua proposta de valor.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 py-2"
          >
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>O que você precisa?</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ex: Preciso montar um guarda-roupa de 6 portas da IKEA..."
                      className="min-h-[100px] border-neutral-200 bg-neutral-50 focus:border-orange-500"
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
                name="contactPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Seu Telefone</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="+44 7000 000000"
                        className="border-neutral-200 bg-neutral-50"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço do Serviço</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Rua, Número, CEP"
                        className="border-neutral-200 bg-neutral-50"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* SEÇÃO DE ORÇAMENTO */}
            <div className="space-y-3 pt-2">
              <FormLabel>Proposta de Valor (Libras £)</FormLabel>
              <FormField
                control={form.control}
                name="budgetType"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <RadioGroup
                        onValueChange={(val) => {
                          field.onChange(val);
                          setBudgetType(val as "negotiable" | "range");
                        }}
                        defaultValue={field.value}
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem
                            value="negotiable"
                            id="r1"
                            className="border-neutral-400 text-orange-600"
                          />
                          <Label htmlFor="r1" className="cursor-pointer">
                            A Combinar
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem
                            value="range"
                            id="r2"
                            className="border-neutral-400 text-orange-600"
                          />
                          <Label htmlFor="r2" className="cursor-pointer">
                            Faixa de Preço
                          </Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                  </FormItem>
                )}
              />

              {budgetType === "range" && (
                <div className="animate-in fade-in slide-in-from-top-2 flex items-center gap-2">
                  <FormField
                    control={form.control}
                    name="minBudget"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Min (£)"
                            className="border-neutral-200 bg-neutral-50"
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <span className="text-neutral-400">-</span>
                  <FormField
                    control={form.control}
                    name="maxBudget"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Max (£)"
                            className="border-neutral-200 bg-neutral-50"
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="mt-4 h-12 w-full bg-orange-600 font-bold text-white hover:bg-orange-700"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" /> Enviar Solicitação
                </>
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
