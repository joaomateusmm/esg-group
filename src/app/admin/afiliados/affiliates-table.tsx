"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertCircle,
  Ban,
  CheckCircle2,
  Loader2,
  MoreHorizontal,
  Search,
  Undo2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { banAffiliateAction, unbanAffiliateAction } from "@/actions/affiliate";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface AffiliateData {
  id: string;
  code: string;
  balance: number;
  totalEarnings: number;
  status: string;
  createdAt: Date;
  user: {
    name: string | null;
    email: string;
    image: string | null;
  } | null;
}

interface AffiliatesTableProps {
  data: AffiliateData[];
}

// AJUSTE DE MOEDA PARA LIBRAS (GBP)
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(value / 100);
};

export function AffiliatesTable({ data }: AffiliatesTableProps) {
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const handleBan = async (id: string) => {
    const confirm = window.confirm(
      "Tem certeza que deseja banir este afiliado? Ele perderá o acesso ao painel.",
    );
    if (!confirm) return;

    setIsProcessing(id);
    try {
      const res = await banAffiliateAction(id);
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Erro ao tentar banir afiliado.");
    } finally {
      setIsProcessing(null);
    }
  };

  const handleUnban = async (id: string) => {
    const confirm = window.confirm("Deseja reativar o acesso deste afiliado?");
    if (!confirm) return;

    setIsProcessing(id);
    try {
      const res = await unbanAffiliateAction(id);
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Erro ao tentar desbanir afiliado.");
    } finally {
      setIsProcessing(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-neutral-400" />
            <Input
              placeholder="Filtrar afiliados..."
              className="h-9 w-[250px] border-neutral-200 bg-white pl-9 text-neutral-900 placeholder:text-neutral-400 focus-visible:ring-orange-500"
            />
          </div>
        </div>
      </div>

      <Card className="border-neutral-200 bg-white shadow-sm">
        <CardHeader className="border-b border-neutral-100 pb-4">
          <CardTitle className="text-lg font-bold text-neutral-900">
            Lista de Afiliados
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-neutral-50">
              <TableRow className="border-neutral-100 hover:bg-neutral-50">
                <TableHead className="font-medium text-neutral-500">
                  Afiliado
                </TableHead>
                <TableHead className="font-medium text-neutral-500">
                  Código
                </TableHead>
                <TableHead className="font-medium text-neutral-500">
                  Status
                </TableHead>
                <TableHead className="text-right font-medium text-neutral-500">
                  Saldo Atual
                </TableHead>
                <TableHead className="text-right font-medium text-neutral-500">
                  Total Ganho
                </TableHead>
                <TableHead className="text-right font-medium text-neutral-500">
                  Cadastrado em
                </TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((affiliate) => (
                <TableRow
                  key={affiliate.id}
                  className="border-neutral-100 hover:bg-neutral-50/50"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 border border-neutral-200">
                        <AvatarImage src={affiliate.user?.image || ""} />
                        <AvatarFallback className="bg-orange-100 text-xs font-medium text-orange-700">
                          {affiliate.user?.name?.slice(0, 2).toUpperCase() ||
                            "AF"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-neutral-900">
                          {affiliate.user?.name || "Sem nome"}
                        </span>
                        <span className="text-xs text-neutral-500">
                          {affiliate.user?.email}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="font-mono text-sm text-neutral-600">
                    {affiliate.code}
                  </TableCell>

                  <TableCell>
                    {affiliate.status === "active" ? (
                      <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100">
                        <CheckCircle2 className="mr-1 h-3 w-3" /> Ativo
                      </Badge>
                    ) : affiliate.status === "banned" ? (
                      <Badge
                        variant="destructive"
                        className="border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                      >
                        <Ban className="mr-1 h-3 w-3" /> Banido
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-neutral-200 bg-neutral-50 text-neutral-500"
                      >
                        <AlertCircle className="mr-1 h-3 w-3" /> Suspenso
                      </Badge>
                    )}
                  </TableCell>

                  <TableCell className="text-right font-medium text-neutral-900">
                    {formatCurrency(affiliate.balance)}
                  </TableCell>

                  <TableCell className="text-right font-medium text-emerald-600">
                    {formatCurrency(affiliate.totalEarnings)}
                  </TableCell>

                  <TableCell className="text-right text-xs text-neutral-500">
                    {format(new Date(affiliate.createdAt), "dd/MM/yyyy", {
                      locale: ptBR,
                    })}
                  </TableCell>

                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-8 w-8 p-0 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
                          disabled={isProcessing === affiliate.id}
                        >
                          {isProcessing === affiliate.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <span className="sr-only">Abrir menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </>
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="border-neutral-200 bg-white text-neutral-700 shadow-md"
                      >
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-neutral-100" />

                        {affiliate.status === "banned" ? (
                          <DropdownMenuItem
                            onClick={() => handleUnban(affiliate.id)}
                            className="cursor-pointer text-emerald-600 focus:bg-emerald-50 focus:text-emerald-700"
                          >
                            <Undo2 className="mr-2 h-4 w-4" />
                            Reverter Banimento
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => handleBan(affiliate.id)}
                            className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700"
                          >
                            <Ban className="mr-2 h-4 w-4" />
                            Banir Afiliado
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}

              {data.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-96 text-center text-neutral-500"
                  >
                    <div className="flex h-full w-full flex-col items-center justify-center gap-4 py-10">
                      <p className="text-lg font-light text-neutral-400">
                        Nenhum afiliado encontrado.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
