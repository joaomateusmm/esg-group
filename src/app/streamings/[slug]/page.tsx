import { arrayContains, desc } from "drizzle-orm";
import { ArrowLeft, Frown } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import { db } from "@/db";
import { product, streaming } from "@/db/schema";

// A MESMA função robusta usada no actions (para garantir que batam)
function generateSlug(text: string) {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/\+/g, "-plus") // Trata o Star+ e Disney+
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

interface StreamPageProps {
  params: Promise<{ slug: string }>;
}

export default async function StreamPage({ params }: StreamPageProps) {
  const { slug } = await params;

  // 1. Buscar todos os streamings
  const allStreamings = await db.select().from(streaming);

  // 2. Encontrar qual streaming gera o slug que está na URL
  const currentStreaming = allStreamings.find(
    (s) => generateSlug(s.name) === slug,
  );

  if (!currentStreaming) return notFound();

  // 3. Buscar produtos vinculados usando arrayContains
  const streamProducts = await db
    .select()
    .from(product)
    .where(arrayContains(product.streamings, [currentStreaming.id]))
    .orderBy(desc(product.createdAt));

  return (
    <div className="flex min-h-screen flex-col bg-[#010000]">
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-42 md:px-8">
        <div className="mb-12 flex flex-col gap-4">
          <Link
            href="/"
            className="flex w-fit items-center gap-2 text-sm text-neutral-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
          <div>
            <h1 className="font-clash-display text-4xl font-medium text-white capitalize md:text-5xl">
              {currentStreaming.name}
            </h1>
            <p className="mt-2 text-neutral-400">
              Assinaturas e contas disponíveis para {currentStreaming.name}.
            </p>
          </div>
        </div>

        {streamProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-[#0A0A0A] py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
              <Frown className="h-8 w-8 text-neutral-500" />
            </div>
            <h3 className="text-xl font-medium text-white">
              Nenhum produto encontrado
            </h3>
            <p className="mt-2 text-neutral-400">
              Ainda não temos produtos cadastrados para este serviço.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {streamProducts.map((prod) => (
              <ProductCard
                key={prod.id}
                data={{
                  id: prod.id,
                  name: prod.name,
                  description: prod.description,
                  price: prod.price,
                  discountPrice: prod.discountPrice,
                  images: prod.images,
                }}
                categoryName={currentStreaming.name}
              />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
