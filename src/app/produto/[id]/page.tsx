import { desc, eq, inArray } from "drizzle-orm";
import {
  Check,
  CreditCard,
  HeartPlus,
  Lock,
  MessageSquare,
  ShieldCheck,
  Star,
  User, // Ícone
  Zap,
} from "lucide-react";
import { headers } from "next/headers"; // <--- Importante para pegar a sessão
import Image from "next/image";
import { notFound } from "next/navigation";

import { AddToCartButton } from "@/components/add-to-cart-button";
import { BuyNowButton } from "@/components/BuyNowButton";
// IMPORTAÇÃO DO NOVO BOTÃO
import { DeleteReviewButton } from "@/components/delete-review-button";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ProductGallery } from "@/components/product-gallery";
import { ProductReviewForm } from "@/components/product-review-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { db } from "@/db";
import { category, product, review, user as userTable } from "@/db/schema";
import { auth } from "@/lib/auth"; // <--- Importante para auth

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

// 1. Atualizamos o ReviewModel para incluir o userId para comparação
type ReviewModel = {
  id: string;
  userId: string; // <--- Novo campo
  rating: number;
  comment: string | null;
  createdAt: Date;
  user: {
    name: string | null;
    image: string | null;
  } | null;
};

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;

  // A. Pegar a sessão do usuário atual para saber quem está logado
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const currentUserId = session?.user?.id;

  // 1. Buscar dados do produto
  const productData = await db.query.product.findFirst({
    where: eq(product.id, id),
  });

  if (!productData) {
    return notFound();
  }

  // 2. Buscar categorias
  let categoryNames: string[] = [];
  if (productData.categories && productData.categories.length > 0) {
    const categories = await db
      .select({ name: category.name })
      .from(category)
      .where(inArray(category.id, productData.categories));
    categoryNames = categories.map((c) => c.name);
  }

  // 3. Buscar avaliações do produto
  const rows = await db
    .select({
      review: review,
      user: userTable,
    })
    .from(review)
    .leftJoin(userTable, eq(review.userId, userTable.id))
    .where(eq(review.productId, id))
    .orderBy(desc(review.createdAt));

  // Transformamos o resultado do Join no nosso ReviewModel
  const reviews: ReviewModel[] = rows.map((row) => ({
    id: row.review.id,
    userId: row.review.userId, // <--- Passamos o ID do autor
    rating: row.review.rating,
    comment: row.review.comment,
    createdAt: row.review.createdAt,
    user: row.user
      ? {
          name: row.user.name,
          image: row.user.image,
        }
      : null,
  }));

  // 4. Calcular média de notas
  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0
      ? reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews
      : 0;

  // Formatadores
  const formatPrice = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value / 100);

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(date);

  const discountPercentage =
    productData.discountPrice && productData.price
      ? Math.round(
          ((productData.price - productData.discountPrice) /
            productData.price) *
            100,
        )
      : 0;

  const finalPrice = productData.discountPrice || productData.price;
  const productImage = productData.images?.[0] || "";

  return (
    <div className="min-h-screen bg-[#010000]">
      <div className="z-[100] w-full bg-[#010000]">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-center">
          <Header />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pt-42 pb-12 md:px-8">
        <div className="grid gap-8 lg:grid-cols-12">
          {/* COLUNA ESQUERDA (Galeria + Descrição) */}
          <div className="space-y-8 lg:col-span-7">
            <ProductGallery
              images={productData.images || []}
              productName={productData.name}
            />

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

          {/* COLUNA DIREITA (Sidebar de Compra) */}
          <div className="space-y-6 lg:col-span-5">
            {/* Card Principal de Compra */}
            <Card className="border-white/10 bg-[#0A0A0A] shadow-xl shadow-black/50">
              <CardContent className="space-y-6 p-6">
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

                {productData.deliveryMode === "email" && (
                  <div className="flex items-center gap-2 rounded-md border border-[#D00000]/20 bg-[#D00000]/10 p-3 text-sm text-[#D00000]">
                    <Zap className="h-4 w-4 shrink-0 fill-current" />
                    <span className="font-medium">
                      Entrega Automática via E-mail
                    </span>
                  </div>
                )}

                <div className="py-2">
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
            {/* LADO DIREITO: FORMULÁRIO (Ocupa 5 colunas) */}
            <div className="lg:col-span-5 xl:col-span-4">
              <div className="sticky top-24">
                <ProductReviewForm productId={productData.id} />
              </div>
            </div>
          </div>
        </div>

        {/* --- SECÇÃO INFERIOR: AVALIAÇÕES (FULL WIDTH) --- */}
        <div className="mt-6 grid gap-8">
          {/* LADO ESQUERDO: LISTA DE AVALIAÇÕES */}
          <div className="lg:col-span-7 xl:col-span-8">
            <div className="h-full rounded-xl border border-white/10 bg-[#0A0A0A] p-6">
              <div className="mb-6 flex items-center justify-between border-b border-white/5 pb-4">
                <div>
                  <h4 className="flex items-center gap-2 text-lg font-medium text-white">
                    <MessageSquare className="h-5 w-5 text-[#D00000]" />
                    Avaliações da Comunidade ({totalReviews})
                  </h4>
                </div>
                {totalReviews > 0 && (
                  <div className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-1">
                    <div className="flex text-yellow-500">
                      <Star className="h-5 w-5 fill-current" />
                    </div>
                    <span className="text-xl font-bold text-white">
                      {averageRating.toFixed(1)}
                    </span>
                    <span className="text-sm text-neutral-500">/ 5.0</span>
                  </div>
                )}
              </div>

              {/* Lista Scrollável com GRID DE 3 COLUNAS */}
              <div className="scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20 max-h-[600px] overflow-y-auto pr-2">
                {reviews.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {reviews.map((reviewItem) => (
                      <div
                        key={reviewItem.id}
                        className="group relative flex flex-col gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-5 transition-colors hover:border-white/10 hover:bg-white/[0.04]"
                      >
                        {/* BOTÃO DE DELETAR (LIXEIRA)
                           - Posição absoluta no canto superior direito
                           - Só aparece se o usuário logado for o dono da review
                        */}
                        {currentUserId === reviewItem.userId && (
                          <div className="absolute top-3 right-3 opacity-0 transition-opacity group-hover:opacity-100">
                            <DeleteReviewButton
                              reviewId={reviewItem.id}
                              productId={id}
                            />
                          </div>
                        )}

                        <div className="flex items-center gap-3">
                          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white/10 bg-neutral-800">
                            {reviewItem.user?.image ? (
                              <Image
                                src={reviewItem.user.image}
                                alt={reviewItem.user.name || "User"}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <User className="h-5 w-5 text-neutral-500" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-white">
                              {reviewItem.user?.name || "Usuário"}
                            </p>
                            <p className="text-xs text-neutral-500">
                              {formatDate(reviewItem.createdAt)}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-3 w-3 ${
                                reviewItem.rating >= star
                                  ? "fill-yellow-500 text-yellow-500"
                                  : "fill-transparent text-neutral-700"
                              }`}
                            />
                          ))}
                        </div>

                        <p className="line-clamp-4 text-sm leading-relaxed break-words text-neutral-300">
                          {reviewItem.comment}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <p className="text-base text-neutral-500">
                      Ainda não há avaliações para este produto.
                    </p>
                    <p className="mt-2 text-sm text-neutral-600">
                      Seja o primeiro a avaliar!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
