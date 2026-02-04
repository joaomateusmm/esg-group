"use client";

import {
  Check,
  CreditCard,
  Globe, // Ícone para o accordion
  Lock,
  ShieldCheck,
  XCircle,
  Zap,
} from "lucide-react";
import { useState } from "react";

import { AddToCartButton } from "@/components/add-to-cart-button";
import { AddToWishlistButton } from "@/components/AddToWishlistButton";
import { BuyNowButton } from "@/components/BuyNowButton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// --- CONFIGURAÇÃO DE MOEDAS ---
const EXCHANGE_RATES: Record<string, number> = {
  GBP: 1, // Libra (Base)
  USD: 1.27, // Dólar
  EUR: 1.15, // Euro
  BRL: 7.35, // Real
};

const formatPrice = (value: number, currencyCode: string = "BRL") => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: currencyCode,
  }).format(value / 100);
};

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
    currency?: string; // 1. Recebemos a moeda aqui
  };
  categoryNames: string[];
}

export function ProductPurchaseCard({
  product,
  categoryNames,
}: ProductPurchaseCardProps) {
  const initialPrice = product.discountPrice || product.price;
  const productCurrency = product.currency || "GBP";

  const [finalPrice] = useState(initialPrice);
  const [appliedCoupon] = useState<{
    code: string;
    discount: number;
  } | null>(null);

  const originalDiscountPercentage =
    product.discountPrice && product.price
      ? Math.round(
          ((product.price - product.discountPrice) / product.price) * 100,
        )
      : 0;

  // Função auxiliar para conversão
  const getConvertedPrice = (priceInCents: number, targetCurrency: string) => {
    const basePrice = priceInCents / EXCHANGE_RATES[productCurrency];
    const converted = basePrice * EXCHANGE_RATES[targetCurrency];
    return formatPrice(converted, targetCurrency);
  };

  const productImage = product.images?.[0] || "";
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
                  {formatPrice(product.price, productCurrency)}
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
                {finalPrice === 0
                  ? "Gratuito"
                  : formatPrice(finalPrice, productCurrency)}
              </span>
            </div>

            {/* 2. ACCORDION DE MOEDAS (NOVO) */}
            {finalPrice > 0 && (
              <div className="mt-2">
                <Accordion
                  type="single"
                  collapsible
                  className="w-full border-none"
                >
                  <AccordionItem value="currencies" className="border-none">
                    <AccordionTrigger className="flex h-6 justify-start gap-1 py-0 text-[11px] font-medium text-neutral-500 hover:text-orange-600 hover:no-underline data-[state=open]:text-orange-600">
                      <Globe className="h-3 w-3" />
                      <span>Ver preço em outras moedas</span>
                    </AccordionTrigger>
                    <AccordionContent className="pt-3 pb-1">
                      <div className="grid grid-cols-2 gap-2 rounded-lg bg-neutral-50 p-3 text-xs text-neutral-600 sm:grid-cols-3">
                        {["GBP", "USD", "EUR", "BRL"]
                          .filter((c) => c !== productCurrency)
                          .map((target) => (
                            <div key={target} className="flex flex-col">
                              <span className="text-[10px] font-bold text-neutral-400">
                                {target}
                              </span>
                              <span className="font-mono text-neutral-900">
                                {getConvertedPrice(finalPrice, target)}
                              </span>
                            </div>
                          ))}
                        <div className="col-span-full mt-1 border-t border-neutral-200 pt-1 text-[9px] text-neutral-400">
                          * Conversão estimada. O valor final pode variar no
                          checkout.
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
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
                className="text-md h-14 flex-1 border-neutral-300 bg-white font-bold text-neutral-700 shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:bg-neutral-50 hover:text-neutral-900"
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
                    unidade(s).
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
