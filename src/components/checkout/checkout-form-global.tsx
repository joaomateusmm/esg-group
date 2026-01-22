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
  const { items, getTotalPrice } = useCartStore();

  const [isLoading, setIsLoading] = useState(false);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
  const [shippingCost, setShippingCost] = useState(0);
  const [deliveryDays, setDeliveryDays] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // ESTADO PARA GUARDAR OS DADOS DO ENDEREÇO
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [addressDetails, setAddressDetails] = useState<any>(null);

  // Função chamada quando o endereço muda no Stripe
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleAddressChange = async (event: any) => {
    // Guarda os dados do endereço sempre que mudar
    setAddressDetails(event.value);

    if (!event.complete) return;

    const address = event.value.address;

    setIsCalculatingShipping(true);

    try {
      const result = await calculateShippingAction({
        destinationPostalCode: address.postal_code,
        destinationCountry: address.country,
        items: items.map((item) => ({
          id: item.id,
          quantity: item.quantity,
        })),
      });

      setShippingCost(result.price);
      setDeliveryDays(result.estimatedDays);
    } catch (error) {
      console.error("Erro ao calcular frete:", error);
      setShippingCost(3000); // Fallback
    } finally {
      setIsCalculatingShipping(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    // Trigger form validation
    const { error: submitError } = await elements.submit();
    if (submitError) {
      setMessage(submitError.message || "Erro na validação do formulário.");
      setIsLoading(false);
      return;
    }

    // PREPARA OS DADOS DE ENDEREÇO E TELEFONE
    // Se o AddressElement capturou o telefone, ele estará em addressDetails.phone
    const shippingDetails = addressDetails
      ? {
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
        }
      : undefined;

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success`,
        // FORÇA O ENVIO DOS DADOS DE ENTREGA
        shipping: shippingDetails,
      },
    });

    if (error.type === "card_error" || error.type === "validation_error") {
      setMessage(error.message || "Ocorreu um erro.");
    } else {
      setMessage("Erro inesperado.");
    }

    setIsLoading(false);
  };

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
