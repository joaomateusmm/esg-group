"use client";

import { Archive, Edit, MoreHorizontal, Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { archiveProduct, deleteProduct } from "./actions";

interface ProductActionsProps {
  id: string;
}

export function ProductActions({ id }: ProductActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false); // NOVO DIALOG

  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // 1. Tenta Deletar
  const handleDelete = () => {
    startTransition(async () => {
      try {
        const result = await deleteProduct(id);

        if (result.success) {
          // Deu certo de primeira? Ótimo.
          setShowDeleteDialog(false);
          toast.success(result.message);
          router.refresh();
        } else if (result.code === "CONSTRAINT_VIOLATION") {
          // AQUI ESTÁ A INTELIGÊNCIA:
          // Se falhou por causa do banco, fechamos o delete e abrimos a sugestão
          setShowDeleteDialog(false);
          setShowArchiveDialog(true);
        } else {
          // Erro genérico real
          toast.error(result.message);
        }
      } catch {
        toast.error("Erro de comunicação.");
      }
    });
  };

  // 2. Aceita Arquivar (Deixar Inativo)
  const handleArchive = () => {
    startTransition(async () => {
      try {
        const result = await archiveProduct(id);
        if (result.success) {
          setShowArchiveDialog(false);
          toast.success("Produto alterado para Inativo.");
          router.refresh();
        } else {
          toast.error("Não foi possível inativar o produto.");
        }
      } catch {
        toast.error("Erro ao tentar arquivar.");
      }
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-8 w-8 p-0 text-neutral-400 hover:bg-white/10 hover:text-white"
          >
            <span className="sr-only">Abrir menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="border-white/10 bg-[#111] text-white"
        >
          <DropdownMenuLabel>Ações</DropdownMenuLabel>
          <DropdownMenuItem className="cursor-pointer focus:bg-white/10 focus:text-white">
            <Edit className="mr-2 h-4 w-4" /> Editar
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-white/10" />
          <DropdownMenuItem
            className="cursor-pointer text-red-500 focus:bg-red-500/10 focus:text-red-500"
            onSelect={(e) => {
              e.preventDefault();
              setShowDeleteDialog(true);
            }}
          >
            <Trash className="mr-2 h-4 w-4" /> Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* --- DIALOG 1: TENTATIVA DE EXCLUSÃO --- */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="border-white/10 bg-[#111] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir permanentemente?</AlertDialogTitle>
            <AlertDialogDescription className="text-neutral-400">
              Essa ação tentará remover o produto do banco de dados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 bg-transparent text-white hover:bg-white/10 hover:text-white">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={isPending}
            >
              {isPending ? "Processando..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* --- DIALOG 2: SUGESTÃO INTELIGENTE (ARQUIVAR) --- */}
      <AlertDialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <AlertDialogContent className="border-white/10 bg-[#111] text-white">
          <AlertDialogHeader>
            <div className="mb-2 flex items-center gap-2 text-yellow-500">
              <Archive className="h-5 w-5" />
              <AlertDialogTitle className="text-white">
                Não foi possível excluir
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-neutral-300">
              Algum usuário tem esse produto no carrinho, favoritos ou histórico
              de compras. Para não perder esses dados, sugerimos deixá-lo como{" "}
              <strong>Inativo</strong>. Ele não aparecerá mais na loja, mas o
              histórico será mantido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 bg-transparent text-white hover:bg-white/10 hover:text-white">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleArchive}
              className="bg-yellow-600 text-white hover:bg-yellow-700"
              disabled={isPending}
            >
              {isPending ? "Salvando..." : "Deixar Inativo"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
