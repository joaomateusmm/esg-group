"use client";

import { Eye, MoreHorizontal, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { deleteRequest } from "@/actions/admin-requests";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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

interface RequestsTableProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
}

export function RequestsTable({ data }: RequestsTableProps) {
  const [isPending, startTransition] = useTransition();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedRequest, setSelectedRequest] = useState<any>(null);

  const handleDelete = (id: string) => {
    if (
      !confirm(
        "Tem certeza que deseja excluir esta solicitação permanentemente?",
      )
    )
      return;

    startTransition(async () => {
      try {
        const res = await deleteRequest(id);
        if (res.success) {
          toast.success(res.message);
        } else {
          toast.error(res.error);
        }
      } catch {
        toast.error("Erro ao excluir.");
      }
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge
            variant="outline"
            className="border-yellow-200 bg-yellow-50 text-yellow-700"
          >
            Pendente
          </Badge>
        );
      case "accepted":
        return (
          <Badge className="border-blue-200 bg-blue-100 text-blue-700 hover:bg-blue-100">
            Em Andamento
          </Badge>
        );
      case "completed":
        return (
          <Badge className="border-emerald-200 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
            Concluído
          </Badge>
        );
      case "rejected":
        return (
          <Badge
            variant="destructive"
            className="border-red-200 bg-red-100 text-red-700 hover:bg-red-100"
          >
            Rejeitado
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="rounded-md border border-neutral-200 bg-white shadow-sm">
      <Table>
        <TableHeader className="bg-neutral-50">
          <TableRow>
            <TableHead className="pl-6">Data</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Prestador</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Orçamento</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="pr-8 text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="h-24 text-center text-neutral-500"
              >
                Nenhuma solicitação encontrada.
              </TableCell>
            </TableRow>
          ) : (
            data.map((item) => (
              <TableRow className="px-8" key={item.id}>
                <TableCell className="text-xs text-neutral-500">
                  {new Date(item.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="font-medium">
                  {item.customer.name}
                </TableCell>
                <TableCell>{item.provider.user.name}</TableCell>
                <TableCell>{item.category.name}</TableCell>
                <TableCell>
                  {item.budgetType === "range"
                    ? `£ ${item.budgetValue}`
                    : "A Combinar"}
                </TableCell>
                <TableCell>{getStatusBadge(item.status)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {/* Modal de Detalhes */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedRequest(item)}
                        >
                          <Eye className="h-4 w-4 text-neutral-500" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="border-neutral-200 bg-white text-neutral-900 sm:max-w-[500px]">
                        <DialogHeader>
                          <DialogTitle>Detalhes da Solicitação</DialogTitle>
                          <DialogDescription>ID: {item.id}</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="block text-xs font-semibold text-neutral-500">
                                Cliente
                              </span>
                              {item.customer.name} <br />
                              <span className="text-xs text-neutral-400">
                                {item.customer.email}
                              </span>
                            </div>
                            <div>
                              <span className="block text-xs font-semibold text-neutral-500">
                                Prestador
                              </span>
                              {item.provider.user.name}
                            </div>
                            <div>
                              <span className="block text-xs font-semibold text-neutral-500">
                                Telefone Contato
                              </span>
                              {item.contactPhone}
                            </div>
                            <div>
                              <span className="block text-xs font-semibold text-neutral-500">
                                Endereço
                              </span>
                              {item.address}
                            </div>
                          </div>

                          <div>
                            <span className="mb-1 block text-xs font-semibold text-neutral-500">
                              Descrição do Problema
                            </span>
                            <p className="rounded-md border border-neutral-100 bg-neutral-50 p-3 text-sm italic">
                              &quot;{item.description}&quot;
                            </p>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Menu de Ações (Excluir) */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="border-neutral-200 bg-white"
                      >
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => handleDelete(item.id)}
                          disabled={isPending}
                          className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700"
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Excluir Registro
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
