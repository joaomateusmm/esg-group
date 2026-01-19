"use client";

import {
  AddressElement,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { Loader2, Lock } from "lucide-react";
import { useState } from "react";

// Importe a Server Action que criamos
import { calculateShippingAction } from "@/actions/calculate-shipping";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart-store";

export function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const { items, getTotalPrice } = useCartStore(); // Pegamos os itens do carrinho

  const [isLoading, setIsLoading] = useState(false);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
  const [shippingCost, setShippingCost] = useState(0);
  const [deliveryDays, setDeliveryDays] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Função chamada quando o endereço muda no Stripe
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleAddressChange = async (event: any) => {
    if (!event.complete) return;

    const address = event.value.address;

    setIsCalculatingShipping(true);

    try {
      // Chamamos nossa Server Action passando Endereço + Itens
      const result = await calculateShippingAction({
        destinationPostalCode: address.postal_code,
        destinationCountry: address.country,
        // Mapeamos os itens do carrinho para o formato que a action espera
        items: items.map((item) => ({
          id: item.id,
          quantity: item.quantity,
          // AQUI É O PULO DO GATO:
          // Se o seu objeto 'product' no carrinho já tiver peso, passe aqui.
          // Se não, a Action vai usar o peso padrão que definimos lá.
          // weight: item.weight,
        })),
      });

      setShippingCost(result.price);
      setDeliveryDays(result.estimatedDays);
    } catch (error) {
      console.error("Erro ao calcular frete:", error);
      // Fallback de segurança se a API falhar
      setShippingCost(3000);
    } finally {
      setIsCalculatingShipping(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsLoading(true);

    // O Stripe processa o pagamento do valor TOTAL (definido no backend na criação do Intent)
    // ATENÇÃO: Num cenário real avançado, você precisaria atualizar o PaymentIntent
    // no backend com o valor do frete novo antes de confirmar.
    // Para simplificar agora, assumimos que o valor do frete será cobrado ou ajustado.

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success`,
      },
    });

    if (error.type === "card_error" || error.type === "validation_error") {
      setMessage(error.message || "Ocorreu um erro.");
    } else {
      setMessage("Erro inesperado.");
    }

    setIsLoading(false);
  };

  // Soma o subtotal dos produtos + o frete calculado
  const total = getTotalPrice() + shippingCost;

  const formatPrice = (val: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val / 100);

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
          <PaymentElement />
        </div>
      </div>

      {/* LADO DIREITO: RESUMO */}
      <div>
        <div className="sticky top-24 rounded-xl border border-neutral-200 bg-white p-6 shadow-lg">
          <h2 className="mb-6 text-xl font-bold text-neutral-900">
            Resumo do Pedido
          </h2>

          {/* Lista compacta de itens */}
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
              <span className="flex items-center gap-2">
                Frete
                {deliveryDays && (
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                    {deliveryDays} dias úteis
                  </span>
                )}
              </span>
              <span className="font-medium text-orange-600">
                {isCalculatingShipping ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : shippingCost > 0 ? (
                  formatPrice(shippingCost)
                ) : (
                  "A calcular..."
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
              !stripe ||
              !elements ||
              shippingCost === 0
            }
            type="submit"
            className="mt-6 h-12 w-full bg-orange-600 text-base font-bold text-white hover:bg-orange-700 disabled:bg-neutral-300"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <>
                <Lock className="mr-2 h-4 w-4" />
                Pagar {formatPrice(total)}
              </>
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
