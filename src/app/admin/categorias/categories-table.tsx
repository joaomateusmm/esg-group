/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Trash2 } from "lucide-react";
import Image from "next/image";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { deleteCategories } from "./actions";
import { CategoryActions } from "./category-actions";

interface CategoriesTableProps {
  data: any[];
}

export function CategoriesTable({ data }: CategoriesTableProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(data.map((c) => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (checked: boolean, id: string) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    }
  };

  const handleBulkDelete = () => {
    startTransition(async () => {
      try {
        await deleteCategories(selectedIds);
        setSelectedIds([]);
        toast.success("Categorias excluídas.");
      } catch {
        // CORREÇÃO: Removi a variável (error) já que não era usada.
        toast.error("Erro ao excluir.");
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Filtros e Ações */}
      <div className="flex items-center justify-between">
        {selectedIds.length > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBulkDelete}
            disabled={isPending}
            className="bg-red-600 hover:bg-red-700"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir ({selectedIds.length})
          </Button>
        )}
      </div>

      {/* Tabela */}
      <div className="rounded-md border border-white/10 bg-[#0A0A0A]">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/10 hover:bg-white/5">
              <TableHead className="w-[40px]">
                <Checkbox
                  className="border-white/50 data-[state=checked]:border-[#D00000] data-[state=checked]:bg-[#D00000]"
                  checked={
                    data.length > 0 && selectedIds.length === data.length
                  }
                  onCheckedChange={(c) => handleSelectAll(!!c)}
                />
              </TableHead>
              <TableHead className="text-neutral-400">Nome</TableHead>
              <TableHead className="text-neutral-400">Descrição</TableHead>
              <TableHead className="text-right text-neutral-400">
                Criado em
              </TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
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
                      Nenhuma categoria encontrada.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => (
                <TableRow
                  key={item.id}
                  className="border-white/10 hover:bg-white/5"
                >
                  <TableCell>
                    <Checkbox
                      className="border-white/50 data-[state=checked]:border-[#D00000] data-[state=checked]:bg-[#D00000]"
                      checked={selectedIds.includes(item.id)}
                      onCheckedChange={(c) => handleSelectOne(!!c, item.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium text-white">
                    {item.name}
                  </TableCell>
                  <TableCell className="text-neutral-400">
                    {item.description || "-"}
                  </TableCell>
                  <TableCell className="text-right text-neutral-400">
                    {new Date(item.createdAt).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell>
                    <CategoryActions id={item.id} />
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
