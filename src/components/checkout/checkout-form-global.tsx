"use client";

import {
  AddressElement,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import {
  CreditCard,
  Loader2,
  Lock,
  Mail,
  Ticket,
  Truck,
  X,
} from "lucide-react";
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
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/cart-store";

export function CheckoutForm({
  existingOrderId,
  userEmail,
}: {
  existingOrderId: string | null;
  userEmail?: string | null;
}) {
  const stripe = useStripe();
  const elements = useElements();

  const {
    items,
    getTotalPrice,
    getSubtotal,
    coupon,
    applyCoupon,
    removeCoupon,
    clearCart,
  } = useCartStore();

  const router = useRouter();

  // Estado para o email do visitante
  const [guestEmail, setGuestEmail] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
  const [shippingCost, setShippingCost] = useState(0);
  const [message, setMessage] = useState<string | null>(null);

  const [couponInput, setCouponInput] = useState("");
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState<"card" | "cod">("card");

  // ESTADO PARA CONTROLAR SE O ENDEREÇO ESTÁ COMPLETO
  const [isAddressComplete, setIsAddressComplete] = useState(false);

  const cartCurrency = items.length > 0 ? items[0].currency || "GBP" : "GBP";

  const formatPrice = (val: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: cartCurrency,
    }).format(val / 100);

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
    // O Stripe manda event.complete = true quando todos os campos obrigatórios estão preenchidos
    setIsAddressComplete(event.complete);
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
    } catch (error) {
      console.error(error);
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

    // TRAVA DUPLA: Valida Endereço E Email
    if (
      !isAddressComplete ||
      !addressDetails ||
      !addressDetails.address ||
      !addressDetails.name
    ) {
      setMessage("Por favor, preencha o endereço de entrega completo.");
      return;
    }

    if (!userEmail && !guestEmail) {
      setMessage("Por favor, informe seu e-mail para contato.");
      return;
    }

    const finalEmail = userEmail || guestEmail;

    if (paymentMethod === "card" && (!stripe || !elements)) {
      return;
    }

    setIsLoading(true);
    setMessage(null);

    // --- FLUXO 1: CARTÃO (STRIPE) ---
    if (paymentMethod === "card") {
      if (!stripe || !elements) return;

      const { error: submitError } = await elements.submit();
      if (submitError) {
        setMessage(submitError.message || "Erro na validação do formulário.");
        setIsLoading(false);
        return;
      }

      // 2. SALVAR ENDEREÇO E EMAIL NO BANCO (CRUCIAL PARA O ORDER CARD FUNCIONAR)
      if (existingOrderId) {
        try {
          await updateOrderAddressAction(
            existingOrderId,
            {
              street: addressDetails.address.line1,
              number: "N/A",
              complement: addressDetails.address.line2,
              city: addressDetails.address.city,
              state: addressDetails.address.state,
              zipCode: addressDetails.address.postal_code,
              phone: addressDetails.phone,
            },
            finalEmail, // <--- AQUI ESTÁ A CORREÇÃO: Passando o e-mail!
          );
        } catch (err) {
          console.error("Erro ao salvar endereço:", err);
        }
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
          receipt_email: finalEmail, // Passa o e-mail para o Stripe
        },
      });

      if (error.type === "card_error" || error.type === "validation_error") {
        setMessage(error.message || "Ocorreu um erro.");
      } else {
        setMessage("Erro inesperado.");
      }
      setIsLoading(false);
    }

    // --- FLUXO 2: COD (PAGAMENTO NA ENTREGA) ---
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

        const customerInfo = {
          email: finalEmail, // E-mail real (shadow ou user)
          name: addressDetails.name,
        };

        if (existingOrderId) {
          result = await updateOrderToCOD(
            existingOrderId,
            customerInfo,
            shippingData,
          );
        } else {
          result = await createOrderCOD(
            items,
            customerInfo,
            coupon?.code,
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

  const subtotal = getSubtotal();
  const totalPrice = getTotalPrice();
  const discountAmount = Math.max(0, subtotal - totalPrice);
  const total = totalPrice + shippingCost;

  return (
    <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-6">
        {/* --- 3. INPUT DE EMAIL (Só aparece se não estiver logado) --- */}
        {!userEmail && (
          <div className="rounded-xl border border-neutral-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-bold text-neutral-900">
              Dados de Contato
            </h2>
            <div className="relative">
              <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <Input
                type="email"
                placeholder="Seu melhor e-mail para receber atualizações"
                className="h-11 border-neutral-300 pl-10 focus:border-orange-500 focus:ring-orange-500"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                required
              />
            </div>
            <p className="mt-2 text-xs text-neutral-500">
              Usaremos este e-mail para enviar o rastreio e atualizações do
              pedido.
            </p>
          </div>
        )}

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
              <span className="flex items-center gap-2 font-semibold">
                Subtotal
              </span>
              <span>{formatPrice(subtotal)}</span>
            </div>

            <div className="flex items-center justify-between text-neutral-600">
              <span className="flex items-center gap-2 font-semibold">
                Frete
              </span>
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

            {coupon && discountAmount > 0 && (
              <div className="flex justify-between font-medium text-emerald-600">
                <span className="flex items-center gap-1"> Cupom</span>
                <span>- {formatPrice(discountAmount)}</span>
              </div>
            )}

            <div className="flex items-center justify-between rounded-md text-neutral-600">
              <span className="flex items-center gap-2 text-sm font-semibold tracking-wide">
                {" "}
                Previsão de Entrega
              </span>
              <span>Dos dias {deliveryDateString}</span>
            </div>

            <div className="border-t border-neutral-200/70 pt-4">
              {!coupon ? (
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Ticket className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                    <Input
                      placeholder="Possui um cupom?"
                      className="h-10 border-neutral-300 bg-white pl-9 text-neutral-900 placeholder:text-neutral-400 focus:border-orange-500 focus:ring-orange-500"
                      value={couponInput}
                      onChange={(e) =>
                        setCouponInput(e.target.value.toUpperCase())
                      }
                    />
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-10 border border-neutral-200/70 bg-neutral-100 text-neutral-700 shadow-sm hover:bg-neutral-200"
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
                <div className="flex items-center justify-between rounded-md border border-neutral-200 bg-neutral-50 p-3">
                  <div className="flex items-center gap-2">
                    <Ticket className="h-4 w-4 text-neutral-600" />
                    <div>
                      <p className="text-sm font-bold text-neutral-700">
                        {coupon.code}
                      </p>
                      <p className="text-xs text-neutral-600">
                        Desconto de {formatPrice(discountAmount)} aplicado
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-neutral-600 hover:bg-neutral-100"
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
            disabled={
              isLoading ||
              isCalculatingShipping ||
              !isAddressComplete || // Trava Endereço
              (!userEmail && !guestEmail) || // Trava E-mail
              (paymentMethod === "card" && (!stripe || !elements))
            }
            type="submit"
            className="mt-6 h-12 w-full cursor-pointer bg-emerald-500 text-base font-bold text-white shadow-md duration-300 hover:-translate-y-0.5 hover:bg-emerald-600 disabled:transform-none disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-neutral-800 disabled:shadow-none"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : paymentMethod === "card" ? (
              <>
                <Lock className="mr-2 h-4 w-4" />
                Comprar Agora
              </>
            ) : (
              <>Concluir Pedido</>
            )}
          </Button>

          {(!isAddressComplete || (!userEmail && !guestEmail)) &&
            !isLoading && (
              <div className="mt-4 text-center text-xs text-neutral-500">
                Preencha os dados de contato e entrega.
              </div>
            )}

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
