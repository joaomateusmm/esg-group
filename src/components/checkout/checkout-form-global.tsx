"use client";

import {
  AddressElement,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { CreditCard, Loader2, Lock, Truck } from "lucide-react"; // Importei ícones extras
import { useRouter } from "next/navigation"; // Importar useRouter
import { useEffect, useState } from "react";

import { createOrderCOD, getCartShippingCost } from "@/actions/checkout"; // Importar a nova action
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils"; // Importar cn para classes condicionais
import { useCartStore } from "@/store/cart-store";

export function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const { items, getTotalPrice, clearCart } = useCartStore(); // Importar clearCart
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
  const [shippingCost, setShippingCost] = useState(0);
  const [message, setMessage] = useState<string | null>(null);

  // ESTADO DO MÉTODO DE PAGAMENTO: 'card' ou 'cod' (Cash on Delivery)
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cod">("card");

  const cartCurrency = items.length > 0 ? items[0].currency || "GBP" : "GBP";

  const formatPrice = (val: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: cartCurrency,
    }).format(val / 100);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [addressDetails, setAddressDetails] = useState<any>(null);

  useEffect(() => {
    const fetchShipping = async () => {
      setIsCalculatingShipping(true);
      try {
        const result = await getCartShippingCost(items);
        setShippingCost(result.price);
      } catch (error) {
        console.error("Erro ao buscar frete:", error);
      } finally {
        setIsCalculatingShipping(false);
      }
    };

    if (items.length > 0) {
      fetchShipping();
    }
  }, [items]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleAddressChange = async (event: any) => {
    setAddressDetails(event.value);
    if (!event.complete) return;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (paymentMethod === "card" && (!stripe || !elements)) {
      return;
    }

    setIsLoading(true);
    setMessage(null);

    // Validação básica do endereço (Stripe Address Element já valida visualmente, mas precisamos dos dados)
    if (!addressDetails || !addressDetails.address || !addressDetails.name) {
      setMessage("Por favor, preencha o endereço de entrega completo.");
      setIsLoading(false);
      return;
    }

    // --- FLUXO 1: PAGAMENTO COM CARTÃO (STRIPE) ---
    if (paymentMethod === "card") {
      if (!stripe || !elements) return;

      const { error: submitError } = await elements.submit();
      if (submitError) {
        setMessage(submitError.message || "Erro na validação do formulário.");
        setIsLoading(false);
        return;
      }

      const shippingDetails = {
        name: addressDetails.name,
        phone: addressDetails.phone,
        address: {
          line1: addressDetails.address.line1,
          line2: addressDetails.address.line2,
          city: addressDetails.address.city,
          state: addressDetails.address.state,
          postal_code: addressDetails.address.postal_code,
          country: addressDetails.address.country,
        },
      };

      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/sucesso`,
          shipping: shippingDetails,
        },
      });

      if (error.type === "card_error" || error.type === "validation_error") {
        setMessage(error.message || "Ocorreu um erro.");
      } else {
        setMessage("Erro inesperado.");
      }
      setIsLoading(false);
    }

    // --- FLUXO 2: PAGAMENTO NA ENTREGA (COD) ---
    else {
      try {
        const shippingData = {
          street: addressDetails.address.line1,
          number: "N/A", // O Element do Stripe junta rua e número em line1 as vezes, ou line2. Simplificação.
          complement: addressDetails.address.line2,
          city: addressDetails.address.city,
          state: addressDetails.address.state,
          zipCode: addressDetails.address.postal_code,
          phone: addressDetails.phone,
        };

        // Chama a Server Action para criar o pedido sem pagamento imediato
        const result = await createOrderCOD(
          items,
          {
            email: "guest@example.com", // TODO: Pegar email real do usuário logado ou input se for guest
            name: addressDetails.name,
          },
          undefined, // Coupon code (se tiver, passar aqui)
          shippingData,
        );

        if (result.success) {
          clearCart(); // Limpa o carrinho
          router.push(`/checkout/sucesso?orderId=${result.orderId}`); // Redireciona
        }
      } catch (error) {
        console.error(error);
        if (error instanceof Error) {
          setMessage(error.message);
        } else {
          setMessage("Erro ao criar pedido.");
        }
        setIsLoading(false);
      }
    }
  };

  const total = getTotalPrice() + shippingCost;

  return (
    <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-2">
      {/* LADO ESQUERDO: DADOS */}
      <div className="space-y-6">
        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-bold text-neutral-900">
            Endereço de Entrega
          </h2>
          <AddressElement
            options={{
              mode: "shipping",
              allowedCountries: [
                "BR",
                "US",
                "GB",
                "FR",
                "IT",
                "PT",
                "ES",
                "DE",
              ],
              fields: { phone: "always" },
              validation: { phone: { required: "always" } },
            }}
            onChange={handleAddressChange}
          />
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-bold text-neutral-900">Pagamento</h2>

          {/* SELETOR DE MÉTODO DE PAGAMENTO */}
          <div className="mb-6 flex w-full flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => setPaymentMethod("card")}
              className={cn(
                "flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border px-5 py-3 font-medium transition-all duration-200",
                paymentMethod === "card"
                  ? "bg-orange-50 text-orange-700 shadow-sm ring-1 ring-orange-600"
                  : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900",
              )}
            >
              <CreditCard className="h-4 w-4" />
              Pagar Agora
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod("cod")}
              className={cn(
                "flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border px-5 py-3 font-medium transition-all duration-200",
                paymentMethod === "cod"
                  ? "bg-orange-50 text-orange-700 shadow-sm ring-1 ring-orange-600"
                  : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900",
              )}
            >
              <Truck className="h-4 w-4" />
              Pagar na Entrega
            </button>
          </div>

          {/* MOSTRA O FORM DO STRIPE APENAS SE FOR 'CARD' */}
          {paymentMethod === "card" ? (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <PaymentElement />
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-top-2 rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600 duration-300">
              <p className="mb-1 flex items-center gap-2 font-medium text-neutral-900">
                <Truck className="h-4 w-4 text-orange-600" /> Pagamento na
                Entrega
              </p>
              <p>
                Você pagará o valor total de{" "}
                <strong>{formatPrice(total)}</strong> diretamente ao entregador
                quando receber seu pedido. Aceitamos dinheiro, cartão ou PIX.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* LADO DIREITO: RESUMO */}
      <div>
        <div className="sticky top-24 rounded-xl border border-neutral-200 bg-white p-6 shadow-lg">
          <h2 className="mb-6 text-xl font-bold text-neutral-900">
            Resumo do Pedido
          </h2>

          <div className="mb-4 max-h-40 overflow-y-auto pr-2">
            {items.map((item) => (
              <div key={item.id} className="mb-2 flex justify-between text-sm">
                <span className="w-2/3 truncate text-neutral-600">
                  {item.quantity}x {item.name}
                </span>
                <span className="font-medium">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-3 border-t border-neutral-100 pt-4 text-sm">
            <div className="flex justify-between text-neutral-600">
              <span>Subtotal</span>
              <span>{formatPrice(getTotalPrice())}</span>
            </div>

            <div className="flex items-center justify-between text-neutral-600">
              <span className="flex items-center gap-2">Frete</span>
              <span className="font-medium text-orange-600">
                {isCalculatingShipping ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : shippingCost > 0 ? (
                  formatPrice(shippingCost)
                ) : (
                  "Grátis"
                )}
              </span>
            </div>
          </div>

          <div className="mt-4 flex justify-between border-t border-neutral-200 pt-4 text-lg font-bold text-neutral-900">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>

          <Button
            disabled={
              isLoading ||
              isCalculatingShipping ||
              (paymentMethod === "card" && (!stripe || !elements))
            }
            type="submit"
            className="mt-6 h-12 w-full bg-orange-600 text-base font-bold text-white hover:bg-orange-700 disabled:bg-neutral-300"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : paymentMethod === "card" ? (
              <>
                <Lock className="mr-2 h-4 w-4" />
                Pagar {formatPrice(total)}
              </>
            ) : (
              <>Concluir Pedido</>
            )}
          </Button>

          {message && (
            <div className="mt-4 rounded bg-red-50 p-2 text-center text-sm text-red-500">
              {message}
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
