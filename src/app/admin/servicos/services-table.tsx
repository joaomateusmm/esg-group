"use client";

import { Edit, MoreHorizontal, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";

// Importe a action real
import { deleteServices } from "@/actions/services";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ServicesTableProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
}

export function ServicesTable({ data }: ServicesTableProps) {
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

  // Função genérica para deletar (um ou vários)
  const handleDelete = (idsToDelete: string[]) => {
    if (
      !confirm(
        "Tem certeza que deseja excluir? Essa ação não pode ser desfeita.",
      )
    )
      return;

    startTransition(async () => {
      try {
        const res = await deleteServices(idsToDelete);
        if (res.success) {
          toast.success(res.message);
          setSelectedIds([]); // Limpa seleção
        } else {
          toast.error(res.error);
        }
      } catch {
        toast.error("Erro ao excluir.");
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Filtros e Ações em Massa (Alinhado à direita) */}
      <div className="flex h-10 items-center justify-end">
        {selectedIds.length > 0 && (
          <Button
            onClick={() => handleDelete(selectedIds)}
            disabled={isPending}
            className="animate-in fade-in zoom-in-95 bg-red-600 text-white shadow-sm duration-200 hover:bg-red-700"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir ({selectedIds.length})
          </Button>
        )}
      </div>

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
              <TableHead className="w-[80px]">Imagem</TableHead>
              <TableHead className="font-semibold text-neutral-900">
                Nome
              </TableHead>
              <TableHead className="hidden font-semibold text-neutral-600 md:table-cell">
                Descrição
              </TableHead>
              <TableHead className="text-center font-semibold text-neutral-600">
                Status
              </TableHead>
              <TableHead className="hidden text-right font-semibold text-neutral-600 md:table-cell">
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
                  className="h-64 text-center text-neutral-500"
                >
                  <div className="flex h-full w-full flex-col items-center justify-center gap-4 py-10">
                    <p className="text-lg font-light text-neutral-400">
                      Nenhum serviço encontrado.
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
                  <TableCell>
                    <div className="relative h-10 w-10 overflow-hidden rounded-md border border-neutral-200 bg-neutral-100">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-neutral-400">
                          -
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-neutral-900">
                    {item.name}
                  </TableCell>
                  <TableCell className="hidden max-w-[200px] truncate text-neutral-500 md:table-cell">
                    {item.description || "-"}
                  </TableCell>
                  <TableCell className="text-center">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        item.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {item.isActive ? "Ativo" : "Inativo"}
                    </span>
                  </TableCell>
                  <TableCell className="hidden text-right text-neutral-500 md:table-cell">
                    {new Date(item.createdAt).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-8 w-8 p-0 text-neutral-500 hover:text-neutral-900"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="border-neutral-200 bg-white text-neutral-900"
                      >
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/admin/servicos/${item.id}`}
                            className="flex cursor-pointer items-center"
                          >
                            <Edit className="mr-2 h-4 w-4" /> Editar
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-neutral-100" />
                        <DropdownMenuItem
                          className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700"
                          onClick={() => handleDelete([item.id])} // Chama a função de delete com o ID do item
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
