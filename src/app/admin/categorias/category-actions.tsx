"use client";

import { MoreHorizontal, Trash } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { deleteCategories } from "./actions";

interface CategoryActionsProps {
  id: string;
}

export function CategoryActions({ id }: CategoryActionsProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteCategories([id]);
        toast.success("Categoria excluída.");
      } catch {
        // CORREÇÃO: Removi a variável (error)
        toast.error("Erro ao excluir.");
      }
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-8 w-8 p-0 text-white hover:bg-white/10"
        >
          <span className="sr-only">Abrir menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="border-white/10 bg-[#111] text-white"
      >
        <DropdownMenuItem
          onClick={handleDelete}
          disabled={isPending}
          className="cursor-pointer text-red-500 focus:bg-red-500/10 focus:text-red-500"
        >
          <Trash className="mr-2 h-4 w-4" />
          Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
