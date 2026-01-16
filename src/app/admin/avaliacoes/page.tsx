import { desc, eq } from "drizzle-orm";
import { Star } from "lucide-react";
import Image from "next/image";

import { DeleteReviewButton } from "@/app/admin/avaliacoes/components/delete-review-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { db } from "@/db";
import { product, review, user } from "@/db/schema";

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

export default async function AdminReviewsPage() {
  const reviews = await db
    .select({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      userName: user.name,
      userEmail: user.email,
      userImage: user.image,
      productName: product.name,
      productImage: product.images,
    })
    .from(review)
    .leftJoin(user, eq(review.userId, user.id))
    .leftJoin(product, eq(review.productId, product.id))
    .orderBy(desc(review.createdAt));

  return (
    <div className="space-y-6 p-2">
      <div>
        <h1 className="font-clash-display flex items-center gap-3 text-3xl font-medium text-white">
          Gerenciar Avaliações
        </h1>
        <p className="text-neutral-400">
          Veja o que os clientes estão falando sobre seus produtos.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0A0A0A]">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/10 hover:bg-white/5">
              <TableHead className="text-neutral-400">Cliente</TableHead>
              <TableHead className="text-neutral-400">Produto</TableHead>
              <TableHead className="text-neutral-400">Nota</TableHead>
              {/* Largura fixa no cabeçalho ajuda a coluna a não colapsar */}
              <TableHead className="w-[300px] text-neutral-400">
                Comentário
              </TableHead>
              <TableHead className="text-right text-neutral-400">
                Data
              </TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reviews.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-96 text-center text-neutral-500"
                >
                  <div className="flex h-full w-full flex-col items-center justify-center gap-4 py-10">
                    <Image
                      src="/images/illustration.svg"
                      alt="Sem produtos"
                      width={300}
                      height={300}
                      className="opacity-40 grayscale"
                    />

                    <p className="text-lg font-light text-neutral-400">
                      Nenhuma avaliação encontrada.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              reviews.map((item) => (
                <TableRow
                  key={item.id}
                  className="border-white/10 hover:bg-white/5"
                >
                  {/* CLIENTE */}
                  <TableCell className="align-middle">
                    <div className="flex items-center gap-3">
                      <div className="relative h-8 w-8 overflow-hidden rounded-full bg-neutral-800">
                        {item.userImage && (
                          <Image
                            src={item.userImage}
                            alt="Avatar"
                            fill
                            className="object-cover"
                          />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-white">
                          {item.userName || "Anônimo"}
                        </span>
                        <span className="text-xs text-neutral-500">
                          {item.userEmail}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  {/* PRODUTO */}
                  <TableCell className="align-middle">
                    <div className="flex items-center gap-2">
                      <div className="relative h-8 w-12 overflow-hidden rounded bg-neutral-800">
                        {item.productImage && item.productImage[0] && (
                          <Image
                            src={item.productImage[0]}
                            alt="Prod"
                            fill
                            className="object-cover"
                          />
                        )}
                      </div>
                      <span className="max-w-[150px] truncate text-sm text-neutral-300">
                        {item.productName}
                      </span>
                    </div>
                  </TableCell>

                  {/* NOTA */}
                  <TableCell className="align-middle">
                    <div className="flex items-center gap-1 text-yellow-500">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="font-bold text-white">
                        {item.rating.toFixed(1)}
                      </span>
                    </div>
                  </TableCell>

                  {/* COMENTÁRIO - CORREÇÃO COMPLETA */}
                  <TableCell className="align-middle">
                    {/* A div interna restringe a largura e força a quebra */}
                    <div className="w-[300px]">
                      <p className="text-sm break-words whitespace-normal text-neutral-400">
                        {item.comment || (
                          <span className="italic opacity-50">
                            Sem comentário
                          </span>
                        )}
                      </p>
                    </div>
                  </TableCell>

                  {/* DATA */}
                  <TableCell className="text-right align-middle text-xs text-neutral-500">
                    {formatDate(item.createdAt)}
                  </TableCell>

                  {/* AÇÕES */}
                  <TableCell className="align-middle">
                    <DeleteReviewButton reviewId={item.id} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
