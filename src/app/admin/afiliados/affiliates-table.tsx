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
  Undo2, // Ícone para desfazer
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

// Importe AMBAS as actions aqui
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

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
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
            <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-neutral-500" />
            <Input
              placeholder="Filtrar afiliados..."
              className="mb-4 h-9 w-[250px] border-white/10 bg-white/5 pl-9 text-white placeholder:text-neutral-500 focus-visible:ring-[#D00000]"
            />
          </div>
        </div>
      </div>

      <Card className="border-white/10 bg-[#0A0A0A]">
        <CardHeader>
          <CardTitle className="text-white">Lista de Afiliados</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-white/5">
                <TableHead className="text-neutral-400">Afiliado</TableHead>
                <TableHead className="text-neutral-400">Código</TableHead>
                <TableHead className="text-neutral-400">Status</TableHead>
                <TableHead className="text-right text-neutral-400">
                  Saldo Atual
                </TableHead>
                <TableHead className="text-right text-neutral-400">
                  Total Ganho
                </TableHead>
                <TableHead className="text-right text-neutral-400">
                  Cadastrado em
                </TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((affiliate) => (
                <TableRow
                  key={affiliate.id}
                  className="border-white/10 hover:bg-white/5"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 border border-white/10">
                        <AvatarImage src={affiliate.user?.image || ""} />
                        <AvatarFallback className="bg-neutral-800 text-xs text-white">
                          {affiliate.user?.name?.slice(0, 2).toUpperCase() ||
                            "AF"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-white">
                          {affiliate.user?.name || "Sem nome"}
                        </span>
                        <span className="text-xs text-neutral-500">
                          {affiliate.user?.email}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="font-mono text-sm text-neutral-300">
                    {affiliate.code}
                  </TableCell>

                  <TableCell>
                    {affiliate.status === "active" ? (
                      <Badge className="border-green-500/20 bg-green-500/10 text-green-500 hover:bg-green-500/20">
                        <CheckCircle2 className="mr-1 h-3 w-3" /> Ativo
                      </Badge>
                    ) : affiliate.status === "banned" ? (
                      <Badge className="border-red-500/20 bg-red-500/10 text-red-500 hover:bg-red-500/20">
                        <Ban className="mr-1 h-3 w-3" /> Banido
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-white/10 text-neutral-400"
                      >
                        <AlertCircle className="mr-1 h-3 w-3" /> Suspenso
                      </Badge>
                    )}
                  </TableCell>

                  <TableCell className="text-right font-medium text-white">
                    {formatCurrency(affiliate.balance)}
                  </TableCell>

                  <TableCell className="text-right font-medium text-green-500">
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
                          className="h-8 w-8 p-0 text-white hover:bg-white/10"
                          disabled={isProcessing === affiliate.id}
                        >
                          {isProcessing === affiliate.id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-neutral-500" />
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
                        className="border-white/10 bg-[#111] text-white"
                      >
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-white/10" />

                        {affiliate.status === "banned" ? (
                          <DropdownMenuItem
                            onClick={() => handleUnban(affiliate.id)}
                            className="cursor-pointer text-green-500 focus:bg-green-500/10 focus:text-green-500"
                          >
                            <Undo2 className="mr-2 h-4 w-4" />
                            Reverter Banimento
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => handleBan(affiliate.id)}
                            className="cursor-pointer text-red-500 focus:bg-red-500/10 focus:text-red-500"
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
                    className="h-24 text-center text-neutral-500"
                  >
                    Nenhum afiliado encontrado.
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
