import { desc, eq, inArray } from "drizzle-orm";
import {
  Hammer,
  Hash,
  Info,
  MessageSquare,
  Ruler,
  ShieldCheck,
  Star,
  Tag,
  User,
  WandSparkles,
  Weight,
} from "lucide-react";
import { headers } from "next/headers";
import Image from "next/image";
import { notFound } from "next/navigation";

import { DeleteReviewButton } from "@/components/delete-review-button";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ProductPurchaseCard } from "@/components/product-purchase-card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { db } from "@/db";
import { category, product, review, user as userTable } from "@/db/schema";
import { auth } from "@/lib/auth";

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

type ReviewModel = {
  id: string;
  userId: string;
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

  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const currentUserId = session?.user?.id;

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

  const rows = await db
    .select({
      review: review,
      user: userTable,
    })
    .from(review)
    .leftJoin(userTable, eq(review.userId, userTable.id))
    .where(eq(review.productId, id))
    .orderBy(desc(review.createdAt));

  const reviews: ReviewModel[] = rows.map((row) => ({
    id: row.review.id,
    userId: row.review.userId,
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

  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0
      ? reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews
      : 0;

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(date);

  const productImages =
    productData.images && productData.images.length > 0
      ? productData.images
      : ["https://placehold.co/600x600/f3f4f6/9ca3af.png?text=Sem+Imagem"];

  // Tradução da condição
  const conditionMap: Record<string, string> = {
    new: "Estado de novo",
    used: "Usado / Ótima condição",
    refurbished: "Recondicionado",
  };

  return (
    <div className="min-h-screen bg-[#f9f9f9]">
      <Header />
      <div className="mx-auto max-w-7xl px-4 pt-38 pb-12 md:px-8">
        <div className="grid gap-8 lg:grid-cols-12">
          {/* --- COLUNA ESQUERDA (Galeria + Descrição) --- */}
          <div className="space-y-8 lg:col-span-7">
            {/* CARROSSEL DE IMAGENS */}
            <div className="w-full rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
              <Carousel className="w-full">
                <CarouselContent>
                  {productImages.map((imgSrc, index) => (
                    <CarouselItem key={index}>
                      <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg bg-neutral-50 p-4">
                        <Image
                          src={imgSrc}
                          alt={`${productData.name} - Imagem ${index + 1}`}
                          fill
                          className="object-contain"
                          priority={index === 0}
                        />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                {productImages.length > 1 && (
                  <>
                    <CarouselPrevious className="left-4 border-neutral-200 bg-white/80 text-neutral-900 hover:bg-white" />
                    <CarouselNext className="right-4 border-neutral-200 bg-white/80 text-neutral-900 hover:bg-white" />
                  </>
                )}
              </Carousel>

              {productImages.length > 1 && (
                <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                  {productImages.map((imgSrc, idx) => (
                    <div
                      key={idx}
                      className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-neutral-200 bg-neutral-50"
                    >
                      <Image
                        src={imgSrc}
                        alt="thumb"
                        fill
                        className="object-cover opacity-70 transition-opacity hover:opacity-100"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* DESCRIÇÃO & ESPECIFICAÇÕES */}
            <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm md:p-8">
              {/* DESCRIÇÃO */}
              <div className="mb-8">
                <h3 className="mb-4 flex items-center gap-2 text-xl font-bold text-neutral-900">
                  <span className="h-6 w-1 rounded-full bg-orange-600"></span>
                  Descrição
                </h3>
                <div className="prose prose-neutral max-w-none text-neutral-600">
                  <p className="leading-relaxed whitespace-pre-line">
                    {productData.description || "Sem descrição disponível."}
                  </p>
                </div>
              </div>

              {/* ESPECIFICAÇÕES TÉCNICAS */}
              <div className="border-t border-neutral-100 pt-8">
                <h3 className="mb-6 flex items-center gap-2 text-xl font-bold text-neutral-900">
                  <span className="h-6 w-1 rounded-full bg-orange-600"></span>
                  Especificações Técnicas
                </h3>

                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Item: Dimensões */}
                  <div className="flex items-start gap-3 rounded-lg border border-neutral-100 bg-neutral-50 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-orange-600 shadow-sm">
                      <Ruler className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-neutral-800">
                        Dimensões (Lar. x Alt. x Com.)
                      </p>
                      <p className="text-sm text-neutral-500">
                        {(productData.width ?? 0) > 0 &&
                        (productData.height ?? 0) > 0 &&
                        (productData.length ?? 0) > 0
                          ? `${productData.width}cm x ${productData.height}cm x ${productData.length}cm`
                          : "Não informado"}
                      </p>
                    </div>
                  </div>

                  {/* Item: Peso */}
                  <div className="flex items-start gap-3 rounded-lg border border-neutral-100 bg-neutral-50 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-orange-600 shadow-sm">
                      <Weight className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-neutral-800">
                        Peso
                      </p>
                      <p className="text-sm text-neutral-500">
                        {(productData.weight ?? 0) > 0
                          ? `${productData.weight} kg`
                          : "Não informado"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* --- COLUNA DIREITA (Sidebar de Compra + Info Útil) --- */}
          <div className="space-y-6 lg:col-span-5">
            <ProductPurchaseCard
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              product={productData as any}
              categoryNames={categoryNames}
            />

            {/* --- NOVO CARD: INFORMAÇÕES ÚTEIS --- */}
            <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
              <h4 className="mb-4 flex items-center gap-2 text-base font-bold text-neutral-900">
                <Info className="h-4 w-4 text-orange-600" />
                Detalhes do Produto
              </h4>
              <div className="space-y-3">
                {/* ID do Produto (NOVO) */}
                <div className="flex items-center justify-between border-b border-neutral-100 pb-2 text-sm last:border-0 last:pb-0">
                  <div className="flex items-center gap-2 text-neutral-600">
                    <Hash className="h-4 w-4 text-neutral-400" />
                    <span>ID do Produto</span>
                  </div>
                  <span className="pl-4 text-right font-medium break-all text-neutral-800">
                    {productData.id}
                  </span>
                </div>

                {/* Condição */}
                <div className="flex items-center justify-between border-b border-neutral-100 pb-2 text-sm last:border-0 last:pb-0">
                  <div className="flex items-center gap-2 text-neutral-600">
                    <WandSparkles className="h-4 w-4 text-neutral-400" />
                    <span>Condição</span>
                  </div>
                  <span className="font-medium text-neutral-800">
                    {conditionMap[productData.condition || "new"] || "Novo"}
                  </span>
                </div>

                {/* Marca */}
                <div className="flex items-center justify-between border-b border-neutral-100 pb-2 text-sm last:border-0 last:pb-0">
                  <div className="flex items-center gap-2 text-neutral-600">
                    <Tag className="h-4 w-4 text-neutral-400" />
                    <span>Marca</span>
                  </div>
                  <span className="font-medium text-neutral-800">
                    {productData.brand || "Sem Marca"}
                  </span>
                </div>

                {/* Montagem Necessária */}
                <div className="flex items-center justify-between border-b border-neutral-100 pb-2 text-sm last:border-0 last:pb-0">
                  <div className="flex items-center gap-2 text-neutral-600">
                    <Hammer className="h-4 w-4 text-neutral-400" />
                    <span>Vem Montado?</span>
                  </div>
                  <span
                    className={`font-medium ${
                      productData.isAssembled
                        ? "text-neutral-800"
                        : "text-neutral-800"
                    }`}
                  >
                    {productData.isAssembled
                      ? "Sim. Produto já vem Montado"
                      : "Não. Produto requer montagem"}
                  </span>
                </div>

                {/* Garantia */}
                <div className="flex items-center justify-between border-b border-neutral-100 pb-2 text-sm last:border-0 last:pb-0">
                  <div className="flex items-center gap-2 text-neutral-600">
                    <ShieldCheck className="h-4 w-4 text-neutral-400" />
                    <span>Garantia</span>
                  </div>
                  <div className="text-right">
                    <span
                      className={`block font-medium ${
                        productData.hasWarranty
                          ? "text-neutral-800"
                          : "text-neutral-800"
                      }`}
                    >
                      {productData.hasWarranty
                        ? "Garantia inclusa"
                        : "Sem garantia"}
                    </span>
                    {productData.hasWarranty && productData.warrantyDetails && (
                      <span className="text-xs text-neutral-400">
                        ({productData.warrantyDetails})
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- SECÇÃO INFERIOR: AVALIAÇÕES --- */}
        <div className="mt-8 grid gap-8">
          <div className="lg:col-span-7 xl:col-span-8">
            <div className="h-full rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between border-b border-neutral-100 pb-4">
                <div>
                  <h4 className="flex items-center gap-2 text-lg font-bold text-neutral-900">
                    <MessageSquare className="h-5 w-5 text-orange-600" />
                    Avaliações da Comunidade ({totalReviews})
                  </h4>
                </div>
                {totalReviews > 0 && (
                  <div className="flex items-center gap-2 rounded-full border border-orange-100 bg-orange-50 px-4 py-1">
                    <div className="flex text-orange-500">
                      <Star className="h-5 w-5 fill-current" />
                    </div>
                    <span className="text-xl font-bold text-neutral-900">
                      {averageRating.toFixed(1)}
                    </span>
                    <span className="text-sm text-neutral-500">/ 5.0</span>
                  </div>
                )}
              </div>

              <div className="scrollbar-thin scrollbar-track-transparent scrollbar-thumb-neutral-200 max-h-[600px] overflow-y-auto pr-2">
                {reviews.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {reviews.map((reviewItem) => (
                      <div
                        key={reviewItem.id}
                        className="group relative flex flex-col gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-5 transition-all hover:bg-white hover:shadow-md"
                      >
                        {currentUserId === reviewItem.userId && (
                          <div className="absolute top-3 right-3 opacity-0 transition-opacity group-hover:opacity-100">
                            <DeleteReviewButton
                              reviewId={reviewItem.id}
                              productId={id}
                            />
                          </div>
                        )}

                        <div className="flex items-center gap-3">
                          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-neutral-200 bg-white">
                            {reviewItem.user?.image ? (
                              <Image
                                src={reviewItem.user.image}
                                alt={reviewItem.user.name || "User"}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <User className="h-5 w-5 text-neutral-400" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-neutral-900">
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
                                  ? "fill-orange-500 text-orange-500"
                                  : "fill-transparent text-neutral-300"
                              }`}
                            />
                          ))}
                        </div>

                        <p className="line-clamp-4 text-sm leading-relaxed break-words text-neutral-600">
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
                    <p className="mt-2 text-sm text-neutral-400">
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
