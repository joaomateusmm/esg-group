"use client";

import {
  CheckCircle,
  Eye,
  MoreHorizontal,
  Trash2,
  XCircle,
} from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

// Importe a nova action deleteProvider
import {
  approveProvider,
  deleteProvider,
  rejectProvider,
} from "@/actions/admin-providers";
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
  DropdownMenuSeparator, // Adicionado Separator
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

interface ProvidersTableProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
}

export function ProvidersTable({ data }: ProvidersTableProps) {
  const [isPending, startTransition] = useTransition();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [ setSelectedProvider] = useState<any>(null);

  // Adicionei 'delete' ao tipo de ação
  const handleAction = (
    action: "approve" | "reject" | "delete",
    id: string,
  ) => {
    // Confirmação para exclusão
    if (
      action === "delete" &&
      !confirm("Tem certeza que deseja excluir este registro permanentemente?")
    ) {
      return;
    }

    startTransition(async () => {
      try {
        let res;
        if (action === "approve") res = await approveProvider(id);
        else if (action === "reject") res = await rejectProvider(id);
        else res = await deleteProvider(id); // Chamada da action de delete

        if (res.success) {
          toast.success(res.message);
        } else {
          toast.error(res.error);
        }
      } catch {
        toast.error("Erro na operação.");
      }
    });
  };

  // ... (função getStatusBadge igual ao anterior)
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="border-emerald-200 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
            Aprovado
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
        return (
          <Badge
            variant="outline"
            className="border-yellow-200 bg-yellow-50 text-yellow-700"
          >
            Pendente
          </Badge>
        );
    }
  };

  return (
    <div className="rounded-md border border-neutral-200 bg-white shadow-sm">
      <Table>
        <TableHeader className="bg-neutral-50">
          <TableRow>
            <TableHead>Prestador</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Experiência</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="h-24 text-center text-neutral-500"
              >
                Nenhuma solicitação encontrada.
              </TableCell>
            </TableRow>
          ) : (
            data.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium text-neutral-900">
                      {item.user.name}
                    </span>
                    <span className="text-xs text-neutral-500">
                      {item.user.email}
                    </span>
                    <span className="text-xs text-neutral-500">
                      {item.phone} • {item.location}
                    </span>
                  </div>
                </TableCell>
                <TableCell>{item.category.name}</TableCell>
                <TableCell>{item.experienceYears} anos</TableCell>
                <TableCell>{getStatusBadge(item.status)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {/* Botão de Ver Detalhes (Modal) - Mantido igual */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedProvider(item)}
                        >
                          <Eye className="h-4 w-4 text-neutral-500" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="border-neutral-200 bg-white text-neutral-900 sm:max-w-[500px]">
                        <DialogHeader>
                          <DialogTitle>Detalhes do Prestador</DialogTitle>
                          <DialogDescription>
                            Informações completas do cadastro.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-xs font-semibold text-neutral-500">
                                Nome
                              </label>
                              <p className="text-sm">{item.user.name}</p>
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-neutral-500">
                                Categoria
                              </label>
                              <p className="text-sm">{item.category.name}</p>
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-neutral-500">
                                Telefone
                              </label>
                              <p className="text-sm">{item.phone}</p>
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-neutral-500">
                                Localização
                              </label>
                              <p className="text-sm">{item.location}</p>
                            </div>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-neutral-500">
                              Sobre / Bio
                            </label>
                            <p className="mt-1 rounded-md border border-neutral-100 bg-neutral-50 p-3 text-sm">
                              {item.bio}
                            </p>
                          </div>
                          {item.portfolioUrl && (
                            <div>
                              <label className="text-xs font-semibold text-neutral-500">
                                Portfólio
                              </label>
                              <a
                                href={item.portfolioUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-1 block text-sm text-orange-600 hover:underline"
                              >
                                {item.portfolioUrl}
                              </a>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Ações Rápidas */}
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

                        {/* Aprovar */}
                        {item.status !== "approved" && (
                          <DropdownMenuItem
                            onClick={() => handleAction("approve", item.id)}
                            disabled={isPending}
                            className="cursor-pointer text-emerald-600 focus:text-emerald-700"
                          >
                            <CheckCircle className="h-4 w-4" /> Aprovar
                          </DropdownMenuItem>
                        )}

                        {/* Rejeitar */}
                        {item.status !== "rejected" && (
                          <DropdownMenuItem
                            onClick={() => handleAction("reject", item.id)}
                            disabled={isPending}
                            className="cursor-pointer text-neutral-600 focus:text-orange-700"
                          >
                            <XCircle className="h-4 w-4" /> Rejeitar
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuSeparator className="bg-neutral-100" />

                        {/* Excluir (Sempre visível) */}
                        <DropdownMenuItem
                          onClick={() => handleAction("delete", item.id)}
                          disabled={isPending}
                          className="cursor-pointer text-neutral-600 focus:bg-red-50 focus:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" /> Excluir
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
