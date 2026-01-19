import { desc, eq } from "drizzle-orm"; // Importar eq
import { ArrowLeft, Frown } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
// Certifique-se que o caminho do ProductCard está correto
import { ProductCard } from "@/components/ProductCard";
import { db } from "@/db";
// Importar a tabela game também
import { game, product } from "@/db/schema";

// --- FUNÇÃO PARA GERAR SLUG ---
function generateSlug(name: string) {
  return name.toLowerCase().trim().replace(/\s+/g, "-");
}

interface GamePageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function GamePage({ params }: GamePageProps) {
  // Pegamos o slug da URL
  const { slug } = await params;

  // 1. Buscar todos os moveis para encontrar o correto pelo slug
  // (Idealmente, salvaríamos o slug no banco, mas seguindo sua lógica atual:)
  const allGames = await db.select().from(game);

  const currentGame = allGames.find((g) => generateSlug(g.name) === slug);

  // Se não achar o jogo, retorna 404
  if (!currentGame) {
    return notFound();
  }

  // 2. Buscar produtos vinculados a este jogo
  // Aqui assumimos que você adicionou a coluna 'gameId' na tabela product
  const gameProducts = await db
    .select()
    .from(product)
    .where(eq(product.gameId, currentGame.id)) // Filtra direto no banco
    .orderBy(desc(product.createdAt));

  return (
    <div className="flex min-h-screen flex-col bg-[#010000]">
      <Header />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-42 md:px-8">
        {/* --- CABEÇALHO DO JOGO --- */}
        <div className="mb-12 flex flex-col gap-4">
          <Link
            href="/"
            className="flex w-fit items-center gap-2 text-sm text-neutral-400 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para o catálogo
          </Link>

          <div>
            <h1 className="font-clash-display text-4xl font-medium text-white capitalize md:text-5xl">
              {currentGame.name}
            </h1>
            <p className="mt-2 text-neutral-400">
              Confira todos os produtos disponíveis para {currentGame.name}.
            </p>
          </div>
        </div>

        {/* --- GRID DE PRODUTOS --- */}
        {gameProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
              <Frown className="h-8 w-8 text-neutral-500" />
            </div>
            <h3 className="text-xl font-medium text-white">
              Nenhum produto encontrado
            </h3>
            <p className="mt-2 text-neutral-400">
              Ainda não temos produtos cadastrados para este jogo.
            </p>
            <Link
              href="/"
              className="mt-4 rounded-md bg-red-700 px-6 py-3 duration-300 hover:scale-105"
            >
              Ver Catálogo
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {gameProducts.map((prod) => (
              <ProductCard
                key={prod.id}
                data={{
                  id: prod.id,
                  name: prod.name,
                  description: prod.description,
                  price: prod.price,
                  discountPrice: prod.discountPrice,
                  images: prod.images,
                  stock: prod.stock,
                  isStockUnlimited: prod.isStockUnlimited ?? false, // Garante booleano caso venha null
                }}
                // Passamos o nome do jogo como "categoria" visual ou o nome do jogo mesmo
                categoryName={currentGame.name}
              />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
