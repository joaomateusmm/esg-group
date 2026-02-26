"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { CreditCard, Loader2, Send, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

// Usaremos uma nova action que vamos criar no próximo passo!
import { createServicePaymentIntent } from "@/actions/service-checkout";
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

// Carrega a chave pública da Stripe
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
);

// --- SCHEMA LOCAL ---
const formSchema = z.object({
  description: z.string().min(10, "Descreva o problema com mais detalhes."),
  address: z.string().min(5, "Endereço obrigatório."),
  contactPhone: z.string().min(8, "Telefone obrigatório."),
});

type FormValues = z.infer<typeof formSchema>;

interface HireServiceFormProps {
  provider: {
    id: string;
    user: { name: string };
    servicePrice: number; // NOVO: Precisamos receber o preço do prestador em centavos!
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

// --- COMPONENTE INTERNO DO STRIPE (ETAPA 2) ---
function StripePaymentStep({
  amount,
  onSuccess,
}: {
  clientSecret: string;
  amount: number;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Redireciona para uma tela de sucesso de serviços
        return_url: `${window.location.origin}/checkout/sucesso-servico`,
      },
    });

    if (error) {
      toast.error(error.message || "Erro ao processar pagamento.");
      setIsProcessing(false);
    } else {
      // O redirecionamento acontece automaticamente pelo Stripe,
      // mas deixamos o onSuccess aqui por segurança.
      onSuccess();
    }
  };

  const formattedPrice = new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(amount / 100);

  return (
    <form onSubmit={handlePayment} className="mt-4 space-y-6">
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
        <PaymentElement />
      </div>

      <Button
        type="submit"
        disabled={isProcessing || !stripe || !elements}
        className="h-12 w-full bg-orange-600 font-bold text-white hover:bg-orange-700"
      >
        {isProcessing ? (
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        ) : (
          <>
            <CreditCard className="mr-2 h-5 w-5" /> Pagar {formattedPrice}
          </>
        )}
      </Button>
      <p className="flex items-center justify-center gap-2 text-xs text-neutral-500">
        <ShieldCheck className="h-4 w-4 text-green-600" /> Pagamento 100% seguro
        via Stripe
      </p>
    </form>
  );
}

// --- COMPONENTE PRINCIPAL DO MODAL ---
export function HireServiceForm({
  provider,
  categoryId,
  isOpen,
  onClose,
}: HireServiceFormProps) {
  // Controle de Etapas
  const [step, setStep] = useState<"details" | "payment">("details");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isGeneratingIntent, setIsGeneratingIntent] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
      address: "",
      contactPhone: "",
    },
  });

  const formattedPrice = new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(provider.servicePrice / 100);

  // ETAPA 1: Enviar Detalhes e Gerar Intenção de Pagamento
  const onSubmitDetails = async (data: FormValues) => {
    setIsGeneratingIntent(true);
    try {
      const payload = {
        ...data,
        providerId: provider.id,
        categoryId: categoryId,
        amount: provider.servicePrice,
      };

      // Chama a action para salvar o pedido como "pending" e retornar o clientSecret
      const res = await createServicePaymentIntent(payload);

      if (res.success && res.clientSecret) {
        setClientSecret(res.clientSecret);
        setStep("payment"); // Avança para a tela de cartão
      } else {
        toast.error(res.error || "Erro ao iniciar pagamento.");
      }
    } catch {
      toast.error("Erro inesperado ao conectar com o provedor de pagamentos.");
    } finally {
      setIsGeneratingIntent(false);
    }
  };

  const handlePresetClick = (text: string) => {
    form.setValue("description", text, { shouldValidate: true });
  };

  const handleClose = () => {
    if (isGeneratingIntent) return; // Não fecha se estiver carregando
    form.reset();
    setStep("details");
    setClientSecret(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-lg border-neutral-200 bg-white text-neutral-900"
        onInteractOutside={(e) => e.preventDefault()} // Impede fechar clicando fora para não perder o pagamento
      >
        <DialogHeader>
          <DialogTitle className="font-clash-display text-xl">
            {step === "details" ? "Solicitar Serviço" : "Pagamento Seguro"}
          </DialogTitle>
          <DialogDescription>
            {step === "details" ? (
              <>
                Contratando{" "}
                <span className="font-bold text-orange-600">
                  {provider.user.name}
                </span>
              </>
            ) : (
              "Insira os dados do seu cartão para confirmar o serviço."
            )}
          </DialogDescription>
        </DialogHeader>

        {step === "details" && (
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
                      {text.length > 35 ? text.substring(0, 35) + "..." : text}
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

              {/* MOSTRADOR DE PREÇO FIXO */}
              <div className="mt-4 flex items-center justify-between rounded-lg border border-orange-200 bg-orange-50 p-4">
                <span className="font-semibold text-orange-900">
                  Valor do Serviço:
                </span>
                <span className="text-xl font-bold text-orange-600">
                  {formattedPrice}
                </span>
              </div>

              <Button
                type="submit"
                className="mt-4 h-12 w-full bg-orange-600 font-bold text-white hover:bg-orange-700"
                disabled={isGeneratingIntent}
              >
                {isGeneratingIntent ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Continuar para Pagamento <Send className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </Form>
        )}

        {/* ETAPA 2: STRIPE ELEMENTS */}
        {step === "payment" && clientSecret && (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: {
                theme: "stripe",
                variables: { colorPrimary: "#ea580c" },
              },
            }}
          >
            <StripePaymentStep
              clientSecret={clientSecret}
              amount={provider.servicePrice}
              onSuccess={handleClose}
            />
          </Elements>
        )}
      </DialogContent>
    </Dialog>
  );
}
