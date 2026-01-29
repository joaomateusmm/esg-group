import { desc, eq } from "drizzle-orm";
import { Star, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react"; // 1. IMPORTAR SUSPENSE

import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { db } from "@/db";
import {
  product as productTable,
  review,
  user as userTable,
} from "@/db/schema";

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);

export default async function AvaliacoesPage() {
  const rows = await db
    .select({
      review: review,
      user: userTable,
      product: productTable,
    })
    .from(review)
    .leftJoin(userTable, eq(review.userId, userTable.id))
    .leftJoin(productTable, eq(review.productId, productTable.id))
    .orderBy(desc(review.createdAt));

  const reviews = rows.map((row) => ({
    ...row.review,
    user: row.user,
    product: row.product,
  }));

  return (
    <main className="min-h-screen bg-[#f9f9f9] font-sans text-neutral-900">
      {/* 3. ENVOLVER HEADER COM SUSPENSE */}
      <Suspense fallback={<div className="h-20 w-full bg-white" />}>
        <Header />
      </Suspense>

      <div className="container mx-auto max-w-6xl px-6 py-32">
        {/* Cabeçalho */}
        <div className="animate-in fade-in slide-in-from-bottom-4 mb-16 flex w-full flex-col items-start justify-between gap-6 duration-700 md:flex-row md:items-end">
          <div className="mt-12 flex max-w-2xl flex-col items-start">
            <h1 className="font-clash-display mb-4 text-left text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl md:text-5xl lg:text-6xl">
              Mural de Avaliações
            </h1>
            <p className="text-left text-lg font-medium text-neutral-500">
              Veja o que a comunidade diz sobre os nossos produtos.
              Transparência e qualidade em primeiro lugar.
            </p>
          </div>
          <div className="inline-flex shrink-0 items-center rounded-full border border-neutral-200 bg-white px-4 py-2 shadow-sm">
            <span className="text-sm font-medium text-neutral-600">
              Total de avaliações:{" "}
              <span className="font-bold text-orange-600">
                {reviews.length}
              </span>
            </span>
          </div>
        </div>

        {/* Grid de Avaliações */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reviews.length > 0 ? (
            reviews.map((item, i) => (
              <div
                key={item.id}
                className="animate-in fade-in zoom-in fill-mode-backwards flex w-full flex-col justify-between rounded-xl border border-neutral-200 bg-white p-6 shadow-sm transition-all duration-300 hover:border-orange-200 hover:shadow-md"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div>
                  {/* Estrelas */}
                  <div className="mb-3 flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          item.rating >= star
                            ? "fill-orange-500 text-orange-500"
                            : "fill-neutral-100 text-neutral-200"
                        }`}
                      />
                    ))}
                  </div>

                  {/* Texto da Avaliação com Clamp */}
                  <div className="mb-4 min-h-[60px]">
                    <p className="line-clamp-3 text-sm leading-relaxed font-medium text-neutral-600">
                      &quot;{item.comment || "Avaliação sem comentário."}&quot;
                    </p>
                  </div>
                </div>

                <div className="mt-auto space-y-4 border-t border-dashed border-neutral-100 pt-4">
                  {/* Produto */}
                  {item.product && (
                    <Link
                      href={`/produto/${item.product.id}`}
                      className="group flex items-center gap-3 rounded-lg bg-neutral-50 p-2 transition-colors hover:bg-orange-50/50"
                    >
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md border border-neutral-200 bg-white">
                        {item.product.images?.[0] && (
                          <Image
                            src={item.product.images[0]}
                            alt={item.product.name}
                            fill
                            className="object-cover transition-transform group-hover:scale-105"
                          />
                        )}
                      </div>
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate text-[10px] font-bold tracking-wider text-neutral-400 uppercase group-hover:text-orange-400">
                          Avaliou
                        </span>
                        <span className="truncate text-sm font-semibold text-neutral-800 group-hover:text-orange-700">
                          {item.product.name}
                        </span>
                      </div>
                    </Link>
                  )}

                  {/* Usuário */}
                  <div className="flex items-center gap-3 pl-1">
                    <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-neutral-200 bg-neutral-100">
                      {item.user?.image ? (
                        <Image
                          src={item.user.image}
                          alt={item.user.name || "User"}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-white text-neutral-400">
                          <User className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-neutral-900">
                        {item.user?.name || "Anônimo"}
                      </span>
                      <span className="text-[11px] font-medium text-neutral-500">
                        {formatDate(item.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-24 text-center">
              <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
                <Star className="h-8 w-8 text-neutral-300" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900">
                Nenhuma avaliação ainda
              </h3>
              <p className="text-neutral-500">
                Seja o primeiro a avaliar um produto!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 4. ENVOLVER FOOTER COM SUSPENSE */}
      <Suspense fallback={<div className="h-20 w-full bg-white" />}>
        <Footer />
      </Suspense>
    </main>
  );
}
