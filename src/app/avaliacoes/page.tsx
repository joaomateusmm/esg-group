import { desc, eq } from "drizzle-orm";
import { Star, User } from "lucide-react"; // Ícones
import Image from "next/image";
import Link from "next/link";

import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { db } from "@/db";
// IMPORTANTE: Renomeamos as tabelas para evitar conflitos e fazer os joins
import {
  product as productTable,
  review,
  user as userTable,
} from "@/db/schema";

// Formatação de data
const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);

export default async function AvaliacoesPage() {
  // 1. Buscar avaliações usando db.select + leftJoin
  // Isso evita o erro 'referencedTable' e é mais seguro
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

  // 2. Transformar o resultado no formato que o JSX espera
  const reviews = rows.map((row) => ({
    ...row.review,
    user: row.user,
    product: row.product,
  }));

  return (
    <main className="min-h-screen bg-[#010000] text-white">
      <Header />
      <div className="container mx-auto max-w-6xl px-6 py-32">
        {/* Cabeçalho da Página */}
        <div className="animate-in fade-in slide-in-from-bottom-4 mb-16 flex w-full flex-col items-start justify-between gap-6 duration-700 md:flex-row md:items-end">
          <div className="mt-12 flex max-w-2xl flex-col items-start">
            <h1 className="mb-4 text-left text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
              Mural de Avaliações
            </h1>

            <p className="text-left text-lg text-neutral-400">
              Veja o que a comunidade diz sobre os nossos produtos.
              Transparência e qualidade em primeiro lugar.
            </p>
          </div>

          <div className="inline-flex shrink-0 items-center">
            <span className="text-sm font-medium text-neutral-700">
              Total de avaliações:{" "}
              <span className="font-bold text-neutral-400">
                {reviews.length}
              </span>
            </span>
          </div>
        </div>

        {/* A Grade (Grid) de Avaliações */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reviews.length > 0 ? (
            reviews.map((item, i) => (
              <div
                key={item.id}
                // Usamos classes Tailwind 'animate-in' para animação no servidor
                className="animate-in fade-in zoom-in fill-mode-backwards flex w-full flex-col justify-between rounded-3xl border border-white/10 bg-[#0a0a0a] p-8 transition-colors duration-500 hover:border-white/20"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div>
                  {/* Estrelas */}
                  <div className="mb-4 flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          item.rating >= star
                            ? "fill-yellow-500 text-yellow-500"
                            : "fill-transparent text-neutral-700"
                        }`}
                      />
                    ))}
                  </div>

                  {/* Texto da Avaliação */}
                  <div className="min-h-[60px] text-lg leading-relaxed text-gray-200">
                    &quot;{item.comment}&quot;
                  </div>
                </div>

                <div className="space-y-4 border-t border-white/5 pt-4">
                  {/* Produto Avaliado (Linkável) */}
                  {item.product && (
                    <Link
                      href={`/produto/${item.product.id}`}
                      className="flex items-center gap-3 rounded-xl bg-white/5 p-2 transition-colors hover:bg-white/10"
                    >
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-neutral-800">
                        {item.product.images?.[0] && (
                          <Image
                            src={item.product.images[0]}
                            alt={item.product.name}
                            fill
                            className="object-cover"
                          />
                        )}
                      </div>
                      <div className="flex flex-col overflow-hidden">
                        <span className="truncate text-xs text-neutral-500">
                          Avaliou o produto:
                        </span>
                        <span className="truncate text-sm font-medium text-white">
                          {item.product.name}
                        </span>
                      </div>
                    </Link>
                  )}

                  {/* Usuário */}
                  <div className="flex items-center gap-4">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-white/10 bg-neutral-800">
                      {item.user?.image ? (
                        <Image
                          src={item.user.image}
                          alt={item.user.name || "User"}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <User className="h-6 w-6 text-neutral-500" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <div className="font-semibold tracking-tight text-white">
                        {item.user?.name || "Anônimo"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDate(item.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center text-neutral-500">
              <p>Nenhuma avaliação encontrada ainda.</p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </main>
  );
}
