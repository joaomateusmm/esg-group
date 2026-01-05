import { eq, inArray } from "drizzle-orm";
import {
  Check,
  CreditCard,
  HeartPlus,
  Lock,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { notFound } from "next/navigation";

import { AddToCartButton } from "@/components/add-to-cart-button";
import { BuyNowButton } from "@/components/BuyNowButton"; // <--- Importe o novo botão
import { Header } from "@/components/Header";
import { ProductGallery } from "@/components/product-gallery";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { db } from "@/db";
import { category, product } from "@/db/schema";

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;

  const productData = await db.query.product.findFirst({
    where: eq(product.id, id),
  });

  if (!productData) {
    return notFound();
  }

  let categoryNames: string[] = [];
  if (productData.categories && productData.categories.length > 0) {
    const categories = await db
      .select({ name: category.name })
      .from(category)
      .where(inArray(category.id, productData.categories));
    categoryNames = categories.map((c) => c.name);
  }

  const formatPrice = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value / 100);

  // Calcula desconto
  const discountPercentage =
    productData.discountPrice && productData.price
      ? Math.round(
          ((productData.price - productData.discountPrice) /
            productData.price) *
            100,
        )
      : 0;

  // Define o preço final para uso no componente
  const finalPrice = productData.discountPrice || productData.price;
  const productImage = productData.images?.[0] || "";

  return (
    <div className="min-h-screen bg-[#010000] py-40">
      <div className="z-[100] w-full bg-[#010000]">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-center">
          <Header />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 md:px-8">
        {/* --- GRID SUPERIOR: GALERIA E INFO DE COMPRA --- */}
        <div className="grid gap-8 lg:grid-cols-12">
          {/* COLUNA ESQUERDA (Galeria + Descrição) - Ocupa 7 colunas */}
          <div className="space-y-8 lg:col-span-7">
            <ProductGallery
              images={productData.images || []}
              productName={productData.name}
            />

            {/* Descrição agora fica abaixo da galeria em telas grandes */}
            <div className="rounded-xl border border-white/10 bg-[#0A0A0A] p-6 md:p-8">
              <h3 className="mb-4 flex items-center gap-2 text-xl font-medium text-white">
                <span className="h-6 w-1 rounded-full bg-[#D00000]"></span>
                Descrição
              </h3>
              <div className="prose prose-invert max-w-none text-neutral-400">
                <p className="leading-relaxed whitespace-pre-line">
                  {productData.description || "Sem descrição disponível."}
                </p>
              </div>
            </div>
          </div>

          {/* COLUNA DIREITA (Sidebar de Compra) - Ocupa 5 colunas */}
          <div className="space-y-6 lg:col-span-5">
            {/* Card Principal de Compra */}
            <Card className="border-white/10 bg-[#0A0A0A] shadow-xl shadow-black/50">
              <CardContent className="space-y-6 p-6">
                {/* Título e Categorias */}
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
                    {productData.name}
                  </h1>
                </div>

                <Separator className="bg-white/5" />

                {/* Preço e Entrega */}
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    {productData.discountPrice && (
                      <span className="text-sm text-neutral-500 line-through decoration-white/20">
                        {formatPrice(productData.price)}
                      </span>
                    )}
                    {discountPercentage > 0 && (
                      <Badge className="border-0 bg-green-500/10 text-xs text-green-500 hover:bg-green-500/20">
                        {discountPercentage}% OFF
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-4xl font-bold text-white">
                      {formatPrice(finalPrice)}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-500">À vista no PIX</p>
                </div>

                {/* Modos de Entrega Dinâmico */}
                {productData.deliveryMode === "email" && (
                  <div className="flex items-center gap-2 rounded-md border border-[#D00000]/20 bg-[#D00000]/10 p-3 text-sm text-[#D00000]">
                    <Zap className="h-4 w-4 shrink-0 fill-current" />
                    <span className="font-medium">
                      Entrega Automática via E-mail
                    </span>
                  </div>
                )}

                {/* Botões de Ação */}
                <div className="py-2">
                  {/* SUBSTITUÍDO: Link direto pela Action de Compra */}
                  <BuyNowButton
                    product={{
                      id: productData.id,
                      name: productData.name,
                      price: finalPrice,
                      image: productImage,
                    }}
                  />

                  <div className="flex w-full gap-4">
                    <AddToCartButton
                      product={{
                        id: productData.id,
                        name: productData.name,
                        price: productData.price,
                        discountPrice: productData.discountPrice,
                        images: productData.images,
                      }}
                      variant="outline"
                      size="lg"
                      className="text-md h-14 flex-1 border-white/10 bg-transparent font-bold text-white hover:bg-white/5"
                    />

                    <Button
                      variant="outline"
                      size="lg"
                      className="text-md h-14 flex-1 border-white/10 bg-transparent font-bold text-white hover:bg-white/5"
                    >
                      <HeartPlus className="mr-2 h-5 w-5" />
                      Favoritar
                    </Button>
                  </div>
                </div>

                {/* Estoque e Segurança */}
                <div className="grid grid-cols-2 gap-4 text-xs text-neutral-500">
                  <div className="flex flex-col items-center justify-center gap-1 rounded bg-white/5 p-2 text-center">
                    <ShieldCheck className="h-5 w-5 text-neutral-300" />
                    <span>Compra 100% Segura</span>
                  </div>
                  <div className="flex flex-col items-center justify-center gap-1 rounded bg-white/5 p-2 text-center">
                    {productData.isStockUnlimited ? (
                      <>
                        <Check className="h-5 w-5 text-green-500" />
                        <span className="text-green-500">
                          Estoque Ilimitado
                        </span>
                      </>
                    ) : (
                      <>
                        <Lock className="h-5 w-5 text-neutral-300" />
                        <span>Restam {productData.stock} un.</span>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Métodos de Pagamento */}
            {productData.paymentMethods &&
              productData.paymentMethods.length > 0 && (
                <div className="rounded-xl border border-white/10 bg-[#0A0A0A] p-5">
                  <h4 className="mb-3 flex items-center gap-2 text-sm font-medium text-white">
                    <CreditCard className="h-4 w-4 text-[#D00000]" />
                    Formas de Pagamento
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {productData.paymentMethods.map((method) => (
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
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
