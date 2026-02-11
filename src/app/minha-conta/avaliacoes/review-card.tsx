"use client";

import { Edit, Star, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";

import { deleteReviewAction, updateReviewAction } from "@/actions/review"; // Ajuste o caminho se necessário
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// Componente para o botão de submit do form
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      className="w-full bg-orange-600 text-white hover:bg-orange-700"
    >
      {pending ? "Salvando..." : "Salvar Alterações"}
    </Button>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ReviewCard({ review }: { review: any }) {
  const [isPending, startTransition] = useTransition();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Função de Deletar (Agora chamada pelo AlertDialogAction)
  const handleDelete = () => {
    startTransition(async () => {
      // Passamos review.id e review.productId para revalidar corretamente
      const res = await deleteReviewAction(review.id, review.productId);
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    });
  };

  // Função de Atualizar (Wrapper para fechar o modal)
  const handleUpdate = async (formData: FormData) => {
    const res = await updateReviewAction(null, formData);
    if (res?.success) {
      toast.success(res.message);
      setIsEditDialogOpen(false);
    } else {
      toast.error(res?.message || "Erro ao atualizar");
    }
  };

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm transition-all hover:border-orange-200 sm:flex-row sm:items-start">
      {/* Imagem do Produto */}
      <Link href={`/produto/${review.productId}`} className="shrink-0">
        <div className="relative h-24 w-24 overflow-hidden rounded-md border border-neutral-100 bg-neutral-50">
          {review.product.images && review.product.images[0] ? (
            <Image
              src={review.product.images[0]}
              alt={review.product.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-neutral-400">
              Sem foto
            </div>
          )}
        </div>
      </Link>

      {/* Conteúdo */}
      <div className="flex-1 space-y-2">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <Link href={`/produto/${review.productId}`}>
            <h3 className="font-semibold text-neutral-900 hover:text-orange-600 hover:underline">
              {review.product.name}
            </h3>
          </Link>
          <span className="text-xs text-neutral-400">
            {new Date(review.createdAt).toLocaleDateString()}
          </span>
        </div>

        {/* Estrelas */}
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${
                i < review.rating
                  ? "fill-orange-500 text-orange-500"
                  : "text-neutral-300"
              }`}
            />
          ))}
        </div>

        <p className="text-sm text-neutral-600 italic">
          {review.comment ? `"${review.comment}"` : "Sem comentário escrito."}
        </p>
      </div>

      {/* Ações */}
      <div className="flex shrink-0 gap-2 sm:flex-col">
        {/* Botão EDITAR (Modal Dialog) */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon" className="h-8 w-8">
              <Edit className="h-4 w-4 text-neutral-600" />
            </Button>
          </DialogTrigger>
          <DialogContent className="border-neutral-200 bg-white sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Avaliação</DialogTitle>
            </DialogHeader>
            <form action={handleUpdate} className="space-y-4 py-4">
              <input type="hidden" name="reviewId" value={review.id} />

              <div className="space-y-2">
                <Label>Nota (1 a 5)</Label>
                <Input
                  name="rating"
                  type="number"
                  min="1"
                  max="5"
                  defaultValue={review.rating}
                  required
                  className="border-neutral-200 bg-white"
                />
              </div>

              <div className="space-y-2">
                <Label>Comentário</Label>
                <Textarea
                  name="comment"
                  defaultValue={review.comment || ""}
                  maxLength={155}
                  className="resize-none border-neutral-200 bg-white"
                />
                <p className="text-right text-xs text-neutral-400">
                  Máx. 155 caracteres
                </p>
              </div>

              <SubmitButton />
            </form>
          </DialogContent>
        </Dialog>

        {/* Botão EXCLUIR (AlertDialog) */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-red-100 text-red-600 hover:bg-red-50 hover:text-red-700"
              disabled={isPending}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="border-neutral-200 bg-white">
            <AlertDialogHeader>
              <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. Isso excluirá permanentemente
                sua avaliação do produto.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-neutral-200 hover:bg-neutral-100 hover:text-neutral-900">
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-600"
              >
                Sim, excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
