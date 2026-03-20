"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

// Importando a NOVA Action que não usa o Stripe
import { requestServiceWithoutPayment } from "@/actions/service-checkout";
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
import { Textarea } from "@/components/ui/textarea";

import { BookingDatePicker } from "./booking-date-picker";
import { Separator } from "./ui/separator";

// --- SCHEMA LOCAL CORRIGIDO ---
const formSchema = z.object({
  description: z
    .string()
    .min(5, "A descrição deve ter pelo menos 5 caracteres"),
  contactPhone: z.string().min(5, "Telefone inválido"),
  address: z.string().min(5, "Endereço inválido"),
  scheduledDate: z.any().refine((val) => val instanceof Date, {
    message: "Por favor, selecione uma data para o serviço.",
  }),
});

type FormValues = z.infer<typeof formSchema>;

interface HireServiceFormProps {
  provider: {
    id: string;
    user: { name: string };
    servicePrice: number;
  };
  categoryId: string;
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_DESCRIPTIONS = [
  "Preciso montar móveis recém comprados (guarda-roupa, cama, etc).",
  "Preciso de reparos gerais em casa (troca de torneira, chuveiro, etc).",
  "Preciso de ajuda para pintura de paredes internas.",
  "Preciso de uma limpeza pesada/pós-obra na minha residência.",
  "Preciso de instalação de suportes, quadros ou prateleiras na parede.",
];

export function HireServiceForm({
  provider,
  categoryId,
  isOpen,
  onClose,
}: HireServiceFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
      address: "",
      contactPhone: "",
    },
  });

  const selectedDate = form.watch("scheduledDate");

  const formattedPrice = new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(provider.servicePrice / 100);

  // NOVA LÓGICA DE ENVIO (APENAS SOLICITAÇÃO)
  const onSubmitDetails = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...data,
        providerId: provider.id,
        categoryId: categoryId,
        amount: provider.servicePrice,
        scheduledDate: data.scheduledDate.toISOString(),
      };

      // Usa a action que apenas salva no banco
      const res = await requestServiceWithoutPayment(payload);

      if (res.success) {
        setIsSuccess(true); // Muda para a tela de sucesso dentro do modal
      } else {
        toast.error(res.error || "Erro ao enviar solicitação.");
      }
    } catch {
      toast.error("Erro inesperado ao processar sua solicitação.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePresetClick = (text: string) => {
    form.setValue("description", text, { shouldValidate: true });
  };

  const handleClose = () => {
    if (isSubmitting) return;
    form.reset();
    setIsSuccess(false);
    onClose();
  };

  const isSubmitDisabled = isSubmitting || !selectedDate;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-lg border-neutral-200 bg-white text-neutral-900"
        onInteractOutside={(e) => {
          // Só impede de fechar se estiver enviando.
          if (isSubmitting) e.preventDefault();
        }}
      >
        {isSuccess ? (
          // --- TELA DE SUCESSO ---
          <div className="flex flex-col items-center justify-center space-y-4 py-1 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-neutral-900">
              Solicitação Enviada!
            </h2>
            <p className="text-neutral-500">
              Sua solicitação foi enviada para{" "}
              <strong>{provider.user.name}</strong>. Você será notificado assim
              que o prestador confirmar o serviço.
            </p>
            <div className="flex items-center justify-center gap-2">
              <Link className="w-full" href="/minha-conta/servicos">
                {" "}
                <Button
                  className=" cursor-pointer bg-orange-600 font-bold text-white hover:bg-orange-700"
                >
                  Ver meus serviços
                </Button>
              </Link>
              <Button
                onClick={handleClose}
                className=" cursor-pointer bg-neutral-800 font-bold text-white hover:bg-neutral-900"
              >
                Entendido, fechar
              </Button>
            </div>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-clash-display text-xl">
                Solicitar Serviço
              </DialogTitle>
              <DialogDescription>
                Contratando{" "}
                <span className="font-bold text-orange-600">
                  {provider.user.name}
                </span>
                . O pagamento será feito apenas após a confirmação do
                profissional.
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmitDetails)}
                className="space-y-4 py-2"
              >
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center justify-between">
                        <span>O que você precisa?</span>
                      </FormLabel>
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

                <div className="space-y-2">
                  <span className="flex items-center gap-1 text-xs font-medium text-neutral-500">
                    Preenchimento rápido:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_DESCRIPTIONS.map((text, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handlePresetClick(text)}
                        className="cursor-pointer rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs text-orange-700 transition-colors hover:bg-orange-100 hover:text-orange-800 active:scale-95"
                      >
                        {text.length > 35
                          ? text.substring(0, 35) + "..."
                          : text}
                      </button>
                    ))}
                  </div>
                </div>

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
                            className="border-neutral-200 bg-neutral-50 focus:border-orange-500"
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
                            className="border-neutral-200 bg-neutral-50 focus:border-orange-500"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="scheduledDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col pt-2">
                      <FormLabel>Quando você precisará do serviço?</FormLabel>
                      <div className="relative">
                        <BookingDatePicker
                          date={field.value}
                          setDate={field.onChange}
                          title="Agendar data do serviço"
                        />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between rounded-lg border border-orange-200 bg-orange-50 p-4">
                    <span className="font-semibold text-orange-900">
                      Valor do Serviço:
                    </span>
                    <span className="text-xl font-bold text-orange-600">
                      {formattedPrice}
                    </span>
                  </div>

                  <Button
                    type="submit"
                    className="text-md h-12 w-full cursor-pointer bg-orange-600 font-bold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isSubmitDisabled}
                  >
                    {isSubmitting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        Enviar Solicitação <Send className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
