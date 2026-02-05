"use client";

import {
  AddressElement,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import {
  CreditCard,
  Info,
  Loader2,
  Lock,
  Ticket,
  Truck,
  X,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  createOrderCOD,
  getCartShippingCost,
  updateOrderAddressAction,
  updateOrderToCOD,
} from "@/actions/checkout";
import { validateCoupon } from "@/actions/coupons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/cart-store";

import { CheckoutAuth } from "./checkout-auth";

export function CheckoutForm({
  existingOrderId,
  userEmail,
}: {
  existingOrderId: string | null;
  userEmail?: string | null;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();

  const { data: session } = authClient.useSession();
  const finalUserEmail = userEmail || session?.user?.email;

  const {
    items,
    getTotalPrice,
    getSubtotal,
    coupon,
    applyCoupon,
    removeCoupon,
    clearCart,
  } = useCartStore();

  const [isLoading, setIsLoading] = useState(false);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);

  // --- ESTADOS DE FRETE ---
  const [baseShippingCost, setBaseShippingCost] = useState(0); // Valor original da API
  const [shippingCost, setShippingCost] = useState(0); // Valor aplicado na UI e Pedido

  const [message, setMessage] = useState<string | null>(null);

  const [couponInput, setCouponInput] = useState("");
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState<"card" | "cod">("card");
  const [isAddressComplete, setIsAddressComplete] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [addressDetails, setAddressDetails] = useState<any>(null);

  const cartCurrency = items.length > 0 ? items[0].currency || "GBP" : "GBP";

  const formatPrice = (val: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: cartCurrency,
    }).format(val / 100);

  // 1. CARREGA O FRETE BASE INICIAL
  useEffect(() => {
    if (items.length > 0) {
      const fetchShipping = async () => {
        setIsCalculatingShipping(true);
        try {
          const result = await getCartShippingCost(items);
          setBaseShippingCost(result.price);
          // Inicialmente, assumimos o frete base. A lógica de cidade vai sobrescrever se necessário.
          setShippingCost(result.price);
        } catch (error) {
          console.error("Erro frete:", error);
        } finally {
          setIsCalculatingShipping(false);
        }
      };
      fetchShipping();
    }
  }, [items]);

  // 2. MONITOR DE ENDEREÇO (A LÓGICA DE OURO)
  useEffect(() => {
    if (addressDetails?.address?.city) {
      const city = addressDetails.address.city.trim().toLowerCase();

      // Verifica variações comuns de Londres
      if (city === "london" || city === "londres") {
        setShippingCost(0);
      } else {
        // Se mudou para outra cidade, restaura o frete original
        setShippingCost(baseShippingCost);
      }
    } else {
      // Se limpou o endereço, volta ao base
      setShippingCost(baseShippingCost);
    }
  }, [addressDetails, baseShippingCost]);

  // --- CÁLCULOS FINAIS ---
  const subtotal = getSubtotal();
  // O total agora usa SEMPRE o `shippingCost` que já foi ajustado pelo useEffect acima
  const total = getTotalPrice() + shippingCost;
  const discountAmount = Math.max(0, subtotal - getTotalPrice());

  const OrderSummaryItems = () => (
    <div className="mb-6 max-h-[400px] overflow-y-auto pr-2">
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="flex items-start gap-4">
            <div className="relative h-16 w-16 min-w-[64px] overflow-hidden rounded-md border border-neutral-100 bg-neutral-50">
              {item.image ? (
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-neutral-400">
                  Sem foto
                </div>
              )}
            </div>
            <div className="flex flex-1 flex-col justify-between">
              <div className="flex justify-between gap-2">
                <span className="line-clamp-2 text-sm leading-snug font-medium text-neutral-900">
                  {item.name}
                </span>
                <span className="text-sm font-semibold whitespace-nowrap text-neutral-900">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-neutral-500">
                <span>Qtd: {item.quantity}</span>
                <span>Unit: {formatPrice(item.price)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (!finalUserEmail) {
    return (
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <CheckoutAuth />
        </div>

        <div>
          <div className="pointer-events-none sticky top-36 rounded-xl border border-neutral-200 bg-white p-6 opacity-80 shadow-lg">
            <h2 className="mb-6 text-xl font-bold text-neutral-900">
              Resumo do Pedido
            </h2>
            <OrderSummaryItems />
            <div className="flex justify-between border-t border-neutral-200 pt-4 text-lg font-bold">
              <span>Total Estimado</span>
              <span>{formatPrice(getTotalPrice())}</span>
            </div>
            <div className="mt-6 rounded-lg border border-emerald-100 bg-emerald-50 p-4 text-center">
              <p className="flex items-center justify-center gap-2 text-sm font-medium text-emerald-800">
                <Lock className="h-4 w-4" />
                Complete seu cadastro ao lado para finalizar
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleAddressChange = async (event: any) => {
    setAddressDetails(event.value);
    setIsAddressComplete(event.complete);
    if (event.complete && message?.includes("endereço")) {
      setMessage(null);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponInput) return;
    setIsValidatingCoupon(true);
    try {
      const currentSubtotal = getSubtotal();
      const result = await validateCoupon(couponInput, currentSubtotal);
      if (result.valid) {
        applyCoupon({
          code: couponInput.toUpperCase(),
          type: "fixed",
          value: result.discountAmount || 0,
        });
        toast.success(result.message);
        setCouponInput("");
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Erro ao validar cupom.");
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    toast.info("Cupom removido.");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAddressComplete || !addressDetails?.name) {
      setMessage("Por favor, preencha o endereço de entrega completo.");
      return;
    }

    if (paymentMethod === "card" && (!stripe || !elements)) return;

    setIsLoading(true);
    setMessage(null);

    // --- DADOS FINAIS DE ENVIO ---
    const shippingData = {
      street: addressDetails.address.line1,
      number: "N/A",
      complement: addressDetails.address.line2,
      city: addressDetails.address.city,
      state: addressDetails.address.state,
      zipCode: addressDetails.address.postal_code,
      phone: addressDetails.phone,
      // IMPORTANTE: Se o backend aceitar o custo do frete, passamos aqui.
      // Se não, o backend precisará recalcular com a mesma lógica de "London".
      cost: shippingCost,
    };

    if (paymentMethod === "card") {
      if (!stripe || !elements) return;

      const { error: submitError } = await elements.submit();
      if (submitError) {
        setMessage(submitError.message || "Erro na validação.");
        setIsLoading(false);
        return;
      }

      // Atualiza endereço no backend antes de confirmar no Stripe
      if (existingOrderId) {
        try {
          await updateOrderAddressAction(existingOrderId, shippingData);
        } catch (err) {
          console.error(err);
        }
      }

      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/sucesso`,
          shipping: {
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
          },
          receipt_email: finalUserEmail,
        },
      });

      if (error) setMessage(error.message || "Ocorreu um erro.");
      setIsLoading(false);
    } else {
      // --- PAGAMENTO NA ENTREGA (COD) ---
      try {
        let result;

        if (existingOrderId) {
          result = await updateOrderToCOD(existingOrderId, shippingData);
        } else {
          // Aqui passamos o shippingData que pode ser usado no backend para validar
          result = await createOrderCOD(items, coupon?.code, shippingData);
        }

        if (result.success) {
          clearCart();
          router.push(`/checkout/sucesso?orderId=${result.orderId}`);
        }
      } catch (error) {
        console.error(error);
        setMessage("Erro ao processar pedido. Verifique se está logado.");
        setIsLoading(false);
      }
    }
  };

  const isButtonDisabled =
    isLoading ||
    isCalculatingShipping ||
    !isAddressComplete ||
    (paymentMethod === "card" && (!stripe || !elements));

  let helperMessage = message;

  if (!helperMessage && isButtonDisabled && !isLoading) {
    if (!isAddressComplete) {
      helperMessage = "Preencha o endereço de entrega completo para continuar.";
    } else if (isCalculatingShipping) {
      helperMessage = "Calculando frete...";
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-6">
        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-bold text-neutral-900">
            Endereço de Entrega
          </h2>
          <AddressElement
            options={{
              mode: "shipping",
              allowedCountries: [
                "ES",
                "GB",
                "BR",
                "US",
                "DE",
                "FR",
                "IT",
                "PT",
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
              <CreditCard className="h-4 w-4" /> Pagar Agora
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
              <Truck className="h-4 w-4" /> Pagar na Entrega
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
                <strong>{formatPrice(total)}</strong> diretamente ao entregador.
              </p>
            </div>
          )}
        </div>
      </div>

      <div>
        <div className="sticky top-36 rounded-xl border border-neutral-200 bg-white p-6 shadow-lg">
          <h2 className="mb-6 text-lg font-bold text-neutral-900">
            Resumo do pedido
          </h2>

          <OrderSummaryItems />

          <div className="space-y-3 border-t border-neutral-100 pt-4 text-sm">
            <div className="flex justify-between text-neutral-600">
              <span className="font-semibold">Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-neutral-600">
              <span className="font-semibold">Frete</span>
              <span
                className={cn(
                  "font-medium",
                  shippingCost === 0 && baseShippingCost > 0
                    ? "text-emerald-600"
                    : "text-orange-600",
                )}
              >
                {isCalculatingShipping ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : shippingCost > 0 ? (
                  formatPrice(shippingCost)
                ) : // Se for 0, e o base era > 0, sabemos que é por causa de Londres
                baseShippingCost > 0 ? (
                  "Grátis (Londres)"
                ) : (
                  "Grátis"
                )}
              </span>
            </div>
            {coupon && discountAmount > 0 && (
              <div className="flex justify-between font-medium text-emerald-600">
                <span className="flex items-center gap-1">
                  Cupom ({coupon.code})
                </span>
                <span>- {formatPrice(discountAmount)}</span>
              </div>
            )}

            <div className="border-t border-neutral-200/70 pt-4">
              {!coupon ? (
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Ticket className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                    <Input
                      placeholder="Cupom"
                      className="h-10 pl-9"
                      value={couponInput}
                      onChange={(e) =>
                        setCouponInput(e.target.value.toUpperCase())
                      }
                    />
                  </div>
                  <Button
                    type="button"
                    className="h-10 cursor-pointer bg-emerald-500 shadow-md duration-300 hover:-translate-y-0.5 hover:bg-emerald-500"
                    onClick={handleApplyCoupon}
                    disabled={!couponInput || isValidatingCoupon}
                  >
                    {isValidatingCoupon ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Aplicar"
                    )}
                  </Button>
                </div>
              ) : (
                <div className="flex justify-between rounded-md bg-neutral-100 p-3 shadow-md">
                  <span className="flex items-center justify-center gap-2 text-sm font-bold text-neutral-800">
                    {coupon.code} <Ticket className="h-4 w-4 rotate-45" />
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={handleRemoveCoupon}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 flex justify-between border-t border-neutral-200 pt-4 text-lg font-bold text-neutral-900">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>

          <Button
            disabled={isButtonDisabled}
            type="submit"
            className="text-md mt-6 h-12 w-full bg-emerald-500 font-bold text-white hover:bg-emerald-600 disabled:bg-neutral-300 disabled:text-neutral-800"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : paymentMethod === "card" ? (
              <>
                <Lock className="mr-2 h-4 w-4" /> Comprar Agora
              </>
            ) : (
              "Concluir Pedido"
            )}
          </Button>

          {helperMessage && (
            <div className="mt-4 flex items-center justify-center gap-1 text-center text-xs font-medium text-neutral-500">
              <Info className="h-3.5 w-3.5" />
              {helperMessage}
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
