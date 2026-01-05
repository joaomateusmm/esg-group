"use client";

import { Edit, MoreHorizontal, Trash } from "lucide-react";
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

import { deleteProduct } from "./actions";

interface ProductActionsProps {
  id: string;
}

export function ProductActions({ id }: ProductActionsProps) {
  const [open, setOpen] = useState(false); // Controla se o Alerta está aberto
  const [isPending, startTransition] = useTransition(); // Estado de carregamento da exclusão

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteProduct(id);
        setOpen(false);
        toast.success("Produto excluído com sucesso.");
      } catch {
        // CORREÇÃO: Removi a variável (error)
        toast.error("Erro ao excluir produto.");
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
          {/* Ao clicar em Excluir, abrimos o Dialog em vez de deletar direto */}
          <DropdownMenuItem
            className="cursor-pointer text-red-500 focus:bg-red-500/10 focus:text-red-500"
            onSelect={(e) => {
              e.preventDefault(); // Impede o dropdown de fechar abruptamente
              setOpen(true);
            }}
          >
            <Trash className="mr-2 h-4 w-4" /> Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* --- ALERT DIALOG --- */}
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent className="border-white/10 bg-[#111] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Quer mesmo excluir o produto?</AlertDialogTitle>
            <AlertDialogDescription className="text-neutral-400">
              Essa ação não pode ser desfeita. Isso excluirá permanentemente o
              produto do banco de dados.
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
              {isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
