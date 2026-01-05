"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { deleteOrder } from "@/actions/delete-order";
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

export function DeleteOrderButton({ orderId }: { orderId: string }) {
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      const result = await deleteOrder(orderId);
      if (result.success) {
        toast.success("Pedido removido do histórico.");
      } else {
        toast.error("Erro ao remover pedido.");
      }
    } catch {
      toast.error("Erro inesperado.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button
          className="ml-4 p-2 text-neutral-500 transition-colors hover:text-red-500"
          title="Excluir do histórico"
          // Impedir que o clique abra o Accordion junto
          onClick={(e) => e.stopPropagation()}
        >
          {isDeleting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent className="border border-white/10 bg-[#0A0A0A] text-white">
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir do histórico?</AlertDialogTitle>
          <AlertDialogDescription className="text-neutral-400">
            Isso removerá este pedido da sua lista de visualização. Essa ação
            não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-white/10 bg-transparent text-white hover:bg-white/5 hover:text-white">
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            Confirmar Exclusão
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
