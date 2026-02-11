import { desc, eq } from "drizzle-orm";
import { MessageSquare, Star } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { db } from "@/db";
import { review } from "@/db/schema";
import { auth } from "@/lib/auth";

import { ReviewCard } from "./review-card";

export const dynamic = "force-dynamic";

export default async function MyReviewsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  // Busca as reviews do usuário + dados do produto
  const userReviews = await db.query.review.findMany({
    where: eq(review.userId, session.user.id),
    with: {
      product: {
        columns: {
          name: true,
          images: true,
          id: true, // Necessário para o link
        },
      },
    },
    orderBy: [desc(review.createdAt)],
  });

  return (
    <main className="min-h-screen bg-neutral-50">
      <Header />

      <div className="container mx-auto max-w-4xl px-4 py-20 pt-38">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-orange-600">
            <Star className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-clash-display text-2xl font-bold text-neutral-900">
              Minhas Avaliações
            </h1>
            <p className="text-sm text-neutral-500">
              Gerencie o feedback que você deixou nos produtos.
            </p>
          </div>
        </div>

        {userReviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-neutral-50/50 py-20 text-center">
            <MessageSquare className="mb-4 h-12 w-12 text-neutral-300" />
            <h3 className="text-lg font-medium text-neutral-900">
              Nenhuma avaliação encontrada
            </h3>
            <p className="text-neutral-500">
              Você ainda não avaliou nenhum produto.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {userReviews.map((item) => (
              <ReviewCard key={item.id} review={item} />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}
