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
            className="bg-red-600 text-white shadow-sm hover:bg-red-700"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir ({selectedIds.length})
          </Button>
        )}
      </div>

      {/* Tabela */}
      <div className="rounded-md border border-neutral-200 bg-white shadow-sm">
        <Table>
          <TableHeader className="bg-neutral-50">
            <TableRow className="border-neutral-200 hover:bg-neutral-100">
              <TableHead className="w-[40px]">
                <Checkbox
                  className="border-neutral-400 data-[state=checked]:border-orange-600 data-[state=checked]:bg-orange-600"
                  checked={
                    data.length > 0 && selectedIds.length === data.length
                  }
                  onCheckedChange={(c) => handleSelectAll(!!c)}
                />
              </TableHead>
              <TableHead className="font-semibold text-neutral-600">
                Nome
              </TableHead>
              <TableHead className="font-semibold text-neutral-600">
                Descrição
              </TableHead>
              <TableHead className="text-right font-semibold text-neutral-600">
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
                      src="/images/illustration.svg" // Garanta que essa imagem funciona no claro ou troque
                      alt="Sem produtos"
                      width={200}
                      height={200}
                      className="opacity-50 grayscale"
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
                  className="border-neutral-100 transition-colors hover:bg-neutral-50"
                >
                  <TableCell>
                    <Checkbox
                      className="border-neutral-400 data-[state=checked]:border-orange-600 data-[state=checked]:bg-orange-600"
                      checked={selectedIds.includes(item.id)}
                      onCheckedChange={(c) => handleSelectOne(!!c, item.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium text-neutral-900">
                    {item.name}
                  </TableCell>
                  <TableCell className="text-neutral-500">
                    {item.description || "-"}
                  </TableCell>
                  <TableCell className="text-right text-neutral-500">
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
