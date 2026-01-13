"use client";

import {
  Check,
  CreditCard,
  Lock,
  ShieldCheck,
  Ticket,
  X,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { validateCoupon } from "@/actions/coupons";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { AddToWishlistButton } from "@/components/AddToWishlistButton";
import { BuyNowButton } from "@/components/BuyNowButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

interface ProductPurchaseCardProps {
  product: {
    id: string;
    name: string;
    price: number;
    discountPrice?: number | null;
    images: string[] | null;
    deliveryMode: string;
    isStockUnlimited: boolean | null;
    stock: number | null;
    paymentMethods: string[] | null;
  };
  categoryNames: string[];
}

const formatPrice = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value / 100);
};

export function ProductPurchaseCard({
  product,
  categoryNames,
}: ProductPurchaseCardProps) {
  const initialPrice = product.discountPrice || product.price;

  const [finalPrice, setFinalPrice] = useState(initialPrice);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
  } | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const originalDiscountPercentage =
    product.discountPrice && product.price
      ? Math.round(
          ((product.price - product.discountPrice) / product.price) * 100,
        )
      : 0;

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setIsValidating(true);

    try {
      const result = await validateCoupon(couponCode, initialPrice);

      if (result.valid && result.newTotal !== undefined) {
        setFinalPrice(result.newTotal);
        setAppliedCoupon({
          code: couponCode,
          discount: result.discountAmount || 0,
        });
        toast.success(result.message);
      } else {
        toast.error(result.message);
        setAppliedCoupon(null);
        setFinalPrice(initialPrice);
      }
    } catch (error) {
      toast.error("Erro ao validar cupom.");
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setFinalPrice(initialPrice);
    toast.info("Cupom removido.");
  };

  const productImage = product.images?.[0] || "";

  return (
    <>
      {/* --- CARD 1: INFORMAÇÕES DE COMPRA --- */}
      <Card className="border-white/10 bg-[#0A0A0A] shadow-xl shadow-black/50">
        <CardContent className="space-y-6 p-6">
          {/* Cabeçalho */}
          <div>
            <div className="mb-3 flex flex-wrap gap-2">
              {categoryNames.map((cat) => (
                <Badge
                  key={cat}
                  variant="secondary"
                  className="bg-white/5 text-xs text-neutral-400 hover:bg-white/10"
                >
                  {cat}
                </Badge>
              ))}
            </div>
            <h1 className="font-clash-display text-3xl font-medium text-white">
              {product.name}
            </h1>
          </div>

          <Separator className="bg-white/5" />

          {/* Preços */}
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              {(product.discountPrice || appliedCoupon) && (
                <span className="text-sm text-neutral-500 line-through decoration-white/20">
                  {formatPrice(product.price)}
                </span>
              )}

              {originalDiscountPercentage > 0 && !appliedCoupon && (
                <Badge className="border-0 bg-green-500/10 text-xs text-green-500 hover:bg-green-500/20">
                  {originalDiscountPercentage}% OFF
                </Badge>
              )}
              {appliedCoupon && (
                <Badge className="border-0 bg-blue-500/10 text-xs text-blue-500 hover:bg-blue-500/20">
                  CUPOM ATIVO
                </Badge>
              )}
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-white">
                {finalPrice === 0 ? "Gratuito" : formatPrice(finalPrice)}
              </span>
            </div>
            {finalPrice > 0 && (
              <p className="text-sm text-neutral-500">À vista no PIX</p>
            )}
          </div>

          {/* Entrega */}
          {product.deliveryMode === "email" && (
            <div className="flex items-center gap-2 rounded-md border border-[#D00000]/20 bg-[#D00000]/10 p-3 text-sm text-[#D00000]">
              <Zap className="h-4 w-4 shrink-0 fill-current" />
              <span className="font-medium">Entrega Automática via E-mail</span>
            </div>
          )}

          {/* Botões */}
          <div className="space-y-4 py-2">
            <BuyNowButton
              product={{
                id: product.id,
                name: product.name,
                price: initialPrice, // Envia preço original para o backend calcular
                image: productImage,
              }}
              couponCode={appliedCoupon?.code}
            />

            <div className="flex w-full gap-4">
              <AddToCartButton
                product={{
                  id: product.id,
                  name: product.name,
                  price: product.price,
                  discountPrice: product.discountPrice,
                  images: product.images,
                }}
                variant="outline"
                size="lg"
                className="text-md h-14 flex-1 border-white/10 bg-transparent font-bold text-white hover:bg-white/5"
              />

              <AddToWishlistButton
                product={{
                  id: product.id,
                  name: product.name,
                  price: finalPrice,
                  image: productImage,
                  category: categoryNames[0] || "Geral",
                }}
              />
            </div>

            {/* Área do Cupom */}
            <div className="pt-2">
              {!appliedCoupon ? (
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Ticket className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                    <Input
                      placeholder="Cupom de desconto"
                      className="h-10 border-white/10 bg-white/5 pl-9 text-white"
                      value={couponCode}
                      onChange={(e) =>
                        setCouponCode(e.target.value.toUpperCase())
                      }
                    />
                  </div>
                  <Button
                    variant="secondary"
                    className="h-10 bg-white/10 text-white hover:bg-white/20"
                    onClick={handleApplyCoupon}
                    disabled={!couponCode || isValidating}
                  >
                    {isValidating ? "..." : "Aplicar"}
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-md border border-green-500/20 bg-green-500/10 p-3">
                  <div className="flex items-center gap-2">
                    <Ticket className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="text-sm font-bold text-green-500">
                        {appliedCoupon.code}
                      </p>
                      <p className="text-xs text-green-400/70">
                        Desconto de {formatPrice(appliedCoupon.discount)}{" "}
                        aplicado
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-green-500 hover:bg-green-500/20 hover:text-green-400"
                    onClick={handleRemoveCoupon}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Rodapé de Segurança */}
          <div className="grid grid-cols-2 gap-4 text-xs text-neutral-500">
            <div className="flex flex-col items-center justify-center gap-1 rounded bg-white/5 p-2 text-center">
              <ShieldCheck className="h-5 w-5 text-neutral-300" />
              <span>Compra 100% Segura</span>
            </div>
            <div className="flex flex-col items-center justify-center gap-1 rounded bg-white/5 p-2 text-center">
              {product.isStockUnlimited ? (
                <>
                  <Check className="h-5 w-5 text-green-500" />
                  <span className="text-green-500">Estoque Ilimitado</span>
                </>
              ) : (
                <>
                  <Lock className="h-5 w-5 text-neutral-300" />
                  <span>Restam {product.stock} un.</span>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* --- CARD 2: FORMAS DE PAGAMENTO (SEPARADO) --- */}
      {product.paymentMethods && product.paymentMethods.length > 0 && (
        <Card className="mt-6 border-white/10 bg-[#0A0A0A]">
          <CardContent>
            <h4 className="mb-3 flex items-center gap-2 text-sm font-medium text-white">
              <CreditCard className="h-4 w-4 text-[#D00000]" />
              Formas de Pagamento
            </h4>
            <div className="flex flex-wrap gap-2">
              {product.paymentMethods.map((method) => (
                <Badge
                  key={method}
                  variant="secondary"
                  className="border-white/5 bg-white/5 font-normal text-neutral-400 hover:bg-white/10"
                >
                  {method === "credit_card"
                    ? "Cartão de Crédito"
                    : method === "debit_card"
                      ? "Cartão de Débito"
                      : method === "pix"
                        ? "Pix"
                        : method === "boleto"
                          ? "Boleto"
                          : method}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
