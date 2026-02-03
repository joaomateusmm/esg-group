"use client";

import {
  AddressElement,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { CreditCard, Loader2, Lock, PackageCheck, Truck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// IMPORTAR A NOVA ACTION: updateOrderToCOD
import {
  createOrderCOD,
  getCartShippingCost,
  updateOrderToCOD,
} from "@/actions/checkout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/cart-store";

// RECEBER A PROP existingOrderId
export function CheckoutForm({
  existingOrderId,
}: {
  existingOrderId: string | null;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { items, getTotalPrice, clearCart } = useCartStore();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
  const [shippingCost, setShippingCost] = useState(0);
  const [message, setMessage] = useState<string | null>(null);

  const [paymentMethod, setPaymentMethod] = useState<"card" | "cod">("card");

  const cartCurrency = items.length > 0 ? items[0].currency || "GBP" : "GBP";

  const formatPrice = (val: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: cartCurrency,
    }).format(val / 100);

  // CÁLCULO DAS DATAS DE ENTREGA
  const today = new Date();
  const deliveryStart = new Date(today);
  deliveryStart.setDate(today.getDate() + 10);
  const deliveryEnd = new Date(today);
  deliveryEnd.setDate(today.getDate() + 17);

  const deliveryDateString = `${deliveryStart.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  })} a ${deliveryEnd.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  })}`;

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
          number: "N/A",
          complement: addressDetails.address.line2,
          city: addressDetails.address.city,
          state: addressDetails.address.state,
          zipCode: addressDetails.address.postal_code,
          phone: addressDetails.phone,
        };

        let result;

        // LÓGICA DE CORREÇÃO DE DUPLICIDADE:
        // Se já existe um pedido criado pelo Stripe (existingOrderId), ATUALIZAMOS ele.
        if (existingOrderId) {
          result = await updateOrderToCOD(
            existingOrderId,
            {
              email: "guest@example.com", // Ajustar se tiver user logado
              name: addressDetails.name,
            },
            shippingData,
          );
        } else {
          // Se não existe (ex: stripe falhou em carregar), CRIAMOS um novo.
          result = await createOrderCOD(
            items,
            {
              email: "guest@example.com",
              name: addressDetails.name,
            },
            undefined,
            shippingData,
          );
        }

        if (result.success) {
          clearCart();
          router.push(`/checkout/sucesso?orderId=${result.orderId}`);
        }
      } catch (error) {
        console.error(error);
        if (error instanceof Error) {
          setMessage(error.message);
        } else {
          setMessage("Erro ao processar pedido.");
        }
        setIsLoading(false);
      }
    }
  };

  const total = getTotalPrice() + shippingCost;

  return (
    <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-2">
      {/* ... (RESTO DO JSX MANTIDO IGUAL) ... */}
      {/* Apenas certifique-se de copiar o JSX do seu arquivo original ou do anterior, não mudei nada no visual */}
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

      <div>
        <div className="sticky top-36 rounded-xl border border-neutral-200 bg-white p-6 shadow-lg">
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

            <div className="flex items-center justify-between rounded-md bg-green-50 px-3 py-2 text-green-800">
              <span className="flex items-center gap-2 text-xs font-semibold tracking-wide uppercase">
                <PackageCheck className="h-4 w-4" /> Previsão de Entrega
              </span>
              <span className="font-bold">{deliveryDateString}</span>
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
