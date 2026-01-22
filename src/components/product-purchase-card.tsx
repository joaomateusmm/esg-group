"use client";

import {
  Check,
  CreditCard,
  Lock,
  ShieldCheck,
  Ticket,
  X,
  XCircle,
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
    } catch {
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

  // Tratamento seguro para isStockUnlimited (caso venha null do banco)
  const isStockUnlimitedSafe = product.isStockUnlimited ?? false;

  return (
    <>
      {/* --- CARD 1: INFORMAÇÕES DE COMPRA --- */}
      <Card className="border-neutral-200 bg-white shadow-md">
        <CardContent className="space-y-6 p-6">
          {/* Cabeçalho */}
          <div>
            <div className="mb-3 flex flex-wrap gap-2">
              {categoryNames.map((cat) => (
                <Badge
                  key={cat}
                  variant="secondary"
                  className="bg-neutral-100 text-xs font-medium text-neutral-600 hover:bg-neutral-200"
                >
                  {cat}
                </Badge>
              ))}
            </div>
            <h1 className="font-clash-display text-3xl leading-tight font-semibold text-neutral-900">
              {product.name}
            </h1>
          </div>

          <Separator className="bg-neutral-100" />

          {/* Preços */}
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              {(product.discountPrice || appliedCoupon) && (
                <span className="text-sm text-neutral-400 line-through decoration-neutral-300">
                  {formatPrice(product.price)}
                </span>
              )}

              {originalDiscountPercentage > 0 && !appliedCoupon && (
                <Badge className="border-0 bg-green-50 text-xs text-green-700 hover:bg-green-100">
                  {originalDiscountPercentage}% OFF
                </Badge>
              )}
              {appliedCoupon && (
                <Badge className="border-0 bg-blue-50 text-xs text-blue-700 hover:bg-blue-100">
                  CUPOM ATIVO
                </Badge>
              )}
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-neutral-900">
                {finalPrice === 0 ? "Gratuito" : formatPrice(finalPrice)}
              </span>
            </div>
            {finalPrice > 0 && (
              <p className="text-sm font-medium text-neutral-500">
                À vista no PIX
              </p>
            )}
          </div>

          {/* Entrega */}
          {product.deliveryMode === "email" && (
            <div className="flex items-center gap-2 rounded-md border border-orange-200 bg-orange-50 p-3 text-sm text-orange-700">
              <Zap className="h-4 w-4 shrink-0 fill-current text-orange-500" />
              <span className="font-medium">Entrega Automática via E-mail</span>
            </div>
          )}

          {/* Botões */}
          <div className="space-y-4 py-2">
            <BuyNowButton
              product={{
                id: product.id,
                name: product.name,
                price: initialPrice,
                image: productImage,
                stock: product.stock,
                isStockUnlimited: isStockUnlimitedSafe,
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
                  stock: product.stock,
                  isStockUnlimited: isStockUnlimitedSafe,
                }}
                variant="outline"
                size="lg"
                className="text-md h-14 flex-1 border-neutral-300 bg-white font-bold text-neutral-700 shadow-sm hover:bg-neutral-50 hover:text-neutral-900"
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
                    <Ticket className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                    <Input
                      placeholder="Cupom de desconto"
                      className="h-10 border-neutral-300 bg-white pl-9 text-neutral-900 placeholder:text-neutral-400 focus:border-orange-500 focus:ring-orange-500"
                      value={couponCode}
                      onChange={(e) =>
                        setCouponCode(e.target.value.toUpperCase())
                      }
                    />
                  </div>
                  <Button
                    variant="secondary"
                    className="h-10 border border-neutral-200 bg-neutral-100 text-neutral-700 shadow-sm hover:bg-neutral-200"
                    onClick={handleApplyCoupon}
                    disabled={!couponCode || isValidating}
                  >
                    {isValidating ? "..." : "Aplicar"}
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-md border border-green-200 bg-green-50 p-3">
                  <div className="flex items-center gap-2">
                    <Ticket className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-sm font-bold text-green-700">
                        {appliedCoupon.code}
                      </p>
                      <p className="text-xs text-green-600">
                        Desconto de {formatPrice(appliedCoupon.discount)}{" "}
                        aplicado
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-green-600 hover:bg-green-100"
                    onClick={handleRemoveCoupon}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Rodapé de Segurança */}
          <div className="grid grid-cols-2 gap-4 text-xs font-medium text-neutral-500">
            <div className="flex flex-col items-center justify-center gap-1 rounded border border-neutral-100 bg-neutral-50 p-3 text-center">
              <ShieldCheck className="h-5 w-5 text-neutral-400" />
              <span>Compra 100% Segura</span>
            </div>
            <div className="flex flex-col items-center justify-center gap-1 rounded border border-neutral-100 bg-neutral-50 p-3 text-center">
              {isStockUnlimitedSafe ? (
                <>
                  <Check className="h-5 w-5 text-green-600" />
                  <span className="text-green-700">Estoque Ilimitado</span>
                </>
              ) : (product.stock || 0) > 0 ? (
                <>
                  <Lock className="h-5 w-5 text-neutral-400" />
                  <span>
                    Restam{" "}
                    <span className="font-bold text-neutral-700">
                      {product.stock}
                    </span>{" "}
                    unidades.
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-600" />
                  <span className="font-bold text-red-700">
                    Produto Esgotado
                  </span>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* --- CARD 2: FORMAS DE PAGAMENTO (SEPARADO) --- */}
      {product.paymentMethods && product.paymentMethods.length > 0 && (
        <Card className="mt-6 border-neutral-200 bg-white shadow-sm">
          <CardContent className="pt-6">
            <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold text-neutral-900">
              <CreditCard className="h-4 w-4 text-orange-600" />
              Formas de Pagamento
            </h4>
            <div className="flex flex-wrap gap-2">
              {product.paymentMethods.map((method) => (
                <Badge
                  key={method}
                  variant="secondary"
                  className="border border-neutral-200 bg-neutral-50 px-3 py-1 font-normal text-neutral-600 hover:bg-neutral-100"
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
